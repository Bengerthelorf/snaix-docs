export interface SearchItem {
  url: string;
  meta?: { title?: string; section?: string; product?: string; productTitle?: string };
  excerpt?: string;
}

export interface SearchEngine {
  filters?(): Promise<Record<string, Record<string, number>>>;
  debouncedSearch(query: string, options: object, delay: number): Promise<{
    results: { data(): Promise<SearchItem> }[];
  } | null>;
}

export interface SearchState {
  query: string;
  items: SearchItem[];
  loading: boolean;
  error: boolean;
  scope: 'product' | 'all';
  scopeFallback: boolean;
}

export interface SearchScope {
  product?: string;
}

/** Coalesce index loading and discard responses superseded by a new input. */
export function createSearchRunner(load: () => Promise<SearchEngine>, update: (state: SearchState) => void) {
  let index: Promise<SearchEngine> | undefined;
  let filters: Promise<Record<string, Record<string, number>>> | undefined;
  let version = 0;
  return async (query: string, requested: SearchScope = {}) => {
    const request = ++version;
    let scope: SearchState['scope'] = requested.product ? 'product' : 'all';
    let scopeFallback = false;
    update({ query, items: [], loading: !!query, error: false, scope, scopeFallback });
    if (!query) return;
    try {
      index ??= load().catch((error) => { index = undefined; throw error; });
      const engine = await index;
      if (request !== version) return;
      const options: { filters?: { product: string } } = {};
      if (requested.product) {
        try {
          filters ??= (engine.filters?.() ?? Promise.resolve({})).catch((error) => { filters = undefined; throw error; });
          const available = await filters;
          if ((available.product?.[requested.product] ?? 0) > 0) options.filters = { product: requested.product };
        } catch {
          // Older or partial indexes remain searchable without silently excluding documents.
        }
        if (request !== version) return;
        if (!options.filters) { scope = 'all'; scopeFallback = true; }
      }
      const result = await engine.debouncedSearch(query, options, 200);
      if (!result || request !== version) return;
      const items = await Promise.all(result.results.slice(0, 8).map((hit) => hit.data()));
      if (request === version) update({ query, items, loading: false, error: false, scope, scopeFallback });
    } catch {
      if (request === version) update({ query, items: [], loading: false, error: true, scope, scopeFallback });
    }
  };
}

/** Pagefind highlights are markup; other document text must stay inert. */
export function highlightExcerpt(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;(\/?)mark&gt;/g, '<$1mark>');
}
