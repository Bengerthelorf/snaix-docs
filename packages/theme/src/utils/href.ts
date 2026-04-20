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
