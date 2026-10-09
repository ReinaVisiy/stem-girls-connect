import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import { ContributionLink } from "../components/CampaignAvailability";
import { Link, useGirlhoodRuntime } from "../GirlhoodRuntime";
import { useGirlhoodBasePath } from "../GirlhoodPaths";
import Seo from "../../../components/Seo";
import { copy } from "../config/copy";
import GirlhoodResponseCard from "../components/GirlhoodResponseCard";
import GirlhoodRights from "../components/GirlhoodRights";
import GirlhoodPaperFrame from "../paper/GirlhoodPaperFrame";
import { useGirlhoodLanguage } from "../hooks/useGirlhoodLanguage";
import type { GirlhoodPublicResponse } from "../types";
export default function GirlhoodHome() {
  const navigate = useNavigate();
  const { request, preview } = useGirlhoodRuntime();
  const basePath = useGirlhoodBasePath();
  const { language } = useGirlhoodLanguage();
  const t = copy[language];
  const [voices, setVoices] = useState<GirlhoodPublicResponse[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    request("/api/girlhood/wall?page=1&featured=true", {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setVoices(data.responses.slice(0, 6));
      })
      .catch(() => {
        /* The invitation remains available when featured notes cannot load. */
      });
    return () => controller.abort();
  }, [request]);
  return (
    <>
      <Seo
        title={t.title + " | STEM Girls Connect"}
        description={t.intro}
        path={basePath}
      />
      <section className="girlhood-invitation girlhood-hero">
        <div className="girlhood-hero-text">
          <p className="girlhood-small-heading">{t.eyebrow}</p>
          <h1>{t.heroTitle}</h1>
          <p className="girlhood-hero-question">{t.question}</p>
          <p className="girlhood-invitation-copy">{t.intro}</p>
          <div className="girlhood-invitation-actions">
            <ContributionLink>
              {t.addVoice} <span aria-hidden="true">↗</span>
            </ContributionLink>
            <Link className="girlhood-quiet-link" to={basePath + "/wall"}>
              {t.wall}
            </Link>
          </div>
        </div>
        <div className="girlhood-hero-art" aria-hidden="true">
          <GirlhoodPaperFrame reference="girlhood-hero" slices="small" />
        </div>
      </section>
      <GirlhoodRights language={language} />
      {voices.length > 0 && (
        <section className="girlhood-home-notes" aria-label={t.wall}>
          <div className="girlhood-notes-grid">
            {voices.map((response) => (
              <GirlhoodResponseCard
                key={response.public_reference}
                response={response}
                onOpen={preview ? undefined : reference => navigate(basePath + "/wall?note=" + encodeURIComponent(reference))}
                language={language}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
