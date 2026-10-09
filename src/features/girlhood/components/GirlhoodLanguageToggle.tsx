import type { GirlhoodLanguage } from "../types";
import { ui } from "../config/ui";
export default function GirlhoodLanguageToggle({
  language,
  onChange,
}: {
  language: GirlhoodLanguage;
  onChange: (value: GirlhoodLanguage) => void;
}) {
  return (
    <div
      className="girlhood-language inline-flex"
      role="group"
      aria-label={ui[language].language}
    >
      {(["en", "fr"] as const).map((value) => (
        <button
          key={value}
          type="button"
          lang={value}
          aria-label={value === "en" ? "English" : "Français"}
          aria-pressed={language === value}
          onClick={() => onChange(value)}
          className={
            language === value
              ? "rounded-full bg-brandPink px-4 py-2 font-bold text-white"
              : "rounded-full px-4 py-2 font-bold text-brandSlate"
          }
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
