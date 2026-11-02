import { selectDisplayPanel, type DisplayPanel } from './viewport-panel';

interface SegmentedWindow extends Window {
  viewport?: { readonly segments?: readonly DisplayPanel[] };
}

let currentPanel: DisplayPanel | null = null;
export const displayPanel = () => currentPanel;

function updatePanel() {
  let segments: readonly DisplayPanel[] | undefined;
  try { segments = (window as SegmentedWindow).viewport?.segments; } catch { /* An unavailable preview API leaves the normal layout intact. */ }
  const next = selectDisplayPanel(segments, window.innerWidth, window.innerHeight);
  if (JSON.stringify(next) === JSON.stringify(currentPanel)) return;
  const scrollTop = currentPanel ? document.body.scrollTop : window.scrollY;
  const root = document.documentElement;
  currentPanel = next;
  if (next) {
    root.setAttribute('data-display-panel', '');
    root.toggleAttribute('data-display-panel-compact', next.width <= 720);
    root.toggleAttribute('data-display-panel-small', next.width <= 480);
    root.toggleAttribute('data-display-panel-short', next.height <= 480);
    for (const [property, value] of Object.entries(next)) root.style.setProperty(`--display-panel-${property}`, `${value}px`);
    document.body.scrollTop = scrollTop;
  } else {
    for (const attribute of ['data-display-panel', 'data-display-panel-compact', 'data-display-panel-small', 'data-display-panel-short']) root.removeAttribute(attribute);
    for (const property of ['x', 'y', 'width', 'height']) root.style.removeProperty(`--display-panel-${property}`);
    window.scrollTo({ top: scrollTop, behavior: 'instant' });
  }
  document.dispatchEvent(new CustomEvent('snx:display-panel-change'));
}

// Both standardized notifications are needed: changing segment count can
// leave the overall viewport dimensions unchanged.
window.addEventListener('resize', updatePanel);
for (const query of ['(horizontal-viewport-segments: 2)', '(vertical-viewport-segments: 2)']) matchMedia(query).addEventListener('change', updatePanel);
(navigator as Navigator & { devicePosture?: EventTarget }).devicePosture?.addEventListener('change', updatePanel);
document.addEventListener('visibilitychange', () => { if (!document.hidden) updatePanel(); });

// A hinge can move without changing viewport size or segment count. Observe
// CSS environment geometry, including the neighbor whose width can change
// while the first segment stays the same. These fixed, hidden probes take no
// layout space; unsupported browsers create neither probes nor an observer.
try {
  if ((window as SegmentedWindow).viewport?.segments && typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(updatePanel);
    for (const index of ['0 0', '1 0', '0 1']) {
      const probe = document.createElement('div');
      probe.setAttribute('aria-hidden', 'true');
      probe.inert = true;
      probe.style.cssText = `position:fixed;inset:0 auto auto 0;width:env(viewport-segment-width ${index},0px);height:env(viewport-segment-height ${index},0px);visibility:hidden;pointer-events:none;contain:strict;overflow:hidden;`;
      document.body.append(probe);
      observer.observe(probe);
    }
  }
} catch { /* Keep the regular layout if a preview API refuses access. */ }
updatePanel();
