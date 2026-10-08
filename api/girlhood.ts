import type { VercelRequest, VercelResponse } from '@vercel/node';
import submit from './_lib/girlhood/submit.js';
import withdraw from './_lib/girlhood/withdraw.js';
import wall from './_lib/girlhood/wall.js';
import stats from './_lib/girlhood/stats.js';
import maintenance from './_lib/girlhood/maintenance.js';
import status from './_lib/girlhood/status.js';
const handlers = { submit, withdraw, wall, stats, maintenance, status };
export default function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action;
  if (typeof action !== 'string' || !Object.hasOwn(handlers, action)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ error: 'Not found' });
  }
  return handlers[action as keyof typeof handlers](req, res);
}
