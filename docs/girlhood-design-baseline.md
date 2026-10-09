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

## Rights statistics: verification status (Item 2)

The five figures in `src/features/girlhood/config/rights.ts` come from the campaign plan of 9 October 2026. Checked in this session, without a browser:

| # | Claim | What was confirmed here |
|---|---|---|
| 1 | More than 120 million girls out of school | UNICEF Girl Goals page exists (published 2025-03-06); a search result headline reports 122 million girls out of school. Page text itself could not be read. |
| 2 | One in eight girls and women, rape or sexual assault before 18 | UNICEF press release headline "Over 370 million girls and women globally subjected to rape or sexual assault as children". The linked topic page text did not expose the figure to an automated fetch. |
| 3 | More than 230 million girls and women, FGM | UNICEF press release headline confirms 230 million girls and women alive today. |
| 4 | About one in five girls married before 18 | **Not confirmed.** The linked UNICEF page could not be fetched (permission not granted) and no search result confirmed the wording. |
| 5 | Women 35% of STEM graduates, unchanged in a decade | News headlines citing UNESCO confirm 35% and "unchanged in a decade". The UNESCO page itself could not be fetched. |

A person must open all five links and confirm the wording before launch, in particular claim 4. The population and measure of each claim (for example "alive today", "before turning 18") are protected by `tests/girlhood/rights.test.ts`.

Other open items for Item 2: the French copy (title adaptation, informal *tu* register, French rights speech) still needs a fluent read-through and a campaign-owner decision. Privacy and form copy elsewhere in French still use *vous*.


## Local continuation, 9 October 2026 (Node 24)

The remote already contained the three commits through a95ecac on design/girlhood-magic, with no open PR. To preserve that work, design/girlhood-personal-images was created from fetched origin/main and fast-forwarded to those commits. Main still resolves to 052d1c9. Initial GitHub network failures were retried successfully.

Fresh read-only production screenshots were captured at 360, 390 and 1440 px for home, wall and writer, before the new local implementation was deployed anywhere. These are in girlhood-paper/before. No production submissions were created. The older Node 22 results above belong to the inherited branch; this continuation uses Node 24.19.0 and installed Edge through Playwright.

All five editorial figures were independently checked against the primary pages linked in config/rights.ts on 9 October: UNICEF Girl Goals (122 million out of school), UNICEF childhood sexual violence (one in eight for rape/sexual assault), UNICEF FGM report (over 230 million), UNICEF International Day of the Girl 2026 (one in five married before 18), and UNESCO STEM education (35%, unchanged for ten years). These checks supersede the incomplete verification section above. Sources preserve their distinct populations and measures; child marriage is prevalence, not an annual incidence estimate.

The official English title is retained in French pending an approved adapted name. Public UI uses informal tu; a fluent human editorial read-through remains a release review item. No safeguarding contacts have been invented.
