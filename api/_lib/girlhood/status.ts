import type { VercelRequest, VercelResponse } from '@vercel/node';
export type CampaignState = 'not_yet_open' | 'open' | 'closed';
export function campaignState(): CampaignState {
  const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    && (process.env.GIRLHOOD_WITHDRAWAL_PEPPER?.length ?? 0) >= 32
    && (process.env.GIRLHOOD_RATE_LIMIT_SECRET?.length ?? 0) >= 32
    && process.env.GIRLHOOD_ALLOWED_ORIGINS?.trim());
  if (!configured) return 'closed';
  if (process.env.GIRLHOOD_SUBMISSIONS_OPEN === 'true') return 'open';
  return process.env.GIRLHOOD_CAMPAIGN_PHASE === 'not_yet_open' ? 'not_yet_open' : 'closed';
}
export default function status(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({ state: campaignState() });
}
