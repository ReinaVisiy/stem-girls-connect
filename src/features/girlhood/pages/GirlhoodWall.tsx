import { ContributionLink } from '../components/CampaignAvailability';
import { useGirlhoodRuntime } from '../GirlhoodRuntime';
import { useGirlhoodBasePath } from '../GirlhoodPaths';
import { useEffect, useState } from "react";
import { Link } from "../GirlhoodRuntime";
import Seo from "../../../components/Seo";
import GirlhoodResponseCard from "../components/GirlhoodResponseCard";
import { useGirlhoodLanguage } from "../hooks/useGirlhoodLanguage";
import { ui } from "../config/ui";
import type { GirlhoodCategory, GirlhoodPublicResponse } from "../types";
export default function GirlhoodWall() {
  const { request } = useGirlhoodRuntime();
  const basePath = useGirlhoodBasePath();
  const { language } = useGirlhoodLanguage();
  const t = ui[language];
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [category, setCategory] = useState("all"),
    [responseLanguage, setResponseLanguage] = useState("all"),
    [page, setPage] = useState(1);
  const [responses, setResponses] = useState<GirlhoodPublicResponse[]>([]),
    [hasMore, setHasMore] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  const cursor = cursors[page - 1];
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    const query = new URLSearchParams({
      page: String(page),
      category,
      language: responseLanguage,
    });
    if (cursor) query.set('cursor', cursor);
    request("/api/girlhood/wall?" + query, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (!controller.signal.aborted) {
          setResponses(d.responses);
          setHasMore(d.hasMore);
          setNextCursor(d.nextCursor ?? null);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [category, responseLanguage, page, cursor, retry, request]);
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <Seo
        title={t.voices + " | Girlhood Should Be Hers"}
        description={t.wallIntro}
        path={basePath + '/wall'}
      />
      <h1 className="text-5xl font-black">{t.voices}</h1>
      <p className="mt-4 max-w-2xl">{t.wallIntro}</p>
      <p className="mt-3 max-w-3xl text-sm">{language === 'fr' ? 'Les filles et les jeunes femmes sont au cœur de cette campagne. Les témoignages des femmes adultes et des alliés présentent leurs propres perspectives.' : 'Girls and young women are at the heart of this campaign. Adult women and allies speak from their own perspectives.'}</p>
      <ContributionLink className="girlhood-button mt-6 inline-block"
        >
        {t.add}
      </ContributionLink>
      <div
        className="mt-8 flex flex-wrap gap-2"
        role="group"
        aria-label={t.voices}
      >
        {["all", ...Object.keys(t.categories)].map((key) => (
          <button
            key={key}
            aria-pressed={category === key}
            onClick={() => {
              setCategory(key);
              setPage(1);
              setCursors([null]);
            }}
            className={
              category === key
                ? "girlhood-button"
                : "rounded-full border px-4 py-2"
            }
          >
            {key === "all" ? t.all : t.categories[key as GirlhoodCategory]}
          </button>
        ))}
      </div>
      <label className="mt-5 block font-bold">
        {t.responseLanguage}
        <select
          className="girlhood-input mt-2 max-w-xs"
          value={responseLanguage}
          onChange={(e) => {
            setResponseLanguage(e.target.value);
            setPage(1);
            setCursors([null]);
          }}
        >
          <option value="all">{t.allLanguages}</option>
          <option value="en" lang="en">
            English
          </option>
          <option value="fr" lang="fr">
            Français
          </option>
        </select>
      </label>
      {loading ? (
        <div className="mt-8">
          <p role="status">{t.loading}</p>
          <div
            aria-hidden="true"
            className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="girlhood-skeleton" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="py-12">
          <p role="alert">{t.unavailable}</p>
          <button
            className="girlhood-button mt-4"
            onClick={() => setRetry((v) => v + 1)}
          >
            {t.retry}
          </button>
        </div>
      ) : responses.length === 0 ? (
        <p role="status" className="py-12">
          {t.empty}
        </p>
      ) : (
        <div className="mt-8 grid items-start gap-5 md:grid-cols-2 lg:grid-cols-3">
          {responses.map((r) => (
            <GirlhoodResponseCard
              key={r.public_reference}
              response={r}
              language={language}
            />
          ))}
        </div>
      )}
      <nav
        className="mt-8 flex items-center justify-between gap-3"
        aria-label={t.page}
      >
        <button
          disabled={loading || page === 1}
          className="girlhood-button"
          onClick={() => setPage((v) => v - 1)}
        >
          {t.previous}
        </button>
        <span aria-live="polite">
          {t.page} {page}
        </span>
        <button
          disabled={loading || error || !hasMore || !nextCursor}
          className="girlhood-button"
          onClick={() => { setCursors((values) => [...values.slice(0, page), nextCursor]); setPage((v) => v + 1); }}
        >
          {t.next}
        </button>
      </nav>
      <p className="mt-10 text-sm">{t.disclaimer}</p>
    </section>
  );
}

