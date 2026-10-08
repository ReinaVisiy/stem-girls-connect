import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls: { table: string; select: string; order?: string }[] = [];
let result: { data: unknown; error: { message: string } | null } = { data: [], error: null };
let throwOnClient = false;

vi.mock('../../api/_lib/supabase.js', () => ({
  getSupabaseClient: () => {
    if (throwOnClient) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    return {
      from: (table: string) => {
        const call: { table: string; select: string; order?: string } = { table, select: '' };
        calls.push(call);
        const q: any = {
          select: (s: string) => { call.select = s; return q; },
          order: (o: string) => { call.order = o; return q; },
          then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
            Promise.resolve(result).then(res, rej),
        };
        return q;
      },
    };
  },
}));

import handler from '../../api/content';

function mockRes() {
  const res: any = { statusCode: 0, body: undefined, headers: {} as Record<string, string> };
  res.status = (c: number) => { res.statusCode = c; return res; };
  res.json = (b: unknown) => { res.body = b; return res; };
  res.setHeader = (k: string, v: string) => { res.headers[k] = v; return res; };
  return res;
}
const run = async (method: string, resource?: unknown) => {
  const res = mockRes();
  await handler({ method, query: resource === undefined ? {} : { resource } } as any, res);
  return res;
};

beforeEach(() => { calls.length = 0; result = { data: [], error: null }; throwOnClient = false; });

describe('api/content — array resources', () => {
  const table: Record<string, string> = {
    stats: 'site_stats', bureau: 'bureau', partners: 'partners', slideshow: 'home_slideshow',
  };
  for (const [resource, tbl] of Object.entries(table)) {
    it(`${resource}: queries ${tbl} ordered by display_order and returns the array`, async () => {
      const rows = [{ id: 1, display_order: 1 }, { id: 2, display_order: 2 }];
      result = { data: rows, error: null };
      const res = await run('GET', resource);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(rows);
      expect(Array.isArray(res.body)).toBe(true);
      expect(calls).toEqual([{ table: tbl, select: '*', order: 'display_order' }]);
      expect(res.headers['Cache-Control']).toBe('s-maxage=60, stale-while-revalidate');
    });
  }
});

describe('api/content — map resources', () => {
  it('site-content returns key -> content map', async () => {
    result = { data: [{ key: 'a', content: 'A' }, { key: 'b', content: 'B' }], error: null };
    const res = await run('GET', 'site-content');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ a: 'A', b: 'B' });
    expect(calls).toEqual([{ table: 'site_content', select: 'key, content' }]);
    expect(res.headers['Cache-Control']).toBe('s-maxage=60, stale-while-revalidate');
  });

  it('site-images returns placement_key -> { image_url, alt_text } map', async () => {
    result = {
      data: [
        { placement_key: 'hero', image_url: '/h.jpg', alt_text: 'Hero', id: 9 },
        { placement_key: 'team', image_url: '/t.jpg', alt_text: null },
      ],
      error: null,
    };
    const res = await run('GET', 'site-images');
    expect(res.body).toEqual({
      hero: { image_url: '/h.jpg', alt_text: 'Hero' },
      team: { image_url: '/t.jpg', alt_text: null },
    });
    expect(calls).toEqual([{ table: 'site_images', select: '*' }]);
  });
});

describe('api/content — errors and restrictions', () => {
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('%s -> 405, no DB access', async (m) => {
    const res = await run(m, 'stats');
    expect(res.statusCode).toBe(405);
    expect(res.body).toEqual({ error: 'Method not allowed' });
    expect(calls).toHaveLength(0);
  });

  it.each([undefined, '', 'posts', 'admin_users', 'site_stats', '../x', 'constructor', '__proto__', 'toString'])(
    'invalid resource %j -> 404, no DB access', async (r) => {
      const res = await run('GET', r);
      expect(res.statusCode).toBe(404);
      expect(calls).toHaveLength(0);
    });

  it('array-valued resource param uses first value', async () => {
    const res = await run('GET', ['stats', 'bureau']);
    expect(res.statusCode).toBe(200);
    expect(calls[0].table).toBe('site_stats');
  });

  it('database error -> 500 with message', async () => {
    result = { data: null, error: { message: 'boom' } };
    const res = await run('GET', 'partners');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'boom' });
    expect(res.headers['Cache-Control']).toBeUndefined();
  });

  it('client construction failure -> 500', async () => {
    throwOnClient = true;
    const res = await run('GET', 'stats');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: expect.stringContaining('Missing SUPABASE_URL') });
  });
});

describe('vercel.json rewrites', () => {
  it('maps the six original URLs to /api/content and keeps catch-all excluding /api/', async () => {
    const cfg = (await import('../../vercel.json')).default as any;
    const rw: { source: string; destination: string }[] = cfg.rewrites;
    for (const n of ['stats', 'bureau', 'partners', 'slideshow', 'site-content', 'site-images']) {
      expect(rw).toContainEqual({ source: `/api/${n}`, destination: `/api/content?resource=${n}` });
    }
    expect(rw.at(-1)).toEqual({ source: '/((?!api/).*)', destination: '/index.html' });
    // None of the explicit API rewrites can shadow other routes.
    const apiRw = rw.filter((r) => r.source.startsWith('/api/'));
    expect(apiRw.map((r) => r.source).sort()).toEqual(
      ['/api/bureau', '/api/girlhood/:action', '/api/partners', '/api/site-content', '/api/site-images', '/api/slideshow', '/api/stats'],
    );
  });
});
