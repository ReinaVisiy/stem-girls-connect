# Girlhood note experience

The campaign now starts with writing. Three small paper surfaces replace the four-step survey. Mobile participants tap between thoughts; desktop shows them together. Age and sharing choices follow in a compact disclosure. Name and one location are optional, with separate publication permissions. Existing country fields and stored receipts remain compatible.

The wall uses three compact previews per row at 360px and 390px, and six at desktop widths. Native dialogs show the complete original answers, support Escape and return focus to the opener. French and reduced motion remain supported. The main site navbar, footer, newsletter, program routing and administrator authentication remain intact.

## Copy and visual evidence

Using identical local fixtures with no approved notes, visible English homepage campaign content fell from 201 to 49 words, a 76% reduction. This excludes the main site navigation/footer and participant writing. The homepage has one short introduction and two actions; statistics, journey cards and the privacy panel have been removed.

Screenshots use synthetic local fixtures only. These examples are not seeded into production.

## Database deployment order

Apply `supabase/migrations/20261008231632_girlhood_note_lengths.sql` before deploying this code. It relaxes only four response-length constraints: first answer 1–2,000 characters, optional answers up to 2,000, and matching public moderated text limits. The API still rejects blank first answers and oversize notes without silently truncating them. Its bounded request size accommodates multibyte text. The administrator editor accepts the same longer responses.

The migration leaves records, RLS, grants, under-13 protections, moderation, audit triggers, withdrawal and consent unchanged. It is compatible with the previous application. Do not restore the old database maximum after longer responses have been received; reverting the application alone is safe for stored records.

Production migration approval must be recorded before application. Do not seed test contributions or change campaign availability as part of this release.

## Validation

- 65 existing programs/site tests and 35 campaign tests pass, including isolated PostgreSQL migration tests.
- TypeScript and production build pass.
- Browser tests cover 360, 390, 768 and 1440px, three-column mobile wall, full-response expansion, Escape/focus restoration, writing before personal details, optional permissions, under-13 identity clearing, oversize validation, submission, private receipt download/recovery, withdrawal, open/closed state, French and dark mode.
- Receipt warnings protect unsaved codes on navigation and reload. Both credentials can be copied together or downloaded.
- Local browser fixtures do not contact production Supabase or create real contributions.

For a local UI run: build the app, run `UI_PORT=4182 npm run preview:fixtures`, then `npm run test:browser` (set the environment variable using your shell's syntax). Admin fixture verification uses `VITE_SUPABASE_URL=https://preview-db.invalid` and `VITE_SUPABASE_ANON_KEY=preview-anon-key` at build time, then `UI_ADMIN_ONLY=true UI_BASE_URL=http://127.0.0.1:4182 npm run test:browser:release`.

The existing build warning about the main site's large bundle is unchanged. The locked dependencies were not upgraded as part of this redesign.
