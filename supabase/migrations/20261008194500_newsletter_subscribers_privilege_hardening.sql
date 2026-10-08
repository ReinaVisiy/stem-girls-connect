-- DRAFT, NOT APPLIED TO PRODUCTION.
--
-- Subscribers privilege hardening.
--
-- Why: row level security does not govern TRUNCATE, and Supabase grants new
-- tables to anon/authenticated/service_role with ALL by default. After
-- 20261008105340 the authenticated role still held UPDATE, TRUNCATE,
-- REFERENCES and TRIGGER on public.subscribers, so any signed-in user could
-- empty the newsletter list with a single TRUNCATE regardless of is_admin().
--
-- What the application actually needs (src/admin/AdminSubscribers.tsx and
-- api/subscribe.ts):
--   * admin panel, role authenticated:  SELECT (list/export) and DELETE (remove)
--     both gated by the existing "Admin select" / "Admin delete" RLS policies
--   * newsletter signup, role service_role: INSERT through
--     public.newsletter_signup(); sequence usage is kept
--
-- Apply ONLY after the staged newsletter rollout in GIRLHOOD_CAMPAIGN_SETUP.md
-- has deployed the new signup handler and 20261008105340 has revoked the
-- legacy anonymous INSERT. Dropping the legacy "Public insert" policy earlier
-- would break the previously deployed endpoint.
--
-- Safe to re-run. Does not touch data.
begin;

-- authenticated: exactly what the admin panel uses. REVOKE ALL on a table also
-- removes any column-level grants, so nothing lingers.
revoke all on table public.subscribers from public, anon, authenticated;
grant select, delete on table public.subscribers to authenticated;

-- service_role keeps SELECT, INSERT and DELETE for the signup RPC and
-- operational support. It loses the destructive or unused privileges.
revoke truncate, update, references, trigger on table public.subscribers from service_role;
grant select, insert, delete on table public.subscribers to service_role;

-- RLS defence in depth. Subscribers are never edited and are only ever created
-- by the service-role RPC, so no policy should permit UPDATE or client INSERT
-- even if a privilege is re-granted by mistake later.
drop policy if exists "Admin update" on public.subscribers;
drop policy if exists "Public insert" on public.subscribers;

-- Admin SELECT and DELETE policies are required by the admin panel. Recreate
-- them idempotently so this migration does not depend on earlier history.
drop policy if exists "Admin select" on public.subscribers;
create policy "Admin select" on public.subscribers
  for select using ((select public.is_admin()));
drop policy if exists "Admin delete" on public.subscribers;
create policy "Admin delete" on public.subscribers
  for delete using ((select public.is_admin()));

alter table public.subscribers enable row level security;

commit;
