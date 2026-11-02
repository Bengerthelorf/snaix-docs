import { nextTabIndex, readCodeTabLabel } from './layout-state';

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
  let previousOverflow = '';
  const blocked = new Map<HTMLElement, boolean>();
  const isOpen = () => bar.hasAttribute('data-open');
  drawer.inert = true;

  const close = (restoreFocus = false) => {
    if (!isOpen()) return;
    bar.removeAttribute('data-open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    button.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
    for (const [element, wasInert] of blocked) element.inert = wasInert;
    blocked.clear();
    if (restoreFocus) button.focus();
  };

  const open = () => {
    if (!mobile.matches || isOpen()) return;
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
    drawer.querySelector<HTMLElement>('a, button')?.focus();
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
  mobile.addEventListener('change', () => { if (!mobile.matches) close(); });
}
