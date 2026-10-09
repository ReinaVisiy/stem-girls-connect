import { useId, useRef } from "react";
import type { GirlhoodPublicResponse, GirlhoodLanguage } from "../types";
import { ui } from "../config/ui";
export default function GirlhoodResponseCard({
  response,
  language = response.language,
}: {
  response: GirlhoodPublicResponse;
  language?: GirlhoodLanguage;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const l = ui[language];
  const name =
    response.safe_display_name === "Anonymous"
      ? ""
      : response.safe_display_name;
  const location = [response.safe_city, response.safe_country]
    .filter(Boolean)
    .join(", ");
  const close = () => dialog.current?.close();
  return (
    <article
      className={"girlhood-note girlhood-note-" + response.public_category}
    >
      <button
        ref={trigger}
        type="button"
        className="girlhood-note-preview"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={
          (language === "fr" ? "Lire le souhait : " : "Read wish: ") +
          response.public_girlhood_response.slice(0, 90)
        }
      >
        <span className="girlhood-note-mark" aria-hidden="true">
          ✳
        </span>
        <span className="girlhood-note-excerpt" lang={response.language}>
          {response.public_girlhood_response}
        </span>
        <span className="girlhood-note-signature">
          {name || l.categories[response.public_category]}
        </span>
      </button>
      <dialog
        ref={dialog}
        className="girlhood-note-dialog"
        aria-labelledby={id}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onClose={() => trigger.current?.focus()}
      >
        <div className="girlhood-expanded-note">
          <button
            type="button"
            className="girlhood-note-close"
            onClick={close}
            aria-label={language === "fr" ? "Fermer" : "Close"}
            autoFocus
          >
            ×
          </button>
          <p id={id} className="girlhood-small-heading">
            {l.categories[response.public_category]}
          </p>
          <blockquote lang={response.language}>
            {response.public_girlhood_response}
          </blockquote>
          {response.public_future_response && (
            <section>
              <h2>{language === "fr" ? "Devenir" : "Becoming"}</h2>
              <p lang={response.language}>{response.public_future_response}</p>
            </section>
          )}
          {response.public_support_response && (
            <section>
              <h2>
                {language === "fr" ? "Ce qui aiderait" : "What would help"}
              </h2>
              <p lang={response.language}>{response.public_support_response}</p>
            </section>
          )}
          {(name || location) && (
            <footer>
              {name}
              {name && location ? " · " : ""}
              {location}
            </footer>
          )}
        </div>
      </dialog>
    </article>
  );
}
