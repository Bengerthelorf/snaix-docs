import { posix } from 'node:path';

export interface ProductRewriteSpec {
  /** Substring path match; first-match-wins. */
  contentDir: string;
  base: string;
  /** Pre-sorted longest-first. */
  rewrites: [string, string][];
  /** Non-default locale prefixes used by the product's docs routes. */
  locales?: string[];
}

const isAbsoluteInternal = (url: string) => url.startsWith('/') && !url.startsWith('//');

type SourceFile = { path?: string; history?: string[] };
const sourcePath = (file?: SourceFile) => String(file?.path ?? file?.history?.[0] ?? '').replaceAll('\\', '/');

export function productForFile(products: ProductRewriteSpec[], file: SourceFile) {
  const path = sourcePath(file);
  return products.find((product) => path.includes(product.contentDir));
}

function splitLocale(url: string, product: ProductRewriteSpec): [string, string] {
  const firstSegment = url.match(/^\/([^/?#]+)(?=\/|[?#]|$)/)?.[1];
  const code = product.locales?.find((code) => code.toLowerCase() === firstSegment?.toLowerCase());
  if (code && firstSegment) {
    return [`/${code}`, url.slice(firstSegment.length + 1) || '/'];
  }
  return ['', url];
}

function applyPathRewrites(url: string, product: ProductRewriteSpec): string | undefined {
  for (const [from, to] of product.rewrites) {
    if (from.includes('#')) continue;
    if (url.startsWith(from)) {
      return to + url.slice(from.length);
    }
    // A directory's index also resolves without its trailing slash.
    if (from.endsWith('/') && url.split(/[?#]/, 1)[0] === from.slice(0, -1)) {
      return to.replace(/\/$/, '') + url.slice(from.length - 1);
    }
  }
}

function applyFragmentRewrite(url: string, product: ProductRewriteSpec): string | undefined {
  const [, path = '', query = '', fragment = ''] = url.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/)!;
  if (!fragment) return;
  const rule = product.rewrites.find(([from]) => from === path + fragment);
  if (!rule) return;
  const target = rule[1];
  if (!query || target.includes('?')) return target;
  const hash = target.indexOf('#');
  return hash === -1 ? target + query : target.slice(0, hash) + query + target.slice(hash);
}

function relativeSourcePath(file: SourceFile | undefined, product: ProductRewriteSpec): string | undefined {
  const path = sourcePath(file);
  const start = path.indexOf(product.contentDir);
  return start === -1 ? undefined : path.slice(start + product.contentDir.length);
}

function sourceRoute(source: string, product: ProductRewriteSpec): string {
  const slug = source.replace(/\.mdx?$/i, '').replace(/(?:^|\/)index$/, '');
  const [locale, page] = splitLocale(`/${slug}`, product);
  return locale + (applyPathRewrites(page, product) ?? `/docs${page === '/' ? '' : page}`);
}

/** Shared by remark and rehype, so a link passing through both is rewritten once. */
export function rewriteProductUrl(url: string, product: ProductRewriteSpec, file?: SourceFile, relativeDocs = true): string {
  if (!url) return url;
  const base = product.base.replace(/\/$/, '');
  if (base && (url === base || ['/', '?', '#'].some((suffix) => url.startsWith(base + suffix)))) {
    const alias = applyFragmentRewrite(url.slice(base.length), product);
    return alias ? base + alias : url;
  }

  const source = relativeSourcePath(file, product);
  if (url.startsWith('#') && source) {
    const alias = applyFragmentRewrite(sourceRoute(source, product) + url, product);
    return alias ? base + alias : url;
  }

  // Published pages have directory URLs, while Markdown references are relative
  // to source files. Resolve doc links before the browser can nest them under
  // the current page, and leave assets for Astro's asset handling.
  const relative = !/^(?:[a-z][a-z\d+.-]*:|[/#?])/i.test(url);
  if (relativeDocs && relative) {
    const [, target = '', suffix = ''] = url.match(/^([^?#]*)(.*)$/)!;
    if (!posix.extname(target) || /\.mdx?$/i.test(target)) {
      if (source !== undefined) {
        const resolved = posix.normalize(posix.join(posix.dirname(source), target));
        if (!resolved.startsWith('../')) {
          const route = sourceRoute(resolved, product) + suffix;
          return base + (applyFragmentRewrite(route, product) ?? route);
        }
      }
    }
    return url;
  }

  const [locale, path] = isAbsoluteInternal(url) ? splitLocale(url, product) : ['', url];
  const out = applyPathRewrites(path, product) ?? path;
  const route = locale + out;

  return isAbsoluteInternal(out) ? base + (applyFragmentRewrite(route, product) ?? route) : out;
}
