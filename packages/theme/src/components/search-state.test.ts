import { expect, test } from 'bun:test';
import { createSearchRunner, highlightExcerpt } from './search-state';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

test('shares the first index load and displays only the latest query', async () => {
  const loading = deferred<any>();
  const updates: any[] = [];
  const queries: string[] = [];
  let loads = 0;
  const run = createSearchRunner(() => { loads++; return loading.promise; }, (state) => updates.push(state));
  const first = run('copy');
  const second = run('ssh');
  loading.resolve({ debouncedSearch: async (query: string) => {
    queries.push(query);
    return { results: [{ data: async () => ({ url: '/ssh', meta: { title: query } }) }] };
  } });
  await Promise.all([first, second]);
  expect(loads).toBe(1);
  expect(queries).toEqual(['ssh']);
  expect(updates.at(-1)?.items[0]?.meta.title).toBe('ssh');
});

test('clearing input invalidates pending result data and selection', async () => {
  const result = deferred<any>();
  const updates: any[] = [];
  const run = createSearchRunner(async () => ({ debouncedSearch: async () => ({ results: [{ data: () => result.promise }] }) }), (state) => updates.push(state));
  const pending = run('copy');
  await Promise.resolve();
  await Promise.resolve();
  await run('');
  result.resolve({ url: '/stale' });
  await pending;
  expect(updates.at(-1)).toMatchObject({ query: '', items: [], loading: false });
});

test('reports failure and permits index loading to be retried', async () => {
  let loads = 0;
  const updates: any[] = [];
  const run = createSearchRunner(async () => {
    if (++loads === 1) throw new Error('index offline');
    return { debouncedSearch: async () => ({ results: [] }) };
  }, (state) => updates.push(state));
  await run('copy');
  expect(updates.at(-1)?.error).toBe(true);
  await run('copy');
  expect(loads).toBe(2);
  expect(updates.at(-1)).toMatchObject({ loading: false, error: false, items: [] });
});

test('keeps search highlighting while treating metadata markup as text', () => {
  expect(highlightExcerpt('use <mark>ssh</mark> & <img src=x onerror=alert(1)>'))
    .toBe('use <mark>ssh</mark> &amp; &lt;img src=x onerror=alert(1)&gt;');
});

test('limits product search to an indexed product filter and can switch to all products', async () => {
  const updates: any[] = [];
  const options: object[] = [];
  let filterLoads = 0;
  const run = createSearchRunner(async () => ({
    filters: async () => { filterLoads++; return { product: { bcmr: 2, claudit: 1 } }; },
    debouncedSearch: async (_query: string, searchOptions: object) => {
      options.push(searchOptions);
      return { results: [] };
    },
  }), (state) => updates.push(state));

  await run('install', { product: 'bcmr' });
  expect(options[0]).toEqual({ filters: { product: 'bcmr' } });
  expect(updates.at(-1)).toMatchObject({ scope: 'product', scopeFallback: false });
  await run('install');
  expect(options[1]).toEqual({});
  await run('copy', { product: 'bcmr' });
  expect(filterLoads).toBe(1);
});

test('searches all products with an explicit fallback when product metadata is unavailable', async () => {
  for (const filters of [undefined, async () => ({}), async () => ({ product: { claudit: 1 } }), async () => { throw new Error('old index'); }]) {
    const updates: any[] = [];
    let options: object | undefined;
    const run = createSearchRunner(async () => ({
      filters,
      debouncedSearch: async (_query: string, value: object) => {
        options = value;
        return { results: [{ data: async () => ({ url: '/bcmr/docs/install' }) }] };
      },
    }), (state) => updates.push(state));
    await run('install', { product: 'bcmr' });
    expect(options).toEqual({});
    expect(updates.at(-1)).toMatchObject({ error: false, scope: 'all', scopeFallback: true });
    expect(updates.at(-1).items[0].url).toBe('/bcmr/docs/install');
  }
});

test('changing scope invalidates a pending product response', async () => {
  const stale = deferred<any>();
  const started = deferred<void>();
  const updates: any[] = [];
  const run = createSearchRunner(async () => ({
    filters: async () => ({ product: { bcmr: 2 } }),
    debouncedSearch: async (_query: string, options: any) => ({ results: [{
      data: () => {
        if (options.filters) { started.resolve(); return stale.promise; }
        return Promise.resolve({ url: '/all' });
      },
    }] }),
  }), (state) => updates.push(state));
  const current = run('copy', { product: 'bcmr' });
  await started.promise;
  await run('copy');
  stale.resolve({ url: '/stale-product' });
  await current;
  expect(updates.at(-1)).toMatchObject({ scope: 'all', items: [{ url: '/all' }] });
});
