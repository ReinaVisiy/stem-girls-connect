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
test("under-13 public permissions and identity are stripped regardless of payload", () => {
  const record = submissionRecord(input);
  for (const key of [
    "consent_public",
    "consent_display_name",
    "consent_display_country",
    "consent_display_city",
    "consent_reuse",
  ])
    assert.equal(record[key as keyof typeof record], false);
  assert.equal(record.display_name, null);
  assert.equal(record.city_region, null);
  for (const status of [
    "pending",
    "approved",
    "approved_redacted",
    "withdrawn",
    "escalated",
  ])
    assert.equal(eligible(12, true, status, null), false);
  assert.equal(eligible(13, true, "approved", null), true);
  assert.equal(eligible(13, false, "approved", null), false);
  assert.equal(eligible(13, true, "approved", new Date()), false);
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
