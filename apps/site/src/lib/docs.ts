import type { CollectionEntry } from 'astro:content';
import {
  buildDocsNav,
  buildLanguageOptions,
  bareSlug as bareSlugLib,
  defaultLocale,
  localeOf,
  localePrefix,
  slugPrefix,
  type LocaleOption,
  type NavSection,
} from '@snaix/docs/docs-nav';
import { snaixConfig } from 'virtual:snaix-config';

export const LOCALES: LocaleOption[] = snaixConfig.locales ?? [
  { code: 'en', label: 'English', default: true },
];

export const DEFAULT_LOCALE = defaultLocale(LOCALES);

/** Loose docs-entry shape shared across every product's content collection. */
type DocEntry = CollectionEntry<'bcmr'> | CollectionEntry<'claudit'> | CollectionEntry<'pikpaktui'> | CollectionEntry<'iconchanger'>;

export function resolveLocale(code: string): LocaleOption {
  return LOCALES.find((l) => l.code === code) ?? DEFAULT_LOCALE;
}

export function bareSlug(slug: string): string {
  return bareSlugLib(slug, LOCALES);
}

export function localeOfEntry(entry: DocEntry): LocaleOption {
  const code = entry.data.locale ?? localeOf(entry.slug, LOCALES);
  return resolveLocale(code);
}

export async function navFor(
  locale: LocaleOption,
  entries: DocEntry[],
  sections?: string[],
  options?: { docsRoot?: string; internalsDocsRoot?: string },
): Promise<NavSection[]> {
  const filtered = sections
    ? entries.filter((e) => sections.includes(e.data.section ?? 'guide'))
    : entries;

  const isInternalsOnly = sections && sections.length === 1 && sections[0] === 'internals';

  return buildDocsNav(filtered, {
    locale,
    locales: LOCALES,
    sectionOrder: ['guide', 'cli', 'internals'],
    docsRoot: isInternalsOnly ? (options?.internalsDocsRoot ?? '/internals') : (options?.docsRoot ?? '/docs'),
    slugTransform: isInternalsOnly ? (s) => s.replace(/^ablation\/?/, '') : undefined,
  });
}

export function languagesFor(
  entry: DocEntry,
  entries: DocEntry[],
  docsRoot: string,
) {
  return buildLanguageOptions(entries, entry.slug, localeOfEntry(entry), LOCALES, docsRoot);
}

export function docsBaseFor(locale: LocaleOption, root = '/docs'): string {
  return `${localePrefix(locale, LOCALES)}${root}`;
}

/** Footer language switcher for pages without per-page localized equivalents;
 *  case is preserved so routes like `/zh-Hant/` stay exact (Linux is case-sensitive). */
export function localesAsLanguages(current: string, tail = '/') {
  return LOCALES.map((l) => ({
    code: l.code,
    label: l.label,
    href: `${l.default ? '' : `/${l.code}`}${tail}`,
    active: l.code === current,
  }));
}

export { slugPrefix, localePrefix };
