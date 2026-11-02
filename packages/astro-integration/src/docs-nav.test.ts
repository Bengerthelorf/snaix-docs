import { describe, expect, test } from 'bun:test';
import { bareSlug, buildDocsNav, buildLanguageOptions, localeOf, type LocaleOption } from './docs-nav.ts';

const locales: LocaleOption[] = [
  { code: 'en', label: 'English', default: true },
  { code: 'zh', label: '简体中文' },
];

const entries = [
  {
    slug: 'zh/getting-started',
    data: {
      title: '快速开始',
      locale: 'zh',
      section: 'guide',
    },
  },
];

describe('buildDocsNav', () => {
  test('places the locale after the product root', () => {
    const nav = buildDocsNav(entries, {
      locale: locales[1]!,
      locales,
      productRoot: '/pikpaktui',
      docsRoot: '/docs',
    });

    expect(nav[0]?.items[0]?.href).toBe('/pikpaktui/zh/docs/getting-started');
  });

  test('uses localized folders when a schema has supplied the default locale', () => {
    const pages = [
      { slug: 'scp-compatibility', data: { title: 'scp compatibility', locale: 'en' } },
      { slug: 'zh/scp-compatibility', data: { title: 'scp 兼容性', locale: 'en' } },
    ];
    expect(buildDocsNav(pages, { locale: locales[0]!, locales, productRoot: '/bcmr' })[0]?.items).toEqual([
      { slug: 'scp-compatibility', title: 'scp compatibility', href: '/bcmr/docs/scp-compatibility' },
    ]);
    expect(buildDocsNav(pages, { locale: locales[1]!, locales, productRoot: '/bcmr' })[0]?.items).toEqual([
      { slug: 'scp-compatibility', title: 'scp 兼容性', href: '/bcmr/zh/docs/scp-compatibility' },
    ]);
  });
});

test('the first locale remains default when no explicit default flag is set', () => {
  const implicit: LocaleOption[] = [{ code: 'en', label: 'English' }, { code: 'zh', label: '中文' }];
  expect(bareSlug('en/setup', implicit)).toBe('en/setup');
  expect(localeOf('en/setup', implicit)).toBe('en');
  const pages = [{ slug: 'setup', data: { title: 'Setup' } }, { slug: 'zh/setup', data: { title: '设置' } }];
  expect(buildLanguageOptions(pages, 'setup', implicit[0]!, implicit, { productRoot: '/tool', docsSubpath: '/docs' })).toEqual([
    { code: 'en', label: 'English', href: '/tool/docs/setup', active: true },
    { code: 'zh', label: '中文', href: '/tool/zh/docs/setup', active: false },
  ]);
});

test('language links apply the same slug transform as their routes', () => {
  const pages = [{ slug: 'ablation/scc', data: { title: 'Streaming checkpoint copy' } }];
  expect(buildLanguageOptions(pages, 'ablation/scc', locales[0]!, locales, {
    productRoot: '/bcmr', docsSubpath: '/internals', slugTransform: (slug) => slug.replace(/^ablation\/?/, ''),
  })).toEqual([
    { code: 'en', label: 'English', href: '/bcmr/internals/scc', active: true },
  ]);
});
