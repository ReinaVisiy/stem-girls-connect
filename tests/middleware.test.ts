import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SHELL = `<!doctype html><html><head><title>T</title>
<meta name="description" content="d" />
<link rel="canonical" href="https://stemgirlsconnect.org/" />
<meta property="og:url" content="x" />
<meta property="og:title" content="x" />
<meta property="og:description" content="x" />
<meta property="og:image" content="x" />
<meta property="og:image:alt" content="x" />
<meta name="twitter:title" content="x" />
<meta name="twitter:description" content="x" />
<meta name="twitter:image" content="x" />
<meta name="twitter:image:alt" content="x" />
</head><body><div id="root"></div></body></html>`;

let programs: Record<string, unknown>[] = [];
const restCalls: string[] = [];

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://db.example.co';
  process.env.SUPABASE_ANON_KEY = 'anon';
  restCalls.length = 0;
  programs = [];
  vi.stubGlobal('fetch', async (input: string | URL) => {
    const u = new URL(String(input));
    if (u.pathname === '/index.html') return new Response(SHELL, { status: 200 });
    if (u.host === 'db.example.co') {
      restCalls.push(u.pathname.replace('/rest/v1/', '') + u.search);
      if (u.pathname.endsWith('/programs')) return new Response(JSON.stringify(programs), { status: 200 });
      return new Response('[]', { status: 200 });
    }
    return new Response('no', { status: 500 });
  });
});
afterEach(() => vi.unstubAllGlobals());

async function get(path: string) {
  const { default: mw } = await import('../middleware');
  const res = await mw(new Request(`https://stemgirlsconnect.org${path}`));
  return { status: res.status, html: await res.text() };
}

describe('middleware: /programs/:slug', () => {
  const live = { title: 'Girls in Code', short_description: 'Learn to code.', cover_image_url: 'https://img/x.jpg', page_template: 'standard' };

  it('published standard program -> 200 with its own title, description, image', async () => {
    programs = [live];
    const { status, html } = await get('/programs/girls-in-code');
    expect(status).toBe(200);
    expect(html).toContain('<title>Girls in Code | STEM Girls Connect</title>');
    expect(html).toContain('content="Learn to code."');
    expect(html).toContain('<meta property="og:image" content="https://img/x.jpg" />');
  });

  it('the girlhood campaign uses its own share card, not the program cover photo', async () => {
    programs = [{ ...live, page_template: 'girlhood' }];
    const { html } = await get('/programs/girlhood');
    expect(html).toContain('<meta property="og:image" content="https://stemgirlsconnect.org/girlhood-share.png" />');
    expect(html).not.toContain('https://img/x.jpg');
    expect(html).toContain('content="Every girl deserves a childhood she can call her own.');
  });

  it('queries only published programs with a supported template (drafts/unsupported never fetched)', async () => {
    programs = [live];
    await get('/programs/girls-in-code');
    const q = restCalls.find((c) => c.startsWith('programs?'))!;
    expect(q).toContain('published=eq.true');
    expect(q).toContain('page_template=in.(standard,girlhood)');
  });

  it('unpublished / unsupported / nonexistent (no row returned) -> real 404, no private data', async () => {
    programs = [];
    const { status, html } = await get('/programs/secret-draft');
    expect(status).toBe(404);
    expect(html).toContain('<title>Page Not Found | STEM Girls Connect</title>');
    expect(html).toContain('The page you were looking for could not be found.');
    // Only the generic not-found content is served: no program title/description.
    expect(html).not.toContain('Learn about');
  });

  it('deeper path under a standard program -> 404', async () => {
    programs = [live];
    expect((await get('/programs/girls-in-code/extra')).status).toBe(404);
  });

  it('Girlhood supports only known subpages and still requires a published program', async () => {
    programs = [{ ...live, page_template: 'girlhood' }];
    for (const sub of ['', '/share-your-voice', '/wall', '/withdraw', '/privacy', '/wall/']) {
      expect((await get('/programs/girlhood' + sub)).status).toBe(200);
    }
    for (const sub of ['/nope', '/wall/extra']) {
      expect((await get('/programs/girlhood' + sub)).status).toBe(404);
    }
    programs = [];
    expect((await get('/programs/girlhood/wall')).status).toBe(404);
  });

  it('malformed percent-escape -> 404 instead of crashing', async () => {
    const r = await get('/programs/%E0%A4%A');
    expect(r.status).toBe(404);
    const b = await get('/blog/%E0%A4%A');
    expect(b.status).toBe(404);
  });

  it('titles containing $-patterns are rendered literally (no replace-pattern injection)', async () => {
    programs = [{ ...live, title: "Save $& and $' and $$ today" }];
    const { html } = await get('/programs/x');
    expect(html).toContain("<title>Save $&amp; and $' and $$ today | STEM Girls Connect</title>");
  });

  it('unknown top-level routes 404', async () => {
    expect((await get('/nope')).status).toBe(404);
  });
});

describe('middleware: /programs list', () => {
  it('filters to published + supported templates', async () => {
    programs = [{ title: 'A', slug: 'a', short_description: null }];
    const { status, html } = await get('/programs');
    expect(status).toBe(200);
    expect(html).toContain('/programs/a');
    const q = restCalls.find((c) => c.startsWith('programs?'))!;
    expect(q).toContain('published=eq.true');
    expect(q).toContain('page_template=in.(standard,girlhood)');
  });
});

describe('/activities redirect', () => {
  it('is a permanent redirect to /programs in vercel.json', async () => {
    const cfg = (await import('../vercel.json')).default as any;
    expect(cfg.redirects).toContainEqual({ source: '/activities', destination: '/programs', permanent: true });
  });
});
