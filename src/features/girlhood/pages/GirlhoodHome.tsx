import { ContributionLink } from '../components/CampaignAvailability';
import { useGirlhoodRuntime } from '../GirlhoodRuntime';
import { useGirlhoodBasePath } from '../GirlhoodPaths';
import { useEffect, useState } from "react";
import { Link } from "../GirlhoodRuntime";
import Seo from "../../../components/Seo";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Heart,
  PencilLine,
} from "lucide-react";
import GirlhoodPossibilities from "../components/GirlhoodPossibilities";
import { experience } from "../config/experience";
import { copy } from "../config/copy";
import { ui } from "../config/ui";
import GirlhoodResponseCard from "../components/GirlhoodResponseCard";
import { useGirlhoodLanguage } from "../hooks/useGirlhoodLanguage";
import type { GirlhoodPublicResponse, GirlhoodStatsData } from "../types";
export default function GirlhoodHome() {
  const { request } = useGirlhoodRuntime();
  const basePath = useGirlhoodBasePath();
  const { language } = useGirlhoodLanguage();
  const t = copy[language],
    l = ui[language];
  const x = experience[language];
  const [stats, setStats] = useState<GirlhoodStatsData | null>(null),
    [voices, setVoices] = useState<GirlhoodPublicResponse[]>([]),
    [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(
      ["/api/girlhood/stats", "/api/girlhood/wall?page=1&featured=true"].map(
        (url) =>
          request(url, { signal: controller.signal }).then((r) => {
            if (!r.ok) throw new Error();
            return r.json();
          }),
      ),
    )
      .then(([s, w]) => {
        if (!controller.signal.aborted) {
          setStats(s);
          setVoices(w.responses.slice(0, 3));
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [request]);
  return (
    <>
      <Seo
        title={t.title + " | STEM Girls Connect"}
        description={t.intro}
        path={basePath + ''}
      />
      <section className="girlhood-hero relative overflow-hidden bg-[#32112c] px-5 py-16 text-white sm:py-24">
        <div className="girlhood-stars" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="girlhood-eyebrow">
              <Sparkles size={16} aria-hidden="true" />
              {l.day}
            </p>
            <h1 className="mt-7 text-5xl font-black leading-[1.07] tracking-tight sm:text-7xl">
              {t.title}
            </h1>
            <p className="mt-6 text-xl text-[#eedff0]">{t.tagline}</p>
            <p className="mt-6 max-w-xl leading-relaxed">{t.intro}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ContributionLink className="girlhood-hero-cta inline-flex items-center gap-3 rounded-full bg-white px-6 py-4 font-bold text-brandPink"
                >
                {t.addVoice}
                <ArrowRight size={18} aria-hidden="true" />
              </ContributionLink>
              <Link
                className="rounded-full border border-white px-6 py-3 font-bold"
                to={basePath + '/wall'}
              >
                {t.wall}
              </Link>
            </div>
            <p className="mt-6 text-sm text-[#eedff0]">{x.small}</p>
          </div>
          <GirlhoodPossibilities language={language} />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-12">
        {stats ? (
          <dl className="girlhood-stats grid grid-cols-2 gap-5 rounded-3xl bg-white p-6 sm:grid-cols-5">
            {[
              [l.count, stats.publicVoices],
              [l.categories.girl, stats.girls],
              [l.categories.young_woman, stats.youngWomen],
              [l.categories.woman, stats.women],
              [l.categories.ally, stats.allies],
            ].map(([label, n]) => (
              <div key={label} className="text-center">
                <dt>{label}</dt>
                <dd className="mt-2 text-3xl font-black text-brandPink">{n}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p role={error ? "alert" : "status"}>
            {error ? l.unavailable : l.loading}
          </p>
        )}
        <div className="mt-16 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-brandPink">
            {x.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">{x.journey}</h2>
          <p className="mt-4 text-lg">{x.journeyHelp}</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            [l.imagine, l.imagineHelp],
            [l.choose, l.chooseHelp],
            [l.connect, l.connectHelp],
          ].map(([title, body], i) => (
            <div
              key={title}
              className="girlhood-journey-card rounded-3xl bg-white p-7"
            >
              <div className="mb-8 flex items-center justify-between text-brandPink">
                {i === 0 ? (
                  <PencilLine aria-hidden="true" />
                ) : i === 1 ? (
                  <ShieldCheck aria-hidden="true" />
                ) : (
                  <Heart aria-hidden="true" />
                )}
                <span className="text-sm font-bold">0{i + 1}</span>
              </div>
              <h3 className="text-2xl font-black">{title}</h3>
              <p className="mt-4">{body}</p>
            </div>
          ))}
        </div>
        <div className="girlhood-trust mt-10 rounded-3xl bg-[#e3f4ec] p-7 sm:p-10">
          <ShieldCheck size={32} aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold">{x.trust}</h2>
          <p className="mt-4 max-w-3xl">{x.trustHelp}</p>
          <details className="mt-4">
            <summary className="cursor-pointer font-bold">{l.privacy}</summary>
            <p className="mt-4">{l.privacyAge}</p>
            <p className="mt-3">{l.privacyChoices}</p>
          </details>
          <Link className="mt-4 inline-block underline" to={basePath + '/privacy'}>
            {l.privacy}
          </Link>
        </div>
        {voices.length === 0 && !error && stats && <p className="mt-10" role="status">{l.empty}</p>}
        {voices.length > 0 && (
          <section className="mt-12">
            <h2 className="text-3xl font-black">{l.featured}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {voices.map((r) => (
                <GirlhoodResponseCard
                  key={r.public_reference}
                  response={r}
                  language={language}
                />
              ))}
            </div>
          </section>
        )}
        <Link to={basePath + '/wall'} className="girlhood-button mt-8 inline-block">
          {l.viewAll}
        </Link>
      </section>
    </>
  );
}

