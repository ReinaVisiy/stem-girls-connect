-- Apply after the two earlier Girlhood migrations.
begin;
alter table public.girlhood_submissions
  add column request_token_hash text unique check (char_length(request_token_hash) = 64),
  add column request_payload_hash text check (char_length(request_payload_hash) = 64),
  add column public_display_name text check (char_length(public_display_name) <= 80),
  add column public_country text check (char_length(public_country) <= 100),
  add column public_city text check (char_length(public_city) <= 100);
-- Deliberately no identity backfill: existing voices become anonymous until reviewed.
-- Never grant recovery credentials or their hashes to browser roles.
grant select (public_display_name,public_country,public_city)
  on public.girlhood_submissions to authenticated;
grant update (public_display_name,public_country,public_city)
  on public.girlhood_submissions to authenticated;

create or replace view public.girlhood_public_responses with (security_invoker = true) as
select public_reference,public_category,language,public_girlhood_response,public_future_response,public_support_response,
  case when consent_display_name then coalesce(nullif(trim(public_display_name),''),'Anonymous') else 'Anonymous' end as safe_display_name,
  case when consent_display_country then nullif(trim(public_country),'') else null end as safe_country,
  case when consent_display_city then nullif(trim(public_city),'') else null end as safe_city,
  featured,created_at,featured_order
from public.girlhood_submissions
where age >= 13 and consent_public = true
  and moderation_status in ('approved','approved_redacted') and withdrawn_at is null;

-- Reuse the audited trigger for changes to the new public fields, while its original
-- column-level permissions continue protecting age, original identity and consent.
-- Public clients must not bypass newsletter rate limits by inserting directly.
-- The existing SGC subscribers table and its admin SELECT/DELETE policies are required.
revoke all on public.subscribers from public, anon;
revoke insert on public.subscribers from authenticated;
grant insert on public.subscribers to service_role;
-- Support existing serial/bigserial subscriber IDs without assuming their name.
do $$
declare sequence_name text;
begin
  sequence_name := pg_get_serial_sequence('public.subscribers','id');
  if sequence_name is not null then
    execute format('grant usage, select on sequence %s to service_role', sequence_name);
  end if;
end;
$$;
commit;
