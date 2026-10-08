-- Apply after the original campaign migration; safe for existing campaign rows.
begin;
alter table public.girlhood_submissions
  add column escalation_owner text,
  add column escalation_resolution text,
  add column reuse_cleanup_required boolean not null default false;
alter table public.girlhood_moderation_events add column changes jsonb not null default '{}'::jsonb;

-- Existing withdrawals must remain withdrawn when the old admin UI is used.
update public.girlhood_submissions set withdrawn_at = coalesce(withdrawn_at, now()), featured = false,
  reuse_cleanup_required = consent_reuse or reuse_cleanup_required,
  consent_public = false, consent_reuse = false, consent_analysis = false,
  consent_display_name = false, consent_display_country = false, consent_display_city = false
where moderation_status = 'withdrawn' or withdrawn_at is not null;

alter table public.girlhood_submissions
  add constraint girlhood_identity_lengths check (
    char_length(display_name) <= 80 and char_length(country) <= 100 and char_length(city_region) <= 100) not valid,
  add constraint girlhood_public_lengths check (
    char_length(public_girlhood_response) <= 500 and char_length(public_future_response) <= 500 and char_length(public_support_response) <= 500) not valid,
  add constraint girlhood_notes_lengths check (
    char_length(moderation_notes) <= 2000 and char_length(moderation_reason) <= 1000
    and char_length(escalation_owner) <= 120 and char_length(escalation_resolution) <= 2000) not valid;

-- Grants are explicit: do not rely on project default privileges.
revoke all on public.girlhood_submissions from public, anon, authenticated;
grant select (
  id,public_reference,age,perspective,public_category,language,display_name,country,city_region,
  girlhood_response,future_response,support_response,public_girlhood_response,public_future_response,public_support_response,
  consent_public,consent_display_name,consent_display_country,consent_display_city,consent_reuse,consent_analysis,
  consent_version,moderation_status,moderation_reason,moderation_notes,reviewed_by,reviewed_at,featured,featured_order,
  created_at,updated_at,withdrawn_at,escalation_owner,escalation_resolution,reuse_cleanup_required
) on public.girlhood_submissions to authenticated;
grant update (
  moderation_status,moderation_reason,moderation_notes,public_girlhood_response,public_future_response,
  public_support_response,featured,featured_order,escalation_owner,escalation_resolution,reuse_cleanup_required
) on public.girlhood_submissions to authenticated;
grant all on public.girlhood_submissions to service_role;
revoke all on public.girlhood_moderation_events from public, anon, authenticated;
grant select, insert on public.girlhood_moderation_events to authenticated;
grant all on public.girlhood_moderation_events to service_role;
grant usage, select on sequence public.girlhood_moderation_events_id_seq to authenticated, service_role;
drop policy "Girlhood admins add events" on public.girlhood_moderation_events;
create policy "Girlhood trigger audit only" on public.girlhood_moderation_events for insert to authenticated
with check (pg_trigger_depth() > 0 and (select public.is_admin()) and moderator_id = (select auth.uid()));

create or replace function public.log_girlhood_moderation_event()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare diff jsonb;
begin
  if old.withdrawn_at is not null or old.moderation_status = 'withdrawn' then
    if new.moderation_status <> 'withdrawn' then raise exception 'A withdrawn contribution cannot be republished'; end if;
  end if;
  if new.moderation_status = 'withdrawn' then
    new.withdrawn_at = coalesce(old.withdrawn_at, now());
    new.featured = false;
    new.consent_public = false; new.consent_reuse = false; new.consent_analysis = false;
    new.consent_display_name = false; new.consent_display_country = false; new.consent_display_city = false;
    if old.withdrawn_at is null then
      new.reuse_cleanup_required = old.consent_reuse;
    end if;
  end if;
  if new.moderation_status in ('approved','approved_redacted') then
    if coalesce(char_length(trim(new.public_girlhood_response)),0) < 1 then raise exception 'Public-safe response is required'; end if;
  else new.featured = false;
  end if;
  if new.featured and (new.age < 13 or not new.consent_public or new.withdrawn_at is not null) then
    raise exception 'Only public contributions can be featured';
  end if;
  if new.moderation_status in ('rejected','escalated') and coalesce(trim(new.moderation_reason),'') = '' then
    raise exception 'A moderation reason is required';
  end if;
  if new.moderation_status = 'escalated' and coalesce(trim(new.escalation_owner),'') = '' then
    raise exception 'An escalation owner is required';
  end if;
  if old.moderation_status = 'escalated' and new.moderation_status not in ('escalated','withdrawn')
     and coalesce(trim(new.escalation_resolution),'') = '' then raise exception 'Record the escalation resolution first'; end if;
  if auth.uid() is not null then new.reviewed_by = auth.uid(); new.reviewed_at = now(); end if;
  new.updated_at = now();
  -- Audit only changed field names, not duplicate private response text.
  select coalesce(jsonb_object_agg(n.key, true), '{}'::jsonb) into diff
    from jsonb_each(to_jsonb(new)) n join jsonb_each(to_jsonb(old)) o on n.key = o.key
    where n.value is distinct from o.value and n.key not in ('updated_at','reviewed_at','reviewed_by');
  if diff <> '{}'::jsonb then
    insert into public.girlhood_moderation_events
      (submission_id,moderator_id,previous_status,new_status,reason_code,notes,changes)
    values (new.id,auth.uid(),old.moderation_status,new.moderation_status,new.moderation_reason,new.moderation_notes,diff);
  end if;
  return new;
