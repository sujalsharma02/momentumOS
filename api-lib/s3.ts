import { createHash, createHmac } from "node:crypto";
function required(name: string): string { const value = process.env[name]; if (!value) throw new Error(`${name} is not configured.`); return value; }
function hmac(key: Buffer | string, value: string): Buffer { return createHmac("sha256",key).update(value,"utf8").digest(); }
function encode(value: string): string { return encodeURIComponent(value).replace(/[!'()*]/g,c => "%" + c.charCodeAt(0).toString(16).toUpperCase()); }
function sha256(value: string): string { return createHash("sha256").update(value,"utf8").digest("hex"); }
export async function createPresignedUrl(input: { key:string; method:"PUT"|"GET" }): Promise<string> {
  const endpoint = new URL(required("AWS_ENDPOINT_URL_S3"));
  const bucket = required("AWS_S3_BUCKET"), region = required("AWS_REGION");
  const accessKey = required("AWS_ACCESS_KEY_ID"), secretKey = required("AWS_SECRET_ACCESS_KEY");
  if (endpoint.protocol !== "https:") throw new Error("S3 endpoint must use HTTPS.");
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g,"");
  const dateStamp = amzDate.slice(0,8);
  const host = endpoint.host;
  const basePath = endpoint.pathname.replace(/\/$/,"");
  const canonicalUri = (basePath + "/" + encode(bucket) + "/" + input.key.split("/").map(encode).join("/"));
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const params: Record<string,string> = {
    "X-Amz-Algorithm":"AWS4-HMAC-SHA256",
    "X-Amz-Credential":`${accessKey}/${scope}`,
    "X-Amz-Date":amzDate,
    "X-Amz-Expires":"300",
    "X-Amz-SignedHeaders":"host",
  };
  const canonicalQuery = Object.entries(params).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${encode(k)}=${encode(v)}`).join("&");
  const canonicalRequest = [input.method,canonicalUri,canonicalQuery,`host:${host}\n`,"host","UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256",amzDate,scope,sha256(canonicalRequest)].join("\n");
  const dateKey = hmac("AWS4"+secretKey,dateStamp);
  const regionKey = hmac(dateKey,region);
  const serviceKey = hmac(regionKey,"s3");
  const signingKey = hmac(serviceKey,"aws4_request");
  const signature = createHmac("sha256",signingKey).update(stringToSign).digest("hex");
  const url = new URL(endpoint.toString());
  url.pathname = canonicalUri;
  url.search = canonicalQuery + "&X-Amz-Signature=" + signature;
  return url.toString();
}
