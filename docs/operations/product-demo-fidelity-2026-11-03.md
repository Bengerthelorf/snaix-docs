# Product workflow audit — 2026-11-03

## Source of truth

The product checkouts match their live upstream `main` revisions at audit time:

| Product | Revision | User workflow used for the site |
| --- | --- | --- |
| IconChanger | `e7203370c828b581ad87d3029ebbef1e226bdf23` | Select app → community icon library → Current/Selected preview → Apply → Done or Undo; Restore Default asks for confirmation. |
| Claudit | `f943c9b7accc5c7513c9a050c1017a46832ab295` | Menu bar → Usage/Quota → Dashboard → session conversation and tool calls. |
| pikpaktui | `68b7a6bdf6e4abe2a049974dec2c38e736f2a25c` | Login → browse/preview folders → collect across folders → cart actions and download queue. CLI reuses account state. |
| bcmr | `3e43a8a1f9b1f2dc75f4ba37fab4faa4ee96c6c2` | Select local/SSH endpoints and copy/check flags → run CLI → inspect progress/results. Verification and resume follow the selected options. |

Imported source and documentation in `content/` were not modified.

## Corrections

**IconChanger.** Replaced the geometric-design/image-size editor with an
application sidebar and real community icon samples. Selecting a library icon
opens a Current/Selected dialog; only Apply changes the sample app and Dock.
Undo restores the previous custom icon, and Restore Default has a confirmation.
Native dialogs are controlled from React state: an asynchronously delivered
`close` event from a cancelled dialog cannot dismiss a newly reopened preview.
Removed the name, size and drawing controls. The landing preview now uses the
repository's actual app screenshot. Library artwork keeps its author/source
links; `icon-library.json` records original URLs and SHA-256 values. Default
artwork comes from Mozilla and Microsoft's official assets.

Source: `IconChanger/Views/IconList.swift`, `Views/ChangeView.swift`,
`Views/ImageView/ImageViewCore.swift:25–136` and `Services/IconInteractionPolicy.swift`.

**Claudit.** The demo starts with the menu-bar Usage/Quota popover. Dashboard
filters and charts remain available after Open Dashboard; sessions open a
conversation excerpt with expandable thinking and tool input/result. Returning
preserves filters. Quota uses a fixed sample snapshot, independently of log
filters. The landing preview derives all amounts and counts from the same
sample dataset instead of separate decorative numbers.

Source: `AppDelegate.swift:348–396`, `PopoverView.swift:35–55`, `UsageView.swift:19–42`,
`QuotaView.swift:24–67`, `SessionsPage.swift:102–121` and `SessionDetailView.swift`.

**pikpaktui.** Removed the nonexistent BLAKE3 verification and false download
status from the shared TUI illustration. Corrected paths and cart shortcuts.
The CLI reference now covers all 29 public commands, uses `login.toml`, supplies
required login inputs, and writes `-j 4` with the actual folder-download scope.
Added source-backed tests against the Rust registry, config and option parser.

Source: `src/main.rs`, `cmd/mod.rs`, `cmd/login.rs`, `cmd/download.rs`, `config.rs`
and TUI cart/download handlers.

**bcmr.** Kept the command generator. Copy rejects the unsupported standalone
`-` stream endpoint and explains `./-` for a literal filename. Check correctly
treats `*` as literal; resume notes distinguish saved checkpoints from strict
prefix checking. The CLI page uses 14 site-owned executable examples rather
than upstream illustrative stdout. Shared CLI rendering distinguishes syntax,
commands and labeled example output, and no longer invents a successful `ok`.

Source: `src/main.rs`, `app/commands.rs:138–145`, `core/resume.rs`, `core/session.rs`
and `core/remote/resume.rs`.

## Verification

Behavior tests cover preview without applying, Cancel, per-app Apply, Undo to a
previous custom icon, confirmed restore, CLI registry/parser agreement, quota
snapshot arithmetic and dataset reconciliation. Browser checks exercise the
complete workflows, rather than only whether controls respond.

The production build contains 383 pages; all generated internal links and 128
referenced local assets pass the offline checker. The complete suite
passes 153 tests / 723 assertions, and all four TypeScript projects pass. The
standalone theme example also builds and passes its 12-page / 302-link check.

Layout checks cover eight changed page families across 14 viewports (112 cases),
nine related/localized pages at phone/tablet/laptop widths (27), and seven
text-enlargement, zoom-reflow, short-window and display-gap states (56). All 195
cases report no overflow, clipping, out-of-bounds controls or page errors. A
further 20 light/dark native-dialog cases pass, including safe areas and opaque
panel gaps.

Claudit passes all 24 browser/theme/size combinations (144 workflow checks).
The shared CLI reference and bcmr command generator pass 438 checks across
Chrome, WebKit and Firefox at 320/1440px. Icon replacement passes all 24
browser/theme/size combinations (264 workflow checks). A 40-cycle rapid
cancel/reopen regression passes, including seven delayed native `close` events
arriving after a new dialog had already opened. Pre-fix failure traces are kept
alongside the successful results.

Final test, geometry and browser receipts are retained in
`.cache/product-fidelity-20261103/`. The browser checks use isolated Chrome,
WebKit and Firefox contexts with viewport/touch emulation.
