import { clearSession, createSession, credentialsMatch, readSession } from "../api-lib/sessionStore.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    try {
      const username = await readSession(req);
      return username
        ? res.status(200).json({ authenticated: true, username })
        : res.status(401).json({ authenticated: false });
    } catch (error) {
      console.error("Session lookup failed:", error);
      return res.status(500).json({ error: "Could not validate the login session." });
    }
  }

  if (req.method === "DELETE") {
    try {
      await clearSession(req, res);
      return res.status(200).json({ authenticated: false });
    } catch (error) {
      console.error("Session revocation failed:", error);
      return res.status(500).json({ error: "The browser cookie was cleared, but the session could not be revoked in the database." });
    }
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
    await createSession(String(process.env.MOMENTUM_LOGIN_USERNAME).trim(), res);
    return res.status(200).json({ authenticated: true });
  } catch (error) {
    console.error("Session creation failed:", error);
    return res.status(500).json({ error: "Could not save the login session. Check DATABASE_URL and database permissions." });
  }
}
