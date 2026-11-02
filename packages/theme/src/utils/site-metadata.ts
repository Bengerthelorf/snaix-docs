import type { BrandMetadata, ProductIntegration } from '@snaix/docs';

interface SiteMetadataInput {
  pathname: string;
  site?: URL | string;
  base?: string;
  brand?: BrandMetadata;
  products?: Pick<ProductIntegration, 'productRoot' | 'favicon' | 'ogImage' | 'tagline'>[];
  description?: string;
  favicon?: string;
  ogImage?: string;
}

const genericFavicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="4" fill="#111"/><path d="M11 10h13l5 5v15H11z" fill="#fff"/><path d="M15 19h10M15 24h10" stroke="#111" stroke-width="2"/></svg>')}`;

/** Resolve site metadata without assuming a particular product set, origin or assets. */
export function resolveSiteMetadata(input: SiteMetadataInput) {
  const base = (input.base ?? '/').replace(/\/$/, '');
  const path = base && (input.pathname === base || input.pathname.startsWith(`${base}/`))
    ? input.pathname.slice(base.length) || '/' : input.pathname;
  const product = [...(input.products ?? [])]
    .sort((a, b) => b.productRoot.replace(/\/$/, '').length - a.productRoot.replace(/\/$/, '').length)
    .find(({ productRoot }) => {
      const root = productRoot.replace(/\/$/, '');
      return !root || path === root || path.startsWith(`${root}/`);
    });
  const assetPath = (value: string) => {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return value;
    const absolute = value.startsWith('/') ? value : `/${value}`;
    return !base || absolute === base || absolute.startsWith(`${base}/`) ? absolute : `${base}${absolute}`;
  };
  const favicon = input.favicon ?? product?.favicon ?? input.brand?.favicon ?? genericFavicon;
  const image = input.ogImage ?? product?.ogImage ?? input.brand?.ogImage;
  const imagePath = image ? assetPath(image) : undefined;
  return {
    siteName: input.brand?.name ?? 'Documentation',
    description: input.description ?? product?.tagline ?? input.brand?.description ?? 'Documentation, guides and reference.',
    favicon: assetPath(favicon),
    canonical: input.site ? new URL(input.pathname, input.site).toString() : undefined,
    ogImage: imagePath && input.site ? new URL(imagePath, input.site).toString() : imagePath,
  };
}
