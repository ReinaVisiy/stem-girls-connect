import { Fragment, useId, useRef } from "react";
import { rights, rightsSources } from "../config/rights";
import type { GirlhoodLanguage } from "../types";

/**
 * The rights-based editorial beat shown below the hero: five sourced global
 * indicators, kept short and calm (not a statistics dashboard). Each number is
 * an in-page link to its source in the list below, so nobody has to leave the
 * page to find where a figure comes from.
 */
export default function GirlhoodRights({
  language,
}: {
  language: GirlhoodLanguage;
}) {
  const c = rights[language];
  const uid = useId();
  const sources = useRef<HTMLDetailsElement>(null);
  const headingId = uid + "-heading";
  const sourceId = (i: number) => `${uid}-source-${i + 1}`;
  return (
    <section
      className="girlhood-rights"
      aria-labelledby={headingId}
      lang={language}
    >
      <h2 id={headingId} className="sr-only">
        {c.heading}
      </h2>
      <p className="girlhood-rights-lead">{c.lead}</p>
      <p className="girlhood-rights-list">
        {c.rights.map((right) => (
          <span key={right}>{right}</span>
        ))}
      </p>
      <p className="girlhood-rights-bridge">{c.bridge}</p>
      {c.facts.map((fact) => (
        <p className="girlhood-rights-fact" key={fact.source}>
          {fact.before}
          <strong>{fact.strong}</strong>
          {fact.after}
          <sup>
            <a
              className="girlhood-rights-ref"
              href={"#" + sourceId(fact.source)}
              onClick={() => {
                if (sources.current) sources.current.open = true;
              }}
              aria-label={c.sourceLink(
                fact.source + 1,
                rightsSources[fact.source].label,
              )}
            >
              {fact.source + 1}
            </a>
          </sup>
        </p>
      ))}
      <p className="girlhood-rights-closing">
        {c.closing.before}
        <strong>{c.closing.strong}</strong>
      </p>
      <details className="girlhood-sources" ref={sources}>
        <summary>{c.viewSources}</summary>
        <h3 className="sr-only">{c.sourcesHeading}</h3>
        <ol>
          {rightsSources.map((source, i) => (
            <li id={sourceId(i)} key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.label}
                <span className="sr-only"> ({c.newTab})</span>
              </a>
            </li>
          ))}
        </ol>
        {c.sourcesNote && (
          <Fragment>
            <p className="girlhood-sources-note">{c.sourcesNote}</p>
          </Fragment>
        )}
      </details>
    </section>
  );
}
