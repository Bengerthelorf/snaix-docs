import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import snaixDocs from '@snaix/docs';
import bcmrDocsConfig from '../../content/bcmr/docs/docs.config.ts';
import clauditDocsConfig from '../../content/claudit/docs/docs.config.ts';
import pikpaktuiDocsConfig from '../../content/pikpaktui/docs/docs.config.ts';
import iconchangerDocsConfig from '../../content/iconchanger/docs/docs.config.ts';
import { fetchProductMeta, fetchRecentCommits, readBuildInfo, readLocalCommits } from './src/data/fetch-github.ts';
import {
  manualStats,
  tickerStatic,
  activity as fallbackActivity,
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

const PROJ_LABEL = { bcmr: 'bcmr', pikpaktui: 'pikpak', iconchanger: 'icon', claudit: 'claudit', site: 'site' };
const PROJ_KIND  = { bcmr: 'is-bcmr', pikpaktui: 'is-pikpak', iconchanger: 'is-icon', claudit: 'is-claudit', site: 'is-site' };

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const formatMsg = (raw) => {
  const out = [];
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === '`') {
      const end = raw.indexOf('`', i + 1);
      if (end !== -1) {
        out.push(`<code>${escapeHtml(raw.slice(i + 1, end))}</code>`);
        i = end + 1;
        continue;
      }
    }
    const next = raw.indexOf('`', i);
    out.push(escapeHtml(raw.slice(i, next === -1 ? raw.length : next)));
    i = next === -1 ? raw.length : next;
  }
  return out.join('');
};
const formatTime = (iso, now) => {
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const dayMs = 86_400_000;
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const days = Math.floor(diffMs / dayMs);
  if (days <= 1) return 'yday';
  if (days < 7) return `${days}d`;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const PER_REPO_CAP = 2;
const commitBatches = await Promise.all(
  productPresentations.map((p) => fetchRecentCommits(p.repo, PER_REPO_CAP)),
);
const allCommits = [
  ...productPresentations.flatMap((p, i) => commitBatches[i].map((c) => ({ ...c, slug: p.slug }))),
  ...readLocalCommits(PER_REPO_CAP).map((c) => ({ ...c, slug: 'site' })),
];
const now = new Date();
const liveActivity = allCommits
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 7)
  .map((c) => ({
    time: formatTime(c.date, now),
    proj: PROJ_LABEL[c.slug] ?? c.slug,
    kind: PROJ_KIND[c.slug] ?? '',
    msg: formatMsg(c.message),
  }));
const activity = liveActivity.length > 0 ? liveActivity : fallbackActivity;

const bcmrProduct = {
  slug: 'bcmr',
  title: 'bcmr',
  tagline: 'better copy · move · remove',
  version: bcmrMeta.version,
  releaseDate: bcmrMeta.releaseDate,
  githubUrl: 'https://github.com/Bengerthelorf/bcmr',
  repo: 'Bengerthelorf/bcmr',
  productRoot: '/bcmr',
  accent: 'var(--ink)',
  install: bcmrDocsConfig.install,
  sections: bcmrDocsConfig.sections,
  tabs: [
    { id: 'home',      label: 'overview',  href: '/' },
    { id: 'commands',  label: 'cli',  href: '/commands' },
    { id: 'docs',      label: 'docs',      href: '/docs/getting-started', sections: ['guide'] },
    { id: 'internals', label: 'internals', href: '/internals',            sections: ['internals'] },
    { id: 'install',   label: 'install',   href: '/install' },
    { id: 'changelog', label: 'changelog', href: '/changelog' },
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
  repo: 'Bengerthelorf/Claudit',
  productRoot: '/claudit',
  accent: 'var(--blue)',
  install: clauditDocsConfig.install,
  sections: clauditDocsConfig.sections,
  tabs: [
    { id: 'home',      label: 'overview', href: '/' },
    { id: 'docs',      label: 'docs',     href: '/docs/getting-started', sections: ['guide'] },
    { id: 'install',   label: 'install',  href: '/install' },
    { id: 'changelog', label: 'changelog', href: '/changelog' },
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
  repo: 'Bengerthelorf/pikpaktui',
  productRoot: '/pikpaktui',
  accent: 'var(--yellow)',
  install: pikpaktuiDocsConfig.install,
  sections: pikpaktuiDocsConfig.sections,
  tabs: [
    { id: 'home',      label: 'overview', href: '/' },
    { id: 'docs',      label: 'docs',     href: '/docs/getting-started', sections: ['guide'] },
    { id: 'commands',  label: 'cli', href: '/commands' },
    { id: 'install',   label: 'install',  href: '/install' },
    { id: 'changelog', label: 'changelog', href: '/changelog' },
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
  repo: 'Bengerthelorf/macIconChanger',
  productRoot: '/iconchanger',
  accent: 'var(--red)',
  install: iconchangerDocsConfig.install,
  sections: iconchangerDocsConfig.sections,
  tabs: [
    { id: 'home',      label: 'overview', href: '/' },
    { id: 'docs',      label: 'docs',     href: '/docs/getting-started', sections: ['guide'] },
    { id: 'commands',  label: 'cli', href: '/commands' },
    { id: 'install',   label: 'install',  href: '/install' },
    { id: 'changelog', label: 'changelog', href: '/changelog' },
  ],
  linkRewrites: iconchangerDocsConfig.linkRewrites,
  contentDir: 'src/content/iconchanger/',
};

const locales = [
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
];

export default defineConfig({
  site: 'https://app.snaix.homes',
  trailingSlash: 'ignore',
  integrations: [
    snaixDocs({
      products: [bcmrProduct, clauditProduct, pikpaktuiProduct, iconchangerProduct],
      buildStamp: buildInfo,
      markdown: { math: true, mermaid: true },
      locales,
      siteData: {
        edition: `edition ${String(productPresentations.length).padStart(2, '0')}`,
        build: buildInfo,
        stats: {
          shippingTools: productPresentations.length,
          githubStars: totalStars,
          locales: locales.length,
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
