import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import snaixDocs from '@snaix/docs';

export default defineConfig({
  site: 'https://snaix.homes',
  integrations: [
    react(),
    mdx(),
    snaixDocs({
      title: 'bcmr',
      tagline: 'better copy · move · remove',
      version: 'v0.9.1',
      products: [
        { slug: 'bcmr',        name: 'bcmr',        color: 'ink'    },
        { slug: 'pikpaktui',   name: 'pikpaktui',   color: 'yellow' },
        { slug: 'iconchanger', name: 'iconchanger', color: 'red'    },
        { slug: 'claudit',     name: 'claudit',     color: 'blue'   },
      ],
      sections: [
        { label: 'guide', items: ['overview', 'install', 'quickstart'] },
        { label: 'cli',   items: ['cp', 'mv', 'rm', 'sync'] },
      ],
    }),
  ],
  vite: {
    ssr: { noExternal: ['@snaix/docs-theme', '@snaix/docs'] },
  },
});
