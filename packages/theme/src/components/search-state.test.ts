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
