import { snaixConfig } from 'virtual:snaix-config';
import type { ProductIntegration } from '@snaix/docs';
import { buildLanguageOptions, type DocEntryLike, type LocaleOption } from '@snaix/docs/docs-nav';
import { productHref } from '@snaix/docs-theme';
import { LOCALES } from './docs.ts';

export function product(slug: string) {
  const p = snaixConfig.products.find((x) => x.slug === slug) as ProductIntegration | undefined;
  if (!p) throw new Error(`unknown product: ${slug}`);

  const href = (path: string): string => productHref(p, path);

  const nav = (current?: string) =>
    p.tabs.map((t) => ({
      id: t.id,
      label: t.label,
      href: t.external ? t.href : href(t.href),
      external: t.external,
      active: current ? t.id === current : false,
    }));

  const docsLanguages = <T extends DocEntryLike>(
    entry: T,
    allEntries: T[],
    currentLocale: LocaleOption,
    docsSubpath = '/docs',
  ) =>
    buildLanguageOptions(allEntries, entry.slug, currentLocale, LOCALES, {
      productRoot: p.productRoot,
      docsSubpath,
    });

  /** Emit switcher entries only for the locales the caller has pages at. Docs
   *  pages auto-filter via buildLanguageOptions; landings/install/commands
   *  don't have per-entry content to introspect, so callers pass the set
   *  explicitly. */
  const pageLanguages = (currentCode: string, tail: string, codes: string[]) =>
    LOCALES
      .filter((l) => codes.includes(l.code))
      .map((l) => ({
        code: l.code,
        label: l.label,
        href: href(`${l.default ? '' : `/${l.code}`}${tail}`),
        active: l.code === currentCode,
      }));

  return { ...p, href, nav, docsLanguages, pageLanguages };
}
