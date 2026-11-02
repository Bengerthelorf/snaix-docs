import { describe, expect, test } from 'bun:test';
import { remarkUrlRewriter, type ProductRewriteSpec } from './remark/url-rewriter.ts';
import { rehypeLinkRewriter } from './rehype/link-rewriter.ts';

const product: ProductRewriteSpec = {
  contentDir: 'src/content/pikpaktui/',
  base: '/pikpaktui',
  locales: ['zh', 'zh-Hant'],
  rewrites: [['/guide/', '/docs/'], ['/cli/', '/docs/cli/']],
};
const file = { path: '/project/apps/site/src/content/pikpaktui/zh/getting-started.md' };

function rewrite(url: string, spec = product, source = file) {
  const markdown: any = { type: 'root', children: [{ type: 'link', url, children: [] }] };
  remarkUrlRewriter({ products: [spec] })(markdown, source);
  const html: any = {
    type: 'root',
    children: [{ type: 'element', tagName: 'a', properties: { href: markdown.children[0].url }, children: [] }],
  };
  rehypeLinkRewriter({ products: [spec] })(html, source);
  return html.children[0].properties.href;
}

describe('product URL rewriting across Markdown and HTML', () => {
  test.each([
    ['/guide/tui#controls', '/pikpaktui/docs/tui#controls'],
    ['/zh/guide/tui?view=all#controls', '/pikpaktui/zh/docs/tui?view=all#controls'],
    ['/zh-Hant/cli/commands', '/pikpaktui/zh-Hant/docs/cli/commands'],
    ['/zh/cli/', '/pikpaktui/zh/docs/cli/'],
    ['/zh/cli', '/pikpaktui/zh/docs/cli'],
    ['/pikpaktui', '/pikpaktui'],
    ['/pikpaktui?view=all', '/pikpaktui?view=all'],
    ['/pikpaktui#intro', '/pikpaktui#intro'],
    ['/pikpaktui/docs/tui', '/pikpaktui/docs/tui'],
    ['/images/screen.png', '/pikpaktui/images/screen.png'],
    ['//cdn.example.com/image.png', '//cdn.example.com/image.png'],
    ['https://example.com/guide/tui', 'https://example.com/guide/tui'],
    ['../tui', '/pikpaktui/docs/tui'],
    ['#controls', '#controls'],
    ['', ''],
  ])('rewrites %s to %s', (url, expected) => {
    expect(rewrite(url)).toBe(expected);
  });

  test.each([
    ['./setup', '/pikpaktui/zh/docs/setup'],
    ['./transfer-backends.md#limits', '/pikpaktui/zh/docs/transfer-backends#limits'],
    ['../zh-Hant/tui.mdx?view=all#controls', '/pikpaktui/zh-Hant/docs/tui?view=all#controls'],
    ['./cli/index.md', '/pikpaktui/zh/docs/cli'],
    ['mailto:docs@example.com', 'mailto:docs@example.com'],
    ['?view=all', '?view=all'],
    ['./assets/screen.png', './assets/screen.png'],
  ])('resolves relative doc link %s using its source directory', (url, expected) => {
    expect(rewrite(url)).toBe(expected);
  });

  test('relative links from a directory index point to siblings of that source file', () => {
    expect(rewrite('./commands', product, { path: '/project/apps/site/src/content/pikpaktui/zh/cli/index.md' }))
      .toBe('/pikpaktui/zh/docs/cli/commands');
  });

  test('relative internals links preserve their separate public route', () => {
    expect(rewrite('./scc.md', { ...product, rewrites: [['/ablation/', '/internals/']] }, {
      path: '/project/apps/site/src/content/pikpaktui/ablation/index.md',
    })).toBe('/pikpaktui/internals/scc');
  });

  test('keeps root-mounted products root-relative', () => {
    expect(rewrite('/guide/tui', { ...product, base: '/' })).toBe('/docs/tui');
  });

  test('rewrites raw HTML media using the same rules', () => {
    const tree: any = { type: 'root', children: [
      { type: 'element', tagName: 'a', properties: { href: '/zh/guide/tui' }, children: [] },
      { type: 'element', tagName: 'video', properties: { src: '/images/demo.mp4' }, children: [] },
    ] };
    rehypeLinkRewriter({ products: [product] })(tree, file);
    expect(tree.children.map((node: any) => node.properties)).toEqual([
      { href: '/pikpaktui/zh/docs/tui' }, { src: '/pikpaktui/images/demo.mp4' },
    ]);
  });

  test('does not rewrite content from another product', () => {
    const tree: any = { type: 'root', children: [{ type: 'image', url: '/images/screen.png' }] };
    remarkUrlRewriter({ products: [product] })(tree, { path: '/project/src/content/bcmr/guide.md' });
    expect(tree.children[0].url).toBe('/images/screen.png');
  });
});

describe('fragment compatibility aliases', () => {
  const spec: ProductRewriteSpec = {
    ...product,
    rewrites: [
      ['/docs/tui#old-controls', '/docs/tui#controls'],
      ['/zh/docs/tui#old-controls', '/zh/docs/tui#按键'],
      ['/docs/tui#old-settings', '/docs/configuration#settings'],
      ['/guide/', '/docs/'],
    ],
  };

  test.each([
    ['/guide/tui#old-controls', '/pikpaktui/docs/tui#controls'],
    ['/guide/tui?view=all#old-controls', '/pikpaktui/docs/tui?view=all#controls'],
    ['/zh/guide/tui#old-controls', '/pikpaktui/zh/docs/tui#按键'],
    ['/pikpaktui/zh/docs/tui#old-controls', '/pikpaktui/zh/docs/tui#按键'],
    ['/guide/tui#old-controls-extra', '/pikpaktui/docs/tui#old-controls-extra'],
    ['/guide/tui#old-settings', '/pikpaktui/docs/configuration#settings'],
    ['../tui.md#old-controls', '/pikpaktui/docs/tui#controls'],
  ])('applies a page-specific alias after path rewriting for %s', (url, expected) => {
    expect(rewrite(url, spec)).toBe(expected);
  });

  test('same-page hashes use the source route to find an exact compatibility alias', () => {
    expect(rewrite('#old-controls', spec, { path: '/project/apps/site/src/content/pikpaktui/tui.md' }))
      .toBe('/pikpaktui/docs/tui#controls');
    expect(rewrite('#old-controls', spec)).toBe('#old-controls');
  });
});
