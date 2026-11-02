export interface SearchItem {
  url: string;
  meta?: { title?: string; section?: string };
  excerpt?: string;
}

export interface SearchEngine {
  debouncedSearch(query: string, options: object, delay: number): Promise<{
    results: { data(): Promise<SearchItem> }[];
  } | null>;
}

export interface SearchState {
  query: string;
  items: SearchItem[];
  loading: boolean;
  error: boolean;
}

/** Coalesce index loading and discard responses superseded by a new input. */
export function createSearchRunner(load: () => Promise<SearchEngine>, update: (state: SearchState) => void) {
  let index: Promise<SearchEngine> | undefined;
  let version = 0;
  return async (query: string) => {
    const request = ++version;
    update({ query, items: [], loading: !!query, error: false });
    if (!query) return;
    try {
      index ??= load().catch((error) => { index = undefined; throw error; });
      const engine = await index;
      if (request !== version) return;
      const result = await engine.debouncedSearch(query, {}, 200);
      if (!result || request !== version) return;
      const items = await Promise.all(result.results.slice(0, 8).map((hit) => hit.data()));
      if (request === version) update({ query, items, loading: false, error: false });
    } catch {
      if (request === version) update({ query, items: [], loading: false, error: true });
    }
  };
}

/** Pagefind highlights are markup; other document text must stay inert. */
export function highlightExcerpt(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/&lt;(\/?)mark&gt;/g, '<$1mark>');
}
