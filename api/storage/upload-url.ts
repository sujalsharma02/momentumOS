import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "momentum_session";
function sessionSecret() {
  const value = process.env.MOMENTUM_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("MOMENTUM_SESSION_SECRET must be at least 32 characters.");
  return value;
}
function signSession(payload) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}
function readSession(req) {
  try {
    const raw = String(req.headers?.cookie ?? "")
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(COOKIE_NAME + "="))
      ?.slice(COOKIE_NAME.length + 1);
    if (!raw) return null;
    const [payload, signature] = raw.split(".");
    if (!payload || !signature) return null;
    const actual = Buffer.from(signature);
    const expected = Buffer.from(signSession(payload));
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.sub && session.exp && session.exp > Math.floor(Date.now() / 1000)
      ? session.sub
      : null;
  } catch {
    return null;
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}
function hmac(key, value) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}
function encode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    "%" + character.charCodeAt(0).toString(16).toUpperCase()
  );
}
function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
async function createPresignedUrl({ key, method }) {
  const endpoint = new URL(required("AWS_ENDPOINT_URL_S3"));
  const bucket = required("AWS_S3_BUCKET");
  const region = required("AWS_REGION");
  const accessKey = required("AWS_ACCESS_KEY_ID");
  const secretKey = required("AWS_SECRET_ACCESS_KEY");
  if (endpoint.protocol !== "https:") throw new Error("S3 endpoint must use HTTPS.");

  const now = new Date();
  const amzDate = now.toISOString().slice(0, 19).replaceAll("-", "").replaceAll(":", "") + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const host = endpoint.host;
  const basePath = endpoint.pathname.endsWith("/") ? endpoint.pathname.slice(0, -1) : endpoint.pathname;
  const canonicalUri = basePath + "/" + encode(bucket) + "/" + key.split("/").map(encode).join("/");
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const params = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${accessKey}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": "300",
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${encode(name)}=${encode(value)}`)
    .join("&");
  const canonicalHeaders = `host:${host}\n`;
  const canonicalRequest = [method, canonicalUri, canonicalQuery, canonicalHeaders, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const dateKey = hmac("AWS4" + secretKey, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  const url = new URL(endpoint.toString());
  url.pathname = canonicalUri;
  url.search = canonicalQuery + "&X-Amz-Signature=" + signature;
  return url.toString();
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const username = readSession(req);
  if (!username) return res.status(401).json({ error: "Sign in before accessing files." });

  const { fileName, contentType, action, key: requestedKey } = req.body ?? {};
  if (typeof fileName !== "string" || fileName.length > 180 || typeof contentType !== "string") {
    return res.status(400).json({ error: "A valid fileName and contentType are required." });
  }
  if (!["put", "get"].includes(action)) {
    return res.status(400).json({ error: "action must be put or get." });
  }
  const allowedContentType = new RegExp("^(image/(png|jpeg|webp|gif)|application/pdf|text/plain|application/json)$");
  if (action === "put" && !allowedContentType.test(contentType)) {
    return res.status(415).json({ error: "Unsupported file type." });
  }

  const safeName = fileName.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "file";
  const objectKey = action === "get"
    ? (typeof requestedKey === "string" && requestedKey.startsWith(username + "/") ? requestedKey : "")
    : `${username}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;
  if (!objectKey) return res.status(403).json({ error: "You cannot access that object." });

  try {
    const signedMethod = action === "put" ? "PUT" : "GET";
    const url = await createPresignedUrl({ key: objectKey, method: signedMethod });
    return res.status(200).json({ url, key: objectKey, method: signedMethod, expiresIn: 300 });
  } catch (error) {
    console.error("Object storage signing failed:", error);
    return res.status(500).json({ error: "Could not create a signed URL. Check the S3-compatible storage environment variables." });
  }
}
