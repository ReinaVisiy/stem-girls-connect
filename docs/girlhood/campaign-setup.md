# Girlhood Should Be Hers — polished and hardened release

This integration adds the uploaded campaign to the current SGC Programs system. Existing site pages, the Programs editor, reports, consolidated content API and design palette are preserved. No production database, user accounts or deployment were changed.

## Programs integration

Create one program in the existing Programs editor with slug `girlhood` and page template `girlhood`, or import `examples/girlhood-program.json` to prefill it. Import does not publish. Keep it unpublished while preparing the database and environment; publish it only when the campaign is ready. The main route is `/programs/girlhood`, with `share-your-voice`, `wall`, `privacy` and `withdraw` subpages. The original `/girlhood/*` links redirect there. The admin editor and database enforce this single canonical slug/template. Once published, it cannot be unpublished, deleted or renamed: close contributions instead, preserving receipt links.

The campaign uses one shared set of submissions and moderation records. Do not assign this template to multiple independent campaigns. Programs remain managed through the existing `/api/programs` and admin editor. Campaign endpoints keep `/api/girlhood/*`, routed to one server function so the existing consolidated API structure is preserved. Moderation is at `/admin/girlhood`.

Keep the program published if participants still need its receipt recovery, privacy and withdrawal pages; close new contributions using `GIRLHOOD_SUBMISSIONS_OPEN=false` instead of unpublishing the program.

The age policy is preserved from the upload: under-13 responses can be stored privately; their name, country and city are discarded and publication/reuse disabled. This is not a blanket rejection of under-13 collection. Ages 13–17, 18–24 and 25+ receive distinct public categories, with allies categorized separately. Publication still requires consent and moderation. No legal eligibility threshold is inferred from these implementation rules.

## Start here

1. Use Node.js 24 (check `node --version`) and run `npm ci`.
2. Copy `.env.local.example` to `.env.local` and supply your project's values.
3. Apply the migrations below to a development copy of the existing SGC database.
4. Run `npm run check`, then verify the real flow on a configured Vercel preview.
5. Open submissions only after that preview and the campaign team are ready.

The website requires the existing SGC schema, subscribers table, storage buckets, admin membership and `public.is_admin()` function. The recovered historical migrations and fresh-install instructions are documented in `supabase/migrations/README.md`. Managed Supabase auth/storage services and an administrator account must still be provisioned. The ZIP does not contain credentials.

## Required migration order — explicit release authorization required

Production was inspected read-only on 2026-10-08: the nine historical website/Programs migrations are applied; no Girlhood migrations or tables are present. No production migrations were executed during refinement.

The newsletter is independent of Girlhood. Use this staged rollout to avoid an outage:

1. Back up and inspect target migration history. Apply ONLY `20261008142013_newsletter_independent_limiter.sql` as the prepare step using the normal migration tool and record its exact version. It adds the atomic signup RPC and limiter without revoking the old public INSERT, so the currently deployed newsletter continues working. Do not blindly push every pending migration yet.
2. Configure the server service-role key and a separate `NEWSLETTER_RATE_LIMIT_SECRET` (32+ random characters). Keep `GIRLHOOD_SUBMISSIONS_OPEN=false`. With the target environment loaded, run `node scripts/release-preflight.mjs`. It checks configuration names and a read-only backend readiness RPC; it does not submit an email or print secrets.
3. Deploy this branch's code with the campaign closed and its program unpublished. Smoke-test new and duplicate newsletter signup using approved test addresses. This endpoint now calls the independent RPC. Do not proceed if the newsletter fails.
4. Apply the missing campaign migrations in this order: `20261008000000_girlhood_campaign.sql`, `20261008012326_girlhood_hardening.sql`, `20261008105340_girlhood_receipts_identity_newsletter.sql`, `20261008141957_girlhood_release_safeguards.sql`. The receipts migration revokes legacy public subscriber INSERT only AFTER the compatible endpoint is deployed. Do not replay historical website migrations.
5. Verify newsletter, administrator permissions, campaign privacy/recovery/withdrawal and maintenance against the configured deployment. Publish the single canonical program when approved; keep collection closed until launch authorization.
6. DRAFT, NOT YET APPLIED ANYWHERE: `20261008194500_newsletter_subscribers_privilege_hardening.sql`. Apply it during the controlled staging/release phase, only after steps 3 and 4 are verified. Row level security does not govern TRUNCATE, and Supabase grants new tables to the API roles with ALL by default, so before this step any signed-in user could still TRUNCATE `subscribers`. The migration leaves `authenticated` with SELECT and DELETE only (exactly what `src/admin/AdminSubscribers.tsx` uses, still gated by the admin RLS policies), removes UPDATE, TRUNCATE, REFERENCES and TRIGGER from `service_role`, and drops the unused `Admin update` and legacy `Public insert` policies. It changes no data and is safe to re-run. Afterwards confirm in the admin panel that listing, CSV export and removing a test subscriber still work, and that newsletter signup still succeeds. `tests/girlhood/subscribers-privileges.test.ts` covers this on isolated PostgreSQL, including a guard that fails if application code starts updating or inserting subscribers from the browser.

