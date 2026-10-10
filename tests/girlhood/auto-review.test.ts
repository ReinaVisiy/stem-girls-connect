import { test } from "node:test";
import assert from "node:assert/strict";
import { autoReviewIssues, submissionRecord } from "../../shared/girlhood";

const base = {
  age: 20, perspective: "own", language: "en",
  girlhoodResponse: "Girlhood should be freedom, curiosity and room to dream.",
  futureResponse: "A scientist, an artist, herself.", supportResponse: "Mentors who listen.",
  displayName: "", cityRegion: "", country: "",
  consentPublic: true, consentDisplayName: false, consentDisplayCountry: false, consentDisplayCity: false,
  consentReuse: false, consentAnalysis: false,
};

test("clean notes pass the automatic checks, including accents, emoji and dates", () => {
  for (const text of ["Freedom 🌸", "Elle rêve d'être ingénieure, libre et fière.", "From 1998 to 2004 I learned to code", "Born on 2026-10-11"])
    assert.deepEqual(autoReviewIssues([text]), []);
});
test("contact details, links, addresses, language and safeguarding topics are held", () => {
  const cases: [string, string][] = [
    ["write me at girl@example.com", "contact"], ["call 677 12 34 56", "contact"], ["my handle is @someone", "contact"],
    ["visit www.example.org", "link"], ["see example.com", "link"], ["I live at 12 Main Street", "address"],
    ["quelle merde", "language"], ["sh1t", "language"],
    ["I want to die", "safeguarding"], ["je veux mourir", "safeguarding"], ["aaaaaaaaaaaaaaaa", "spam"],
  ];
  for (const [text, reason] of cases) assert.ok(autoReviewIssues([text]).includes(reason), `${text} -> ${reason}`);
});
test("adults who agree to publish and pass the checks are approved at once", () => {
  const record = submissionRecord(base);
  assert.equal(record.moderation_status, "approved");
  assert.equal(record.moderation_reason, "auto_checks_passed");
});
test("under 15s who share wait for human approval and are never auto approved", () => {
  const record = submissionRecord({ ...base, age: 12 });
  assert.equal(record.moderation_status, "pending");
  assert.equal(record.consent_public, true);
});
test("no consent to publish means no approval", () => {
  assert.equal(submissionRecord({ ...base, consentPublic: false }).moderation_status, "pending");
});
test("notes that fail the checks wait for a person", () => {
  assert.equal(submissionRecord({ ...base, girlhoodResponse: "email me girl@example.com" }).moderation_status, "pending");
});
test("15 to 17 year olds publish at once even with a safe name; a name never delays text", () => {
  assert.equal(submissionRecord({ ...base, age: 15, displayName: "Ada", consentDisplayName: true }).moderation_status, "approved");
  assert.equal(submissionRecord({ ...base, age: 15, cityRegion: "Douala", consentDisplayCity: true }).moderation_status, "approved");
  assert.equal(submissionRecord({ ...base, age: 14, displayName: "Ada", consentDisplayName: true }).moderation_status, "pending");
});
test("a public name that fails the checks holds the note", () => {
  assert.equal(submissionRecord({ ...base, displayName: "see www.spam.com", consentDisplayName: true }).moderation_status, "pending");
});

test("a submission must say whether it is from a girl or woman, or from an ally", async () => {
  const { validate } = await import("../../shared/girlhood");
  const form = { ...base, acknowledgementReview: true, acknowledgementPrivacy: true };
  assert.ok(validate({ ...form, perspective: "" }).includes("perspective"));
  assert.ok(!validate({ ...form, perspective: "own" }).includes("perspective"));
  assert.ok(!validate({ ...form, perspective: "ally" }).includes("perspective"));
});

test("an instantly published note carries the public name and place the person agreed to show", () => {
  const shown = submissionRecord({ ...base, age: 25, displayName: "Ada", country: "Cameroon", cityRegion: "Douala", consentDisplayName: true, consentDisplayCountry: true, consentDisplayCity: false });
  assert.equal(shown.moderation_status, "approved");
  assert.equal(shown.public_display_name, "Ada");
  assert.equal(shown.public_country, "Cameroon");
  assert.equal(shown.public_city, null);
  const hidden = submissionRecord({ ...base, age: 25, displayName: "Ada", country: "Cameroon" });
  assert.equal(hidden.public_display_name, null);
  assert.equal(hidden.public_country, null);
  const waiting = submissionRecord({ ...base, age: 14, displayName: "Ada", consentDisplayName: true });
  assert.equal(waiting.public_display_name, null);
});
