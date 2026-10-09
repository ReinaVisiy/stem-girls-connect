# Girlhood paper experience review

PR #5 brought the wall, writer and personal keepsakes into one cream-paper design. This follow-up stabilizes the composer dialog and its Share button while image previews change, and supplies the missing browser evidence. The existing programs system, moderation rules, private receipt recovery and withdrawal remain in place.

## What changed

- All three prompts are visible on one sheet. Age and required acknowledgements appear below it; independent optional permissions remain unchecked.
- “Create my image” works before sending, after sending from an in-memory snapshot, and while collection is closed. Receipt recovery never retrieves private writing.
- The lazy-loaded Canvas composer draws the same paper, fonts and authentic logo into 1080×1350 or 1080×1920 PNGs. It wraps Unicode text with measured widths and creates continuation sheets instead of truncating it. The optional signature starts blank, including for under-13 participants.
- Public thumbnails contain an excerpt only. The full note uses approved fields, a permitted signature and no logo. Visitors can share its opaque link, not download somebody else’s words as an image.
- The new `note` action stays inside the existing dispatcher. It reads only `girlhood_public_responses`, with the same projection as the wall, input validation and `no-store`. Missing, private, under-13 and withdrawn references have the same unavailable result. Focus/visibility rechecks clear the previous text while loading.
- The rights section links the five independently checked UNICEF/UNESCO sources. The official English campaign name is retained in French pending an approved adaptation; surrounding UI uses `tu`.

## Verification

- Node 24.19.0: TypeScript and production build pass.
- 65 programs tests and 47 campaign tests pass, including isolated PostgreSQL enforcement of age, moderation, consent, withdrawal and permissions; no production database was seeded or changed.
- `npm audit --omit=dev`: zero production vulnerabilities. The full install audit still reports 20 development-tree vulnerabilities; they are not represented as fixed.
- Browser regression passed: age-12 identity stripping, independent choices, 2,001-character validation without losing the text, mid-form closure preserving answers, receipt download/recovery, withdrawal, keyboard dialog closing/focus return, French and dark writer layouts.
- Additional export/gallery evidence is recorded by `tests/girlhood/browser-paper.mjs`, using only fictional fixtures.

## Assets and performance

The new runtime dependency inherited from the partial paper branch is `@fontsource/eb-garamond@5.3.0` under SIL OFL. Fonts are self-hosted; there is no capture library or runtime AI service. Blank botanical artwork was created once with OpenAI image generation from the owner’s reference, inspected, and compressed to a 128 KB local WebP. Procedural paper/tape assets were preserved. See the [asset provenance](../../src/features/girlhood/assets/README.md).

Measured gzip chunk sizes compared with the main baseline (KB):

| Chunk | Before | After |
|---|---:|---:|
| GirlhoodProgram JS | 2.74 | 7.69 |
| Writer | 6.90 | 7.04 |
| Wall | 1.24 | 2.47 |
| Home | 0.91 | 2.43 |
| Response card | 0.82 | 0.61 |
| Personal image composer (on demand) | — | 2.98 |
| Campaign CSS | 3.12 | 5.29 |

These are measured build chunks, not Lighthouse or real-device scores. The inherited shared-app bundle warning remains. Decorative image bytes are separate from JS and are local assets.

## Review limits and release

The Git integration successfully built the branch preview. The Vercel connector returned 403 for this team, and there is no local CLI login, so independent authenticated preview inspection is blocked. No protection settings were weakened.

Real iPhone Safari/Android hardware, actual destination-app file sharing, mobile keyboard behavior and Lighthouse were not tested. Native share success/cancel paths can be simulated locally, but that is not proof of a specific installed social app accepting files. A fluent French editorial review, owner visual review and named safeguarding/moderation coverage remain human release checks.

Production home, wall and writer were subsequently verified with HTTP 200 at 390 px, no horizontal overflow or JavaScript errors. The local image maker on the live site showed the cautious guidance for unknown age. No production submission was sent.

No migration, production credential change, campaign availability change or production data mutation is required. Do not merge automatically. After approval, merge through the usual main/Vercel workflow; rollback is a revert of this PR and redeployment of the prior main build. No database rollback is necessary.


## Visual evidence

All populated-wall and export examples below use fictional local fixtures. Before screenshots are read-only captures of the prior production design.

| Surface | Before | After |
|---|---|---|
| Home, mobile | [Before](paper-evidence/before/home-390.png) | [After](paper-evidence/after/home-390.png) |
| Writer, mobile | [Before](paper-evidence/before/share-your-voice-390.png) | [After](paper-evidence/after/share-your-voice-390.png) |
| Wall, mobile | [Before](paper-evidence/before/wall-390.png) | [After](paper-evidence/after/wall-390.png) |

[Expanded note](paper-evidence/after/expanded-390.png), [empty wall](paper-evidence/after/empty-390.png), [actual portrait PNG](paper-evidence/exports/portrait.png), [actual Story PNG](paper-evidence/exports/story.png), [mobile export recording](paper-evidence/exports/mobile-export.webm). Desktop comparisons are alongside the mobile files.

The export flow test confirms real browser downloads at both dimensions, no POST containing image text, blank under-13 signature, a simulated native-share cancellation, own-writing access after submission, and no writing recovered with a receipt. The release browser suite passed 60 mobile/tablet/desktop × English/French × light/dark layout checks, existing public pages, unauthenticated admin denial, and authenticated unsaved admin preview with zero mutations/network campaign requests.
