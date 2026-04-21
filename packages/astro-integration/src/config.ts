export interface MarkdownOptions {
  math?: boolean;
  mermaid?: boolean;
  /** Longest keys tried first. */
  linkRewrites?: Record<string, string>;
}

export interface LocaleOption {
  code: string;
  label: string;
  lang?: string;
  dir?: 'ltr' | 'rtl';
  default?: boolean;
  ui?: LocaleUI;
}

export interface LocaleUI {
  tocLabel?: string;
  sections?: Record<string, string>;
  docsLabel?: string;
}

export interface TopNavTab {
  id: string;
  label: string;
  href: string;
  sections?: string[];
  external?: boolean;
}

export interface InstallOption {
  name: string;
  cmd: string;
  note: string;
}

export type InstallOptions = Record<string, InstallOption>;

export interface BuildStamp {
  sha?: string;
  /** `YYYY.MM.DD` form. */
  date?: string;
  sig?: string;
}

export interface ActivityRow {
  time: string;
  proj: string;
  kind: string;
  /** HTML-safe fragment; inline `<code>` allowed. */
  msg: string;
}

export interface SiteStats {
  shippingTools?: number;
  githubStars?: number;
  locales?: number;
  telemetry?: number;
}

export type TileVariant = 'bcmr' | 'pikpak' | 'icon' | 'claudit' | 'ds';

export interface ProductCard {
  slug: string;
  name: string;
  variant: TileVariant;
  eyebrow: string;
  tag: string;
  description: string;
  metaLeft: string;
  metaRight: string;
  href: string;
  repo?: string;
  stars?: number;
}

export interface SiteData {
  edition: string;
  build: BuildStamp;
  stats: SiteStats;
  ticker: string[];
  activity: ActivityRow[];
  products: ProductCard[];
}

export interface NavSection {
  label: string;
  items: string[];
}

export interface ProductIntegration {
  slug: string;
  title: string;
  tagline?: string;
  version?: string;
  releaseDate?: string;
  githubUrl?: string;
  /** No trailing slash. Pages live at `${productRoot}/*`. */
  productRoot: string;
  /** CSS color var (e.g. `var(--yellow)`) used in the docs-page topbar logo + docs-nav section heading. */
  accent: string;
  install: InstallOptions;
  sections: NavSection[];
  tabs: TopNavTab[];
  linkRewrites?: Record<string, string>;
  /** Substring matched against source file paths to scope rewrites. Defaults to `content/${slug}/`. */
  contentDir?: string;
}

export interface SnaixDocsOptions {
  products: ProductIntegration[];
  locales: LocaleOption[];
  buildStamp: BuildStamp;
  siteData: SiteData;
  markdown?: Pick<MarkdownOptions, 'math' | 'mermaid'>;
}

declare global {
  interface Window {
    __SNAIX_CONFIG__?: SnaixDocsOptions;
  }
}
