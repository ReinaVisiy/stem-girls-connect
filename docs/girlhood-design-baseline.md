# Girlhood design baseline

Recorded 9 October 2026 for branch `design/girlhood-magic`, before any design changes.

## Source state

- Base: `main` at `052d1c9efbe6244bbac26782049e7b990d00e90d` (merge of PR #4, `design/girlhood-experience`). Fetched fresh; it matches the SHA in the implementation plan.
- Branch `design/girlhood-magic` did not exist on the remote, so it was created from that `main`.

## Environment

- Node used here: v22.22.0. `package.json` declares `24.x`, so results below come from a different major version than production. Re-run on Node 24 in CI.
- Dependencies installed with `npm ci`.

## Test and build results (measured)

| Command | Result |
|---|---|
| `npm run typecheck` | Passes, no errors |
| `npx vitest run` (programs) | 8 files, 65 tests, all pass |
| `npm run test:girlhood` | 35 tests, 35 pass, 0 fail |
| `npm run build` | Succeeds; only the existing >500 kB main chunk warning |
| `npm audit --omit=dev` | 0 vulnerabilities |

## Route JS weight (from `vite build`, gzip)

| Chunk | Size |
|---|---|
| `index` (shared app) | 503.66 kB (155.68 kB gzip) |
| `GirlhoodProgram` | 6.62 kB (2.74 kB gzip) |
| `GirlhoodSubmit` | 18.15 kB (6.90 kB gzip) |
| `GirlhoodWall` | 2.75 kB (1.24 kB gzip) |
| `GirlhoodHome` | 1.89 kB (0.91 kB gzip) |
| `GirlhoodResponseCard` | 2.02 kB (0.82 kB gzip) |
| `GirlhoodWithdraw` | 2.11 kB (1.03 kB gzip) |
| `GirlhoodProgram` CSS | 11.66 kB (3.12 kB gzip) |

The 40 kB gzip incremental budget in the plan is measured against these figures.

## Existing design tokens (`src/features/girlhood/girlhood.css`)

Light: `--paper #fffaf3`, `--ink #43263d`, `--plum #82246d`, `--line #ddcec9`, `--pink #f3e1e4`, `--green #e4ece3`.
Dark: `--paper #221d25`, `--ink #f5e7ed`, `--line #64515f`, `--plum #bc6eaa`, `--pink #3d2a37`, `--green #293a32`.

There are no `--girlhood-forest`, `--girlhood-wall` or `--girlhood-muted` tokens yet. The plan's green is `#1d7448`.

## Source map

- Pages: `GirlhoodHome` (92 lines), `GirlhoodSubmit` (727), `GirlhoodWall` (150), `GirlhoodWithdraw` (103), `GirlhoodPrivacy` (34).
- Components: `GirlhoodResponseCard` (98), `GirlhoodLayout` (48), `CampaignAvailability` (51), `GirlhoodLanguageToggle`, `GirlhoodPossibilities`.
- Config: `config/copy.ts`, `config/ui.ts`, `config/experience.ts`. Styles: `girlhood.css` (694 lines).
- Tests: `tests/girlhood/` (`api`, `csv`, `database` unit tests; `browser-design`, `browser-release`, `browser-smoke` Playwright scripts).
- Logo: `public/logo.png`, 508 x 491 RGBA PNG.

## Not measured / blockers

- **No screenshots taken in this session.** Playwright is installed but no browser binary is present, and the download from `cdn.playwright.dev` is blocked by the sandbox network policy. The browser scripts (`test:browser`, `test:browser:release`) were therefore not run.
- The earlier screenshots in `docs/girlhood-redesign/` (home, wall, writing at 390 and 1440) come from the previous redesign and are not a fresh baseline.
- The mobile issues listed in the plan (clipped hero shapes, `Allies` filter wrapping, one-prompt-at-a-time writer, collapsed consent) were observed by the plan's author on 9 October and have not been independently re-verified here.
- No Lighthouse, real-device or Vercel preview results exist yet.
- Visual proof for later items needs a machine with a browser, or a preview deployment.
