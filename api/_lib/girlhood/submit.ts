import crypto from "node:crypto";
import { campaignState } from './status.js';
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseServiceClient } from "../supabase.js";
import { submissionRecord, validate, plain } from "../../../shared/girlhood.js";
import {
  failure,
  hashWithdrawalCode,
  isRateLimited,
  makeReference,
  message,
  postGuard,
} from "./_shared.js";

// The token is a private recovery credential. Derive the same receipt on retry.
export function receiptCredentials(token: string) {
  const pepper = process.env.GIRLHOOD_WITHDRAWAL_PEPPER;
  if (!pepper || pepper.length < 32)
    throw new Error("Receipt configuration unavailable");
  const withdrawalCode = crypto
    .createHmac("sha256", pepper)
    .update("girlhood-receipt-v1:" + token)
    .digest()
    .subarray(0, 18)
    .toString("base64url")
    .match(/.{1,6}/g)!
    .join("-");
  return {
    withdrawalCode,
    requestHash: crypto.createHash("sha256").update(token).digest("hex"),
  };
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!postGuard(req, res)) return;
  const token = req.body.requestToken;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token))
    return res.status(400).json({ error: message(req, "invalid") });
  const recoverOnly = req.body.recoverOnly === true;
  if (!recoverOnly && (plain(req.body.website) || validate(req.body).length))
    return res.status(400).json({ error: message(req, "invalid") });
  try {
    const db = getSupabaseServiceClient();
    if (await isRateLimited(req, db, "submit")) {
      res.setHeader("Retry-After", "900");
      return res.status(429).json({ error: message(req, "limited") });
    }
    const { withdrawalCode, requestHash } = receiptCredentials(token);
    const record = recoverOnly ? null : submissionRecord(req.body);
    const payloadHash = record
      ? hashWithdrawalCode("payload-v1:" + JSON.stringify(record))
      : null;
    const lookup = async () => {
      const { data, error } = await db
        .from("girlhood_submissions")
        .select(
          "public_reference,request_payload_hash,consent_public,withdrawn_at,moderation_status",
        )
        .eq("request_token_hash", requestHash)
        .maybeSingle();
      if (error) throw error;
      return data;
    };
    const reply = (
      saved: NonNullable<Awaited<ReturnType<typeof lookup>>>,
      status = 200,
    ) => {
      if (!recoverOnly && saved.request_payload_hash !== payloadHash)
        return res
          .status(409)
          .json({
            error:
              req.body.language === "fr"
                ? "Cette tentative a déjà été enregistrée. Récupérez votre reçu avant de commencer une autre contribution."
                : "This attempt was already saved. Recover your receipt before starting another contribution.",
          });
      return res
        .status(status)
        .json({
          publicReference: saved.public_reference,
          withdrawalCode,
          publicationRequested: saved.consent_public,
          published:
            saved.consent_public === true &&
            !saved.withdrawn_at &&
            saved.moderation_status === "approved",
          withdrawn: Boolean(saved.withdrawn_at),
        });
    };
    const existing = await lookup();
    if (existing) return reply(existing);
    if (recoverOnly)
      return res
        .status(404)
        .json({
          error:
            req.body.language === "fr"
              ? "Aucune contribution enregistrée pour cette tentative. Vous pouvez remplir le formulaire."
              : "No saved contribution was found for this attempt. You can complete the form.",
        });
    if (campaignState() !== 'open')
      return res.status(409).json({ code: 'CAMPAIGN_CLOSED', state: campaignState(), error: message(req, "closed") });
    for (let attempt = 0; attempt < 3; attempt++) {
      const publicReference = makeReference();
      const { error } = await db
        .from("girlhood_submissions")
        .insert({
          ...record,
          public_reference: publicReference,
          withdrawal_hash: hashWithdrawalCode(withdrawalCode),
          request_token_hash: requestHash,
          request_payload_hash: payloadHash,
        });
      if (!error)
        return reply(
          {
            public_reference: publicReference,
            request_payload_hash: payloadHash,
            consent_public: record!.consent_public,
            withdrawn_at: null,
            moderation_status: record!.moderation_status,
          },
          201,
        );
      if (error.code !== "23505") throw error;
      const saved = await lookup();
      if (saved) return reply(saved);
    }
    return failure(req, res, "submit");
  } catch {
    return failure(req, res, "submit");
  }
}
