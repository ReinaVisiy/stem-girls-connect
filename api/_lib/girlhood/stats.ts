import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseServiceClient } from "../supabase.js";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  try {
    const { data, error } = await getSupabaseServiceClient().rpc(
      "girlhood_public_stats",
    );
    if (error) throw error;
    return res.status(200).json(data);
  } catch {
    return res
      .status(503)
      .json({ error: "Campaign totals unavailable / Totaux indisponibles" });
  }
}
