/**
 * pages/api/embed-token.js
 *
 * Protected API route called by the dashboard page.
 * Returns a Domo embed token filtered to the logged-in user's company.
 * The Client Secret never leaves the server.
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { getEmbedToken } from "../../lib/domo";

const EMBED_ID = "D842k"; // Comp Benchmarking dashboard

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const company = session.user.companyName;
  if (!company && !session.user.isAdmin) {
    return res.status(403).json({ error: "No company assigned to this user" });
  }

  // Admin previews as "Peer Group" so they can still see data
  const companyName = company ?? "Peer Group";

  try {
    const { token, embedUrl } = await getEmbedToken(EMBED_ID, companyName);
    return res.status(200).json({ token, embedUrl });
  } catch (err) {
    console.error("Domo embed token error:", err);
    return res.status(500).json({ error: "Failed to generate embed token" });
  }
}
