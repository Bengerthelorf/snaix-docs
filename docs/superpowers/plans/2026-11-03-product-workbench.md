# Product workbench implementation plan

> **For agentic workers:** Use bounded parallel implementation and independent review. User explicitly authorized autonomous implementation, design decisions, testing and inspection.

**Goal:** Complete the six proposed improvements in the existing snaix-docs project and provide a tested, deployable product experience.

**Architecture:** Keep the Astro static site and React islands. Add a shared workbench shell and product experiences, retain existing routes and source documentation. Build-time GitHub metadata feeds an honestly timestamped maintenance overview. Publish a separate owner-private Sites preview after validation; retain the existing Pages/Worker production architecture.

**Tech Stack:** Existing Astro 5, React 19, TypeScript, Bun, Pagefind; no new product dependencies.

## Global constraints

- Retain existing Bauhaus palette, fonts and theme support; favor clear task-based layouts and quieter motion.
- No product checkout edits. New features must be reachable through site navigation.
- Command generation uses supported upstream flags, POSIX argument quoting and validation. It does not execute commands.
- Demonstrations label example data. Icon preview processes uploads locally and handles invalid files.
- Maintenance information must distinguish build snapshots from live health; do not expose secrets or add visitor telemetry.
- Search defaults to current product, allows all products, preserves keyboard behavior and localizes UI with explicit fallback.
- Brand metadata and route-based product assets are configurable; the example app supplies its own defaults.
- Verify meaningful edge cases, production build, internal links and representative desktop/mobile interactions in light and dark modes.

## Tasks

- [x] 1. Baseline: install locked dependencies, populate product docs and run existing unit checks.
- [x] 2. CLI and onboarding: safe bcmr command builder; product/platform installation and symptom-based troubleshooting guide.
- [x] 3. Product demonstrations: local icon preview and example-data Claudit dashboard with meaningful controls.
- [x] 4. Shared theme: localized/product-filtered search and configurable brand/product metadata.
- [x] 5. Integrate: shared workbench shell, landing page, honest maintenance overview, homepage and product entry links; polish responsive interaction design.
- [x] 6. Validate: focused tests, typechecks, builds, built-site link check, browser interaction/geometry/accessibility smoke checks and independent code review; repair findings.
- [x] 7. Deliver: commit, push feature branch and reviewable PR when available; package a private Sites preview and verify terminal deployment status.

## Review focus

Shell metacharacters and option-like paths; unsupported installation combinations; upload replacement/error handling and object URL cleanup; demo totals and filters; empty/error/loading search states and stale requests; metadata fallbacks with no or new products; mobile overflow and keyboard/focus behavior; truthful data timestamps and unavailable upstream data.
