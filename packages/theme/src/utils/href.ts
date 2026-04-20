import type { ProductIntegration } from '@snaix/docs';

/** Prepend Astro's `BASE_URL` to an absolute internal path. Idempotent. */
export function withBase(path: string): string {
  if (!path) return path;
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('#')) {
    return path;
  }
  const base = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');
  if (!base) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (clean.startsWith(base + '/') || clean === base) return clean;
  return `${base}${clean}`;
}

/** Prepend the product's root (e.g. `/pikpaktui`) to an absolute internal path,
 *  then `withBase`. Idempotent: already-rooted paths and external URLs pass through. */
export function productHref(product: Pick<ProductIntegration, 'productRoot'>, path: string): string {
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('#')) return path;
  const pr = product.productRoot.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  const rooted = pr && !clean.startsWith(pr + '/') && clean !== pr ? pr + clean : clean;
  return withBase(rooted);
}
