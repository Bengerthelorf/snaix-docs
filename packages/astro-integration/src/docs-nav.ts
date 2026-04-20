import type { LocaleOption } from './config.ts';

export type { LocaleOption };

export interface DocEntryLike {
  slug: string;
  data: {
    title: string;
    section?: string;
    order?: number;
    locale?: string;
  };
}

export interface NavItem {
  slug: string;
  title: string;
  href?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export function defaultLocale(locales: LocaleOption[] | undefined): LocaleOption {
  if (!locales || locales.length === 0) {
    return { code: 'en', label: 'English', default: true };
  }
  return locales.find((l) => l.default) ?? locales[0]!;
}

export function localePrefix(locale: LocaleOption, locales: LocaleOption[] | undefined): string {
  return locale.code === defaultLocale(locales).code ? '' : `/${locale.code}`;
}

/** Lowercase because Astro slugifies folder names. */
export function slugPrefix(locale: LocaleOption, locales: LocaleOption[] | undefined): string {
  if (locale.code === defaultLocale(locales).code) return '';
  return `${locale.code.toLowerCase()}/`;
}

export function bareSlug(slug: string, locales: LocaleOption[] | undefined): string {
  if (!locales) return slug;
  for (const l of locales) {
    if (l.default) continue;
    const prefix = `${l.code.toLowerCase()}/`;
    if (slug.toLowerCase().startsWith(prefix)) {
      return slug.slice(prefix.length);
    }
  }
  return slug;
}

export function localeOf(slug: string, locales: LocaleOption[] | undefined): string {
  const def = defaultLocale(locales);
  if (!locales) return def.code;
  const lower = slug.toLowerCase();
  // Sort longer codes first so `zh-hant` matches before `zh`.
  const sorted = [...locales]
    .filter((l) => !l.default)
    .sort((a, b) => b.code.length - a.code.length);
  for (const l of sorted) {
    if (lower.startsWith(`${l.code.toLowerCase()}/`)) return l.code;
  }
  return def.code;
}

export interface BuildNavOptions {
  locale: LocaleOption;
  locales: LocaleOption[] | undefined;
  sectionOrder?: string[];
  docsRoot?: string;
  defaultSection?: string;
  slugTransform?: (slug: string) => string;
}

export function buildDocsNav<T extends DocEntryLike>(
  entries: T[],
  options: BuildNavOptions,
): NavSection[] {
  const {
    locale,
    locales,
    sectionOrder,
    docsRoot = '/docs',
    defaultSection = 'guide',
  } = options;

  const filtered = entries.filter((e) => {
    const l = e.data.locale ?? localeOf(e.slug, locales);
    return l === locale.code;
  });

  const bySection = new Map<string, T[]>();
  for (const e of filtered) {
    const sec = e.data.section ?? defaultSection;
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec)!.push(e);
  }
  for (const list of bySection.values()) {
    list.sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
  }

  const labels = Array.from(bySection.keys());
  labels.sort((a, b) => {
    if (sectionOrder) {
      const ia = sectionOrder.indexOf(a);
      const ib = sectionOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
    }
    return a.localeCompare(b);
  });

  const sectionLabels = locale.ui?.sections ?? {};
  const prefix = `${localePrefix(locale, locales)}${docsRoot}`;
  const transform = options.slugTransform ?? ((s: string) => s);

  return labels.map((label) => ({
    label: sectionLabels[label] ?? label,
    items: bySection.get(label)!.map((e) => {
      const bare = bareSlug(e.slug, locales);
      const url = transform(bare);
      return {
        slug: url === '' ? bare : url,
        title: e.data.title,
        href: url === '' ? prefix : `${prefix}/${url}`,
      };
    }),
  }));
}

export function buildLanguageOptions<T extends DocEntryLike>(
  entries: T[],
  currentSlug: string,
  currentLocale: LocaleOption,
  locales: LocaleOption[],
  docsRoot = '/docs',
): { code: string; label: string; href: string; active: boolean }[] {
  const current = bareSlug(currentSlug, locales);
  return locales
    .filter((l) => {
      const prefix = slugPrefix(l, locales);
      return entries.some(
        (e) =>
          e.slug.toLowerCase() === `${prefix}${current}`.toLowerCase() ||
          (l.default && e.slug === current),
      );
    })
    .map((l) => ({
      code: l.code,
      label: l.label,
      href: `${localePrefix(l, locales)}${docsRoot}/${current}`,
      active: l.code === currentLocale.code,
    }));
}
