# Migration history

File versions match the versions recorded in the live Supabase `schema_migrations` table
(applied 2026-10-08): 20261008010839, 20261008101204, 20261008114127, 20261008114140.

An earlier commit used placeholder timestamps (…000000, …010000, …020000). The migrations were
applied through the Supabase tool, which stamped its own timestamps, so the files were renamed to match
and the SVG follow-up was added. SQL contents were not changed; no database history was edited.
Never re-run these against the live project. KNOWN GAP: the five baseline migrations already in the live history (20260827085209 initial_schema,
20260827090241 admin_auth_and_media, 20260829132902 admin_panel_schema, 20260831093701
subscribers_admin_policy, 20260902173931 post_reactions_and_shares) are not in this repository, so these
files alone cannot build a fresh database. Export the baseline (`supabase db dump --schema public`) and add
it as files with those exact versions before relying on a from-scratch rebuild.
