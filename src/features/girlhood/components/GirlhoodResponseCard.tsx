import type { GirlhoodPublicResponse, GirlhoodLanguage } from '../types';
import GirlhoodPaperFrame from '../paper/GirlhoodPaperFrame';
import { useRef } from 'react';
import { copy } from '../config/copy';
export default function GirlhoodResponseCard({ response, language = response.language, onOpen }: {
  response: GirlhoodPublicResponse; language?: GirlhoodLanguage; onOpen?: (reference: string) => void;
}) {
  const preview = useRef<HTMLDialogElement>(null);
  const t = copy[language];
  return <GirlhoodPaperFrame as="article" size="thumb" reference={response.public_reference}>
    <button type="button" className="girlhood-note-preview" aria-haspopup="dialog" onClick={() => onOpen ? onOpen(response.public_reference) : preview.current?.showModal()}
      aria-label={(language === 'fr' ? 'Lire le mot : ' : 'Read note: ') + response.public_girlhood_response.slice(0,90)}>
      <span className="girlhood-note-excerpt" lang={response.language}>{response.public_girlhood_response}</span>
    </button>
    {!onOpen && <dialog ref={preview} className="girlhood-note-dialog" aria-label="Preview">
      <button type="button" onClick={() => preview.current?.close()} autoFocus>{language === 'fr' ? 'Fermer' : 'Close'}</button>
      <GirlhoodPaperFrame><h2 className="girlhood-paper-title">Girlhood Should Be Hers</h2>
        {[[t.q1,response.public_girlhood_response],[t.q2,response.public_future_response],[t.q3,response.public_support_response]].map(([prompt,answer]) => answer && <section key={prompt}><h3 className="girlhood-paper-prompt">{prompt}</h3><p className="girlhood-paper-answer">{answer}</p></section>)}
      </GirlhoodPaperFrame>
    </dialog>}
  </GirlhoodPaperFrame>;
}
