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
import HeroParticles from "../components/HeroParticles";
import TypewriterGreeting, { isGreetingSeason } from "../components/TypewriterGreeting";
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
      <section
        className={
          "girlhood-hero" + (isGreetingSeason() ? " has-greeting" : "")
        }
      >
        <HeroParticles />
        <div className="girlhood-hero-inner">
          <div className="girlhood-hero-text">
            <p className="girlhood-small-heading">{t.eyebrow}</p>
            {isGreetingSeason() && <TypewriterGreeting language={language} />}
            <h1>{t.heroTitle}</h1>
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
        </div>
      </section>
      <GirlhoodRights language={language} />
      <section className="girlhood-invite" aria-labelledby="girlhood-invite-title">
        <h2 id="girlhood-invite-title">{t.inviteTitle}</h2>
        <p>{t.inviteText}</p>
        <ContributionLink>
          {t.addVoice} <span aria-hidden="true">↗</span>
        </ContributionLink>
      </section>
      <section className="girlhood-home-notes" aria-labelledby="girlhood-preview-title">
        <h2 id="girlhood-preview-title" className="girlhood-preview-title">
          {t.previewTitle}
        </h2>
        {voices.length > 0 && (
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
        )}
        <p className="girlhood-preview-more">
          <Link className="girlhood-quiet-link" to={basePath + "/wall"}>
            {t.wall}
          </Link>
        </p>
      </section>
    </>
  );
}
