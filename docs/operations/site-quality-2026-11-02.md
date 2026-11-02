# Component, code quality and performance audit — 2026-11-02

The maintained site was audited from source, built HTML, isolated Worker runtime
fixtures and Chromium browser interactions. Its existing design and public
product routes are preserved. Product repository content was not modified.

## Functional and code changes

- Shared URL rewriting now handles source-relative Markdown links, locale
  prefixes, index routes, query strings and legacy fragment aliases. It is
  idempotent across the remark/rehype passes. Chinese documents with omitted
  locale metadata no longer leak into English navigation.
- Localized landing links use existing shared installation/CLI/changelog
  pages. The Claudit footer no longer invents a nonexistent commands page.
- Install choices are native keyboard-operable buttons. CLI filtering no
  longer restarts the terminal animation or steals normal input shortcuts.
- Search coalesces initial loading, discards stale responses, clears selection
  after input changes, reports failures with retry, escapes indexed text, and
  exposes keyboard/listbox state. Documentation navigation and TOCs are excluded
  from result excerpts; sidebar clipping is prevented while results are open.
- Code tabs support arrows/Home/End and tolerate malformed saved preferences.
  Mobile navigation traps focus, restores existing inert/scroll state, closes
  on Escape and cleans up when resized to desktop. Language pickers fit narrow
  viewports and expose their active language.
- Motion has complete server-rendered content, reduced-motion support, timer
  cleanup and reserved final-text geometry. Claudit's fractional counter uses
  a serializable precision rather than a function discarded by Astro islands.
- The Worker rejects unsupported methods/prototype names, preserves query
  strings, handles HEAD without poisoning GET caches and tolerates upstream or
  cache failures. Routes, Analytics binding and scheduled hook remain unchanged.
- Build-time GitHub requests have a five-second deadline, shared pending
  requests and a short refresh cache. Git commands use argument-safe execution.

## Removed overhead and duplication

The global theme switch is native Astro/DOM, removing the 186,619-byte decoded
React renderer from static documentation pages. The public React component
export remains available for callers. Archivo and JetBrains Mono are supplied
locally from pinned Fontsource assets, with preloads and optional display;
KaTeX and Mermaid also use installed local assets. The diagram loader serializes
theme rerenders and retains readable source if rendering fails.

Duplicate URL rules share one tested implementation. Unused client-global
configuration serialization, the unused `hast` runtime dependency and empty
example collection declarations were removed. The example app was retained as
a useful consumer fixture and updated to the current integration interfaces.

Decorative masthead shapes were moved after the complete masthead markup.
Browser evidence showed that the HTML parser could pause in the first Astro
island and paint shapes against an incomplete header height. Reordering keeps
the final geometry identical and avoids that early placement jump.

## Verification

- Bun: 90 tests passed, 222 assertions, including Worker, URL, search, motion,
  theme and document-ingestion regressions.
- TypeScript: integration, theme, site and example projects pass. This checks
  TS/TSX and imports; `.astro` templates are compiled and browser-tested, not
  exhaustively typechecked by `tsc`.
- Main site: 377 built pages; 27,251 internal link occurrences and 117 local
  assets, including CSS fonts and social images, checked with no missing target.
- Example: 12 pages, 342 internal link occurrences and 72 local assets checked
  against its own canonical origin, with no missing target.
- Browser: 21 paired cold-context samples across representative pages and
  320/390/768/1024/1440 px widths. No page-level horizontal overflow or JavaScript/
  network errors in those runs. Ten functional checks cover theme persistence,
  installer keyboard input, real search, mobile focus/scroll behavior, language
  selection, CLI filtering, replay/reduced motion, diagrams and no-JS headings.

Local, unthrottled Chromium measurements reduced homepage loading LCP from
about 2.3–2.7 seconds to roughly 0.1–0.2 seconds and static docs to roughly
0.1 seconds. This primarily removes external render-blocking font requests.
These are local lab observations, not production field Core Web Vitals or a
guarantee for all devices. Separate captures preserve original outliers and
the parser/shape diagnosis rather than hiding them in an average.

After the final shape ordering fix, five fresh homepage samples measured LCP
92–224 ms. CLS was 0 in three 320 px samples, 0.00019 at 390 px and 0 at
1440 px. The masthead and all five shape rectangles were unchanged. A 30-language
picker and Arabic RTL docs also fit at 320 px without overflow.

Reproduce checks with `bun test`, `bun run typecheck`, `bun run build`, and
`bun run check:site`. Check the example with
`bun run --cwd apps/example build` and
`python3 scripts/check-built-site.py apps/example/dist --origin https://snaix.homes`.
