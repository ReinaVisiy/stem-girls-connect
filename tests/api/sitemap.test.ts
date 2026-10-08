import { describe, expect, it, vi } from 'vitest';

const queries: { table: string; filters: [string, ...unknown[]][] }[] = [];
const data: Record<string, unknown[]> = {
  posts: [{ slug: 'p1', published_at: '2026-01-02T00:00:00Z' }],
  programs: [{ slug: 'girls-in-code' }],
};

vi.mock('../../api/_lib/supabase.js', () => ({
  getSupabaseClient: () => ({
    from: (table: string) => {
      const q = { table, filters: [] as [string, ...unknown[]][] };
      queries.push(q);
      const chain: any = {
        select: () => chain,
        eq: (...a: unknown[]) => { q.filters.push(['eq', ...a]); return chain; },
        in: (...a: unknown[]) => { q.filters.push(['in', ...a]); return chain; },
        then: (res: (v: unknown) => unknown) => Promise.resolve({ data: data[table], error: null }).then(res),
      };
      return chain;
    },
  }),
}));

import handler from '../../api/sitemap.xml';

describe('sitemap', () => {
  it('lists published programs only, restricted to supported templates, plus static pages and posts', async () => {
    const res: any = { headers: {} };
    res.status = (c: number) => { res.code = c; return res; };
    res.send = (b: string) => { res.body = b; return res; };
    res.end = res.send;
    res.setHeader = (k: string, v: string) => { res.headers[k] = v; };
    await handler({ method: 'GET' } as any, res);

    expect(res.code).toBe(200);
    expect(res.body).toContain('/programs/girls-in-code');
    expect(res.body).toContain('/blog/p1');
    expect(res.body).toMatch(/<loc>[^<]*\/programs<\/loc>/);
    const pq = queries.find((q) => q.table === 'programs')!;
    expect(pq.filters).toContainEqual(['eq', 'published', true]);
    expect(pq.filters).toContainEqual(['in', 'page_template', ['standard', 'girlhood']]);
  });
});
