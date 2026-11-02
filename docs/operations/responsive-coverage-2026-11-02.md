# Whole-site device-form-factor audit — 2026-11-02

This extends the component audit with route-by-route responsive checks. The
existing design is retained; meaningful text and controls must remain reachable
rather than being hidden to suppress horizontal scrollbars.

## Device coverage

The main matrix enumerates every HTML route from the production build, including
all translated documents. It includes 280/320/360/430px phones and narrow windows,
768/1024px tablets, 1280px laptops, 1920px desktops and 2560px wide displays.

iPhone Duo profiles use the CSS viewport sizes published by WebKit, rather than
dividing physical screen pixels by an assumed scale:

| Form | CSS width | Small / large viewport height |
| --- | ---: | ---: |
| Outer portrait | 382 | 580 / 618 |
| Outer landscape | 594 | 368 / 406 |
| Inner portrait | 669 | 867 / 902 |
| Inner landscape | 951 | 585 / 620 |
| Each side-by-side window | 385 | 571 / 609 |

The small-height profiles belong to the all-route matrix. Separate interaction
checks exercise resizing and the large-height states, short visible windows,
text enlargement, touch, local keyboard scrolling, open menus, search and RTL.
These are browser emulations, not a claim of physical iPhone Duo testing.

Source: [WebKit Features for Safari 27.1](https://webkit.org/blog/18486/webkit-features-for-safari-27-1/).
The posture and viewport-segment APIs on that Safari release are behind developer
feature flags. Continuous folding screens and split windows therefore use normal
responsive layout without depending on these APIs.

## Changes

- Safe areas are respected at all four edges, including the shared header,
  floating controls, menus, design-system pages and About page.
- Intrinsic grid/flex sizes, long headings, inline code, pager links and build
  stamps reflow within narrow windows. Document layouts use two columns at
  intermediate laptop widths and cap article width on large desktops.
- Search menus use the input's actual rectangle, visual viewport and selected
  display panel to choose a visible position and available height. Touch search
  fields use 16px type. Drawer focus and scrolling are preserved during
  window changes. RTL uses logical borders and spacing; code retains LTR order.
- IconChanger's Dock and the TUI preview retain their complete contents in
  labeled, keyboard-focusable local scroll regions. Claudit's dashboard responds
  to its actual container width; amounts and legends remain visible.
- Product headings, metrics, feature ribbons and design-system samples reflow
  instead of relying on ancestor clipping. The 404 heading also fits narrow
  windows. Mermaid source stays scrollable while loading and after a failure.
- Rendered diagrams preserve their natural text size in labeled, focusable
  scroll regions. Scaling an entire flowchart into a 280px phone reduced real
  labels to 4–7px in the baseline, even though the page had no horizontal overflow.
- A progressive fallback selects the largest complete reading panel when the
  browser reports a real opaque display gap. It synchronizes narrow navigation,
  fixed controls, search, scrolling and panel geometry. Continuous, zero-gap
  folds and browsers without the API retain the normal full-screen layout.
  The page does not request feature flags or identify device models.
- Homepage tile tracks have minimum heights and grow with their content;
  enlarged text does not need to fit fixed-height poster slots. A render-skipping
  optimization on the footer was removed because it changed the containing block
  of fixed language menus and could move them outside short viewports.
- Narrow physical panels give the design tile and manifesto artwork dedicated
  flow space, keeping decorative shapes from covering headings or same-colored
  manifesto text. This is checked visually in addition to the geometry scan.

## Reproducing the geometry audit

After `bun run build`, start the existing site preview and generate a browser
function from its actual HTML routes:

```sh
node scripts/prepare-responsive-audit.mjs --dist=apps/site/dist --origin=http://127.0.0.1:4321 --output=/tmp/snaix-responsive-audit.js
```

Pass that function file to the available Playwright tool, or call the exported
`responsiveAudit(page, options)` from an existing Playwright runner. No browser
runtime is added to the site's dependency graph. `--profiles=phone-320,laptop`
selects a subset; `--dist` and `--origin` also support the example application.

The scanner reviews full-document text ranges against clipping ancestors,
controls and fixed overlays, alongside page width and local scroll regions.
It inspects an element's own clipping as well as its ancestors, and distinguishes
local scrolling from content lost outside a clipped page. SVG/diagram and math
layout, hydration and opened menus require the separate visual/interaction checks.
Static scans use reduced motion and do not claim to validate every animation.

## Verification record

- Bun: 98 tests, 239 assertions, zero failures. The additional geometry tests
  cover unavailable APIs, continuous displays, invalid/overlapping segments,
  horizontal/vertical physical gaps and stable panel selection.
- TypeScript: all four projects pass; main and example production builds pass.
- Generated links/assets: main 377 pages, 27,251 internal link occurrences and
  118 assets; example 12 pages, 342 links and 73 assets; zero missing targets.
- Text/reflow: 36 representative page/state cases pass. Synthetic text-only
  enlargement doubles computed font sizes and line heights at 320px and 1280px;
  640 × 400 CSS pixels model 200% browser-zoom reflow from a 1280 × 800 window.
  Device pixel ratio is not used as a substitute for zoom.
- Short-height interactions: 14 cases pass, including real Pagefind results
  and keyboard selection in 200px-high windows, 30-language menus, RTL,
  Escape/focus behavior and keyboard access to both ends of local mock scrollers.
- Opaque display gaps: 36 representative page/panel cases pass with DevTools
  display-feature emulation, including equal side-by-side panels, a horizontal
  gap and a larger right-hand panel. The browser's segment rectangles and media
  queries actually change; the inspection uses the chosen panel's bounds rather
  than the width of both displays. This does not claim physical hardware or a
  successful native posture notification on every engine.
- All-route geometry matrix: 377 routes × 14 profiles = 5,278 cases, with no
  unresolved page overflow, meaningful text clipping, out-of-bounds controls,
  fixed-overlay overflow or page JavaScript errors. The final affected-page
  checks additionally cover the later safety fixes to About and diagram reading.
- Breakpoint edges: 192 cases pass across 12 representative routes at 344px and
  immediately below/at/above 480, 720, 980, 1180 and 1280px. These use desktop
  fine-pointer contexts to supplement the touch contexts in the main matrix.
- Example application: 12 routes × 14 profiles = 168 cases pass. The generated
  `/docs/` redirect is allowed to finish before inspecting its destination.
- Final targeted regressions: About and both diagram pages pass all 14 profiles
  (42 cases); 12 ordinary pages at 320/1440px pass after the geometry observer
  change (24 cases). The all-route matrix is retained alongside these follow-ups.
- Diagram delivery: five cold-context/motion/viewport cases pass, with first-frame
  glyph heights of 16–18.5px, keyboard access to the scroll region's far edge and
  three theme changes that preserve all diagrams. Their size changes explicitly
  avoid transitions, including the global reduced-motion override.
- Dynamic display geometry changes preserve scrolling when the overall viewport
  and segment count stay the same. CSS environment probes with `ResizeObserver`
  detect the changed rectangles without polling. Unfolding restores normal page
  scrolling and releases the mobile drawer's covered-content state.

Independent source review found no remaining confirmed high-priority regression.
The browser evidence uses isolated Chromium contexts. Actual Safari/iOS hardware,
Firefox, the native iOS keyboard and physical folding hardware were not verified;
their behavior is not inferred from a Chrome viewport or device-pixel-ratio change.

The final all-route matrix, interaction results and publication receipt are
retained with the audit artifacts. Original baseline findings remain available
to distinguish actual fixes from corrected scanner assumptions. The scanner
warms render-skipped sections by scrolling before inspection, preventing deferred
placeholder heights from being misreported as text clipping.
