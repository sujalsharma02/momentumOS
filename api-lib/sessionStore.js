import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const COOKIE_NAME = "momentum_session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

async function ensureSessionTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS momentum_login_sessions (
    token_hash TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
  )`;
  await sql`CREATE INDEX IF NOT EXISTS momentum_login_sessions_username_idx
    ON momentum_login_sessions (username, created_at DESC)`;
}

function getCookieToken(req) {
  return String(req.headers?.cookie ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(COOKIE_NAME + "="))
    ?.slice(COOKIE_NAME.length + 1) || null;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function credentialsMatch(username, password) {
  const expectedUser = process.env.MOMENTUM_LOGIN_USERNAME;
  const expectedPass = process.env.MOMENTUM_LOGIN_PASSWORD;
  if (!expectedUser || !expectedPass || typeof username !== "string" || typeof password !== "string") return false;
  const actualUser = Buffer.from(username.trim().toLowerCase());
  const storedUser = Buffer.from(expectedUser.trim().toLowerCase());
  const actualPassword = Buffer.from(password);
  const storedPassword = Buffer.from(expectedPass);
  return actualUser.length === storedUser.length
    && actualPassword.length === storedPassword.length
    && timingSafeEqual(actualUser, storedUser)
    && timingSafeEqual(actualPassword, storedPassword);
}

export async function readSession(req) {
  const token = getCookieToken(req);
  if (!token) return null;

  const sql = getSql();
  await ensureSessionTable(sql);
  const tokenHash = hashToken(token);
  const rows = await sql`SELECT username
    FROM momentum_login_sessions
    WHERE token_hash = ${tokenHash}
      AND expires_at > NOW()
      AND revoked_at IS NULL
    LIMIT 1`;
  if (!rows.length) return null;

  await sql`UPDATE momentum_login_sessions
    SET last_seen_at = NOW()
    WHERE token_hash = ${tokenHash}
      AND last_seen_at < NOW() - INTERVAL '5 minutes'`;
  return String(rows[0].username);
}

export async function createSession(username, res) {
  const sql = getSql();
  await ensureSessionTable(sql);

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  await sql`INSERT INTO momentum_login_sessions (token_hash, username, expires_at)
    VALUES (${tokenHash}, ${username}, NOW() + INTERVAL '14 days')`;

  res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`);
}

export async function clearSession(req, res) {
  const token = getCookieToken(req);
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
  if (!token) return;

  const sql = getSql();
  await ensureSessionTable(sql);
  const tokenHash = hashToken(token);
  await sql`UPDATE momentum_login_sessions
    SET revoked_at = NOW()
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL`;
}

export { credentialsMatch };
