import { neon } from "@neondatabase/serverless";
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}
export async function ensureDataTable() {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS momentum_user_data (
    user_id TEXT NOT NULL, data_key TEXT NOT NULL, data_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (user_id, data_key)
  )`;
}
