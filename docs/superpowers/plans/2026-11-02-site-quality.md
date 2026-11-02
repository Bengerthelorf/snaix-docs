# Site quality and component audit

Goal: verify the maintained homepage/components and fix concrete functional,
responsive, accessibility and performance defects while preserving its design.

- [x] Inventory published pages, components, links/assets and loading behavior.
- [x] Repair shared interactive components, SSR fallbacks and animation lifecycle.
- [x] Repair docs navigation, locale handling, URL rewrites and bounded build fetches.
- [x] Repair search races, mobile navigation and language menu layout.
- [x] Verify Worker request/cache semantics with runtime fixtures.
- [x] Remove only code/dependencies confirmed unused; extract shared behavior where duplication causes bugs.
- [x] Verify full tests/build, all published links/assets and representative desktop/mobile interactions.
- [x] Review final diff and record measured coverage/limitations in the audit report.

Evidence must distinguish static route coverage, browser-tested interactions,
lab measurements and production behavior. Do not claim field Core Web Vitals
or every possible device/browser combination from local checks.