Some pending campaign versions predate already-applied Programs migrations. Reconcile the exact missing versions deliberately; never rename old migrations or rewrite production history to make an automatic push succeed. Canonical constraints intentionally abort if conflicting Girlhood records exist: review and resolve them without deleting records blindly.

Rollback after the subscriber permission change must retain the new newsletter handler and its RPC. Returning to the old anonymous-insert handler would cause signup failures. Do not restore unrestricted public writes as an automatic fallback.

**Visible identity upgrade:** previously stored public identities remain hidden until a moderator reviews and fills the dedicated public identity fields. Original answers, consents, references and withdrawal codes are preserved. Under-13 country values are removed by the safeguard migration because they are unnecessary identifiers.

Fresh installations have a separate deterministic bootstrap sequence in `supabase/migrations/README.md`. The isolated test reconstructs the recovered schema, tests the prepare/deploy/contract sequence, and verifies campaign permissions. It does not impersonate a full hosted Supabase deployment.

## Environment

Existing server settings: `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
Browser admin settings: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Required server-only settings:
- `SUPABASE_SERVICE_ROLE_KEY`: used by campaign APIs and newsletter signup. Never prefix with VITE_.
- `GIRLHOOD_WITHDRAWAL_PEPPER`: at least 32 random characters. KEEP THE EXISTING VALUE if any submissions exist. It protects existing codes and new receipt recovery.
- `GIRLHOOD_RATE_LIMIT_SECRET`: a separate random secret, at least 32 characters. Campaign submit/withdraw limiter only.
- `NEWSLETTER_RATE_LIMIT_SECRET`: separate newsletter HMAC secret, at least 32 characters; independent RPC/table.
- `CRON_SECRET`: separate random secret, at least 32 characters.
- `GIRLHOOD_ALLOWED_ORIGINS`: comma-separated exact production and preview origins, without paths or trailing slashes.
- `GIRLHOOD_SUBMISSIONS_OPEN`: false by default; true enables new contributions. Receipt recovery and withdrawal remain available when closed.
- `GIRLHOOD_CAMPAIGN_PHASE`: `not_yet_open` before launch or `closed` afterwards. The open flag remains authoritative; missing required campaign configuration always reports closed.

Generate each NEW secret separately:
`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`

Never replace the withdrawal pepper as part of this upgrade. Rate limits per network address per 15 minutes are 20 submission/recovery requests, 30 withdrawals and 5 newsletter requests. Consider shared classroom networks when tuning.

## What changed

### Reliable submissions and private receipts
The browser generates a 256-bit private attempt token. PostgreSQL enforces a unique hash of it. Identical retries return the original reference and code, even after a concurrent insert. Reusing a saved attempt for different content returns a conflict instead of silently changing consent or creating a duplicate.

Only the recovery key is saved in this tab's session storage; answers are never saved there. On return to the form, the participant can recover the receipt without re-entering answers. There is a download button and an explicit action to clear the recovery key. Storage-disabled browsers retain retry protection while the page remains open, but cannot recover after reloading. Closing the tab normally clears session storage; browser session restoration may restore it, so use the clear action on shared devices.

The server derives the withdrawal code using the existing secret and private token, and stores only hashes. No code or key is placed in URLs or logs. Recovery requires the unguessable token and is rate-limited. If both the saved codes and token are lost, contact the campaign team; there is no public identity lookup.

### Moderated identity
Moderators can set a safe public nickname, country and city/region independently of the original details. Blank fields suppress identity. Publication still requires age 13+, publication consent, approval and no withdrawal; each identity field additionally requires its own consent. Age, original identity and consent stay protected from browser edits. Public identity changes are recorded in audit events; recovery hashes remain unavailable to browser admins.

### Newsletter
New and duplicate subscriptions produce the same response. The endpoint validates input length, uses its independent atomic signup/limiter RPC, hides internal database errors and fails closed if configuration is unavailable. Direct public table access is revoked by the new migration. CSV exports quote cell contents and neutralise formula prefixes.

### Experience
The original palette and typography are retained. The bilingual campaign now has an interactive possibilities panel, gentle motion, active navigation, clearer form steps and progress, explicit privacy guidance, expandable voice cards, loading placeholders and a receipt confirmation. Keyboard controls, mobile layouts and reduced-motion preferences are supported.

## Run and verify

- `npm run dev`: frontend only; Vite does not execute Vercel API handlers.
- `npm run check`: TypeScript, API/database regression tests and production build.
- `npm audit --omit=dev`: production dependency audit.
- `npm run preview:fixtures`: after a build, starts a synthetic local preview at http://127.0.0.1:4178/girlhood.
- In a second terminal, `npx playwright install chromium`, then `npm run test:browser`.
- To use installed Edge instead of downloaded Chromium, set `PLAYWRIGHT_CHANNEL=msedge` in your shell before running the browser checks.
- Where downloads are blocked but Chrome or Chromium is already installed at the standard location (for example `/opt/google/chrome/chrome` in the CI sandbox), skip `playwright install` and set `PLAYWRIGHT_CHANNEL=chrome`. Both `npm run test:browser` and `npm run test:browser:release` honor it. Note that `test:browser:release` defaults to `msedge` when the variable is unset.

The preview uses synthetic responses and in-memory receipts; no real Supabase connection or submission occurs. Never deploy the fixture server. Browser artifacts go to `../browser-check` by default; override `UI_ARTIFACT_DIR` if desired.

Automated checks cover duplicate/recovered receipts, conflict handling, newsletter privacy, database grants, identity consent, moderation audit, irreversible withdrawal, retention and rate limits. Browser checks cover English/French, keyboard interactions, reduced motion, mobile overflow, blank-age validation, under-13 privacy, an intentionally dropped response followed by reload/recovery, receipt download, withdrawal and pagination.

## Before opening the real campaign

Use a real Vercel preview to submit an under-13 private response and an age-13+ public-consented response. Moderate safe text and identity; verify the wall never reveals originals. Test each consent off, recover a receipt, withdraw, and confirm reapproval fails. Verify non-admin users cannot read private records or recovery hashes, and cannot insert subscribers directly.

The daily production-only maintenance job deletes records and their audit history 12 months after submission. Monitor failures. Backups, exports and externally reused campaign material need the same organisation-level handling. Appoint a safeguarding contact, brief EN/FR moderators and monitor info@stemgirlsconnect.org.

Local checks use simulated Supabase roles. They do not replace validation of your live database configuration, project-specific functions, storage policies or deployment.

Reference used for database permission review: https://supabase.com/docs/guides/database/postgres/row-level-security

## Availability, preview and operational checks

The existing dispatcher serves a no-store public status action. Loading, failed requests and missing configuration disable contribution controls; a 30-second/focus refresh and pre-submit recheck detect closure. A server closure response preserves typed answers in memory. Reloading does not preserve answers. Receipt recovery and withdrawal are independent of collection state.

The existing Programs editor now previews unpublished Girlhood content using the actual page components and a fixture-only transport. Only authenticated administrators reach it. Preview navigation, English/French, form steps, privacy and withdrawal sections work locally; submission/recovery/withdrawal cannot send requests or alter real records. Public API publication checks remain intact.

The campaign sub-navigation sits inside the existing website navigation/footer. Scoped dark-mode styles retain the campaign colours, and reduced motion is respected. Wall pagination uses a stable created-at/reference cursor so new insertions do not shift later pages; participant perspective labels and featured/empty states are explicit.

Nine top-level API functions remain, including the one Girlhood dispatcher. Maintenance runs once daily (`vercel.json`), uses a constant-time bearer-secret check, and returns HTTP 503 plus a non-sensitive server error log on failure. Monitor the daily invocation and investigate missing/failed runs; no external alerting service has been installed. Hobby cron scheduling is approximate, not exact to the minute. See https://vercel.com/docs/cron-jobs/usage-and-pricing.

For the additional release browser matrix, build a separate fixture artifact with `VITE_SUPABASE_URL=https://preview-db.invalid` and `VITE_SUPABASE_ANON_KEY=fixture-public-key`, using `npm run build -- --outDir ../fixture-dist`. Set `UI_DIST_DIR=../fixture-dist` for the local fixture server, then run `npm run test:browser:release`. These are deliberately fake public credentials. Playwright injects a test session and intercepts only the fictitious database host; production authentication code has no bypass. The test asserts anonymous access is rejected and authenticated unpublished previews make no campaign requests or database mutations. Never deploy the fixture build/server or use real credentials for it.
