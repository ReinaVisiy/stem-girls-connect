# STEM Girls Connect

Website for [STEM Girls Connect](https://stemgirlsconnect.org), a nonprofit working to close the gender gap in STEM by supporting girls and young women to explore, learn and succeed in science, technology, engineering and mathematics. Its main activities are advocacy, training workshops and mentorship.

Live site: https://stemgirlsconnect.org

## Features

- Public site: home, about, programs and program detail pages, impact and reports, blog, newsletter sign-up.
- Database-driven programs, reports and posts, managed from an admin area under `/admin`.
- Girlhood Should Be Hers: a moderated campaign with a public wall of voices and private, in-browser image keepsakes. See [docs/girlhood](docs/girlhood).
- English and French content where supported.

## Technology

- React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7
- Supabase (Postgres, Auth, Row Level Security)
- Vercel (static hosting and serverless functions in `api/`)
- Vitest and the Node test runner for tests; Playwright for browser checks

## Structure

| Path | Contents |
| --- | --- |
| `src/` | React application: pages, components, features (`src/features/girlhood`) |
| `api/` | Vercel serverless handlers; all public Supabase access goes through these |
| `shared/` | Code shared by the app and the API |
| `middleware.ts` | Vercel edge middleware |
| `supabase/` | Database migrations and bootstrap SQL |
| `tests/` | Automated tests; browser scripts live in `tests/girlhood` |
| `docs/` | Project documentation |
| `scripts/` | Release tooling |

## Local development

Requirements: Node.js 24 (see `.nvmrc`) and npm.

```
npm ci
cp .env.local.example .env.local   # then fill in real values
npm run dev
```

`.env.local.example` lists every variable with comments. Use placeholders only in documentation and never commit real values; `.env.local` is gitignored. The service-role key and secrets are read only by code in `api/`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run typecheck` | TypeScript check |
| `npm test` | Programs tests (Vitest) and Girlhood tests |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Typecheck, tests and build together |

Browser checks (`npm run test:browser`, `npm run test:browser:release`) need Playwright browsers installed locally.

## Deployment

The site deploys on Vercel from the `main` branch; pull requests get preview deployments. CI (`.github/workflows/ci.yml`) runs typecheck, tests and build on every pull request to `main`. Environment variables are set in the Vercel project settings. Database changes ship as migrations in `supabase/migrations`; read `supabase/migrations/README.md` before applying any of them.

## Documentation

- Girlhood campaign: [docs/girlhood](docs/girlhood) (setup and rollout, redesign notes)
- Migrations: [supabase/migrations/README.md](supabase/migrations/README.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