end;
$$;
revoke all on function public.log_girlhood_moderation_event() from public, anon, authenticated;
grant execute on function public.log_girlhood_moderation_event() to service_role;

-- Enforce derived category and private under-13 identity on every insert.
create function public.girlhood_prepare_submission()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.public_category = case when new.perspective = 'ally' then 'ally' when new.age < 18 then 'girl' when new.age <= 24 then 'young_woman' else 'woman' end;
  if new.age < 13 then
    new.display_name = null; new.city_region = null; new.featured = false;
    new.consent_public = false; new.consent_display_name = false; new.consent_display_country = false;
    new.consent_display_city = false; new.consent_reuse = false;
  end if;
  return new;
end;
$$;
revoke all on function public.girlhood_prepare_submission() from public, anon, authenticated;
grant execute on function public.girlhood_prepare_submission() to service_role;
create trigger girlhood_prepare before insert on public.girlhood_submissions
for each row execute function public.girlhood_prepare_submission();

revoke all on public.girlhood_public_responses from public, anon, authenticated;
grant select on public.girlhood_public_responses to service_role;
create or replace view public.girlhood_public_responses with (security_invoker = true) as
select public_reference,public_category,language,public_girlhood_response,public_future_response,public_support_response,
  case when consent_display_name then coalesce(nullif(display_name,''),'Anonymous') else 'Anonymous' end as safe_display_name,
  case when consent_display_country then country else null end as safe_country,
  case when consent_display_city then city_region else null end as safe_city,featured,created_at,featured_order
from public.girlhood_submissions
where age >= 13 and consent_public = true and moderation_status in ('approved','approved_redacted') and withdrawn_at is null;
create function public.girlhood_public_stats() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('publicVoices', count(*), 'girls', count(*) filter(where public_category='girl'),
    'youngWomen', count(*) filter(where public_category='young_woman'), 'women', count(*) filter(where public_category='woman'),
    'allies', count(*) filter(where public_category='ally')) from public.girlhood_public_responses;
$$;
revoke all on function public.girlhood_public_stats() from public, anon, authenticated;
grant execute on function public.girlhood_public_stats() to service_role;

-- Atomic fixed-window limiter shared by all API instances; fingerprints only.
create table public.girlhood_rate_buckets (
  fingerprint text primary key check(char_length(fingerprint)=64),
  expires_at timestamptz not null,
  attempts integer not null
);
alter table public.girlhood_rate_buckets enable row level security;
revoke all on public.girlhood_rate_buckets from public, anon, authenticated;
grant all on public.girlhood_rate_buckets to service_role;
create index girlhood_rate_expiry on public.girlhood_rate_buckets(expires_at);
create function public.girlhood_rate_limit(p_key text, p_limit integer) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare used integer;
begin
  if p_limit < 1 or p_limit > 100 then raise exception 'Invalid limit'; end if;
  delete from public.girlhood_rate_buckets where expires_at < now();
  insert into public.girlhood_rate_buckets(fingerprint,expires_at,attempts)
    values(p_key, now() + interval '15 minutes', 1)
  on conflict(fingerprint) do update set attempts = least(public.girlhood_rate_buckets.attempts + 1, 1000)
  returning attempts into used;
  return used <= p_limit;
end;
$$;
revoke all on function public.girlhood_rate_limit(text,integer) from public, anon, authenticated;
grant execute on function public.girlhood_rate_limit(text,integer) to service_role;
-- Daily maintenance deletes response-level data and cascade-deletes its audit history.
create function public.girlhood_expire_records() returns integer
language plpgsql security invoker set search_path = '' as $$
declare removed integer;
begin
  delete from public.girlhood_submissions where created_at < now() - interval '12 months';
  get diagnostics removed = row_count;
  delete from public.girlhood_rate_buckets where expires_at < now();
  return removed;
end;
$$;
revoke all on function public.girlhood_expire_records() from public, anon, authenticated;
grant execute on function public.girlhood_expire_records() to service_role;
commit;
