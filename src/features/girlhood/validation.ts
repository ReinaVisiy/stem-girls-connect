import type { GirlhoodSubmissionInput } from "./types";
import { validate } from "../../../shared/girlhood";
export {
  CONSENT_VERSION as GIRLHOOD_CONSENT_VERSION,
  deriveCategory as derivePublicCategory,
  plain as normalizePlainText,
} from "../../../shared/girlhood";
export function validateGirlhoodSubmission(
  input: Partial<GirlhoodSubmissionInput>,
) {
  return validate(input as Record<string, unknown>);
}
