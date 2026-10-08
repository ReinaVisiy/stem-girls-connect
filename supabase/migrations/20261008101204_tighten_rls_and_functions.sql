-- Tighten RLS policies and function settings flagged by the Supabase advisors.
-- Behaviour-preserving: same access rules, expressed without overlapping policies.

-- 1. Split each 'Admin write' (ALL) policy so SELECT has a single permissive policy.

drop policy "Admin write" on public.bureau;
create policy "Admin insert" on public.bureau for insert with check ((select public.is_admin()));
create policy "Admin update" on public.bureau for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.bureau for delete using ((select public.is_admin()));

drop policy "Admin write" on public.home_slideshow;
create policy "Admin insert" on public.home_slideshow for insert with check ((select public.is_admin()));
create policy "Admin update" on public.home_slideshow for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.home_slideshow for delete using ((select public.is_admin()));

drop policy "Admin write" on public.partners;
create policy "Admin insert" on public.partners for insert with check ((select public.is_admin()));
create policy "Admin update" on public.partners for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.partners for delete using ((select public.is_admin()));

drop policy "Admin write" on public.reports;
create policy "Admin insert" on public.reports for insert with check ((select public.is_admin()));
create policy "Admin update" on public.reports for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.reports for delete using ((select public.is_admin()));

drop policy "Admin write" on public.site_content;
create policy "Admin insert" on public.site_content for insert with check ((select public.is_admin()));
create policy "Admin update" on public.site_content for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.site_content for delete using ((select public.is_admin()));

drop policy "Admin write" on public.site_images;
create policy "Admin insert" on public.site_images for insert with check ((select public.is_admin()));
create policy "Admin update" on public.site_images for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.site_images for delete using ((select public.is_admin()));

drop policy "Admin write" on public.site_stats;
create policy "Admin insert" on public.site_stats for insert with check ((select public.is_admin()));
create policy "Admin update" on public.site_stats for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.site_stats for delete using ((select public.is_admin()));

-- posts: visitors see published rows; admins also need drafts, so one merged SELECT policy.
drop policy "Admin write" on public.posts;
drop policy "Public read" on public.posts;
create policy "Read published or admin" on public.posts for select using (published = true or (select public.is_admin()));
create policy "Admin insert" on public.posts for insert with check ((select public.is_admin()));
create policy "Admin update" on public.posts for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.posts for delete using ((select public.is_admin()));

-- subscribers: anyone may subscribe (INSERT); only admins read, edit or delete.
drop policy "Admin manage" on public.subscribers;
create policy "Admin select" on public.subscribers for select using ((select public.is_admin()));
create policy "Admin update" on public.subscribers for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.subscribers for delete using ((select public.is_admin()));

-- 2. Pin search_path on SECURITY DEFINER functions (they only use public tables and auth.uid()).
alter function public.is_admin() set search_path = public, pg_temp;
alter function public.get_post_reaction_summary(bigint, text) set search_path = public, pg_temp;
alter function public.set_post_reaction(bigint, text, text) set search_path = public, pg_temp;
alter function public.increment_share_count(bigint) set search_path = public, pg_temp;

-- 3. rls_auto_enable is an event-trigger helper; it should not be callable through the API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
