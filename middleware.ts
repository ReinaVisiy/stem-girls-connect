export const config = {
  // Only intercept actual page routes. Excludes /api/*, /admin/*, and
  // anything that looks like a static asset (has a file extension), so
  // JS/CSS/images/fonts and the admin SPA are untouched and fast.
  matcher: ['/((?!api/|admin(?:/|$)|assets/|[^/]+\\.[^/]+$).*)'],
};

interface RouteMeta {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  /**
   * Real, readable HTML injected into #root alongside the meta tags.
   * This is what a non-JS crawler, an AI tool fetching the raw page, or
   * a visitor on a slow connection actually sees before React mounts
   * and replaces it with the live app. Static per route; dynamic routes
   * (/, /about, /impact, /blog, /blog/:slug) append live Supabase data
   * to this after it's picked.
   */
  body: string;
}

const SITE_URL = 'https://stemgirlsconnect.org';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_IMAGE_ALT = 'STEM Girls Connect volunteers leading a STEM outreach session with students';

const CONTACT_EMAIL = 'info@stemgirlsconnect.org';
const CONTACT_LOCATION = 'Foumban, West Region, Cameroon';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Shared wrapper + typographic classes so this reads like the rest of the
// site (the compiled stylesheet is already loaded via index.html, so
// these Tailwind classes render styled, not as a plain unstyled fallback).
function page(inner: string): string {
  return `<div class="container mx-auto px-6 py-16 max-w-3xl">${inner}</div>`;
}
function h1(text: string): string {
  return `<h1 class="text-3xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">${escapeHtml(text)}</h1>`;
}
function h2(text: string): string {
  return `<h2 class="text-xl font-extrabold text-brandGreen mt-10 mb-4 uppercase tracking-widest">${escapeHtml(text)}</h2>`;
}
function p(text: string): string {
  return `<p class="text-brandSlate text-lg leading-relaxed mb-4">${escapeHtml(text)}</p>`;
}
function ul(items: string[]): string {
  return `<ul class="list-disc pl-6 space-y-3 mb-4">${items
    .map((item) => `<li class="text-brandSlate text-base leading-relaxed">${item}</li>`)
    .join('')}</ul>`;
}

