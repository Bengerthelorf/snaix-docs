import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import snaixDocs from '@snaix/docs';
import bcmrDocsConfig from '../../content/bcmr/docs/docs.config.ts';
import clauditDocsConfig from '../../content/claudit/docs/docs.config.ts';
import pikpaktuiDocsConfig from '../../content/pikpaktui/docs/docs.config.ts';
import iconchangerDocsConfig from '../../content/iconchanger/docs/docs.config.ts';
import { fetchProductMeta, readBuildInfo } from './src/data/fetch-github.ts';
import {
  edition,
  manualStats,
  tickerStatic,
  activity,
  productPresentations,
  internalTiles,
} from './src/data/site-static.ts';

const productMetas = await Promise.all(
  productPresentations.map((p) => fetchProductMeta(p.repo)),
);

const productsData = [
  ...productPresentations.map((pres, i) => {
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
  }),
  ...internalTiles,
];

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
  accent: 'var(--ink)',
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
  contentDir: 'src/content/bcmr/',
};

const clauditMeta   = productMetas[productPresentations.findIndex((p) => p.slug === 'claudit')];
const pikpaktuiMeta   = productMetas[productPresentations.findIndex((p) => p.slug === 'pikpaktui')];
const iconchangerMeta = productMetas[productPresentations.findIndex((p) => p.slug === 'iconchanger')];
const clauditProduct = {
  slug: 'claudit',
  title: 'claudit',
  tagline: 'claude api usage, at a glance',
  version: clauditMeta.version,
  releaseDate: clauditMeta.releaseDate,
  githubUrl: 'https://github.com/Bengerthelorf/Claudit',
  productRoot: '/claudit',
  accent: 'var(--blue)',
  install: clauditDocsConfig.install,
  sections: clauditDocsConfig.sections,
  tabs: [
    { id: 'home',      label: 'overview', href: '/' },
    { id: 'docs',      label: 'docs',     href: '/docs/getting-started', sections: ['guide'] },
    { id: 'install',   label: 'install',  href: '/install' },
    { id: 'changelog', label: 'changelog', href: 'https://github.com/Bengerthelorf/Claudit/releases', external: true },
  ],
  linkRewrites: clauditDocsConfig.linkRewrites,
  contentDir: 'src/content/claudit/',
};

const pikpaktuiProduct = {
  slug: 'pikpaktui',
  title: 'pikpaktui',
  tagline: 'pikpak in your terminal',
  version: pikpaktuiMeta.version,
  releaseDate: pikpaktuiMeta.releaseDate,
  githubUrl: 'https://github.com/Bengerthelorf/pikpaktui',
  productRoot: '/pikpaktui',
  accent: 'var(--yellow)',
  install: pikpaktuiDocsConfig.install,
  sections: pikpaktuiDocsConfig.sections,
  tabs: [
    { id: 'home',      label: 'overview', href: '/' },
    { id: 'docs',      label: 'docs',     href: '/docs/getting-started', sections: ['guide'] },
    { id: 'commands',  label: 'commands', href: '/docs/cli/commands',    sections: ['cli'] },
    { id: 'install',   label: 'install',  href: '/install' },
    { id: 'changelog', label: 'changelog', href: 'https://github.com/Bengerthelorf/pikpaktui/releases', external: true },
  ],
  linkRewrites: pikpaktuiDocsConfig.linkRewrites,
  contentDir: 'src/content/pikpaktui/',
};

const iconchangerProduct = {
  slug: 'iconchanger',
  title: 'iconchanger',
  tagline: 'one icon at a time',
  version: iconchangerMeta.version,
  releaseDate: iconchangerMeta.releaseDate,
  githubUrl: 'https://github.com/Bengerthelorf/macIconChanger',
  productRoot: '/iconchanger',
  accent: 'var(--red)',
  install: iconchangerDocsConfig.install,
  sections: iconchangerDocsConfig.sections,
  tabs: [
    { id: 'home',      label: 'overview', href: '/' },
    { id: 'docs',      label: 'docs',     href: '/docs/getting-started', sections: ['guide'] },
    { id: 'commands',  label: 'commands', href: '/docs/cli/commands',    sections: ['cli'] },
    { id: 'install',   label: 'install',  href: '/install' },
    { id: 'changelog', label: 'changelog', href: 'https://github.com/Bengerthelorf/macIconChanger/releases', external: true },
  ],
  linkRewrites: iconchangerDocsConfig.linkRewrites,
  contentDir: 'src/content/iconchanger/',
};

export default defineConfig({
  site: 'https://app.snaix.homes',
  trailingSlash: 'ignore',
  integrations: [
    snaixDocs({
      products: [bcmrProduct, clauditProduct, pikpaktuiProduct, iconchangerProduct],
      buildStamp: buildInfo,
      markdown: { math: true, mermaid: true },
      locales: [
        { code: 'en',      label: 'English',         default: true,
          ui: { tocLabel: 'on this page',   sections: { guide: 'guide',    cli: 'cli', internals: 'internals' } } },
        { code: 'zh',      label: '简体中文',
          ui: { tocLabel: '本页内容',       sections: { guide: '指南',     cli: 'CLI', internals: '技术内幕' } } },
        { code: 'zh-Hant', label: '正體中文',         lang: 'zh-Hant',
          ui: { tocLabel: '本頁內容',       sections: { guide: '指南',     cli: 'CLI', internals: '技術內幕' } } },
        { code: 'zh-HK',   label: '繁體中文 · 香港',   lang: 'zh-HK' },
        { code: 'ja',      label: '日本語',           lang: 'ja' },
        { code: 'ko',      label: '한국어',           lang: 'ko' },
        { code: 'fr',      label: 'Français',        lang: 'fr' },
        { code: 'de',      label: 'Deutsch',         lang: 'de' },
        { code: 'es',      label: 'Español',         lang: 'es' },
        { code: 'it',      label: 'Italiano',        lang: 'it' },
        { code: 'pt',      label: 'Português',       lang: 'pt' },
        { code: 'ru',      label: 'Русский',         lang: 'ru' },
        { code: 'uk',      label: 'Українська',      lang: 'uk' },
        { code: 'pl',      label: 'Polski',          lang: 'pl' },
        { code: 'nl',      label: 'Nederlands',      lang: 'nl' },
        { code: 'sv',      label: 'Svenska',         lang: 'sv' },
        { code: 'da',      label: 'Dansk',           lang: 'da' },
        { code: 'fi',      label: 'Suomi',           lang: 'fi' },
        { code: 'nb',      label: 'Norsk',           lang: 'nb' },
        { code: 'cs',      label: 'Čeština',         lang: 'cs' },
        { code: 'hu',      label: 'Magyar',          lang: 'hu' },
        { code: 'ro',      label: 'Română',          lang: 'ro' },
        { code: 'el',      label: 'Ελληνικά',        lang: 'el' },
        { code: 'tr',      label: 'Türkçe',          lang: 'tr' },
        { code: 'id',      label: 'Bahasa Indonesia', lang: 'id' },
        { code: 'ms',      label: 'Bahasa Melayu',   lang: 'ms' },
        { code: 'vi',      label: 'Tiếng Việt',      lang: 'vi' },
        { code: 'th',      label: 'ไทย',             lang: 'th' },
        { code: 'hi',      label: 'हिन्दी',            lang: 'hi' },
        { code: 'ar',      label: 'العربية',          lang: 'ar', dir: 'rtl' },
      ],
      siteData: {
        edition,
        build: buildInfo,
        stats: {
          shippingTools: productPresentations.length,
          githubStars: totalStars,
          locales: 30,
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
