begin;
-- Participants under 13 may now have their note shown on the wall, always anonymously:
-- name, country and city are never stored or shown, and reuse stays off.
alter table public.girlhood_submissions drop constraint under_13_never_public;
alter table public.girlhood_submissions add constraint under_13_always_anonymous
  check (age >= 13 or (consent_display_name = false and consent_display_country = false
    and consent_display_city = false and consent_reuse = false));

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
  if new.age < 13 then
    new.display_name := null; new.country := null; new.city_region := null;
    new.public_display_name := null; new.public_country := null; new.public_city := null;
    new.consent_reuse := false;
    new.consent_display_name := false; new.consent_display_country := false; new.consent_display_city := false;
    new.featured := false;
  end if;
  return new;
end;
$$;

create or replace function public.girlhood_prepare_submission()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.public_category = case when new.perspective = 'ally' then 'ally' when new.age < 18 then 'girl' when new.age <= 24 then 'young_woman' else 'woman' end;
  if new.age < 13 then
    new.display_name = null; new.city_region = null; new.featured = false;
    new.consent_reuse = false; new.consent_display_name = false; new.consent_display_country = false;
    new.consent_display_city = false;
  end if;
  return new;
end;
$$;

-- Under-13 notes appear, but never with a name or place.
create or replace view public.girlhood_public_responses with (security_invoker = true) as
select public_reference,public_category,language,public_girlhood_response,public_future_response,public_support_response,
  case when age >= 13 and consent_display_name then coalesce(nullif(trim(public_display_name),''),'Anonymous') else 'Anonymous' end as safe_display_name,
  case when age >= 13 and consent_display_country then nullif(trim(public_country),'') else null end as safe_country,
  case when age >= 13 and consent_display_city then nullif(trim(public_city),'') else null end as safe_city,
  featured,created_at,featured_order
from public.girlhood_submissions
where consent_public = true
  and moderation_status in ('approved','approved_redacted') and withdrawn_at is null;
commit;
