-- Expand only response lengths. Existing records, consent, grants, RLS,
-- moderation, receipts and withdrawal rules remain unchanged.
-- Deploy this backwards-compatible migration before the new application.
alter table public.girlhood_submissions
  drop constraint girlhood_submissions_girlhood_response_check,
  drop constraint girlhood_submissions_future_response_check,
  drop constraint girlhood_submissions_support_response_check,
  drop constraint girlhood_public_lengths,
  add constraint girlhood_submissions_girlhood_response_check
    check (char_length(girlhood_response) between 1 and 2000),
  add constraint girlhood_submissions_future_response_check
    check (future_response is null or char_length(future_response) <= 2000),
  add constraint girlhood_submissions_support_response_check
    check (support_response is null or char_length(support_response) <= 2000),
  add constraint girlhood_public_lengths
    check (char_length(public_girlhood_response) <= 2000
      and char_length(public_future_response) <= 2000
      and char_length(public_support_response) <= 2000);
