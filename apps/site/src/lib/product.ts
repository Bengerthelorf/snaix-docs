import { snaixConfig } from 'virtual:snaix-config';
import type { ProductIntegration } from '@snaix/docs';
import { buildLanguageOptions, type DocEntryLike, type LocaleOption } from '@snaix/docs/docs-nav';
import { withBase } from '@snaix/docs-theme';
import { LOCALES } from './docs.ts';

export function product(slug: string) {
  const p = snaixConfig.products.find((x) => x.slug === slug) as ProductIntegration | undefined;
  if (!p) throw new Error(`unknown product: ${slug}`);

  const pr = p.productRoot.replace(/\/$/, '');

  const href = (path: string): string => {
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

  /** Footer switcher for docs pages — filters to locales where the entry exists,
   *  composes URLs rooted at this product. */
  const docsLanguages = <T extends DocEntryLike>(
    entry: T,
    allEntries: T[],
    currentLocale: LocaleOption,
    docsSubpath = '/docs',
  ) =>
    buildLanguageOptions(allEntries, entry.slug, currentLocale, LOCALES, {
      productRoot: pr,
      docsSubpath,
    });

  /** Footer switcher for non-docs pages (home, install, commands) — unconditionally
   *  lists every configured locale, rooted at this product. */
  const pageLanguages = (currentCode: string, tail = '/') =>
    LOCALES.map((l) => ({
      code: l.code,
      label: l.label,
      href: href(`${l.default ? '' : `/${l.code}`}${tail}`),
      active: l.code === currentCode,
    }));

  return { ...p, href, nav, docsLanguages, pageLanguages };
}
