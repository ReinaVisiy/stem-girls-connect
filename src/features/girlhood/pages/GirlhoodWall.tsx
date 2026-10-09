import PublicNoteDialog from '../components/PublicNoteDialog';
import GirlhoodPaperFrame from '../paper/GirlhoodPaperFrame';
import { useSearchParams } from 'react-router-dom';
import { ContributionLink } from "../components/CampaignAvailability";
import { useGirlhoodRuntime } from "../GirlhoodRuntime";
import { useGirlhoodBasePath } from "../GirlhoodPaths";
import { useEffect, useState } from "react";
import { Link } from "../GirlhoodRuntime";
import Seo from "../../../components/Seo";
import GirlhoodResponseCard from "../components/GirlhoodResponseCard";
import { useGirlhoodLanguage } from "../hooks/useGirlhoodLanguage";
import { ui } from "../config/ui";
import type { GirlhoodCategory, GirlhoodPublicResponse } from "../types";
export default function GirlhoodWall() {
  const [params, setParams] = useSearchParams();
  const selected = params.get("note");
  const openNote = (reference: string) => setParams({note: reference});
  const { request, preview } = useGirlhoodRuntime();
  const basePath = useGirlhoodBasePath();
  const { language } = useGirlhoodLanguage();
  const t = ui[language];
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [category, setCategory] = useState("all"),
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
      language: "all",
    });
    if (cursor) query.set("cursor", cursor);
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
  }, [category, page, cursor, retry, request]);
  return (
    <section className="girlhood-wall-page">
      <Seo
        title={t.voices + " | Girlhood Should Be Hers"}
        description={t.wallIntro}
        path={basePath + "/wall"}
      />
      <h1 className="girlhood-page-title">{t.voices}</h1>
      <p className="mt-4 max-w-2xl">{t.wallIntro}</p>
      <ContributionLink className="girlhood-button mt-6 inline-block">
        {t.add}
      </ContributionLink>
      <div className="girlhood-filters" role="group" aria-label={t.voices}>
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
      {loading ? (
        <div className="mt-8">
          <p role="status">{t.loading}</p>
          <div aria-hidden="true" className="girlhood-notes-grid">
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
        <div><p role="status" className="py-12">{t.empty}</p><div className="girlhood-notes-grid" aria-hidden="true">{[0,1,2].map(i => <GirlhoodPaperFrame key={i} size="thumb"><span /></GirlhoodPaperFrame>)}</div></div>
      ) : (
        <div className="girlhood-notes-grid">
          {responses.map((r) => (
            <GirlhoodResponseCard
              key={r.public_reference}
              response={r}
              language={language}
              onOpen={preview ? undefined : openNote}
            />
          ))}
        </div>
      )}
      {(page > 1 || hasMore) && (
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
            onClick={() => {
              setCursors((values) => [...values.slice(0, page), nextCursor]);
              setPage((v) => v + 1);
            }}
          >
            {t.next}
          </button>
        </nav>
      )}
      {!preview && selected && <PublicNoteDialog reference={selected} language={language} onClose={() => setParams({})} />}
      <p className="mt-10 text-sm">{t.disclaimer}</p>
    </section>
  );
}
