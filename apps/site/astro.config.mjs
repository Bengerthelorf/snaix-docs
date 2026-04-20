import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import snaixDocs from '@snaix/docs';
import bcmrDocsConfig from '../../../bcmr/docs/docs.config.ts';
import { fetchProductMeta, readBuildInfo } from './src/data/fetch-github.ts';
import {
  edition,
  manualStats,
  tickerStatic,
  activity,
  productPresentations,
} from './src/data/site-static.ts';

const productMetas = await Promise.all(
  productPresentations.map((p) => fetchProductMeta(p.repo)),
);

const productsData = productPresentations.map((pres, i) => {
  const m = productMetas[i];
  return {
    slug: pres.slug,
    name: pres.name,
    variant: pres.variant,
    eyebrow: pres.eyebrow,
    tag: pres.tag,
    description: pres.descriptionOverride ?? m.description ?? '',
    metaLeft: m.version
      ? `${m.version}${m.releaseDate ? ` · ${m.releaseDate}` : ''}`
      : '',
    metaRight: m.license || '',
    href: pres.href,
    repo: pres.repo,
    stars: m.stars,
  };
});

const bcmrMeta = productMetas[0];
const totalStars = productMetas.reduce((s, m) => s + (m.stars ?? 0), 0);
const buildInfo = readBuildInfo();

const ticker = [
  ...productMetas
    .map((m, i) =>
      m.version ? `${productPresentations[i].name} · ${m.version.replace(/^v/, '')}` : '',
    )
    .filter(Boolean),
  ...tickerStatic,
];

const bcmrProduct = {
  slug: 'bcmr',
  title: 'bcmr',
  tagline: 'better copy · move · remove',
  version: bcmrMeta.version,
  releaseDate: bcmrMeta.releaseDate,
  githubUrl: 'https://github.com/Bengerthelorf/bcmr',
  productRoot: '/bcmr',
  install: bcmrDocsConfig.install,
  sections: bcmrDocsConfig.sections,
  tabs: [
    { id: 'home',      label: 'overview',  href: '/' },
    { id: 'commands',  label: 'commands',  href: '/commands' },
    { id: 'docs',      label: 'docs',      href: '/docs/getting-started', sections: ['guide'] },
    { id: 'internals', label: 'internals', href: '/internals',            sections: ['internals'] },
    { id: 'install',   label: 'install',   href: '/install' },
    { id: 'changelog', label: 'changelog', href: 'https://github.com/Bengerthelorf/bcmr/releases', external: true },
  ],
  linkRewrites: bcmrDocsConfig.linkRewrites,
  contentDir: 'content/docs/',
};

export default defineConfig({
  site: 'https://app.snaix.homes',
  trailingSlash: 'ignore',
  integrations: [
    snaixDocs({
      products: [bcmrProduct],
      buildStamp: buildInfo,
      markdown: { math: true, mermaid: true },
      locales: [
        { code: 'en', label: 'English', default: true,
          ui: { tocLabel: 'on this page', sections: { guide: 'guide', cli: 'cli', internals: 'internals' } } },
        { code: 'zh', label: '简体中文',
          ui: { tocLabel: '本页内容', sections: { guide: '指南', cli: 'CLI', internals: '技术内幕' } } },
        { code: 'zh-Hant', label: '正體中文', lang: 'zh-Hant',
          ui: { tocLabel: '本頁內容', sections: { guide: '指南', cli: 'CLI', internals: '技術內幕' } } },
      ],
      siteData: {
        edition,
        build: buildInfo,
        stats: {
          shippingTools: productsData.length,
          githubStars: totalStars,
          locales: 3,
          telemetry: manualStats.telemetry,
        },
        ticker,
        activity,
        products: productsData,
      },
    }),
    react(),
    mdx(),
  ],
  vite: {
    ssr: { noExternal: ['@snaix/docs-theme', '@snaix/docs'] },
  },
});
