import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "momentum_session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.MOMENTUM_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("MOMENTUM_SESSION_SECRET must be at least 32 characters.");
  return value;
}
function sign(payload) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}
function makeSession(username) {
  const payload = Buffer.from(JSON.stringify({
    sub: username,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })).toString("base64url");
  return payload + "." + sign(payload);
}
function readSession(req) {
  try {
    const raw = String(req.headers?.cookie ?? "")
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(COOKIE_NAME + "="))
      ?.slice(COOKIE_NAME.length + 1);
    if (!raw) return null;
    const [payload, signature] = raw.split(".");
    if (!payload || !signature) return null;
    const a = Buffer.from(signature);
    const b = Buffer.from(sign(payload));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.sub && session.exp && session.exp > Math.floor(Date.now() / 1000)
      ? session.sub
      : null;
  } catch {
    return null;
  }
}
function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`);
}
function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}
function credentialsMatch(username, password) {
  const expectedUser = process.env.MOMENTUM_LOGIN_USERNAME;
  const expectedPass = process.env.MOMENTUM_LOGIN_PASSWORD;
  if (!expectedUser || !expectedPass || typeof username !== "string" || typeof password !== "string") return false;
  const a = Buffer.from(username.trim().toLowerCase());
  const b = Buffer.from(expectedUser.trim().toLowerCase());
  const c = Buffer.from(password);
  const d = Buffer.from(expectedPass);
  return a.length === b.length && c.length === d.length
    && timingSafeEqual(a, b) && timingSafeEqual(c, d);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const username = readSession(req);
    return username
      ? res.status(200).json({ authenticated: true, username })
      : res.status(401).json({ authenticated: false });
  }
  if (req.method === "DELETE") {
    clearSessionCookie(res);
    return res.status(200).json({ authenticated: false });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const { username, password } = req.body ?? {};
  if (!credentialsMatch(username, password)) {
    return res.status(401).json({ error: "Invalid cloud username or password." });
  }
  try {
    setSessionCookie(res, makeSession(String(process.env.MOMENTUM_LOGIN_USERNAME).trim()));
    return res.status(200).json({ authenticated: true });
  } catch (error) {
    console.error("Session setup failed:", error);
    return res.status(500).json({ error: "Session configuration is incomplete." });
  }
}
