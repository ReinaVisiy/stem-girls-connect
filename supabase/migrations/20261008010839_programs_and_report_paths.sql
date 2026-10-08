-- Programs system + report file paths (Phase A)
-- Additive and backwards compatible: nothing is dropped, reports.file_url is kept.

-- ---------------------------------------------------------------------
-- 1. reports: clean storage path + friendly download filename
-- ---------------------------------------------------------------------
alter table public.reports
  add column if not exists file_path text,
  add column if not exists download_name text;

-- Derive the bucket-relative path from the stored public URL
-- e.g. https://<ref>.supabase.co/storage/v1/object/public/site-assets/reports/<uuid>.pdf
--   -> reports/<uuid>.pdf
update public.reports
set file_path = substring(file_url from '/storage/v1/object/public/site-assets/(.+)$')
where file_path is null
  and file_url ~ '/storage/v1/object/public/site-assets/.+';

-- Friendly filename from the title, e.g. "My-Report-2026.pdf"
update public.reports
set download_name = trim(both '-' from regexp_replace(trim(title), '[^A-Za-z0-9]+', '-', 'g')) || '.pdf'
where download_name is null;

-- ---------------------------------------------------------------------
-- 2. programs
-- ---------------------------------------------------------------------
create table if not exists public.programs (
  id                       bigint generated always as identity primary key,
  title                    text not null,
  slug                     text not null unique,
  short_description        text,
  cover_image_url          text,

  status                   text not null default 'upcoming'
    check (status in ('upcoming','applications_open','applications_closed','ongoing','completed')),
  category                 text not null default 'other'
    check (category in ('training','mentorship','outreach','campaign','competition','event','other')),

  -- Text + format check (not an enum) so new special templates need no migration.
  page_template            text not null default 'standard'
    check (page_template ~ '^[a-z0-9_]+$'),

  start_date               date,
  end_date                 date,
  application_open_date    date,
  application_close_date   date,
  application_url          text,
  application_button_text  text,

  location                 text,
  format                   text,
  cost                     text,

  published                boolean not null default false,
  featured                 boolean not null default false,
  display_order            integer not null default 0,

  content                  jsonb not null default '{}'::jsonb,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint programs_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index if not exists programs_published_order_idx
  on public.programs (published, display_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. program_reports (junction)
-- ---------------------------------------------------------------------
create table if not exists public.program_reports (
  id             bigint generated always as identity primary key,
  program_id     bigint not null references public.programs(id) on delete cascade,
  report_id      bigint not null references public.reports(id) on delete cascade,
  edition_label  text,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (program_id, report_id)
);

create index if not exists program_reports_report_id_idx
  on public.program_reports (report_id);

-- ---------------------------------------------------------------------
-- 4. Row Level Security (same is_admin() pattern as the rest of the site)
-- ---------------------------------------------------------------------
alter table public.programs enable row level security;
alter table public.program_reports enable row level security;

-- Visitors only see published programs; admins see everything.
create policy "Read published or admin"
  on public.programs for select
  using (published = true or (select public.is_admin()));

create policy "Admin insert"
  on public.programs for insert
  with check ((select public.is_admin()));

create policy "Admin update"
  on public.programs for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin delete"
  on public.programs for delete
  using ((select public.is_admin()));

-- Links are only visible when their program is visible.
create policy "Read links of published or admin"
  on public.program_reports for select
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.programs p
      where p.id = program_reports.program_id and p.published = true
    )
  );

create policy "Admin insert links"
  on public.program_reports for insert
  with check ((select public.is_admin()));

create policy "Admin update links"
  on public.program_reports for update
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admin delete links"
  on public.program_reports for delete
  using ((select public.is_admin()));
