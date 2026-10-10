-- Final publication model: 15 and over may publish automatically after safety checks; everyone
-- younger can take part and appears only after a person approves. No age is barred. Under 18
-- countries need their own review. Existing rows, consent and audit history are preserved.
begin;

alter table public.girlhood_submissions drop constraint if exists under_13_never_public;

alter table public.girlhood_submissions
  add column if not exists country_review_status text not null default 'not_applicable'
    check (country_review_status in ('not_applicable','pending','approved','rejected')),
  add column if not exists guardian_authorization_status text not null default 'not_required'
    check (guardian_authorization_status in ('not_required','required','recorded'));

-- Rows saved before this change keep their state. Nothing private or pending is published here.
update public.girlhood_submissions
   set country_review_status = 'pending'
 where age < 18 and consent_public and consent_display_country and coalesce(country,'') <> ''
   and moderation_status in ('pending','approved','approved_redacted') and withdrawn_at is null
   and public_country is null;

create or replace function public.girlhood_prepare_submission()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.public_category = case when new.perspective = 'ally' then 'ally' when new.age < 18 then 'girl' when new.age <= 24 then 'young_woman' else 'woman' end;
  return new;
end;
$$;

create or replace function public.girlhood_guard_private_data() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.age is distinct from old.age or new.perspective is distinct from old.perspective then
      raise exception 'Participant age and perspective cannot be changed';
    end if;
    if old.withdrawn_at is not null and new.withdrawn_at is distinct from old.withdrawn_at then
      raise exception 'Withdrawal cannot be reversed';
    end if;
    if (new.consent_public and not old.consent_public)
       or (new.consent_display_name and not old.consent_display_name)
       or (new.consent_display_country and not old.consent_display_country)
       or (new.consent_display_city and not old.consent_display_city)
       or (new.consent_reuse and not old.consent_reuse)
       or (new.consent_analysis and not old.consent_analysis) then
      raise exception 'Moderation cannot grant participant consent';
    end if;
  end if;
  -- Under 15: a person must approve. The database refuses automatic approval at any layer.
  if new.age < 15 and new.moderation_status in ('approved','approved_redacted')
     and (tg_op = 'INSERT' or old.moderation_status not in ('approved','approved_redacted')) then
    if tg_op = 'INSERT' or auth.uid() is null then
      raise exception 'Responses from participants under 15 need human approval before publication';
    end if;
    if new.guardian_authorization_status = 'required' then
      raise exception 'Record guardian authorization before publishing this response';
    end if;
  end if;
  -- Under 18: a country is public only after its own review.
  if new.age < 18 and new.country_review_status <> 'approved' then
    new.public_country := null;
  end if;
  if new.age < 18 and tg_op = 'INSERT' then
    new.public_city := null;
  end if;
  return new;
end;
$$;

-- Re-create the audited moderation trigger function without the old age-13 floor on featuring.
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
  if new.featured and (not new.consent_public or new.withdrawn_at is not null) then
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

create or replace view public.girlhood_public_responses with (security_invoker = true) as
select public_reference,public_category,language,public_girlhood_response,public_future_response,public_support_response,
  case when consent_display_name then coalesce(nullif(trim(public_display_name),''),'Anonymous') else 'Anonymous' end as safe_display_name,
  case when consent_display_country and (age >= 18 or country_review_status = 'approved')
       then nullif(trim(public_country),'') else null end as safe_country,
  case when consent_display_city then nullif(trim(public_city),'') else null end as safe_city,
  featured,created_at,featured_order
from public.girlhood_submissions
where consent_public = true
  and moderation_status in ('approved','approved_redacted') and withdrawn_at is null;

grant select (country_review_status,guardian_authorization_status) on public.girlhood_submissions to authenticated;
grant update (country_review_status,guardian_authorization_status) on public.girlhood_submissions to authenticated;

commit;
