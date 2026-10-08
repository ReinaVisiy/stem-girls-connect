create table if not exists public.girlhood_submissions (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  withdrawal_hash text not null,
  age integer not null check (age between 0 and 120),
  perspective text not null check (perspective in ('own', 'ally')),
  public_category text not null check (public_category in ('girl', 'young_woman', 'woman', 'ally')),
  language text not null check (language in ('en', 'fr')),
  display_name text,
  country text,
  city_region text,
  girlhood_response text not null check (char_length(girlhood_response) between 10 and 500),
  future_response text check (future_response is null or char_length(future_response) <= 500),
  support_response text check (support_response is null or char_length(support_response) <= 500),
  public_girlhood_response text,
  public_future_response text,
  public_support_response text,
  consent_public boolean not null default false,
  consent_display_name boolean not null default false,
  consent_display_country boolean not null default false,
  consent_display_city boolean not null default false,
  consent_reuse boolean not null default false,
  consent_analysis boolean not null default false,
  consent_version text not null,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','approved_redacted','rejected','escalated','withdrawn')),
  moderation_reason text,
  moderation_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  featured boolean not null default false,
  featured_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  constraint under_13_never_public check (age >= 13 or (consent_public = false and consent_display_name = false and consent_display_city = false and consent_reuse = false))
);

create table if not exists public.girlhood_moderation_events (
  id bigint generated always as identity primary key,
  submission_id uuid not null references public.girlhood_submissions(id) on delete cascade,
  moderator_id uuid references auth.users(id),
  previous_status text,
  new_status text not null,
  reason_code text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.girlhood_submissions enable row level security;
alter table public.girlhood_moderation_events enable row level security;

create policy "Girlhood admins read" on public.girlhood_submissions for select to authenticated using ((select public.is_admin()));
create policy "Girlhood admins update" on public.girlhood_submissions for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Girlhood admins read events" on public.girlhood_moderation_events for select to authenticated using ((select public.is_admin()));
create policy "Girlhood admins add events" on public.girlhood_moderation_events for insert to authenticated with check ((select public.is_admin()) and moderator_id = (select auth.uid()));

create or replace view public.girlhood_public_responses with (security_invoker = true) as
select
  public_reference,
  public_category,
  language,
  public_girlhood_response,
  public_future_response,
  public_support_response,
  case when consent_display_name then coalesce(nullif(display_name, ''), 'Anonymous') else 'Anonymous' end as safe_display_name,
  case when consent_display_country then country else null end as safe_country,
  case when consent_display_city then city_region else null end as safe_city,
  featured,
  created_at
from public.girlhood_submissions
where age >= 13
  and consent_public = true
  and moderation_status in ('approved', 'approved_redacted')
  and withdrawn_at is null;

revoke all on public.girlhood_public_responses from anon, authenticated;
revoke all on public.girlhood_submissions from anon;

create or replace function public.log_girlhood_moderation_event()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.moderation_status is distinct from new.moderation_status then
    insert into public.girlhood_moderation_events (submission_id, moderator_id, previous_status, new_status, reason_code, notes)
    values (new.id, (select auth.uid()), old.moderation_status, new.moderation_status, new.moderation_reason, new.moderation_notes);
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger girlhood_moderation_audit before update on public.girlhood_submissions
for each row execute function public.log_girlhood_moderation_event();

create index if not exists girlhood_submissions_moderation_idx on public.girlhood_submissions (moderation_status, created_at desc);
create index if not exists girlhood_submissions_public_idx on public.girlhood_submissions (public_category, created_at desc) where consent_public = true and withdrawn_at is null;
