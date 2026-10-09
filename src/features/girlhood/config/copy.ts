import type { GirlhoodLanguage } from "../types";

export const copy = {
  en: {
    addVoice: "Leave a little wish",
    wall: "Read their wishes",
    title: "Girlhood Should Be Hers",
    tagline: "Her childhood. Her curiosity. Her future to design.",
    intro:
      "Think of the girl you were, the girl you are, or the girl you wish you could have been. What should girlhood feel like?",
    q1: "Girlhood should feel like…",
    q1Help:
      "What should every girl have the freedom to experience while growing up?",
    q2: "Every girl should be free to become…",
    q2Help: "Imagine without limits. What futures should be open to her?",
    q3: "What would have helped you? What would help her?",
    q3Help:
      "What do girls need from families, schools, communities and society to make these futures possible?",
    next: "Continue",
    back: "Back",
    submit: "Leave my note",
    optional: "Optional",
    required: "Required",
  },
  fr: {
    addVoice: "Laisser un petit souhait",
    wall: "Lire leurs souhaits",
    title: "L’enfance des filles devrait leur appartenir",
    tagline: "Son enfance. Sa curiosité. Son avenir à imaginer.",
    intro:
      "Pensez à la fille que vous étiez, que vous êtes ou que vous auriez aimé être. Quelle enfance lui souhaitez-vous ?",
    q1: "L’enfance des filles devrait être…",
    q1Help:
      "Qu’est-ce que chaque fille devrait être libre de vivre en grandissant ?",
    q2: "Chaque fille devrait être libre de devenir…",
    q2Help: "Imaginez sans limites. Quels avenirs devraient lui être ouverts ?",
    q3: "Qu’est-ce qui vous aurait aidée ? Qu’est-ce qui l’aiderait ?",
    q3Help:
      "De quoi les filles ont-elles besoin de la part des familles, des écoles, des communautés et de la société pour rendre ces avenirs possibles ?",
    next: "Continuer",
    back: "Retour",
    submit: "Laisser mon petit mot",
    optional: "Facultatif",
    required: "Obligatoire",
  },
} satisfies Record<GirlhoodLanguage, Record<string, string>>;

