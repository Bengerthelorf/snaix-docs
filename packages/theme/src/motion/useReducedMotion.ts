import { useSyncExternalStore } from 'react';

let mediaQuery: MediaQueryList | undefined;

function getMediaQuery() {
  if (typeof window === 'undefined' || !window.matchMedia) return;
  return mediaQuery ??= window.matchMedia('(prefers-reduced-motion: reduce)');
}

function subscribe(onChange: () => void) {
  const query = getMediaQuery();
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

/** Render complete content on the server; animate only after hydration. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => getMediaQuery()?.matches ?? true,
    () => true,
  );
}
