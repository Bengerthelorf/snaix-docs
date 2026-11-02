import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import snaixDocs from '@snaix/docs';

/** @type {import('@snaix/docs').ProductIntegration} */
const bcmr = {
  slug: 'bcmr',
  title: 'bcmr',
  tagline: 'better copy · move · remove',
  version: 'v0.9.1',
  productRoot: '',
  accent: 'var(--ink)',
  githubUrl: 'https://github.com/melodic-lab/bcmr',
  install: {},
  sections: [
    { label: 'guide', items: ['overview', 'install', 'quickstart'] },
    { label: 'core concepts', items: ['verify'] },
  ],
  tabs: [
    { id: 'home', label: 'index', href: '/' },
    { id: 'commands', label: 'commands', href: '/cli' },
    { id: 'docs', label: 'docs', href: '/docs' },
    { id: 'install', label: 'install', href: '/install' },
    { id: 'changelog', label: 'changelog', href: '/changelog' },
    { id: 'about', label: 'manifesto', href: '/about' },
  ],
  contentDir: 'src/content/docs/',
};

export default defineConfig({
  site: 'https://snaix.homes',
  integrations: [
    react(),
    mdx(),
    snaixDocs({
      products: [bcmr],
      locales: [
        { code: 'en', label: 'English', default: true, ui: { pagerPrev: 'previous', pagerNext: 'next' } },
      ],
      buildStamp: { date: '2026.04.20', sha: 'a3f109c' },
      siteData: {
        edition: 'edition 04',
        build: { date: '2026.04.20', sha: 'a3f109c' },
        stats: {},
        ticker: [],
        activity: [],
        products: [
          { slug: 'bcmr', name: 'bcmr', variant: 'bcmr', href: '/products/bcmr', eyebrow: '', tag: '', description: '', metaLeft: '', metaRight: '' },
          { slug: 'pikpaktui', name: 'pikpaktui', variant: 'pikpak', href: '#', eyebrow: '', tag: '', description: '', metaLeft: '', metaRight: '' },
          { slug: 'iconchanger', name: 'iconchanger', variant: 'icon', href: '#', eyebrow: '', tag: '', description: '', metaLeft: '', metaRight: '' },
          { slug: 'claudit', name: 'claudit', variant: 'claudit', href: '#', eyebrow: '', tag: '', description: '', metaLeft: '', metaRight: '' },
        ],
      },
    }),
  ],
  vite: {
    ssr: { noExternal: ['@snaix/docs-theme', '@snaix/docs'] },
  },
});
