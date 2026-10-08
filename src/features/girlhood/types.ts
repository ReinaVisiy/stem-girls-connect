export type GirlhoodLanguage = "en" | "fr";
export type GirlhoodPerspective = "own" | "ally";
export type GirlhoodCategory = "girl" | "young_woman" | "woman" | "ally";
export type GirlhoodModerationStatus =
  | "pending"
  | "approved"
  | "approved_redacted"
  | "rejected"
  | "escalated"
  | "withdrawn";

export interface GirlhoodSubmissionInput {
  age: number | "";
  perspective: GirlhoodPerspective;
  language: GirlhoodLanguage;
  displayName: string;
  country: string;
  cityRegion: string;
  girlhoodResponse: string;
  futureResponse: string;
  supportResponse: string;
  consentPublic: boolean;
  consentDisplayName: boolean;
  consentDisplayCountry: boolean;
  consentDisplayCity: boolean;
  consentReuse: boolean;
  consentAnalysis: boolean;
  acknowledgementReview: boolean;
  acknowledgementPrivacy: boolean;
  website?: string;
}

export interface GirlhoodPublicResponse {
  public_reference: string;
  public_category: GirlhoodCategory;
  language: GirlhoodLanguage;
  public_girlhood_response: string;
  public_future_response: string | null;
  public_support_response: string | null;
  safe_display_name: string;
  safe_country: string | null;
  safe_city: string | null;
  featured: boolean;
  created_at: string;
}

export interface GirlhoodStatsData {
  publicVoices: number;
  girls: number;
  youngWomen: number;
  women: number;
  allies: number;
}
