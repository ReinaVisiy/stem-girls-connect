# Contributing

1. Branch from `main` using a descriptive name (`fix/...`, `feature/...`, `docs/...`).
2. Use Node 24 and run `npm ci`.
3. Before opening a pull request, run `npm run check`.
4. Keep changes focused. Do not mix refactors with feature work.
5. Never edit or rename an applied migration in `supabase/migrations`; add a new one.
6. Never commit secrets or `.env` files. Use `.env.local.example` for new variables.
7. Open a pull request into `main`. CI must pass before merging.
