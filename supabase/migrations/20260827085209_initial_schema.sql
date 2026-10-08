-- Impact stats (Home page cards)
create table site_stats (
  id bigint generated always as identity primary key,
  stat_key text unique not null,
  value text not null,
  label text not null,
  sub_stat text,
  display_order int not null default 0
);

-- Blog / news posts
create table posts (
  id bigint generated always as identity primary key,
  title text not null,
  slug text unique not null,
  body text not null,
  image_url text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Reports (shown on the new Impact & Evidence page)
create table reports (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  file_url text not null,
  report_date date,
  display_order int not null default 0
);

-- Partners
create table partners (
  id bigint generated always as identity primary key,
  name text not null,
  logo_url text,
  website_url text,
  display_order int not null default 0
);

-- Bureau members
create table bureau (
  id bigint generated always as identity primary key,
  name text not null,
  position text not null,
  photo_url text,
  linkedin_url text,
  display_order int not null default 0
);

-- Home page slideshow
create table home_slideshow (
  id bigint generated always as identity primary key,
  image_url text not null,
  caption text,
  display_order int not null default 0
);

-- Newsletter subscribers
create table subscribers (
  id bigint generated always as identity primary key,
  email text unique not null,
  subscribed_at timestamptz not null default now()
);

-- RLS: public read-only. Writes only ever happen from the Supabase
-- dashboard (you) or, for subscribers, from the serverless function
-- using the anon key with an insert policy.
alter table site_stats enable row level security;
create policy "Public read" on site_stats for select using (true);

alter table posts enable row level security;
create policy "Public read" on posts for select using (published = true);

alter table reports enable row level security;
create policy "Public read" on reports for select using (true);

alter table partners enable row level security;
create policy "Public read" on partners for select using (true);

alter table bureau enable row level security;
create policy "Public read" on bureau for select using (true);

alter table home_slideshow enable row level security;
create policy "Public read" on home_slideshow for select using (true);

alter table subscribers enable row level security;
create policy "Public insert" on subscribers for insert with check (true);

