import { snaixConfig } from 'virtual:snaix-config';

/** Prepend the primary product's `productRoot` and Astro's `BASE_URL`.
 *  Pages for non-primary products should pass fully-prefixed paths instead
 *  of relying on this helper. Idempotent against double-prefix. */
export function withBase(path: string): string {
  if (!path) return path;
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('#')) {
    return path;
  }
  const base = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');
  const pr = String((snaixConfig as any).productRoot ?? '').replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  const rooted = pr && !clean.startsWith(pr + '/') && clean !== pr ? pr + clean : clean;
  return `${base}${rooted}` || '/';
}
