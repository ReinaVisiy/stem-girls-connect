-- Reports: replace single report_date with a start/end range (0 rows, safe to alter)
alter table reports drop column if exists report_date;
alter table reports add column if not exists start_date date;
alter table reports add column if not exists end_date date;

-- Site image placements: lets the admin panel assign an uploaded photo
-- to a specific named slot on the site (hero images, section photos, etc.)
-- without touching code. Frontend falls back to a bundled default when
-- a placement has no row yet.
create table if not exists site_images (
  placement_key text primary key,
  image_url text not null,
  alt_text text,
  updated_at timestamptz not null default now()
);

alter table site_images enable row level security;

create policy "Public read" on site_images for select using (true);
create policy "Admin write" on site_images for all using (is_admin()) with check (is_admin());

