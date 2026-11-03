import type { ActivityRow, TileVariant } from '@snaix/docs';


export const manualStats = {
  telemetry: 0,
};

export const tickerStatic: string[] = [
  'all open source',
  'mit · apache-2.0',
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
      'Colors, typography, motion and shared components.',
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
    tag: 'local + ssh · BLAKE3 · resume',
    descriptionOverride: 'Copy files locally or over SSH. Verify content with BLAKE3 and resume interrupted transfers.',
    href: '/bcmr/',
  },
  {
    repo: 'Bengerthelorf/pikpaktui',
    slug: 'pikpaktui',
    name: 'pikpaktui',
    variant: 'pikpak',
    eyebrow: '02 / pikpak in your terminal',
    tag: 'PikPak · TUI + CLI · batch operations',
    descriptionOverride: 'Browse folders side by side, collect files across folders, and download or share a batch.',
    href: '/pikpaktui/',
  },
  {
    repo: 'Bengerthelorf/macIconChanger',
    slug: 'iconchanger',
    name: 'IconChanger',
    variant: 'icon',
    eyebrow: '03 / macos icons',
    tag: 'macOS · icons · auto-restore',
    descriptionOverride: 'Choose icons from macOSicons.com, apply them to apps or folders, and restore them after app updates.',
    href: '/iconchanger/',
  },
  {
    repo: 'Bengerthelorf/Claudit',
    slug: 'claudit',
    name: 'Claudit',
    variant: 'claudit',
    eyebrow: '04 / claude audit',
    tag: 'Claude Code · tokens · project costs',
    descriptionOverride: 'Read Claude Code sessions, inspect token costs by project, and collect usage from SSH devices.',
    href: '/claudit/',
  },
];
