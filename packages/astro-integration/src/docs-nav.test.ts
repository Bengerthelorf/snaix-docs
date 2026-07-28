import { describe, expect, test } from 'bun:test';
import { buildDocsNav, type LocaleOption } from './docs-nav.ts';

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
});
