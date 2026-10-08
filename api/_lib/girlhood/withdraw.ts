import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseServiceClient } from "../supabase.js";
import {
  failure,
  hashWithdrawalCode,
  isRateLimited,
  message,
  plain,
  postGuard,
} from "./_shared.js";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!postGuard(req, res)) return;
  const reference = plain(req.body.publicReference, 40).toUpperCase(),
    code = plain(req.body.withdrawalCode, 100);
  if (!/^GSH-[A-Z0-9]{6,16}$/.test(reference) || !code)
    return res.status(400).json({ error: message(req, "invalid") });
  try {
    const db = getSupabaseServiceClient();
    if (await isRateLimited(req, db, "withdraw")) {
      res.setHeader("Retry-After", "900");
      return res.status(429).json({ error: message(req, "limited") });
    }
    const { data, error: lookupError } = await db
      .from("girlhood_submissions")
      .select("id,withdrawal_hash")
      .eq("public_reference", reference)
      .maybeSingle();
    if (lookupError) return failure(req, res, "withdraw");
    const actual = data?.withdrawal_hash ?? "0".repeat(64),
      supplied = hashWithdrawalCode(code);
    const valid =
      actual.length === supplied.length &&
      crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(supplied));
    if (!data || !valid)
      return res.status(400).json({ error: message(req, "mismatch") });
    const { data: changed, error } = await db
      .from("girlhood_submissions")
      .update({ moderation_status: "withdrawn" })
      .eq("id", data.id)
      .select("id")
      .single();
    if (error || !changed) return failure(req, res, "withdraw");
    return res.status(200).json({ message: message(req, "withdrawn") });
  } catch {
    return failure(req, res, "withdraw");
  }
}
