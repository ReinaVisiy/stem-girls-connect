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
  const own = (() => {
    try {
      const list = JSON.parse(localStorage.getItem('sgc-girlhood-own') || '[]');
      return Array.isArray(list) && list.includes(reference);
    } catch {return false;}
  })();
  const message = fr
    ? own
      ? 'Joyeuse Journée internationale de la fille ! 💜\n\nVoici ma vision de ce que l’enfance des filles devrait être, dans le cadre de la campagne Girlhood Should Be Hers de STEM Girls Connect.\n\nQue signifie l’enfance des filles pour toi ? Partage ta vision aussi !'
      : 'Joyeuse Journée internationale de la fille ! 💜\n\nVoici une réflexion sur ce que l’enfance des filles devrait être, partagée dans le cadre de la campagne Girlhood Should Be Hers de STEM Girls Connect.\n\nQuel est ton point de vue ? Partage le tien aussi !'
    : own
      ? 'Happy International Day of the Girl Child! 💜\n\nThis is my take on what girlhood should be, as part of STEM Girls Connect\'s Girlhood Should Be Hers campaign.\n\nWhat does girlhood mean to you? Share yours too!'
      : 'Happy International Day of the Girl Child! 💜\n\nHere\'s a reflection on what girlhood should be, shared through STEM Girls Connect\'s Girlhood Should Be Hers campaign.\n\nWhat\'s your take? Share yours too!';
  const full = message + '\n\n' + url.href;
  const [fallback, setFallback] = useState(false);
  async function copyMessage() {
    try {await navigator.clipboard.writeText(full); setFallback(false); setFeedback(fr ? 'Message et lien copiés.' : 'Message and link copied.');}
    catch {setFallback(true); setFeedback(fr ? 'Sélectionne et copie le message ci-dessous.' : 'Select and copy the message below.');}
  }
  async function share() {
    if (typeof navigator.share !== 'function') {await copyMessage(); return;}
    try {await navigator.share({title: 'Girlhood Should Be Hers', text: message, url: url.href}); setFeedback('');}
    catch (error) {
      // Closing the share sheet is a choice, not an error.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await copyMessage();
    }
  }
  const name = note?.safe_display_name === 'Anonymous' ? '' : note?.safe_display_name;
  return <dialog ref={dialog} className="girlhood-note-dialog" aria-labelledby={title} onClose={onClose} onClick={e => {if (e.target === e.currentTarget) dialog.current?.close();}}>
    <button className="girlhood-note-close" type="button" onClick={() => dialog.current?.close()} aria-label={fr ? 'Fermer' : 'Close'} autoFocus>×</button>
    <GirlhoodPaperFrame footer={<p className="girlhood-paper-signature">{name || (fr ? 'Anonyme' : 'Anonymous')}</p>}>
      <h2 id={title} className="girlhood-paper-title">Girlhood Should Be Hers</h2>
      {state !== 'ready' ? <p role="status">{state === 'loading' ? (fr ? 'Chargement…' : 'Loading…') : (fr ? 'Ce mot n’est pas disponible.' : 'This note is unavailable.')}</p> : note &&
        [[t.q1,note.public_girlhood_response],[t.q2,note.public_future_response],[t.q3,note.public_support_response]].map(([prompt,answer]) => answer && <section key={prompt}><h3 className="girlhood-paper-prompt">{prompt}</h3><p className="girlhood-paper-answer" lang={note.language}>{answer}</p></section>)}
    </GirlhoodPaperFrame>
    {state === 'ready' && <div className="girlhood-public-share">
      <button type="button" onClick={share}>{own ? (fr ? 'Partager ma réflexion' : 'Share my reflection') : (fr ? 'Partager cette réflexion' : 'Share this reflection')}</button>
      <button type="button" onClick={copyMessage}>{fr ? 'Copier le message et le lien' : 'Copy message and link'}</button>
      {fallback && <label>{fr ? 'Message à copier' : 'Message to copy'}<textarea readOnly rows={7} value={full} onFocus={e => e.target.select()}/></label>}
      <p role="status">{feedback}</p>
    </div>}
  </dialog>;
}
