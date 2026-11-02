import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { productForFile, rewriteProductUrl, type ProductRewriteSpec } from '../url-rewriter.ts';

export type { ProductRewriteSpec } from '../url-rewriter.ts';

export interface UrlRewriterOptions {
  products?: ProductRewriteSpec[];
}

export function remarkUrlRewriter(options: UrlRewriterOptions = {}) {
  const products = options.products ?? [];

  return (tree: Root, file: any) => {
    const p = productForFile(products, file);
    if (!p) return;

    visit(tree, (node: any) => {
      if (node.type === 'link' || node.type === 'image' || node.type === 'definition') {
        if (typeof node.url !== 'string') return;
        const next = rewriteProductUrl(node.url, p, file, node.type !== 'image');
        if (next !== node.url) node.url = next;
      }
    });
  };
}
