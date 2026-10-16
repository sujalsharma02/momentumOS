import { createHmac, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const COOKIE_NAME = "momentum_session";
const ALLOWED_KEYS = new Set([
  "dayLogs", "applications", "notes", "prepNotes", "prepProgress", "projects",
  "engineeringLog", "roadmap", "planBlocks", "goals", "focusSessions", "reasons",
  "celebratedOn", "settings", "skillBuildRoadmaps", "skillStudyTimer",
]);

function signingSecret() {
  const value = process.env.MOMENTUM_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("MOMENTUM_SESSION_SECRET must be at least 32 characters.");
  return value;
}
function sign(payload) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
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
    const expected = Buffer.from(sign(payload));
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session.sub && session.exp && session.exp > Math.floor(Date.now() / 1000)
      ? session.sub
      : null;
  } catch {
    return null;
  }
}
function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}
async function ensureDataTable(sql) {
  await sql`CREATE TABLE IF NOT EXISTS momentum_user_data (
    user_id TEXT NOT NULL,
    data_key TEXT NOT NULL,
    data_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, data_key)
  )`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const username = readSession(req);
  if (!username) return res.status(401).json({ error: "Sign in to sync your data." });
  if (!["GET", "PUT", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const sql = getSql();
    await ensureDataTable(sql);

    if (req.method === "GET") {
      const rows = await sql`SELECT data_key, data_value FROM momentum_user_data WHERE user_id = ${username}`;
      const data = {};
      for (const row of rows) data[String(row.data_key)] = row.data_value;
      return res.status(200).json({ data });
    }

    const { key, value } = req.body ?? {};
    if (typeof key !== "string" || !ALLOWED_KEYS.has(key)) {
      return res.status(400).json({ error: "Unsupported data key." });
    }
    if (JSON.stringify(value ?? null).length > 1_000_000) {
      return res.status(413).json({ error: "Data item exceeds the 1 MB limit." });
    }
    if (req.method === "DELETE") {
      await sql`DELETE FROM momentum_user_data WHERE user_id = ${username} AND data_key = ${key}`;
      return res.status(200).json({ ok: true });
    }

    await sql`INSERT INTO momentum_user_data (user_id, data_key, data_value, updated_at)
      VALUES (${username}, ${key}, ${JSON.stringify(value ?? null)}::jsonb, NOW())
      ON CONFLICT (user_id, data_key) DO UPDATE
      SET data_value = EXCLUDED.data_value, updated_at = NOW()`;
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Momentum data API failed:", error);
    return res.status(500).json({ error: "Could not access the database. Check DATABASE_URL and database permissions." });
  }
}
