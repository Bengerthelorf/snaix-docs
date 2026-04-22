import type { ActivityRow, TileVariant } from '@snaix/docs';


export const manualStats = {
  telemetry: 0,
};

export const tickerStatic: string[] = [
  'all open source',
  'built to be read',
  'mit · apache-2.0',
  'zero telemetry',
];

/* Fallback activity — only renders if the GitHub commits fetch fails at
   build time. Keep generic so it reads as a placeholder, not a specific
   claim about any product. */
export const activity: ActivityRow[] = [
  { time: '—', proj: 'site', kind: 'is-site', msg: 'live feed unavailable · retry on next build' },
];

export interface ProductPresentation {
  repo: string;
  slug: string;
  name: string;
  variant: TileVariant;
  eyebrow: string;
  tag: string;
  href: string;
  descriptionOverride?: string;
}

export interface InternalTile {
  slug: string;
  name: string;
  variant: TileVariant;
  eyebrow: string;
  tag: string;
  description: string;
  metaLeft: string;
  metaRight: string;
  href: string;
}

export const internalTiles: InternalTile[] = [
  {
    slug: 'design-system',
    name: 'design language',
    variant: 'ds',
    eyebrow: '05 / the rules of the house',
    tag: 'tokens · motion · components',
    description:
      'the single source of visual truth. colors, type, motion primitives, components and principles — every page is built from these pieces.',
    metaLeft: 'living doc',
    metaRight: 'internal',
    href: '/design-system/',
  },
];

export const productPresentations: ProductPresentation[] = [
  {
    repo: 'Bengerthelorf/bcmr',
    slug: 'bcmr',
    name: 'bcmr',
    variant: 'bcmr',
    eyebrow: '01 / copy · move · remove',
    tag: 'cli · rust · cross-platform',
    href: '/bcmr/',
  },
  {
    repo: 'Bengerthelorf/pikpaktui',
    slug: 'pikpaktui',
    name: 'pikpaktui',
    variant: 'pikpak',
    eyebrow: '02 / pikpak in your terminal',
    tag: 'tui + cli · ratatui · miller layout',
    href: '/pikpaktui/',
  },
  {
    repo: 'Bengerthelorf/macIconChanger',
    slug: 'iconchanger',
    name: 'iconchanger',
    variant: 'icon',
    eyebrow: '03 / macos icons',
    tag: 'gui · swift · macos native',
    href: '/iconchanger/',
  },
  {
    repo: 'Bengerthelorf/Claudit',
    slug: 'claudit',
    name: 'claudit',
    variant: 'claudit',
    eyebrow: '04 / claude audit',
    tag: 'gui · swift · macos native',
    href: '/claudit/',
  },
];
