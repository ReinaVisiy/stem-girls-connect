import { test } from "node:test";
import assert from "node:assert/strict";
import { validate, submissionRecord, eligible } from "../../shared/girlhood";
import {
  hashWithdrawalCode,
  makeReference,
  makeWithdrawalCode,
  postGuard,
} from "../../api/_lib/girlhood/_shared";
const input = {
  age: 12,
  perspective: "own",
  language: "en",
  girlhoodResponse: "A world full of learning",
  futureResponse: "",
  supportResponse: "",
  displayName: "Name",
  cityRegion: "City",
  country: "Country",
  consentPublic: true,
  consentDisplayName: true,
  consentDisplayCountry: true,
  consentDisplayCity: true,
  consentReuse: true,
  consentAnalysis: true,
  acknowledgementReview: true,
  acknowledgementPrivacy: true,
};
test("short notes and long reflections keep optional thoughts optional", () => {
  for (const text of ["Safe.", "Free to dream.", "Someone who believed in me.", "é".repeat(2000)]) {
    assert.deepEqual(validate({ ...input, girlhoodResponse: text, futureResponse: "", supportResponse: "" }), []);
    assert.equal(submissionRecord({ ...input, girlhoodResponse: text }).girlhood_response, text);
  }
  for (const text of ["", "   ", "x".repeat(2001), "x".repeat(10001)]) {
    assert.ok(validate({ ...input, girlhoodResponse: text }).includes("answers"));
  }
  for (const key of ["futureResponse", "supportResponse"]) {
    assert.deepEqual(validate({ ...input, [key]: "x".repeat(2000) }), []);
    assert.ok(validate({ ...input, [key]: "x".repeat(2001) }).includes("answers"));
  }
});
test("age must be explicitly supplied as an integer; false strings are never consent", () => {
  for (const age of ["", null, undefined, "13", 13.5, -1, 121])
    assert.ok(validate({ ...input, age }).includes("age"));
  for (const age of [0, 8, 12, 13, 17, 18, 24, 25, 120])
    assert.deepEqual(validate({ ...input, age }), []);
  assert.ok(validate({ ...input, consentPublic: "false" }).includes("choices"));
  assert.ok(
    validate({ ...input, acknowledgementReview: "true" }).includes(
      "acknowledgements",
    ),
  );
});
test("everyone under 15 who asks to share waits for a person, whatever the age", () => {
  for (const age of [0, 8, 10, 12, 13, 14]) {
    const record = submissionRecord({ ...input, age, displayName: "", consentDisplayName: false, consentDisplayCity: false });
    assert.equal(record.consent_public, true, `age ${age}`);
    assert.equal(record.moderation_status, "pending", `age ${age}`);
    assert.equal(record.moderation_reason, "under_15_review");
    assert.equal(record.public_display_name, null);
    assert.equal(record.public_country, null);
    assert.equal(record.public_city, null);
  }
});
test("15 and over publish at once when consented and safe; declined stays private; flagged waits", () => {
  for (const age of [15, 16, 17, 18, 25]) {
    const record = submissionRecord({ ...input, age, consentDisplayCountry: false, consentDisplayCity: false });
    assert.equal(record.moderation_status, "approved", `age ${age}`);
  }
  for (const age of [8, 14, 15, 30]) {
    const record = submissionRecord({ ...input, age, consentPublic: false });
    assert.equal(record.consent_public, false);
    assert.equal(record.moderation_status, "pending");
    assert.equal(record.public_display_name, null);
  }
  for (const age of [8, 16, 30])
    assert.equal(submissionRecord({ ...input, age, girlhoodResponse: "write to a@b.com" }).moderation_status, "pending");
});
test("names and countries are separate decisions; under 18 countries wait for review", () => {
  const blank = submissionRecord({ ...input, age: 16, displayName: "", consentDisplayName: true });
  assert.equal(blank.moderation_status, "approved");
  assert.equal(blank.public_display_name, null);
  const named = submissionRecord({ ...input, age: 16, displayName: "Reina", consentDisplayName: true, consentDisplayCountry: true, consentDisplayCity: true });
  assert.equal(named.moderation_status, "approved");
  assert.equal(named.public_display_name, "Reina");
  assert.equal(named.public_country, null);
  assert.equal(named.public_city, null);
  assert.equal(named.country_review_status, "pending");
  const noName = submissionRecord({ ...input, age: 16, displayName: "Reina", consentDisplayName: false });
  assert.equal(noName.public_display_name, null);
  const adult = submissionRecord({ ...input, age: 30, displayName: "Ada", consentDisplayName: true, consentDisplayCountry: true, consentDisplayCity: false });
  assert.equal(adult.public_country, "Country");
  assert.equal(adult.country_review_status, "not_applicable");
});
test("eligibility never depends on age, only consent, approval and withdrawal", () => {
  for (const age of [8, 14, 15, 40]) {
    assert.equal(eligible(age, true, "approved", null), true);
    assert.equal(eligible(age, false, "approved", null), false);
    assert.equal(eligible(age, true, "approved", new Date()), false);
    for (const status of ["pending", "withdrawn", "escalated", "rejected"])
      assert.equal(eligible(age, true, status, null), false);
  }
});
test("strong reference and code generation, compatible hashing for existing codes", () => {
  process.env.GIRLHOOD_WITHDRAWAL_PEPPER = "test-only-pepper-".repeat(4);
  assert.match(makeReference(), /^GSH-[A-F0-9]{16}$/);
  assert.equal(makeWithdrawalCode().length, 27);
  assert.equal(
    hashWithdrawalCode("vQ7K-H92f-4Xps"),
    hashWithdrawalCode("vQ7K-H92f-4Xps"),
  );
  assert.notEqual(hashWithdrawalCode("one"), hashWithdrawalCode("two"));
});
test("mutation guard rejects cross-origin, non-JSON and oversized payloads", () => {
  process.env.GIRLHOOD_ALLOWED_ORIGINS = "https://campaign.example";
  const res: any = {
    statusCode: 0,
    setHeader() {},
    status(n: number) {
      this.statusCode = n;
      return this;
    },
    json() {},
  };
  const req: any = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
    },
    body: input,
  };
  assert.equal(postGuard(req, res), false);
  assert.equal(res.statusCode, 403);
  req.headers.origin = "https://campaign.example";
  assert.equal(postGuard(req, res), true);
  req.headers["content-type"] = "text/plain";
  assert.equal(postGuard(req, res), false);
  assert.equal(res.statusCode, 415);
  req.headers["content-type"] = "application/json";
  req.body = { text: "x".repeat(48001) };
  assert.equal(postGuard(req, res), false);
  assert.equal(res.statusCode, 413);
});
