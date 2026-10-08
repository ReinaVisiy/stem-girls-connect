import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseServiceClient } from "../supabase.js";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  const secret = process.env.CRON_SECRET,
    actual = req.headers.authorization || "";
  const expected = "Bearer " + secret;
  if (
    !secret ||
    secret.length < 32 ||
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return res.status(401).json({ error: "Unauthorized" });
  try {
    const db = getSupabaseServiceClient();
    const { data, error } = await db.rpc("girlhood_expire_records");
    if (error) throw error;
    return res.status(200).json({ deleted: data });
  } catch {
    console.error("Girlhood retention maintenance failed");
    return res.status(503).json({ error: "Maintenance unavailable" });
  }
}
