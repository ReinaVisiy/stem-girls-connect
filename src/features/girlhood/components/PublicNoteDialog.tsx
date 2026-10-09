import { useEffect, useId, useRef, useState } from 'react';
import { useGirlhoodRuntime } from '../GirlhoodRuntime';
import { useGirlhoodBasePath } from '../GirlhoodPaths';
import GirlhoodPaperFrame from '../paper/GirlhoodPaperFrame';
import { copy } from '../config/copy';
import type { GirlhoodLanguage, GirlhoodPublicResponse } from '../types';

export default function PublicNoteDialog({reference, language, onClose}: {reference: string; language: GirlhoodLanguage; onClose: () => void}) {
  const {request} = useGirlhoodRuntime();
  const basePath = useGirlhoodBasePath();
  const dialog = useRef<HTMLDialogElement>(null), title = useId();
  const [note, setNote] = useState<GirlhoodPublicResponse | null>(null);
  const [state, setState] = useState<'loading'|'ready'|'unavailable'>('loading');
  const [feedback, setFeedback] = useState('');
  const fr = language === 'fr', t = copy[language];
  const url = new URL(basePath + '/wall', window.location.origin); url.searchParams.set('note', reference);
  useEffect(() => {dialog.current?.showModal();}, []);
  useEffect(() => {
    let controller: AbortController | undefined;
    let version = 0;
    const refresh = () => {
      controller?.abort(); controller = new AbortController();
      const generation = ++version;
      setNote(null); setState('loading'); setFeedback('');
      request('/api/girlhood/note?reference=' + encodeURIComponent(reference), {signal: controller.signal, cache: 'no-store'})
        .then(async r => {if (!r.ok) throw new Error(); return r.json();})
        .then(data => {if (version === generation) {setNote(data.response); setState('ready');}})
        .catch(() => {if (version === generation) setState('unavailable');});
    };
    const visibility = () => {
      if (document.visibilityState === 'visible') refresh();
      else {controller?.abort(); version++; setNote(null); setState('loading');}
    };
    refresh();
    window.addEventListener('focus', refresh); window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', visibility);
    return () => {version++; controller?.abort(); window.removeEventListener('focus', refresh); window.removeEventListener('pageshow', refresh); document.removeEventListener('visibilitychange', visibility);};
  }, [reference, request]);
  async function copyLink() {
    try {await navigator.clipboard.writeText(url.href); setFeedback(fr ? 'Lien copié.' : 'Link copied.');}
    catch {setFeedback(fr ? 'Sélectionne et copie le lien ci-dessous.' : 'Select and copy the link below.');}
  }
  async function share() {
    try {await navigator.share({title: 'Girlhood Should Be Hers', url: url.href});}
    catch (error) {if (!(error instanceof DOMException && error.name === 'AbortError')) await copyLink();}
  }
  const name = note?.safe_display_name === 'Anonymous' ? '' : note?.safe_display_name;
  return <dialog ref={dialog} className="girlhood-note-dialog" aria-labelledby={title} onClose={onClose} onClick={e => {if (e.target === e.currentTarget) dialog.current?.close();}}>
    <button className="girlhood-note-close" type="button" onClick={() => dialog.current?.close()} aria-label={fr ? 'Fermer' : 'Close'} autoFocus>×</button>
    <GirlhoodPaperFrame footer={name ? <p className="girlhood-paper-signature">{name}</p> : null}>
      <h2 id={title} className="girlhood-paper-title">Girlhood Should Be Hers</h2>
      {state !== 'ready' ? <p role="status">{state === 'loading' ? (fr ? 'Chargement…' : 'Loading…') : (fr ? 'Ce mot n’est pas disponible.' : 'This note is unavailable.')}</p> : note &&
        [[t.q1,note.public_girlhood_response],[t.q2,note.public_future_response],[t.q3,note.public_support_response]].map(([prompt,answer]) => answer && <section key={prompt}><h3 className="girlhood-paper-prompt">{prompt}</h3><p className="girlhood-paper-answer" lang={note.language}>{answer}</p></section>)}
    </GirlhoodPaperFrame>
    {state === 'ready' && <div className="girlhood-public-share">
      {typeof navigator.share === 'function' && <button type="button" onClick={share}>{fr ? 'Partager le lien' : 'Share link'}</button>}
      <button type="button" onClick={copyLink}>{fr ? 'Copier le lien' : 'Copy link'}</button>
      <label>{fr ? 'Lien vers ce mot public' : 'Link to this public note'}<input readOnly value={url.href} onFocus={e => e.target.select()}/></label><p role="status">{feedback}</p>
    </div>}
  </dialog>;
}
