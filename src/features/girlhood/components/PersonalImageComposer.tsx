import { useEffect, useRef, useState } from 'react';
import { renderImages, type PersonalWords, type RenderedPage } from '../paper/renderImage';
import { copy } from '../config/copy';
import type { GirlhoodLanguage } from '../types';

export default function PersonalImageComposer({words, language, onClose}: {words: PersonalWords; language: GirlhoodLanguage; onClose: () => void}) {
  const fr = language === 'fr', t = copy[language];
  const dialog = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<'portrait' | 'story'>('portrait');
  const [signature, setSignature] = useState(words.name ?? '');
  const [included, setIncluded] = useState([true, true, true]);
  // Edits live only in this dialog. They never touch the submission, the form or the database.
  const [draft, setDraft] = useState<[string, string, string]>(words.answers);
  const [view, setView] = useState<'edit' | 'preview'>('preview');
  const [rendering, setRendering] = useState<{answers: [string, string, string]; signature: string}>({answers: words.answers, signature: words.name ?? ''});
  useEffect(() => {
    const id = window.setTimeout(() => setRendering({answers: draft, signature}), 450);
    return () => window.clearTimeout(id);
  }, [draft, signature]);
  const edited = draft.some((v, i) => v !== words.answers[i]) || signature !== (words.name ?? '');
  const resetEdits = () => {setDraft(words.answers); setSignature(words.name ?? ''); setIncluded([true, true, true]);};
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [busy, setBusy] = useState(true), [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    let active = true; let rendered: RenderedPage[] = [];
    setBusy(true); setPages([]); setError('');
    renderImages({...words, answers: rendering.answers}, included, rendering.signature, format, language).then(result => {
      rendered = result;
      if (active) {setPages(result); setBusy(false);} else result.forEach(p => URL.revokeObjectURL(p.url));
    }).catch(() => {if (active) {setBusy(false); setError(fr ? 'Impossible de créer l’image. Réessaie.' : 'Could not create the image. Please try again.');}});
    return () => {active = false; rendered.forEach(p => URL.revokeObjectURL(p.url));};
  }, [words, rendering, included, format, language, fr]);
  const files = pages.map(p => p.file);
  const shareable = files.length > 0 && !!navigator.canShare?.({files});
  async function share() {
    try {await navigator.share({files});} catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setError(fr ? 'Utilise les liens de téléchargement ci-dessous.' : 'Use the download links below.');
    }
  }
  return <dialog ref={dialog} className="girlhood-composer" aria-labelledby="personal-image-title" onClose={onClose}>
    <button type="button" className="girlhood-note-close" onClick={() => dialog.current?.close()} aria-label={fr ? 'Fermer' : 'Close'} autoFocus>×</button>
    <h2 id="personal-image-title">{fr ? 'Ton image, tes mots' : 'Your image, your words'}</h2>
    <p>{fr ? 'Créée sur ton appareil. Tes mots ne sont pas envoyés pour créer cette image.' : 'Created on your device. Your words are not uploaded to make this image.'}</p>
    <p>{words.under13 || !words.ageKnown ? (fr ? 'Avant de partager ailleurs, demande à un adulte de confiance. Évite ton nom complet et tes coordonnées.' : 'Before sharing elsewhere, ask a trusted adult. Avoid your full name and contact details.') : (fr ? 'Vérifie ce que tu souhaites partager ailleurs. Évite les informations privées.' : 'Check what you want to share elsewhere. Leave out private information.')}</p>
    <div className="girlhood-composer-tabs" role="group" aria-label={fr ? 'Affichage' : 'View'}>
      <button type="button" className="girlhood-composer-tab" aria-pressed={view === 'edit'} onClick={() => setView('edit')}>{fr ? 'Modifier ma carte' : 'Edit My Card'}</button>
      <button type="button" className="girlhood-composer-tab" aria-pressed={view === 'preview'} onClick={() => setView('preview')}>{fr ? 'Aperçu de la carte' : 'Preview Card'}</button>
    </div>
    {view === 'edit' && <div className="girlhood-composer-edit">
      <p>{fr ? 'Ces changements ne concernent que cette carte. Ils ne modifient pas ce que tu as envoyé.' : 'These changes only affect this card. They do not change anything you submitted.'}</p>
      {[t.q1,t.q2,t.q3].map((prompt,i) => (words.answers[i] || draft[i]) && <div key={prompt} className="girlhood-composer-field">
        <label htmlFor={'card-answer-' + i}>{prompt}</label>
        <textarea id={'card-answer-' + i} rows={3} maxLength={1200} value={draft[i]} onChange={e => {const v = e.target.value; setDraft(d => d.map((x, n) => n === i ? v : x) as [string, string, string]);}} />
        <label className="girlhood-composer-include"><input type="checkbox" checked={included[i]} onChange={e => setIncluded(values => values.map((v,n) => n === i ? e.target.checked : v))}/>{fr ? 'Inclure dans la carte' : 'Include on the card'}</label>
      </div>)}
      <label>{fr ? 'Nom sur la carte (facultatif)' : 'Name on the card (optional)'}<input value={signature} maxLength={60} onChange={e => setSignature(e.target.value)} /></label>
      {edited && <button type="button" className="girlhood-button" onClick={resetEdits}>{fr ? 'Annuler mes modifications' : 'Cancel Edits'}</button>}
    </div>}
    {view === 'preview' && <>
    <label htmlFor="personal-format">Format</label><select id="personal-format" value={format} onChange={e => setFormat(e.target.value as 'portrait'|'story')}><option value="portrait">1080 × 1350</option><option value="story">1080 × 1920</option></select>
    {busy && <p role="status">{fr ? 'Création de ton image…' : 'Creating your image…'}</p>}
    {error && <p role="alert">{error}</p>}
    {!busy && shareable && <button type="button" className="girlhood-button" onClick={share}>{fr ? 'Partager les images' : 'Share images'}</button>}
    {(busy || rendering.answers !== draft || rendering.signature !== signature) && <p className="sr-only" role="status">{fr ? 'Mise à jour de l’aperçu…' : 'Updating the preview…'}</p>}
    {!busy && pages.map((page,i) => <figure key={page.url}><img src={page.url} alt={fr ? `Aperçu de ton image, page ${i+1}` : `Your image preview, page ${i+1}`}/><a className="girlhood-button" href={page.url} download={page.file.name}>{fr ? 'Télécharger le PNG' : 'Download PNG'} {pages.length > 1 ? `${i+1} / ${pages.length}` : ''}</a></figure>)}
    </>}
  </dialog>;
}
