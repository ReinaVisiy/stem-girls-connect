import type { GirlhoodPublicResponse, GirlhoodLanguage } from "../types";
import { copy } from "../config/copy";
import { ui } from "../config/ui";
import { experience } from "../config/experience";
export default function GirlhoodResponseCard({
  response,
  language = response.language,
}: {
  response: GirlhoodPublicResponse;
  language?: GirlhoodLanguage;
}) {
  const t = copy[language],
    l = ui[language];
  const location = [response.safe_city, response.safe_country]
    .filter(Boolean)
    .join(", ");
  return (
    <article className="girlhood-voice-card break-inside-avoid overflow-hidden rounded-3xl border border-brandPink/10 bg-white p-6 shadow-sm [overflow-wrap:anywhere]">
      <p className="mb-3 text-sm font-bold">{l.categories[response.public_category]}{response.featured ? (language === 'fr' ? ' · À la une' : ' · Featured') : ''}</p>
      <p className="text-sm font-black text-brandPink">{t.q1}</p>
      <blockquote
        lang={response.language}
        className="mt-3 whitespace-pre-wrap text-xl font-bold"
      >
        “{response.public_girlhood_response}”
      </blockquote>
      {(response.public_future_response ||
        response.public_support_response) && (
        <details className="mt-5">
          <summary>{experience[language].details}</summary>
          {response.public_future_response && (
            <>
              <p className="mt-6 text-sm font-black text-brandPink">{t.q2}</p>
              <p lang={response.language} className="mt-2 whitespace-pre-wrap">
                {response.public_future_response}
              </p>
            </>
          )}
          {response.public_support_response && (
            <>
              <p className="mt-6 text-sm font-black text-brandPink">{t.q3}</p>
              <p lang={response.language} className="mt-2 whitespace-pre-wrap">
                {response.public_support_response}
              </p>
            </>
          )}
        </details>
      )}
      <footer className="mt-6 border-t pt-4 text-sm">
        —{" "}
        {response.safe_display_name === "Anonymous"
          ? l.anonymous
          : response.safe_display_name}{" "}
        · {l.categories[response.public_category]}
        {location ? " · " + location : ""}
      </footer>
    </article>
  );
}
