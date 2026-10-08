-- FRESH DATABASES ONLY. Run after the five recovered 202608/202609 migrations
-- and before 202610 migrations. Do not run against the existing live project.
-- These prerequisites were historically configured outside migration history.
create table public.site_content (
  key text primary key,
  content text not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
create policy "Public read" on public.site_content for select using (true);
create policy "Admin write" on public.site_content for all using (public.is_admin()) with check (public.is_admin());
create function public.rls_auto_enable() returns event_trigger
language plpgsql security definer set search_path='pg_catalog' as $$
declare cmd record;
begin
  for cmd in select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO') and object_type in ('table','partitioned table')
  loop
    if cmd.schema_name = 'public' then
      execute format('alter table if exists %s enable row level security',cmd.object_identity);
    end if;
  end loop;
end;
$$;
revoke all on function public.rls_auto_enable() from public,anon,authenticated;
-- Explicit grants reproduce the original project's content access on fresh
-- Supabase installations without relying on platform default privileges.
grant usage on schema public to anon,authenticated,service_role;
grant select on public.site_stats,public.posts,public.reports,public.partners,
  public.bureau,public.home_slideshow,public.site_images,public.site_content to anon;
grant select,insert,update,delete on public.site_stats,public.posts,public.reports,public.partners,
  public.bureau,public.home_slideshow,public.site_images,public.site_content,public.subscribers to authenticated;
grant insert on public.subscribers to anon;
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to anon,authenticated,service_role;
-- Programs are created by the next migration; these grants remain RLS gated.
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select,insert,update,delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage,select on sequences to authenticated,service_role;
