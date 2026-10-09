import { test } from "node:test";
import assert from "node:assert/strict";
import { rights, rightsSources } from "../../src/features/girlhood/config/rights";
import { copy } from "../../src/features/girlhood/config/copy";

const nbsp = " ";
const plain = (f: { before?: string; strong: string; after: string }) =>
  (f.before ?? "") + f.strong + f.after;

test("rights section keeps five sourced indicators in both languages", () => {
  assert.equal(rightsSources.length, 5);
  for (const url of rightsSources.map((s) => s.url)) {
    assert.match(url, /^https:\/\//);
  }
  for (const lang of ["en", "fr"] as const) {
    const c = rights[lang];
    assert.equal(c.facts.length, 5);
    assert.deepEqual(
      c.facts.map((f) => f.source),
      [0, 1, 2, 3, 4],
      "each fact points at its own source",
    );
    assert.ok(c.contentNote.length > 0, "content note is present");
  }
});

test("population and measure stay faithful to the sources", () => {
  const en = rights.en.facts.map(plain);
  assert.match(en[0], /^More than 120 million girls are out of school\.$/);
  assert.match(en[1], /girls and women alive today/);
  assert.match(en[1], /rape or sexual assault before turning 18/);
  assert.match(en[2], /230 million girls and women/);
  assert.match(en[3], /^About one in five girls is married before age 18\.$/);
  assert.match(en[4], /35% of STEM graduates.*not changed in a decade/);
  const fr = rights.fr.facts.map(plain);
  assert.match(fr[1], /filles et les femmes qui vivent aujourd’hui/);
  assert.match(fr[1], /avant ses 18 ans/);
});

test("French typography uses non-breaking spaces before high punctuation", () => {
  assert.ok(copy.fr.question.endsWith(nbsp + "?"));
  assert.ok(copy.fr.intro.endsWith(nbsp + "?"));
  assert.ok(rights.fr.facts[4].strong.includes(nbsp + "%"));
  assert.ok(rights.fr.facts[0].strong.includes(`120${nbsp}millions`));
});

test("hero copy matches the approved wording and omits the question from the speech", () => {
  assert.equal(copy.en.heroTitle, "Girlhood Should Be Hers.");
  assert.equal(copy.en.question, "What if girls wrote the rules?");
  assert.equal(copy.fr.heroTitle, "Que l’enfance soit la sienne.");
  for (const lang of ["en", "fr"] as const) {
    const speech = JSON.stringify(rights[lang]);
    assert.ok(!speech.includes(copy[lang].question), "question appears once, in the hero");
  }
});

test("no em dashes in campaign copy", () => {
  assert.ok(!JSON.stringify([copy, rights]).includes("—"));
});
