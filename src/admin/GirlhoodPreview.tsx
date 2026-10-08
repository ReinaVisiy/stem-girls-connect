import { Suspense, useMemo, useState } from 'react';
import { useAdminAuth } from './AdminAuthProvider';
import GirlhoodProgram from '../features/girlhood/GirlhoodProgram';
import { GirlhoodRuntime } from '../features/girlhood/GirlhoodRuntime';
import type { ProgramDetail } from '../lib/programs';

const fixture = { public_reference: 'preview-only', public_category: 'girl', language: 'en', public_girlhood_response: 'A childhood full of curiosity, friendship and possibilities.', public_future_response: 'Whatever she chooses to become.', public_support_response: null, safe_display_name: 'Anonymous', safe_country: null, safe_city: null, featured: true, created_at: '2026-10-08T00:00:00Z' };
// This transport never delegates to fetch, including accidental writes or unknown paths.
export const previewRequest: typeof fetch = async (input, options) => {
  if (options?.method && options.method !== 'GET') return new Response(JSON.stringify({ error: 'Preview only. No changes are saved.' }), { status: 403 });
  const url = new URL(String(input), 'https://preview.invalid');
  const action = url.pathname.split('/').at(-1);
  const data = action === 'status' ? { state: 'open' }
    : action === 'stats' ? { publicVoices: 1, girls: 1, youngWomen: 0, women: 0, allies: 0 }
    : action === 'wall' ? { responses: url.searchParams.get('category') && !['all', 'girl'].includes(url.searchParams.get('category')!) ? [] : [fixture], page: 1, hasMore: false } : null;
  return new Response(JSON.stringify(data ?? { error: 'Preview only' }), { status: data ? 200 : 403 });
};
export default function GirlhoodPreview({ program }: { program: ProgramDetail }) {
  const { isAdmin, session, loading } = useAdminAuth();
  const [subPath, setSubPath] = useState('');
  const runtime = useMemo(() => ({ preview: true, request: previewRequest, navigate: (to: string) => setSubPath(to.replace(/^\/programs\/girlhood\/?/, '')) }), []);
  if (loading || !session || !isAdmin) return <p role="status">Administrator access required.</p>;
  return <section aria-label="Girlhood administrator preview">
    <p className="rounded-xl bg-amber-50 p-4 text-amber-950" role="status">Administrator preview · Aperçu administrateur — sample voices only. No contributions, recovery or withdrawal requests are sent. Nothing is published.</p>
    <nav className="my-4 flex flex-wrap gap-3" aria-label="Preview sections">
      {[['', 'Home / Accueil'], ['share-your-voice', 'Contribution'], ['wall', 'Voices / Voix'], ['privacy', 'Privacy / Confidentialité'], ['withdraw', 'Withdrawal / Retrait']].map(([path, label]) => <button key={path} className="rounded-lg border px-3 py-2" aria-pressed={subPath === path} onClick={() => setSubPath(path)}>{label}</button>)}
    </nav>
    <GirlhoodRuntime.Provider value={runtime}>
      <Suspense fallback={<p role="status">Loading preview…</p>}><GirlhoodProgram program={{ ...program, slug: 'girlhood' }} subPath={subPath} /></Suspense>
    </GirlhoodRuntime.Provider>
  </section>;
}
