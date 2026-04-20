import { snaixConfig } from 'virtual:snaix-config';
import type { ProductIntegration } from '@snaix/docs';

export function product(slug: string): ProductIntegration {
  const p = (snaixConfig.products ?? []).find((x) => x.slug === slug);
  if (!p) throw new Error(`unknown product: ${slug}`);
  return p;
}
