-- Admin allowlist: only these auth users can write via the admin form
create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table admin_users enable row level security;
-- no public policies at all on admin_users: nobody can read/write it except via the dashboard/service role

create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_users where id = auth.uid()
  );
$$;

-- Posts: support multiple media items (images/videos), keep image_url for backward-compat as a "cover" image
alter table posts add column media jsonb not null default '[]'::jsonb;
comment on column posts.media is 'Array of {type: "image"|"video", url: string, caption?: string}';

-- Admin write policies (insert/update/delete) for every content table
create policy "Admin write" on site_stats for all using (is_admin()) with check (is_admin());
create policy "Admin write" on posts for all using (is_admin()) with check (is_admin());
create policy "Admin write" on reports for all using (is_admin()) with check (is_admin());
create policy "Admin write" on partners for all using (is_admin()) with check (is_admin());
create policy "Admin write" on bureau for all using (is_admin()) with check (is_admin());
create policy "Admin write" on home_slideshow for all using (is_admin()) with check (is_admin());

