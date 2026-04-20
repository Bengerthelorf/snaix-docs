import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';

export interface ProductRewriteSpec {
  /** Substring path match; first-match-wins. */
  contentDir: string;
  base: string;
  /** Pre-sorted longest-first. */
  rewrites: [string, string][];
}

export interface UrlRewriterOptions {
  products?: ProductRewriteSpec[];
}

const isAbsoluteInternal = (url: string) =>
  url.startsWith('/') && !url.startsWith('//');

export function remarkUrlRewriter(options: UrlRewriterOptions = {}) {
  const products = options.products ?? [];

  return (tree: Root, file: any) => {
    const path = String(file?.path ?? file?.history?.[0] ?? '');
    const p = products.find((x) => path.includes(x.contentDir));
    if (!p) return;

    const rewrite = (url: string | null | undefined): string | null | undefined => {
      if (!url || typeof url !== 'string') return url;
      let out = url;
      for (const [from, to] of p.rewrites) {
        if (out.startsWith(from)) {
          out = to + out.slice(from.length);
          break;
        }
      }
      if (p.base && isAbsoluteInternal(out) && !out.startsWith(p.base + '/')) {
        out = p.base + out;
      }
      return out;
    };

    visit(tree, (node: any) => {
      if (node.type === 'link' || node.type === 'image' || node.type === 'definition') {
        const next = rewrite(node.url);
        if (next !== node.url) node.url = next;
      }
    });
  };
}
