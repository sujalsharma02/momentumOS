import { readSession } from "../api-lib/auth.js";
import { ensureDataTable, getSql } from "../api-lib/db.js";
const ALLOWED_KEYS = new Set(["dayLogs","applications","notes","prepNotes","prepProgress","projects","engineeringLog","roadmap","planBlocks","goals","focusSessions","reasons","celebratedOn","settings","skillBuildRoadmaps","skillStudyTimer"]);
export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control","no-store");
  const username = readSession(req);
  if (!username) return res.status(401).json({ error:"Sign in to sync your data." });
  if (!["GET","PUT","DELETE"].includes(req.method)) { res.setHeader("Allow","GET, PUT, DELETE"); return res.status(405).json({ error:"Method not allowed." }); }
  try {
    await ensureDataTable();
    const sql = getSql();
    if (req.method === "GET") {
      const rows = await sql`SELECT data_key, data_value FROM momentum_user_data WHERE user_id = ${username}`;
      const data: Record<string,unknown> = {};
      for (const row of rows) data[String(row.data_key)] = row.data_value;
      return res.status(200).json({ data });
    }
    const { key, value } = req.body ?? {};
    if (typeof key !== "string" || !ALLOWED_KEYS.has(key)) return res.status(400).json({ error:"Unsupported data key." });
    if (JSON.stringify(value ?? null).length > 1_000_000) return res.status(413).json({ error:"Data item exceeds the 1 MB limit." });
    if (req.method === "DELETE") {
      await sql`DELETE FROM momentum_user_data WHERE user_id = ${username} AND data_key = ${key}`;
      return res.status(200).json({ ok:true });
    }
    await sql`INSERT INTO momentum_user_data (user_id,data_key,data_value,updated_at)
      VALUES (${username},${key},${JSON.stringify(value ?? null)}::jsonb,NOW())
      ON CONFLICT (user_id,data_key) DO UPDATE SET data_value=EXCLUDED.data_value,updated_at=NOW()`;
    return res.status(200).json({ ok:true });
  } catch (error) {
    console.error("Momentum data API failed:",error);
    return res.status(500).json({ error:"Could not access the database. Check DATABASE_URL and database permissions." });
  }
}
