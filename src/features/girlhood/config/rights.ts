import type { GirlhoodLanguage } from "../types";

/**
 * Rights-based editorial section shown below the hero.
 *
 * Wording is deliberately close to each source so the claim keeps the
 * population and the measure the source uses (for example, "alive today",
 * "before turning 18"). Do not shorten these without re-reading the source.
 *
 * Figures and links come from the campaign plan dated 9 October 2026 and must
 * be re-checked by a person before launch (see docs/girlhood/redesign.md).
 */
export interface RightsFact {
  before?: string;
  strong: string;
  after: string;
  /** Index into `sources` (0-based). */
  source: number;
}
export interface RightsSource {
  /** Accessible, human-readable name, e.g. "UNICEF, Girl Goals, 2025". */
  label: string;
  url: string;
}
export interface RightsCopy {
  heading: string;
  lead: string;
  rights: string[];
  /** The turn from the rights to the numbers. */
  bridge: string;
  facts: RightsFact[];
  closing: { before: string; strong: string };
  sourcesHeading: string;
  sourcesNote?: string;
  sourceLink: (n: number, label: string) => string;
  newTab: string;
}

const nb = " "; // non-breaking space (French typography)

export const rightsSources: RightsSource[] = [
  {
    label: "UNICEF, Girl Goals, 2025",
    url: "https://data.unicef.org/resources/girl-goals-report/",
  },
  {
    label: "UNICEF, Sexual violence against children, 2024",
    url: "https://data.unicef.org/topic/child-protection/violence/sexual-violence/",
  },
  {
    label: "UNICEF, Female genital mutilation: a global concern, 2024",
    url: "https://data.unicef.org/resources/female-genital-mutilation-a-global-concern-2024/",
  },
  {
    label: "UNICEF, International Day of the Girl 2026",
    url: "https://www.unicef.org/gender-equality/international-day-girl",
  },
  {
    label: "UNESCO, Women and girls in STEM education",
    url: "https://www.unesco.org/en/gender-equality/education/stem",
  },
];

export const rights: Record<GirlhoodLanguage, RightsCopy> = {
  en: {
    heading: "Every girl has rights",
    lead: "Every girl has rights.",
    rights: ["To learn.", "To be safe.", "To be healthy.", "To be heard."],
    bridge: "Yet for millions of girls, these rights are still promises on paper.",
    facts: [
      { strong: "120 million girls", before: "More than ", after: " are out of school.", source: 0 },
      {
        before: "Among the girls and women alive today, ",
        strong: "one in eight experienced rape or sexual assault before turning 18",
        after: ".",
        source: 1,
      },
      {
        before: "More than ",
        strong: "230 million girls and women",
        after: " have undergone female genital mutilation.",
        source: 2,
      },
      { strong: "About one in five girls", after: " is married before age 18.", source: 3 },
      {
        before: "Women make up just ",
        strong: "35% of STEM graduates",
        after: ", a share that has not changed in a decade.",
        source: 4,
      },
    ],
    closing: {
      before: "These numbers speak of rights denied. ",
      strong: "Girlhood should be hers.",
    },
    sourcesHeading: "Sources",
    sourceLink: (n, label) => `Source ${n}: ${label}`,
    newTab: "opens in a new tab",
  },
  fr: {
    heading: "Chaque fille a des droits",
    lead: "Chaque fille a des droits.",
    rights: [
      "Apprendre.",
      "Grandir en sécurité.",
      "Être soignée.",
      "Être écoutée.",
    ],
    bridge:
      "Pourtant, pour des millions de filles, ces droits ne sont encore que des promesses sur le papier.",
    facts: [
      {
        before: "Plus de ",
        strong: `120${nb}millions de filles`,
        after: " ne sont pas scolarisées.",
        source: 0,
      },
      {
        before: "Parmi les filles et les femmes qui vivent aujourd’hui, ",
        strong: "une sur huit a subi un viol ou une agression sexuelle avant ses 18 ans",
        after: ".",
        source: 1,
      },
      {
        before: "Plus de ",
        strong: `230${nb}millions de filles et de femmes`,
        after: " ont subi des mutilations génitales féminines.",
        source: 2,
      },
      {
        before: "",
        strong: "Environ une fille sur cinq",
        after: " est mariée avant 18 ans.",
        source: 3,
      },
      {
        before: "Les femmes ne représentent que ",
        strong: `35${nb}% des diplômés des filières STEM`,
        after: ", une proportion inchangée depuis dix ans.",
        source: 4,
      },
    ],
    closing: {
      before: "Ces chiffres parlent de droits refusés. ",
      strong: "Que l’enfance soit la sienne.",
    },
    sourcesHeading: "Sources",
    sourcesNote: "Sources en anglais.",
    sourceLink: (n, label) => `Source ${n}${nb}: ${label}`,
    newTab: "s’ouvre dans un nouvel onglet",
  },
};
