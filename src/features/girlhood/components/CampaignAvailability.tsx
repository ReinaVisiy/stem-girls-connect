import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useGirlhoodRuntime, Link } from '../GirlhoodRuntime';
import { useGirlhoodBasePath } from '../GirlhoodPaths';
import { useGirlhoodLanguage } from '../hooks/useGirlhoodLanguage';

type State = 'loading' | 'unavailable' | 'not_yet_open' | 'open' | 'closed';
export const availabilityCopy = {
  en: { loading: 'Checking contribution availability…', unavailable: 'We cannot check availability right now. Please try again. Your answers stay in this tab.', not_yet_open: 'Contributions are not yet open. Explore the campaign and our voices while you wait.', closed: 'Contributions have closed. Your answers stay in this tab. You can still explore our voices, recover your receipt or withdraw a contribution.', open: '', preview: 'Preview only — no contribution will be sent.', retry: 'Check again' },
  fr: { loading: 'Vérification de l’ouverture des contributions…', unavailable: 'Impossible de vérifier la disponibilité. Réessayez. Vos réponses restent dans cet onglet.', not_yet_open: 'Les contributions ne sont pas encore ouvertes. Découvrez la campagne et nos voix en attendant.', closed: 'Les contributions sont closes. Vos réponses restent dans cet onglet. Vous pouvez toujours découvrir nos voix, récupérer votre reçu ou retirer une contribution.', open: '', preview: 'Aperçu uniquement — aucune contribution ne sera envoyée.', retry: 'Vérifier à nouveau' },
};
const Context = createContext({ state: 'loading' as State, refresh: async () => 'unavailable' as State, close: (_state?: State) => {} });
export const useCampaignAvailability = () => useContext(Context);
export function CampaignAvailabilityProvider({ children }: { children: ReactNode }) {
  const { request } = useGirlhoodRuntime();
  const [state, setState] = useState<State>('loading');
  const sequence = useRef(0);
  const refresh = useCallback(async (): Promise<State> => {
    const current = ++sequence.current;
    try {
      const r = await request('/api/girlhood/status', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
      const body = await r.json();
      if (!r.ok || !['open', 'closed', 'not_yet_open'].includes(body.state)) throw new Error();
      if (current !== sequence.current) return 'unavailable';
      setState(body.state); return body.state;
    } catch { if (current === sequence.current) setState('unavailable'); return 'unavailable'; }
  }, [request]);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 30000);
    const focus = () => { void refresh(); };
    window.addEventListener('focus', focus);
    return () => { sequence.current++; clearInterval(timer); window.removeEventListener('focus', focus); };
  }, [refresh]);
  return <Context.Provider value={{ state, refresh, close: (next = 'closed') => { sequence.current++; setState(next); } }}>{children}</Context.Provider>;
}
export function AvailabilityNotice() {
  const { state, refresh } = useCampaignAvailability();
  const { preview } = useGirlhoodRuntime();
  const { language } = useGirlhoodLanguage();
  const copy = availabilityCopy[language];
  if (state === 'open' && !preview) return null;
  return <div className="girlhood-availability rounded-2xl border p-4" role="status">
    {preview ? copy.preview : copy[state]}
    {state === 'unavailable' && <button type="button" className="ml-3 underline" onClick={() => void refresh()}>{copy.retry}</button>}
  </div>;
}
export function ContributionLink({ children, className = 'girlhood-button' }: { children: ReactNode; className?: string }) {
  const { state } = useCampaignAvailability();
  const base = useGirlhoodBasePath();
  return state === 'open' ? <Link className={className} to={base + '/share-your-voice'}>{children}</Link> : <AvailabilityNotice />;
}
