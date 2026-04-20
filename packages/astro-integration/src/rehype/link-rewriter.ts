import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';
import type { ProductRewriteSpec } from '../remark/url-rewriter.ts';

export interface LinkRewriterOptions {
  products?: ProductRewriteSpec[];
}

const isAbsoluteInternal = (href: string) =>
  href.startsWith('/') && !href.startsWith('//');

const TARGETS: Record<string, string> = {
  a: 'href',
  img: 'src',
  video: 'src',
  audio: 'src',
  source: 'src',
};

export function rehypeLinkRewriter(options: LinkRewriterOptions = {}) {
  const products = options.products ?? [];

  return (tree: Root, file: any) => {
    const path = String(file?.path ?? file?.history?.[0] ?? '');
    const p = products.find((x) => path.includes(x.contentDir));
    if (!p) return;

    visit(tree, 'element', (node: Element) => {
      const attr = TARGETS[node.tagName];
      if (!attr) return;
      const raw = node.properties?.[attr];
      if (typeof raw !== 'string') return;

      let rewritten = raw;
      for (const [from, to] of p.rewrites) {
        if (rewritten.startsWith(from)) {
          rewritten = to + rewritten.slice(from.length);
          break;
        }
      }

      if (p.base && isAbsoluteInternal(rewritten) && !rewritten.startsWith(p.base + '/')) {
        rewritten = p.base + rewritten;
      }

      if (rewritten !== raw) {
        node.properties = { ...node.properties, [attr]: rewritten };
      }
    });
  };
}
