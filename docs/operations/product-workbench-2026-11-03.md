# Product workbench — 2026-11-03

## Delivered experience

The existing Astro site now has a task-based homepage and a `/workbench/` entry
point. Shared type, palette and product identities remain the site's design
foundation. The new pages use clear controls, visible focus and reduced-motion
support.

- `/workbench/commands/`: five bcmr presets, editable paths, copy/check options,
  POSIX quoting and clipboard/manual-copy fallback. Source flags and path
  semantics were checked against the product checkout. Commands are text only.
- `/workbench/setup/`: all four products, supported system/architecture/channel
  choices, installation steps, version checks and symptom-based help. `?tool=`
  selects a product. Native macOS apps are restricted to supported macOS plans.
- `/workbench/icons/`: four geometric designs; app, folder and Dock previews;
  browser-local PNG/JPEG/WebP images, file/dimension validation, replacement and
  reset. No image data is uploaded.
- `/workbench/usage/`: 18 explicitly fictional sessions, date/model/project
  filters, reconciled totals, accessible daily bars, token breakdown and session
  table. Costs are fixed example amounts, not current prices.
- `/workbench/status/`: stable release metadata, available docs/languages and
  independent product checkout revisions. This is a timestamped build snapshot,
  not live uptime monitoring. Missing metadata is reported as unavailable.

All four product landings and their installation pages link to the relevant
workbench experience. Existing command references also link to the workbench.

## Shared theme

`SnaixDocsOptions.brand` configures site name, description, favicon and social
image. Products configure their own favicon, social image and verified license.
Product matching uses configured path boundaries and supports Astro base paths.
The standalone example has its own brand and origin, with no placeholder tools.
Unknown licenses and unavailable source revisions are omitted rather than guessed.

Search and the native theme control support English, Simplified Chinese and
Traditional Chinese, with complete English fallback for other languages. Search
starts within the current product; users may select all products. Pagefind
metadata carries the scope. Older/incomplete indexes visibly fall back to an
unfiltered search. Superseded requests cannot overwrite current results.

The bcmr install page no longer presents the website's SHA/date as binary build
information. Its copy example requests recursive traversal and readback
verification, and its check example provides both source and destination.

## Validation

The original 98-test baseline passed before implementation. The completed
suite passes 129 tests with 489 assertions. All four TypeScript projects pass.
The main production build contains 383 pages; its 27,137 internal link
occurrences and 122 local assets pass the offline checker. The standalone
example builds 12 pages and passes its 302-link / 72-asset check.

The complete 383-route production build was scanned at 320×568 and 1280×720
with the repository's DOM geometry auditor: 766 samples, zero horizontal
overflow, zero clipped text, zero controls outside the reading area and zero
page errors. The first scan flagged 14 intentionally offscreen skip links;
these were converted to the standard clipped, focus-visible pattern and
rechecked. The new pages additionally passed 320/768/1440-width smoke checks.

Functional browser checks cover literal shell arguments and invalid multiline
input, preset changes, native-app system restrictions, Windows Cargo setup,
product query links, troubleshooting details, image upload/error/reset,
usage totals/empty-result recovery, scoped/all-product search and Chinese labels.
Independent source reviews checked upload lifecycle and all 60 usage filter
combinations, and used real `/bin/sh` argument roundtrips for generated commands.
Screenshot review found and repaired mobile artwork overlap and inherited
metric-label letter spacing. Filled blue buttons keep an accessible fixed blue
in both themes.

Browser evidence is from Chromium with desktop/mobile viewport emulation.
Safari, Firefox, physical devices and production field performance were not
measured in this task.

## Deployment arrangement

The existing Cloudflare Pages and installer/download Worker remain separate
resources. The companion Sites publication is an owner-private static preview,
registered as `appgprj_6ae8c4e16e78819180e90c07b9e03def`.
The preview source checkout is `.cache/sites-workbench-20261103/`; its
`.openai/hosting.json` retains this identity. Recover repository access for that
same Site if the local cache is absent; do not register a duplicate Site.
No source credentials are stored in the repository.

## Publication evidence

- Feature implementation: `cfdb4937d26fbb9a1a66259e39a92de2d9f169a8`.
- Reviewable change: https://github.com/Bengerthelorf/snaix-docs/pull/1.
- Cloudflare Pages check for the feature implementation: **SUCCESS**.
- Immutable Pages preview: https://adfa75b7.snaix-homes.pages.dev.
- Owner-private Sites preview: https://snaix-workbench-20261103.breezyfrond1.chatgpt.site.
- Sites saved version: `appgprj_6ae8c4e16e78819180e90c07b9e03def~appgver_1e64ece2944081919b1e84e345de57c5`.
- Sites deployment: `appgdep_6ae8c7f8aac48191b69b1075111dfe24`, terminal status **succeeded**.
- Sites static source: `06ebb73b010520ddd9b57332ac6b018e287694fe`, with original Astro provenance recorded in `source-provenance.json`.
- Final focused geometry rerun: 14 changed/representative routes × 2 widths,
  28 samples; zero overflow, clipping, out-of-bounds controls/fixed elements or
  page errors. Keyboard skip links remain visible on focus and focus the main
  content. Dark-theme and 200px-high search-window checks passed.

The original `main` branch and canonical domain continue to serve the existing
production version. The completed implementation is committed on
`codex/product-workbench`, with both hosted previews available for review.
