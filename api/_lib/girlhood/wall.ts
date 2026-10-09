import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseServiceClient } from "../supabase.js";
import { PUBLIC_NOTE_FIELDS } from './public-fields.js';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });
  const page = Number(req.query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000)
    return res.status(400).json({ error: "Invalid page" });
  const { category, language, featured } = req.query;
  let cursor: { created: string; reference: string } | null = null;
  if (req.query.cursor !== undefined) {
    try {
      if (typeof req.query.cursor !== 'string' || req.query.cursor.length > 400) throw new Error();
      cursor = JSON.parse(Buffer.from(req.query.cursor, 'base64url').toString());
      if (!cursor || !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(cursor.created)
          || !Number.isFinite(Date.parse(cursor.created)) || !/^[A-Za-z0-9-]{1,80}$/.test(cursor.reference)) throw new Error();
    } catch { return res.status(400).json({ error: 'Invalid cursor' }); }
  }
  try {
    let query = getSupabaseServiceClient()
      .from("girlhood_public_responses")
      .select(
        PUBLIC_NOTE_FIELDS,
      )
      .order("created_at", { ascending: false })
      .order("public_reference", { ascending: false })
      .range(cursor ? 0 : (page - 1) * 24, cursor ? 24 : page * 24);
    if (cursor) query = query.or(`created_at.lt.${cursor.created},and(created_at.eq.${cursor.created},public_reference.lt.${cursor.reference})`);
    if (
      typeof category === "string" &&
      ["girl", "young_woman", "woman", "ally"].includes(category)
    )
      query = query.eq("public_category", category);
    if (language === "en" || language === "fr")
      query = query.eq("language", language);
    if (featured === "true") query = query.eq("featured", true);
    const { data, error } = await query;
    if (error) throw error;
    const last = data?.[23];
    return res
      .status(200)
      .json({
        responses: (data ?? []).slice(0, 24),
        page,
        hasMore: (data ?? []).length > 24,
        nextCursor: (data ?? []).length > 24 && last ? Buffer.from(JSON.stringify({ created: last.created_at, reference: last.public_reference })).toString('base64url') : null,
      });
  } catch {
    return res
      .status(503)
      .json({ error: "Voices unavailable / Voix indisponibles" });
  }
}
