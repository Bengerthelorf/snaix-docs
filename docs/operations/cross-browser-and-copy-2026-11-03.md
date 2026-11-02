# Browser checks and product copy — 2026-11-03

## Product copy

Site-owned landing pages, product cards, About, installation pages and workbench
copy now describe concrete operations. Imported repository documentation under
`content/` is unchanged.

- **bcmr:** local and SSH copies, BLAKE3 verification, validated resume,
  filesystem-dependent reflink/sparse output, wire compression and NDJSON.
  Removed the unsupported speed comparison and unconditional verification claims;
  corrected `--progress tui` and the license. Verification remains an explicit
  command option. Sources: `content/bcmr/src/core/resume.rs`,
  `src/core/session.rs`, `src/core/remote/resume.rs` and CLI definitions.
- **pikpaktui:** side-by-side folder browsing, a cross-folder cart, batch file
  operations and a resumable download queue. Corrected `login.toml` /
  `session.json`, first-run login behavior and Apache-2.0 licensing. CLI features
  are described individually. Sources: the PikPak checkout's configuration,
  CLI dispatch, cart actions and download queue.
- **IconChanger:** application/folder icons, cached icon reapplication after app
  updates, search aliases and import/export. Initial helper setup requires
  administrator access; online icon search uses a macosicons.com API key.
  Removed unsupported signing, sandbox, format and size claims. Sources:
  `content/iconchanger/docs/` and the helper/application implementation.
- **Claudit:** local Claude Code/OpenClaw usage, estimated costs by project and
  model, conversation inspection, authenticated quota and SSH devices. Removed
  “zero network” claims: quota, Console billing and configured webhooks have
  network implementations. Sources: `UsageParser.swift`, `ModelPricing.swift`,
  `QuotaService.swift`, `ConsoleBillingService.swift` and `WebhookService.swift`.

Removed generic manifestos, guarantees and repeated demo explanations. The usage
demo retains its example-data label and fixed sample period; the icon preview
states that images stay in the browser. The installation guide lists both Claude
Code and Claude.ai quota authentication.

## Browser fixes

- Touch form text is at least 16px; main native controls have 44px targets.
- Workbench layouts respond to their actual readable panel when an opaque
  display gap is reported. Narrow setup, chart and Dock layouts reflow.
- Error colors retain readable contrast in both themes.
- PikPak's decorative CTA artwork no longer covers its heading on phones.
- Generated search results receive scoped styles, visible keyboard selection
  and readable active excerpts. Chinese composition does not trigger navigation.
  Escape stays closed on Firefox; initial ArrowUp selects the last result.
- The menu restores focus to the corresponding desktop link after a breakpoint
  change. WebKit opening waits for the first link to accept focus.
- Usage dates use deterministic UTC formatting, fixing WebKit hydration errors
  caused by engine-specific `Intl` punctuation.

## Verification

The geometry scanner measures lazy sections while they are in view, merges those
observations and opens a fresh page for each route. This avoids Firefox's stale
offscreen intrinsic sizes and navigation-cancellation errors. Local code/table
scrolling is retained. DOM findings are reviewed rather than hidden with overflow
rules.

The 383-route build passes the offline checker: 27,152 local link occurrences and
122 local assets. Bun passes 136 tests / 534 assertions; all four TypeScript
projects pass.

The device-fix build passed these geometry checks before copy revision:

| Browser | Coverage | Cases |
| --- | --- | ---: |
| Chrome 156.0.8078.48 | All 383 routes, 320px phone + 1280px laptop | 766 |
| Chrome | 16 page families, 14 viewport profiles | 224 |
| Chrome | 16 page families, seven text/zoom/short-window/display-gap states | 112 |
| WebKit 27.2 | 16 page families, eight viewport profiles | 128 |
| Firefox 158.0 | 16 page families, eight viewport profiles | 128 |

These 1,358 cases have no unresolved overflow, text clipping, out-of-bounds
controls/fixed overlays or page JavaScript errors.

The copy revision adds localized landing pages and the IconChanger overview to
23 representative routes:

| Browser | Final coverage | Cases |
| --- | --- | ---: |
| Chrome | 23 routes × 14 profiles | 322 |
| Chrome | 23 routes × seven stress states | 161 |
| WebKit | 23 routes × eight profiles | 184 |
| Firefox | 23 routes × eight profiles | 184 |

Chrome and WebKit report zero geometry findings or page errors. Firefox reports
no geometry findings; five initial page-load timeouts pass the isolated retry
(5/5, zero page errors). The raw timeout records are retained alongside the retry.

Functional checks cover five viewports, both themes and command editing,
quoting/copy fallback, usage filters/empty recovery, image upload/error/reset,
installation choices, real Pagefind search and Chinese composition. Chrome and
Firefox each pass all 51 cases. WebKit passes 50 cases; its menu-resize flow
additionally passes with and without reduced motion using actual Option-Tab
link navigation, matching macOS WebKit's keyboard-navigation setting.

Visual review covers the homepage at 390/1440px, About at 390px, product landing
pages and the PikPak install CTA at 430px.

Evidence lives in `.cache/device-audit-20261103/`: geometry JSON, functional
records, focused reproductions and screenshots. `scripts/prepare-responsive-audit.mjs`
generates routes from built HTML; `scripts/responsive-audit.mjs` accepts a
Playwright page, route list and profiles. No browser runtime was added to the
site's dependencies. Checks use isolated browser contexts and viewport/touch,
text-size and display-gap emulation; physical hardware was not measured.
