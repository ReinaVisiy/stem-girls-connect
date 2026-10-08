import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseServiceClient } from "./_lib/supabase.js";
import { createHmac } from 'node:crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (
    !String(req.headers["content-type"] || "")
      .toLowerCase()
      .startsWith("application/json")
  )
    return res.status(415).json({ error: "JSON required" });
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res
      .status(400)
      .json({ status: "error", error: "Please enter a valid email address." });
  try {
    const db = getSupabaseServiceClient();
    const secret = process.env.NEWSLETTER_RATE_LIMIT_SECRET;
    const address = process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
    const ip = (Array.isArray(address) ? address[0] : address)?.split(',')[0]?.trim();
    if (!secret || secret.length < 32 || !ip) throw new Error('Newsletter configuration unavailable');
    const fingerprint = createHmac('sha256', secret).update('newsletter:' + ip).digest('hex');
    const { data, error } = await db.rpc('newsletter_signup', { p_email: email, p_fingerprint: fingerprint });
    if (error) throw error;
    if (data === false) {
      res.setHeader("Retry-After", "900");
      return res
        .status(429)
        .json({ status: "error", error: "Please try again in 15 minutes." });
    }
    if (data !== true) throw new Error('Newsletter limiter unavailable');
    return res.status(200).json({ status: "success" });
  } catch {
    return res
      .status(503)
      .json({
        status: "error",
        error:
          "Subscriptions are temporarily unavailable. Please try again later.",
      });
  }
}