// Kept in sync with each page's <Seo title=... description=... /> call
// and its actual copy. This is what search crawlers and social-media
// link previews see in the initial HTML response — the client-side
// <Seo> component and the React app itself take over once JS runs.
const STATIC_ROUTES: Record<string, RouteMeta> = {
  '/': {
    title: 'STEM Girls Connect | Nurturing Women in STEM',
    description:
      'STEM Girls Connect is a nonprofit training and mentoring girls and young women in science, technology, engineering, and mathematics through workshops, mentorship, and advocacy.',
    body: page(
      h1('Find Your Place in STEM') +
        p('Learn. Connect. Grow.') +
        p(
          'Build practical skills, connect with mentors, discover scholarships and opportunities, and grow alongside a community of girls and young women building their futures in STEM.'
        ) +
        `<p class="mb-4"><a class="text-brandPink font-extrabold" href="/activities">Explore Our Programs</a> &nbsp;&middot;&nbsp; <a class="text-brandPink font-extrabold" href="/join">Join STEM Girls Connect</a></p>`
    ),
  },
  '/about': {
    title: 'About Us | STEM Girls Connect',
    description:
      "Learn about STEM Girls Connect's mission, vision, and the bureau leading efforts to empower girls and young women in STEM.",
    body: page(
      h1('Who We Are') +
        p(
          'STEM Girls Connect is a nonprofit association in Cameroon helping girls and young women explore STEM, build practical skills, access opportunities, and grow through mentorship and community.'
        ) +
        h2('Our Story') +
        p(
          'STEM Girls Connect was established in Cameroon in 2024 with the goal of helping more girls and young women see STEM as a future they can belong in. Through learning, mentorship, opportunities, and community, we support young women as they build confidence, develop skills, and grow in STEM.'
        ) +
        h2('Mission') +
        p('To bring together and empower girls and young women in STEM related fields.') +
        h2('Vision') +
        p(
          'To close the gender gap in STEM fields by empowering and supporting girls and young women to explore, learn and succeed in STEM.'
        )
      // Bureau list appended dynamically below.
    ),
  },
  '/activities': {
    title: 'Our Activities | STEM Girls Connect',
    description:
      "Explore STEM Girls Connect's programs, mentorship, and outreach activities supporting girls and young women in STEM.",
    body: page(
      h1('Our Activities') +
        p(
          'We create opportunities for girls and young women to learn, grow, connect, and build their futures in STEM through training, mentorship, career support, outreach, and access to opportunities.'
        ) +
        ul([
          '<strong>Skills &amp; Training</strong> &mdash; Practical STEM, digital, leadership, and professional skills training designed to help girls and young women build confidence and prepare for future opportunities.',
          '<strong>Mentorship</strong> &mdash; Connecting girls and young women with STEM professionals and experienced peers who can provide guidance, encouragement, and career support.',
          '<strong>Opportunities</strong> &mdash; Helping members discover scholarships, fellowships, training programs, grants, competitions, and other educational or professional opportunities in STEM.',
          '<strong>Career Development</strong> &mdash; Supporting girls and young women with school applications, scholarship applications, grant writing, career preparation, and professional development.',
          '<strong>Leadership &amp; Networking</strong> &mdash; Creating spaces for girls and young women to connect with peers and professionals, strengthen their leadership skills, and build valuable personal and professional networks.',
          '<strong>Outreach &amp; Advocacy</strong> &mdash; Reaching schools and communities to encourage girls to explore STEM, while raising awareness around issues that affect the participation and advancement of girls and women in STEM.',
        ])
    ),
  },
  '/impact': {
    title: 'Impact & Evidence | STEM Girls Connect',
    description: "See the numbers behind STEM Girls Connect's work, and read our published reports and records.",
    body: page(h1('Our work in numbers, stories, and reports.'))
    // Stats list appended dynamically below.
  },
  '/blog': {
    title: 'Blog & News | STEM Girls Connect',
    description: "Updates, stories, and news from STEM Girls Connect's programs.",
    body: page(h1('Blog & News'))
    // Recent posts list appended dynamically below.
  },
  '/join': {
    title: 'Join Us | STEM Girls Connect',
    description: 'Join STEM Girls Connect and become part of a community empowering girls and young women pursuing STEM.',
    body: page(
      h1('Choose Your Path') +
        ul([
          '<strong>Become a Member</strong> &mdash; Join STEM Girls Connect as an official member and become part of a community supporting girls and women in STEM.',
          '<strong>Get Mentorship</strong> &mdash; Connect with mentors and professionals who can support your academic, personal, and career growth.',
          '<strong>Become a Mentor</strong> &mdash; Share your knowledge and experience with girls and young women who are exploring or building careers in STEM.',
          '<strong>Volunteer</strong> &mdash; Contribute your time and skills to support programs, outreach, events, communications, or other SGC activities.',
          '<strong>Partner With Us</strong> &mdash; Work with STEM Girls Connect to expand access to STEM education, mentorship, opportunities, and community impact.',
        ])
    ),
  },
  '/contact': {
    title: 'Contact Us | STEM Girls Connect',
    description:
      'Get in touch with STEM Girls Connect to learn more, collaborate, or support our mission to empower girls and young women in STEM.',
    body: page(
      h1('Contact Us') +
        p(`Headquarters: ${CONTACT_LOCATION}`) +
        `<p class="mb-4 text-brandSlate text-lg"><a class="text-brandPink font-extrabold" href="mailto:${CONTACT_EMAIL}">${escapeHtml(
          CONTACT_EMAIL
        )}</a></p>`
    ),
  },
  '/donate': {
    title: 'Donate | STEM Girls Connect',
    description: "Support STEM Girls Connect's mission to empower girls and young women in STEM with a donation.",
    body: page(
      h1('Help a Girl Go Further in STEM') +
        p(
          'Your support helps STEM Girls Connect provide training, mentorship, outreach, and access to opportunities for girls and young women building their futures in STEM.'
        )
    ),
  },
};

const NOT_FOUND_META: RouteMeta = {
  title: 'Page Not Found | STEM Girls Connect',
  description: 'The page you were looking for could not be found.',
  body: page(h1('Page Not Found') + p('The page you were looking for could not be found.')),
};

