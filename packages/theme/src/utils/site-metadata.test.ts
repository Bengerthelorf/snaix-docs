import { expect, test } from 'bun:test';
import { resolveSiteMetadata } from './site-metadata';

test('generic defaults do not invent a public origin or missing image files', () => {
  const meta = resolveSiteMetadata({ pathname: '/docs/start' });
  expect(meta.siteName).toBe('Documentation');
  expect(meta.favicon.startsWith('data:image/svg+xml,')).toBe(true);
  expect(meta.ogImage).toBeUndefined();
  expect(meta.canonical).toBeUndefined();
});

test('product assets use configured roots with boundaries and most specific match', () => {
  const common = {
    site: new URL('https://docs.example.test'),
    brand: { name: 'Example', favicon: '/brand.svg', ogImage: '/brand.png' },
    products: [
      { productRoot: '', favicon: '/single.svg' },
      { productRoot: '/new-tool', favicon: '/tool.svg', ogImage: '/tool.png' },
      { productRoot: '/new-tool/extension', favicon: '/extension.svg' },
    ],
  };
  expect(resolveSiteMetadata({ ...common, pathname: '/new-tool/docs' })).toMatchObject({
    siteName: 'Example', favicon: '/tool.svg', ogImage: 'https://docs.example.test/tool.png',
  });
  expect(resolveSiteMetadata({ ...common, pathname: '/new-tool/extension' }).favicon).toBe('/extension.svg');
  expect(resolveSiteMetadata({ ...common, pathname: '/new-toolbox' }).favicon).toBe('/single.svg');
});

test('base paths are respected for route matching and internal assets without duplication', () => {
  const meta = resolveSiteMetadata({
    pathname: '/guide/tool/docs', base: '/guide/', site: 'https://example.test',
    products: [{ productRoot: '/tool', favicon: '/guide/icons/tool.svg', ogImage: '/og/tool.png' }],
  });
  expect(meta).toMatchObject({
    canonical: 'https://example.test/guide/tool/docs',
    favicon: '/guide/icons/tool.svg', ogImage: 'https://example.test/guide/og/tool.png',
  });
});

test('page overrides and external assets take precedence while unmatched routes use the brand', () => {
  const common = {
    pathname: '/other', site: 'https://example.test', base: '/guide',
    brand: { name: 'Acme docs', description: 'Acme guides', favicon: '/acme.svg' },
    products: [{ productRoot: '/tool', favicon: '/tool.svg' }],
  };
  expect(resolveSiteMetadata(common)).toMatchObject({ siteName: 'Acme docs', description: 'Acme guides', favicon: '/guide/acme.svg' });
  expect(resolveSiteMetadata({ ...common, description: 'This page', favicon: 'https://cdn.example.test/icon.svg', ogImage: 'https://cdn.example.test/card.png' }))
    .toMatchObject({ description: 'This page', favicon: 'https://cdn.example.test/icon.svg', ogImage: 'https://cdn.example.test/card.png' });
});
