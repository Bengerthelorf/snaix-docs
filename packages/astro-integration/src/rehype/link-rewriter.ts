import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';
import { productForFile, rewriteProductUrl, type ProductRewriteSpec } from '../url-rewriter.ts';

export interface LinkRewriterOptions {
  products?: ProductRewriteSpec[];
}

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
    const p = productForFile(products, file);
    if (!p) return;

    visit(tree, 'element', (node: Element) => {
      const attr = TARGETS[node.tagName];
      if (!attr) return;
      const raw = node.properties?.[attr];
      if (typeof raw !== 'string') return;

      const rewritten = rewriteProductUrl(raw, p, file, attr === 'href');

      if (rewritten !== raw) {
        node.properties = { ...node.properties, [attr]: rewritten };
      }
    });
  };
}
