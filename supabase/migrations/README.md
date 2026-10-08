# Migration history

File versions match the versions recorded in the live Supabase `schema_migrations` table
(applied 2026-10-08): 20261008010839, 20261008101204, 20261008114127, 20261008114140.

An earlier commit used placeholder timestamps (…000000, …010000, …020000). The migrations were
applied through the Supabase tool, which stamped its own timestamps, so the files were renamed to match
and the SVG follow-up was added. SQL contents were not changed; no database history was edited.
Never re-run these against the live project. For a fresh project, apply them in filename order
(`supabase db push`); all statements are idempotent or run on empty tables.
