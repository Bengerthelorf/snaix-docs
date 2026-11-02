# Whole-site responsive coverage implementation plan

> **For agentic workers:** Use subagent-driven development with separate shared-layout, product-layout and browser-evidence ownership.

**Goal:** Every generated page remains readable and operable across narrow phones, landscape phones, folding displays, split windows, tablets and wide desktops.

**Architecture:** Preserve the existing visual design. Fix intrinsic sizing and shared templates at their source, use fluid layouts and feature detection rather than device names, and enumerate built routes for browser checks. Code and tables may scroll within their own regions; page content and controls must remain reachable.

**Tech stack:** Astro, CSS Grid/Flexbox, existing React islands, Bun and the available Playwright browser tool. No new runtime dependency is required.

**Spec:** The user's whole-site device-form-factor request in this chat; official viewport reference: https://webkit.org/blog/18486/webkit-features-for-safari-27-1/ .

## Constraints and review focus

- Test all generated routes, including translations and long technical documents, instead of assuming one page represents them all.
- iPhone Duo CSS viewport widths/heights: outer portrait 382 × 580/618, outer landscape 594 × 368/406, inner portrait 669 × 867/902, inner landscape 951 × 585/620, and each split window 385 × 571/609 (small/large viewport heights).
- Include 320px reflow, common phone/tablet/desktop widths, wide desktops, short heights, touch input, RTL and long translations. Distinguish viewport emulation from physical-device validation.
- Safe areas must be respected on all four edges; short viewports and opened menus must retain usable scroll and focus behavior.
- Display posture/segments APIs are a progressive enhancement. Safari's default responsive layout must work without developer feature flags. Do not mistake a physical pixel resolution for CSS viewport dimensions.
- Hidden overflow is not a substitute for making meaningful content fit. Decorative overflow, deliberate text truncation with retained access, and local code/table scrolling must be distinguished from lost content.

## Implementation and verification

- [x] Enumerate current built routes and capture representative baseline failures, including the full page below the fold.
- [x] Correct shared layout, document, menu, footer, search and safe-area behavior; verify short-height and resize cleanup.
- [x] Correct homepage and all four product presentations, installation/command pages and design-system samples.
- [x] Run the full page/viewport matrix, inspect flagged geometry and representative screenshots, then verify dynamic orientation/window changes and supported segmented-display emulation.
- [x] Run Bun tests, type checks, site/example builds and generated-link checks; independently review the final changes and the bounds of the browser evidence.

After the reviewed source commit, publish and verify production routes and
responsive interactions. The resulting revision and deployment receipt are
recorded in the external audit artifacts, alongside the matrix and screenshots.
