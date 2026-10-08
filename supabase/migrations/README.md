# Migration history and fresh installations

The five 202608/202609 SQL files were recovered verbatim from the live project's `supabase_migrations.schema_migrations.statements`, read-only on 2026-10-08. They contain schema/functions, not production participant data or credentials. The four historical October website migrations retain their live versions: 20261008010839, 20261008101204, 20261008114127, 20261008114140. All nine are already applied in production. No Girlhood migration was applied there during refinement.

Never replay these historical files against an existing project. Inspect the target's migration history first. For the authorized production rollout, follow the newsletter prepare/deploy/contract sequence in `GIRLHOOD_CAMPAIGN_SETUP.md`; an indiscriminate migration push can revoke the old newsletter endpoint's access too early.

## Fresh development installation

Use a fresh Supabase development/test project with its managed `auth` and `storage` schemas available. Do not run this bootstrap on production.

1. Apply the five 202608/202609 migrations in filename order.
2. Apply `supabase/bootstrap/legacy_prerequisites.sql`. This fills the manually created historical `site_content` and `rls_auto_enable` helper gap and establishes explicit grants. It does not create an admin account or seed content.
3. Apply the remaining SQL migrations in filename order. On a fresh installation no old deployed newsletter depends on the legacy grants, so chronological order is safe.
4. Provision the project's storage buckets/policies and administrator membership through the usual authenticated administration setup; never commit account credentials or production exports.
5. Configure the server/client environment and verify hosted Auth, Storage, newsletter, Programs and campaign flows before exposing the deployment.

`tests/girlhood/release.test.ts` executes this baseline plus the staged existing-install upgrade using isolated PostgreSQL (PGlite). Managed roles/auth/storage are test fixtures; the test verifies application schema, database grants, canonical campaign constraints, immutable consent/age, under-13 identity removal, concurrent moderation, newsletter continuity and irreversible withdrawal. Hosted Auth/Storage integration remains a deployment smoke-test requirement. A plain `supabase db reset` without the documented interposed bootstrap is not a complete fresh install.
