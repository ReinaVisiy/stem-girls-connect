import { ContributionLink } from '../components/CampaignAvailability';
import { useGirlhoodBasePath } from '../GirlhoodPaths';
import { useState } from "react";
import { Sparkles, Orbit, Heart, ArrowRight } from "lucide-react";
import { Link } from "../GirlhoodRuntime";
import { experience } from "../config/experience";
import type { GirlhoodLanguage } from "../types";

export default function GirlhoodPossibilities({
  language,
}: {
  language: GirlhoodLanguage;
}) {
  const basePath = useGirlhoodBasePath();
  const [selected, setSelected] = useState(0);
  const x = experience[language];
  const icons = [Sparkles, Orbit, Heart];
  return (
    <div className="girlhood-possibilities">
      <div className="girlhood-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="relative z-10">
        <p className="text-sm font-bold uppercase tracking-[.2em]">{x.hero}</p>
        <div
          className="girlhood-possibility-copy"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="girlhood-possibility-word" key={selected}>
            {x.possibilities[selected].word}
          </p>
          <h2 className="text-xl font-bold">
            {x.possibilities[selected].line}
          </h2>
          <p className="mt-3 text-sm leading-relaxed">
            {x.possibilities[selected].note}
          </p>
        </div>
        <div
          className="girlhood-possibility-buttons"
          role="group"
          aria-label={x.hero}
        >
          {x.possibilities.map((item, i) => {
            const Icon = icons[i];
            return (
              <button
                type="button"
                key={i}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.word}</span>
              </button>
            );
          })}
        </div>
        <ContributionLink className="mt-6 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4"
          >
          {x.begin}
          <ArrowRight size={16} aria-hidden="true" />
        </ContributionLink>
      </div>
    </div>
  );
}