// Mirrors src/components/PostCard.tsx's excerpt() so a shared link's
// preview text matches what the page itself shows.
function stripMarkdown(text: string): string {
  return text.replace(/[#*_>`-]/g, '').trim();
}
function excerpt(body: string, maxLen = 155): string {
  const plain = stripMarkdown(body);
  return plain.length > maxLen ? plain.slice(0, maxLen).trim() + '…' : plain;
}

function injectMeta(html: string, meta: RouteMeta, canonicalUrl: string): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const image = meta.image ?? DEFAULT_IMAGE;
  const imageAlt = escapeHtml(meta.imageAlt ?? DEFAULT_IMAGE_ALT);

  return html
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content=".*?"\s*\/>/, `<meta name="description" content="${description}" />`)
    .replace(/<link rel="canonical" href=".*?"\s*\/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<meta property="og:url" content=".*?"\s*\/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta property="og:title" content=".*?"\s*\/>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description" content=".*?"\s*\/>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:image" content=".*?"\s*\/>/, `<meta property="og:image" content="${image}" />`)
    .replace(/<meta property="og:image:alt" content=".*?"\s*\/>/, `<meta property="og:image:alt" content="${imageAlt}" />`)
    .replace(/<meta name="twitter:title" content=".*?"\s*\/>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description" content=".*?"\s*\/>/, `<meta name="twitter:description" content="${description}" />`)
    .replace(/<meta name="twitter:image" content=".*?"\s*\/>/, `<meta name="twitter:image" content="${image}" />`)
    .replace(/<meta name="twitter:image:alt" content=".*?"\s*\/>/, `<meta name="twitter:image:alt" content="${imageAlt}" />`)
    .replace(/<div id="root"><\/div>/, `<div id="root">${meta.body}</div>`);
}

interface SupabaseRow {
  [key: string]: unknown;
}

async function fetchSupabase(path: string, supabaseUrl: string, anonKey: string): Promise<SupabaseRow[] | null> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as SupabaseRow[];
  } catch {
    return null;
  }
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname === '' ? '/' : url.pathname;
  const canonicalUrl = `${SITE_URL}${path === '/' ? '/' : path.replace(/\/$/, '')}`;

  // The already-built SPA shell (has real bundled asset hashes) — same
  // file the plain catch-all rewrite in vercel.json would otherwise serve.
  const originHtmlRes = await fetch(new URL('/index.html', url.origin));
  const html = await originHtmlRes.text();

  let meta: RouteMeta | undefined = STATIC_ROUTES[path];
  let status = 200;

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey) {
    // Append live data to the static shell for routes backed by Supabase,
    // so crawlers/AI tools see real current content, not just page copy.
    if (meta && path === '/') {
      const [stats, posts] = await Promise.all([
        fetchSupabase('site_stats?select=value,label&order=display_order&limit=4', supabaseUrl, anonKey),
        fetchSupabase('posts?published=eq.true&select=title,slug&order=published_at.desc&limit=1', supabaseUrl, anonKey),
      ]);
      let extra = '';
      if (stats && stats.length > 0) {
        extra += h2('Our Impact So Far') + ul(stats.map((s) => `<strong>${escapeHtml(String(s.value))}</strong> ${escapeHtml(String(s.label))}`));
      }
      if (posts && posts.length > 0) {
        const latest = posts[0];
        extra += h2('Latest From The Blog') + `<p class="mb-4"><a class="text-brandPink font-extrabold" href="/blog/${escapeHtml(
          String(latest.slug)
        )}">${escapeHtml(String(latest.title))}</a></p>`;
      }
      if (extra) meta = { ...meta, body: meta.body + page(extra) };
    } else if (meta && path === '/about') {
      const bureau = await fetchSupabase('bureau?select=name,position&order=display_order', supabaseUrl, anonKey);
      if (bureau && bureau.length > 0) {
        meta = {
          ...meta,
          body:
            meta.body +
            page(
              h2('Our Bureau') +
                ul(bureau.map((m) => `<strong>${escapeHtml(String(m.name))}</strong> &mdash; ${escapeHtml(String(m.position))}`))
            ),
        };
      }
    } else if (meta && path === '/impact') {
      const stats = await fetchSupabase('site_stats?select=value,label,sub_stat&order=display_order', supabaseUrl, anonKey);
      if (stats && stats.length > 0) {
        meta = {
          ...meta,
          body:
            meta.body +
            page(
              h2('By the Numbers') +
                ul(
                  stats.map(
                    (s) =>
                      `<strong>${escapeHtml(String(s.value))}</strong> ${escapeHtml(String(s.label))}${
                        s.sub_stat ? ` (${escapeHtml(String(s.sub_stat))})` : ''
                      }`
                  )
                )
            ),
        };
      }
    } else if (meta && path === '/blog') {
      const posts = await fetchSupabase(
        'posts?published=eq.true&select=title,slug,body,published_at&order=published_at.desc&limit=20',
        supabaseUrl,
        anonKey
      );
      if (posts && posts.length > 0) {
        meta = {
          ...meta,
          body:
            meta.body +
            page(
              ul(
                posts.map(
                  (post) =>
                    `<a class="text-brandPink font-extrabold" href="/blog/${escapeHtml(String(post.slug))}">${escapeHtml(
                      String(post.title)
                    )}</a><br/><span class="text-brandSlate text-sm">${escapeHtml(excerpt(String(post.body)))}</span>`
                )
              )
            ),
        };
      }
    } else if (path.startsWith('/blog/')) {
      const slug = decodeURIComponent(path.slice('/blog/'.length));
      if (slug) {
        const rows = await fetchSupabase(
          `posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=title,body,image_url&limit=1`,
          supabaseUrl,
          anonKey
        );
        const post = rows?.[0];

        if (post) {
          const title = String(post.title);
          const body = String(post.body);
          meta = {
            title: `${title} | STEM Girls Connect`,
            description: excerpt(body),
            image: post.image_url ? String(post.image_url) : undefined,
            imageAlt: title,
            body: page(
              h1(title) +
                body
                  .split(/\n{2,}/)
                  .map((para) => p(stripMarkdown(para)))
                  .filter((para) => para !== p(''))
                  .join('')
            ),
          };
        }
      }
    }
  }

  if (!meta) {
    meta = NOT_FOUND_META;
    // Only genuinely unknown routes 404. A recognized static route always
    // has an entry above, so this only fires for bad paths and missing
    // blog slugs — real soft-404 protection for crawlers.
    status = 404;
  }

  const finalHtml = injectMeta(html, meta, canonicalUrl);

  return new Response(finalHtml, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
