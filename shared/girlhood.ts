export const CONSENT_VERSION = "2026-10-08-v2";
export const PUBLIC_STATUSES = ["approved", "approved_redacted"];
export function plain(value: unknown, max = 10000): string {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, max)
    : "";
}
export function deriveCategory(age: number, perspective: string) {
  return perspective === "ally"
    ? "ally"
    : age < 18
      ? "girl"
      : age <= 24
        ? "young_woman"
        : "woman";
}
export function eligible(
  age: number,
  consent: boolean,
  status: string,
  withdrawn: unknown,
) {
  return (
    age >= 13 &&
    consent === true &&
    PUBLIC_STATUSES.includes(status) &&
    !withdrawn
  );
}
export function validate(input: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (
    typeof input.age !== "number" ||
    !Number.isInteger(input.age) ||
    input.age < 0 ||
    input.age > 120
  )
    errors.push("age");
  if (!["own", "ally"].includes(String(input.perspective)))
    errors.push("perspective");
  if (!["en", "fr"].includes(String(input.language))) errors.push("language");
  if (
    typeof input.girlhoodResponse !== "string" ||
    plain(input.girlhoodResponse).length < 1 ||
    plain(input.girlhoodResponse).length > 2000
  )
    errors.push("answers");
  for (const key of ["futureResponse", "supportResponse"]) {
    if (
      input[key] != null &&
      (typeof input[key] !== "string" || plain(input[key]).length > 2000)
    )
      errors.push("answers");
  }
  for (const [key, limit] of [
    ["displayName", 80],
    ["country", 100],
    ["cityRegion", 100],
  ] as const) {
    if (
      input[key] != null &&
      (typeof input[key] !== "string" || plain(input[key]).length > limit)
    )
      errors.push("identity");
  }
  for (const key of [
    "consentPublic",
    "consentDisplayName",
    "consentDisplayCountry",
    "consentDisplayCity",
    "consentReuse",
    "consentAnalysis",
  ]) {
    if (typeof input[key] !== "boolean") errors.push("choices");
  }
  if (
    input.acknowledgementReview !== true ||
    input.acknowledgementPrivacy !== true
  )
    errors.push("acknowledgements");
  return [...new Set(errors)];
}
export function submissionRecord(input: Record<string, unknown>) {
  const age = input.age as number;
  const under13 = age < 13;
  const consent = !under13 && input.consentPublic === true;
  const q1 = plain(input.girlhoodResponse),
    q2 = plain(input.futureResponse) || null,
    q3 = plain(input.supportResponse) || null;
  return {
    age,
    perspective: input.perspective,
    language: input.language,
    public_category: deriveCategory(age, String(input.perspective)),
    display_name: under13 ? null : plain(input.displayName, 80) || "Anonymous",
    country: under13 ? null : plain(input.country, 100) || null,
    city_region: under13 ? null : plain(input.cityRegion, 100) || null,
    girlhood_response: q1,
    future_response: q2,
    support_response: q3,
    public_girlhood_response: q1,
    public_future_response: q2,
    public_support_response: q3,
    consent_public: consent,
    consent_display_name: consent && input.consentDisplayName === true,
    consent_display_country: consent && input.consentDisplayCountry === true,
    consent_display_city: consent && input.consentDisplayCity === true,
    consent_reuse: !under13 && input.consentReuse === true,
    consent_analysis: input.consentAnalysis === true,
    consent_version: CONSENT_VERSION,
    moderation_status: "pending",
  };
}
