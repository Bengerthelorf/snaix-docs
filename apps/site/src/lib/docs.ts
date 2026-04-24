import type { CollectionEntry } from 'astro:content';
import {
  buildDocsNav,
  bareSlug as bareSlugLib,
  defaultLocale,
  localeOf,
  localePrefix,
  slugPrefix,
  type LocaleOption,
  type NavSection,
} from '@snaix/docs/docs-nav';
import { snaixConfig } from 'virtual:snaix-config';

export const LOCALES: LocaleOption[] = snaixConfig.locales!;
export const DEFAULT_LOCALE = defaultLocale(LOCALES);

/** Every product's docs tab covers these sections. Internals is bcmr-only. */
export const PRODUCT_DOCS_SECTIONS: string[] = ['guide', 'cli'];

type DocEntry = CollectionEntry<'bcmr'> | CollectionEntry<'claudit'> | CollectionEntry<'pikpaktui'> | CollectionEntry<'iconchanger'>;

/** True when the entry belongs to the default locale (i.e. has no `xx/` slug prefix). */
export function isDefaultLocaleEntry(entry: DocEntry): boolean {
  return localeOfEntry(entry).code === DEFAULT_LOCALE.code;
}

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
  sections: readonly string[],
  docsRoot: string,
): Promise<NavSection[]> {
  const filtered = entries.filter((e) => sections.includes(e.data.section ?? 'guide'));
  const isInternalsOnly = sections.length === 1 && sections[0] === 'internals';
  return buildDocsNav(filtered, {
    locale,
    locales: LOCALES,
    sectionOrder: ['guide', 'cli', 'internals'],
    docsRoot,
    slugTransform: isInternalsOnly ? (s) => s.replace(/^ablation\/?/, '') : undefined,
  });
}

export function docsBaseFor(locale: LocaleOption, root: string): string {
  return `${localePrefix(locale, LOCALES)}${root}`;
}

export function pagerFor(nav: NavSection[], currentSlug: string) {
  const flat = nav.flatMap((s) => s.items);
  const i = flat.findIndex((it) => it.slug === currentSlug);
  if (i === -1) return undefined;
  const toLink = (it: { title: string; href?: string; slug: string }) =>
    it.href ? { title: it.title, href: it.href } : undefined;
  return {
    prev: i > 0 ? toLink(flat[i - 1]!) : undefined,
    next: i < flat.length - 1 ? toLink(flat[i + 1]!) : undefined,
  };
}

export function pagerLabelsFor(locale: LocaleOption) {
  return {
    prev: locale.ui?.pagerPrev ?? 'previous',
    next: locale.ui?.pagerNext ?? 'next',
  };
}

export { slugPrefix, localePrefix };
