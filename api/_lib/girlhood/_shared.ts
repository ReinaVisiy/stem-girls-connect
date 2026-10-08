import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { SupabaseClient } from "@supabase/supabase-js";
export {
  plain,
  deriveCategory,
  PUBLIC_STATUSES,
} from "../../../shared/girlhood.js";
export function makeReference() {
  return "GSH-" + crypto.randomBytes(8).toString("hex").toUpperCase();
}
export function makeWithdrawalCode() {
  return crypto
    .randomBytes(18)
    .toString("base64url")
    .match(/.{1,6}/g)!
    .join("-");
}
export function hashWithdrawalCode(code: string) {
  const pepper = process.env.GIRLHOOD_WITHDRAWAL_PEPPER;
  if (!pepper || pepper.length < 32)
    throw new Error("Withdrawal configuration unavailable");
  return crypto.createHmac("sha256", pepper).update(code).digest("hex");
}
const messages = {
  en: {
    invalid: "Check your details and required choices.",
    unavailable:
      "This service is temporarily unavailable. Please try again later.",
    limited: "Too many attempts. Please try again in 15 minutes.",
    mismatch: "The reference and private code do not match.",
    closed: "Contributions are not open yet.",
    withdrawn:
      "Your contribution has been withdrawn. It is no longer available on the campaign website and will not be used in future campaign work.",
  },
  fr: {
    invalid: "Vérifiez vos informations et les choix obligatoires.",
    unavailable:
      "Ce service est temporairement indisponible. Veuillez réessayer plus tard.",
    limited: "Trop de tentatives. Veuillez réessayer dans 15 minutes.",
    mismatch: "La référence et le code privé ne correspondent pas.",
    closed: "Les contributions ne sont pas encore ouvertes.",
    withdrawn:
      "Votre contribution a été retirée. Elle n’est plus disponible sur le site de la campagne et ne sera plus utilisée dans les futurs travaux de la campagne.",
  },
};
export function message(req: VercelRequest, key: keyof typeof messages.en) {
  return messages[req.body?.language === "fr" ? "fr" : "en"][key];
}
export function postGuard(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  if (
    !String(req.headers["content-type"] || "")
      .toLowerCase()
      .startsWith("application/json")
  ) {
    res.status(415).json({ error: "JSON required" });
    return false;
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    res.status(400).json({ error: message(req, "invalid") });
    return false;
  }
  if (Buffer.byteLength(JSON.stringify(req.body), "utf8") > 16000) {
    res.status(413).json({ error: message(req, "invalid") });
    return false;
  }
  const allowed = (process.env.GIRLHOOD_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  if (origin && !allowed.includes(origin)) {
    res.status(403).json({ error: message(req, "invalid") });
    return false;
  }
  return true;
}
export async function isRateLimited(
  req: VercelRequest,
  db: SupabaseClient,
  action: "submit" | "withdraw" | "subscribe",
) {
  const secret = process.env.GIRLHOOD_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Rate limit configuration unavailable");
  // Vercel overwrites this header. Local development uses the socket address.
  const forwarded = process.env.VERCEL
    ? req.headers["x-vercel-forwarded-for"]
    : req.socket?.remoteAddress;
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
    ?.split(",")[0]
    ?.trim();
  if (!ip) throw new Error("Client address unavailable");
  const key = crypto
    .createHmac("sha256", secret)
    .update(action + ":" + ip)
    .digest("hex");
  const { data, error } = await db.rpc("girlhood_rate_limit", {
    p_key: key,
    p_limit: action === "subscribe" ? 5 : action === "submit" ? 20 : 30,
  });
  if (error) throw new Error("Rate limiter unavailable");
  return data !== true;
}
export function failure(
  req: VercelRequest,
  res: VercelResponse,
  action: string,
) {
  console.error("Girlhood " + action + " failed"); // Never log private payloads or database details.
  return res.status(503).json({ error: message(req, "unavailable") });
}
