import { nextTabIndex, readCodeTabLabel } from './layout-state';
import { displayPanel } from './viewport-segments';

const preferenceKey = 'snx-code-tabs';

function selectTab(group: Element, label: string) {
  const tabs = Array.from(group.querySelectorAll<HTMLButtonElement>('.snx-code-tabs__tab'));
  const selected = Math.max(0, tabs.findIndex((tab) => tab.dataset.tabLabel === label));
  tabs.forEach((tab, index) => {
    tab.setAttribute('aria-selected', String(index === selected));
    tab.tabIndex = index === selected ? 0 : -1;
  });
  group.querySelectorAll<HTMLElement>('.snx-code-tabs__panel').forEach((panel, index) => {
    panel.hidden = index !== selected;
  });
}

function syncTabs(label: string) {
  try { localStorage.setItem(preferenceKey, JSON.stringify({ _last: label })); } catch {}
  document.querySelectorAll('[data-code-tabs]').forEach((group) => {
    if (Array.from(group.querySelectorAll<HTMLElement>('[data-tab-label]')).some((tab) => tab.dataset.tabLabel === label)) {
      selectTab(group, label);
    }
  });
}

let savedLabel: string | undefined;
try { savedLabel = readCodeTabLabel(localStorage.getItem(preferenceKey)); } catch {}
for (const group of document.querySelectorAll('[data-code-tabs]')) {
  if (savedLabel) selectTab(group, savedLabel);
  const tabs = Array.from(group.querySelectorAll<HTMLButtonElement>('.snx-code-tabs__tab'));
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => syncTabs(tab.dataset.tabLabel ?? ''));
    tab.addEventListener('keydown', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const next = nextTabIndex(event.key, index, tabs.length);
      if (next === undefined) return;
      event.preventDefault();
      syncTabs(tabs[next]!.dataset.tabLabel ?? '');
      tabs[next]!.focus();
    });
  });
  group.querySelectorAll<HTMLButtonElement>('.snx-code-tabs__copy').forEach((button) => {
    const label = button.textContent;
    let reset: ReturnType<typeof setTimeout> | undefined;
    button.addEventListener('click', async () => {
      const pre = button.parentElement?.querySelector('pre');
      if (!pre) return;
      clearTimeout(reset);
      try {
        await navigator.clipboard.writeText(pre.innerText);
        button.classList.add('is-copied');
        button.textContent = 'copied';
      } catch { button.textContent = 'copy failed'; }
      reset = setTimeout(() => { button.classList.remove('is-copied'); button.textContent = label; }, 1400);
    });
  });
}

for (const bar of document.querySelectorAll<HTMLElement>('[data-topbar]')) {
  const button = bar.querySelector<HTMLButtonElement>('[data-burger]');
  const drawer = bar.querySelector<HTMLElement>('[data-drawer]');
  if (!button || !drawer) continue;
  const mobile = matchMedia('(max-width: 720px)');
  const compact = () => mobile.matches || (displayPanel()?.width ?? Infinity) <= 720;
  let previousOverflow = '';
  const blocked = new Map<HTMLElement, boolean>();
  const isOpen = () => bar.hasAttribute('data-open');
  drawer.inert = true;

  const close = (restoreFocus: boolean | 'viewport' = false) => {
    if (!isOpen()) return;
    const focused = document.activeElement;
    const focusWasInMenu = focused === button || (focused instanceof Node && drawer.contains(focused));
    const focusedHref = focused instanceof HTMLAnchorElement ? focused.getAttribute('href') : null;
    bar.removeAttribute('data-open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    button.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
    for (const [element, wasInert] of blocked) element.inert = wasInert;
    blocked.clear();
    if (restoreFocus === true) button.focus();
    else if (restoreFocus === 'viewport' && focusWasInMenu) {
      const visible = (element: HTMLElement) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
      const desktopLinks = Array.from(bar.querySelectorAll<HTMLAnchorElement>('.topbar-nav a[href], .topbar-right a[href]')).filter(visible);
      const equivalentLink = focusedHref ? desktopLinks.find((link) => link.getAttribute('href') === focusedHref) : undefined;
      const brand = bar.querySelector<HTMLElement>('.topbar-brand');
      const fallback = visible(button) ? button : desktopLinks[0] ?? (brand && visible(brand) ? brand : undefined);
      (equivalentLink ?? fallback)?.focus();
    }
  };

  const open = () => {
    if (!compact() || isOpen()) return;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    bar.setAttribute('data-open', '');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.inert = false;
    button.setAttribute('aria-expanded', 'true');
    // Hide covered content from focus and assistive technology, preserving
    // existing inert state. Walk ancestors so the header itself stays usable.
    for (let node: HTMLElement | null = bar; node?.parentElement; node = node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling !== node && sibling instanceof HTMLElement) {
          blocked.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
      if (node.parentElement === document.body) break;
    }
    const focusFirstLink = () => {
      if (!isOpen()) return;
      // WebKit can keep a just-opened visibility transition hidden for one
      // frame, including with reduced motion. Hidden links cannot take focus.
      if (getComputedStyle(drawer).visibility !== 'visible') {
        requestAnimationFrame(focusFirstLink);
        return;
      }
      const focused = document.activeElement;
      if (focused === button || focused === document.body) {
        const target = drawer.querySelector<HTMLElement>('a, button');
        target?.focus();
        // WebKit may finish applying descendant visibility after the drawer.
        if (target && document.activeElement !== target) requestAnimationFrame(focusFirstLink);
      }
    };
    focusFirstLink();
  };

  button.addEventListener('click', () => isOpen() ? close(true) : open());
  drawer.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) close();
  });
  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') { event.preventDefault(); close(true); }
    if (event.key === 'Tab') {
      const links = Array.from(drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
      const stops = [button, ...links];
      const index = stops.indexOf(document.activeElement as HTMLElement);
      if ((event.shiftKey && index <= 0) || (!event.shiftKey && (index < 0 || index === stops.length - 1))) {
        event.preventDefault();
        stops[event.shiftKey ? stops.length - 1 : 0]?.focus();
      }
    }
  });
  const resize = () => { if (!compact()) close('viewport'); };
  mobile.addEventListener('change', resize);
  document.addEventListener('snx:display-panel-change', resize);
}
