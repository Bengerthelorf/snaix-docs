import { getCollection, type CollectionEntry } from 'astro:content';
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

export const TABS = snaixConfig.tabs ?? [];

export function resolveLocale(code: string): LocaleOption {
  return LOCALES.find((l) => l.code === code) ?? DEFAULT_LOCALE;
}

export function bareSlug(slug: string): string {
  return bareSlugLib(slug, LOCALES);
}

export function localeOfEntry(entry: CollectionEntry<'docs'>): LocaleOption {
  const code = entry.data.locale ?? localeOf(entry.slug, LOCALES);
  return resolveLocale(code);
}

export async function navFor(
  locale: LocaleOption,
  sections?: string[],
  entries?: CollectionEntry<'docs'>[],
): Promise<NavSection[]> {
  const all = entries ?? (await getCollection('docs'));
  const filtered = sections
    ? all.filter((e) => sections.includes(e.data.section ?? 'guide'))
    : all;

  const isInternalsOnly = sections && sections.length === 1 && sections[0] === 'internals';

  return buildDocsNav(filtered, {
    locale,
    locales: LOCALES,
    sectionOrder: ['guide', 'cli', 'internals'],
    docsRoot: isInternalsOnly ? '/internals' : '/docs',
    slugTransform: isInternalsOnly ? (s) => s.replace(/^ablation\/?/, '') : undefined,
  });
}

export async function languagesFor(
  entry: CollectionEntry<'docs'>,
  docsRoot: string,
  entries?: CollectionEntry<'docs'>[],
) {
  const all = entries ?? (await getCollection('docs'));
  return buildLanguageOptions(all, entry.slug, localeOfEntry(entry), LOCALES, docsRoot);
}

export function docsBaseFor(locale: LocaleOption, root = '/docs'): string {
  return `${localePrefix(locale, LOCALES)}${root}`;
}

export function topNavFor(_locale: LocaleOption) {
  return TABS.map((t) => ({
    id: t.id,
    label: t.label,
    href: t.href,
    external: t.external,
  }));
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
