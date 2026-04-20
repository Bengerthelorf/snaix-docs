import { snaixConfig } from 'virtual:snaix-config';
import type { ProductIntegration } from '@snaix/docs';
import { withBase } from '@snaix/docs-theme';

export function product(slug: string) {
  const p = (snaixConfig.products ?? []).find((x) => x.slug === slug) as ProductIntegration | undefined;
  if (!p) throw new Error(`unknown product: ${slug}`);

  const pr = (p.productRoot ?? '').replace(/\/$/, '');
  const href = (path: string): string => {
    if (!path) return path;
    if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('mailto:') || path.startsWith('#')) return path;
    const clean = path.startsWith('/') ? path : `/${path}`;
    const rooted = pr && !clean.startsWith(pr + '/') && clean !== pr ? pr + clean : clean;
    return withBase(rooted);
  };

  const nav = (current?: string) =>
    (p.tabs ?? []).map((t) => ({
      id: t.id,
      label: t.label,
      href: t.external ? t.href : href(t.href),
      external: t.external,
      active: current ? t.id === current : false,
    }));

  return { ...p, href, nav };
}
