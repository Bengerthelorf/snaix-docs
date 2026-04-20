import type { AstroIntegration } from 'astro';
import type { SnaixDocsOptions } from './config.ts';
import { snaixRemarkPlugins } from './remark/directives.ts';
import { remarkMermaid } from './remark/mermaid.ts';
import { remarkUrlRewriter, type ProductRewriteSpec } from './remark/url-rewriter.ts';
import { rehypeLinkRewriter } from './rehype/link-rewriter.ts';

export type {
  SnaixDocsOptions,
  NavSection,
  BuildStamp,
  ActivityRow,
  ProductCard,
  ProductIntegration,
  SiteData,
  SiteStats,
  LocaleOption,
  TopNavTab,
  InstallOption,
  InstallOptions,
  MarkdownOptions,
} from './config.ts';

const VIRTUAL_ID = 'virtual:snaix-config';
const RESOLVED_VIRTUAL_ID = '\0virtual:snaix-config';

export default function snaixDocs(opts: SnaixDocsOptions): AstroIntegration {
  const markdownOpts = opts.markdown ?? {};
  const enableMath = !!markdownOpts.math;
  const enableMermaid = !!markdownOpts.mermaid;

  return {
    name: '@snaix/docs',
    hooks: {
      'astro:config:setup': async ({ updateConfig, injectScript, config }) => {
        const serialized = JSON.stringify(opts);

        const remark: any[] = [...snaixRemarkPlugins];
        const rehype: any[] = [];

        if (enableMath) {
          const remarkMath = (await import('remark-math')).default;
          const rehypeKatex = (await import('rehype-katex')).default;
          remark.push(remarkMath);
          rehype.push(rehypeKatex);
        }
        if (enableMermaid) {
          remark.push(remarkMermaid);
        }

        const astroBase = (config.base ?? '/').replace(/\/$/, '');
        const productSpecs: ProductRewriteSpec[] = opts.products.map((p) => {
          const pr = (p.productRoot ?? '').replace(/\/$/, '');
          return {
            contentDir: p.contentDir ?? `content/${p.slug}/`,
            base: `${astroBase}${pr}` || '/',
            rewrites: Object.entries(p.linkRewrites ?? {}).sort(
              ([a], [b]) => b.length - a.length,
            ),
          };
        });
        remark.push([remarkUrlRewriter, { products: productSpecs }]);
        rehype.push([rehypeLinkRewriter, { products: productSpecs }]);

        updateConfig({
          markdown: {
            remarkPlugins: remark,
            rehypePlugins: rehype,
            smartypants: false,
          },
          vite: {
            plugins: [
              {
                name: 'snaix-virtual-config',
                resolveId(id: string) {
                  if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
                  return null;
                },
                load(id: string) {
                  if (id === RESOLVED_VIRTUAL_ID) {
                    return `export const snaixConfig = ${serialized};\nexport default snaixConfig;`;
                  }
                  return null;
                },
              },
            ],
          },
        });

        injectScript(
          'before-hydration',
          `globalThis.__SNAIX_CONFIG__ = ${serialized};`
        );
      },
    },
  };
}
