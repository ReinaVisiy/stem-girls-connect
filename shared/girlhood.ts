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
const FLAGGED_WORDS =
  /\b(fuck\w*|shit\w*|bitch\w*|cunt\w*|whore\w*|slut\w*|nigg(?:er|a)\w*|fagg?ot\w*|retard\w*|putain\w*|merde\w*|connard\w*|connasse\w*|salope\w*|encule\w*|nique\w*|pute|batard\w*)\b/;
const SAFEGUARDING =
  /\b(kill (?:my|her|him|them)self|suicid\w*|self[- ]harm\w*|want to die|rape\w*|je veux mourir|me tuer|suicide|viol(?:ee|e)?s?)\b/;
const fold = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[0@]/g, (c) => (c === "0" ? "o" : "a"))
    .replace(/[1!]/g, "i")
    .replace(/3/g, "e")
    .replace(/[4]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t");

/**
 * Automatic safety checks for public text. A note that raises any reason is NOT rejected:
 * it simply stays pending until a person reviews it. This is a screen, not a guarantee.
 */
export function autoReviewIssues(texts: string[]): string[] {
  const issues = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text) || /(^|\s)@\w{2,}/.test(text)) issues.add("contact");
    if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|org|net|io|me|co|info|fr|cm|app|link|ly|xyz)\b)/i.test(text)) issues.add("link");
    const phone = text.match(/\+?\d[\d\s().-]{5,}\d/g) ?? [];
    if (phone.some((m) => { const digits = m.replace(/\D/g, "").length; return digits >= 9 || (m.trim().startsWith("+") && digits >= 7); })) issues.add("contact");
    if (
      /\b\d{1,5}\s+(?:[\p{L}'.-]+\s+){0,3}(street|st|road|rd|avenue|ave|boulevard|blvd|lane|rue|quartier)\b/iu.test(text) ||
      /\b(p\.?\s?o\.?\s?box|b\.?\s?p\.?\s?\d+)\b/i.test(text)
    )
      issues.add("address");
    const folded = fold(text);
    if (FLAGGED_WORDS.test(folded)) issues.add("language");
    if (SAFEGUARDING.test(folded)) issues.add("safeguarding");
    if (/(.)\1{11,}/.test(text)) issues.add("spam");
  }
  return [...issues];
}
export function submissionRecord(input: Record<string, unknown>) {
  const age = input.age as number;
  const under13 = age < 13;
  const consent = !under13 && input.consentPublic === true;
  const q1 = plain(input.girlhoodResponse),
    q2 = plain(input.futureResponse) || null,
    q3 = plain(input.supportResponse) || null;
  const showsIdentity =
    consent &&
    (input.consentDisplayName === true ||
      input.consentDisplayCountry === true ||
      input.consentDisplayCity === true);
  // Published at once only for 13+ who agreed to publish, when every public text passes the
  // automatic checks. Under 18s who also choose to show a name or place wait for a person.
  const autoApproved =
    consent &&
    (age >= 18 || !showsIdentity) &&
    autoReviewIssues([
      q1,
      q2 ?? "",
      q3 ?? "",
      plain(input.displayName, 80),
      plain(input.country, 100),
      plain(input.cityRegion, 100),
    ]).length === 0;
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
    // The public view shows the name and place from these columns, so an instantly published note
    // needs them filled (a moderator fills them for notes that wait for review).
    public_display_name:
      autoApproved && input.consentDisplayName === true && !under13
        ? plain(input.displayName, 80) || null
        : null,
    public_country:
      autoApproved && input.consentDisplayCountry === true && !under13
        ? plain(input.country, 100) || null
        : null,
    public_city:
      autoApproved && input.consentDisplayCity === true && !under13
        ? plain(input.cityRegion, 100) || null
        : null,
    moderation_status: autoApproved ? "approved" : "pending",
    moderation_reason: autoApproved ? "auto_checks_passed" : null,
  };
}
