import { clearSessionCookie, credentialsMatch, makeSession, readSession, setSessionCookie } from "../api-lib/auth.js";
export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const username = readSession(req);
    return username ? res.status(200).json({ authenticated: true, username }) : res.status(401).json({ authenticated: false });
  }
  if (req.method === "DELETE") { clearSessionCookie(res); return res.status(200).json({ authenticated: false }); }
  if (req.method !== "POST") { res.setHeader("Allow","GET, POST, DELETE"); return res.status(405).json({ error:"Method not allowed." }); }
  const { username, password } = req.body ?? {};
  if (!credentialsMatch(username, password)) return res.status(401).json({ error:"Invalid cloud username or password." });
  try {
    setSessionCookie(res, makeSession(String(process.env.MOMENTUM_LOGIN_USERNAME).trim()));
    return res.status(200).json({ authenticated:true });
  } catch (error) {
    console.error("Session setup failed:", error);
    return res.status(500).json({ error:"Session configuration is incomplete." });
  }
}
