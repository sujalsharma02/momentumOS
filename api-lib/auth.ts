import { createHmac, timingSafeEqual } from "node:crypto";
const COOKIE_NAME = "momentum_session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;
function secret(): string {
  const value = process.env.MOMENTUM_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("MOMENTUM_SESSION_SECRET must be at least 32 characters.");
  return value;
}
function sign(payload: string): string { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
export function makeSession(username: string): string {
  const payload = Buffer.from(JSON.stringify({ sub: username, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return payload + "." + sign(payload);
}
export function readSession(req: any): string | null {
  try {
    const raw = String(req.headers?.cookie ?? "").split(";").map((p: string) => p.trim()).find((p: string) => p.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1);
    if (!raw) return null;
    const [payload, signature] = raw.split(".");
    if (!payload || !signature) return null;
    const a = Buffer.from(signature), b = Buffer.from(sign(payload));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: string; exp?: number };
    return session.sub && session.exp && session.exp > Math.floor(Date.now() / 1000) ? session.sub : null;
  } catch { return null; }
}
export function setSessionCookie(res: any, token: string): void {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`);
}
export function clearSessionCookie(res: any): void {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}
export function credentialsMatch(username: unknown, password: unknown): boolean {
  const expectedUser = process.env.MOMENTUM_LOGIN_USERNAME, expectedPass = process.env.MOMENTUM_LOGIN_PASSWORD;
  if (!expectedUser || !expectedPass || typeof username !== "string" || typeof password !== "string") return false;
  const a = Buffer.from(username.trim().toLowerCase()), b = Buffer.from(expectedUser.trim().toLowerCase());
  const c = Buffer.from(password), d = Buffer.from(expectedPass);
  return a.length === b.length && c.length === d.length && timingSafeEqual(a,b) && timingSafeEqual(c,d);
}
