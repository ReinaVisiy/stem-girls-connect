# Paper asset provenance

- paper-top/mid/bottom, their small variants, and tape.png are original deterministic procedural artwork inherited from commit 0118682. The source is scripts/generate-girlhood-assets.mjs. They contain no text or logo.
- botanical-wall.webp was generated at design time with OpenAI image generation on 9 October 2026, using the owner-supplied Girlhood Dreams Reflection Sheet.png only as a palette/lighting reference. The prompt requested an empty ivory botanical tabletop, no sheet, tape, text or logo. The generated PNG was inspected and encoded as WebP at quality 0.85; no participant data was provided. It is bundled locally and never generated or fetched from a third party at runtime.
- The older foreground and wall assets are retained as source history but are not imported by the current application.
- The authentic logo remains public/logo.png, unchanged. Only the personal exporter draws it. No logo is printed on public notes.
- EB Garamond comes from @fontsource/eb-garamond (SIL Open Font License), self-hosted through the existing package imports. Canvas explicitly waits for the same fonts. No remote font service is used.

Do not run the procedural generator to overwrite this provenance record. It only reconstructs its procedural assets, not the image-generated botanical background.
