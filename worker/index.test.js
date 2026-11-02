import { afterEach, beforeEach, expect, spyOn, test } from 'bun:test';
import worker from './index.js';

const originalFetch = globalThis.fetch;
const originalCaches = Object.getOwnPropertyDescriptor(globalThis, 'caches');
let stored;
let tasks;
let requests;
let points;
let cache;
let ctx;
let env;

beforeEach(() => {
  stored = new Map();
  tasks = [];
  requests = [];
  points = [];
  cache = {
    async match(request) {
      if (request.method !== 'GET') return undefined;
      return stored.get(request.url)?.clone();
    },
    async put(request, response) {
      if (request.method !== 'GET') throw new TypeError('Cache keys must use GET');
      if (response.status === 206) throw new TypeError('Partial responses cannot be cached');
      stored.set(request.url, response.clone());
    },
  };
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { default: cache } });
  ctx = {
    waitUntil(promise) {
      // Attach a handler immediately, while retaining rejection state for assertions.
      tasks.push(Promise.resolve(promise).then(() => ({ ok: true }), () => ({ ok: false })));
    },
  };
  env = { ANALYTICS: { writeDataPoint: point => points.push(point) } };
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    throw new Error(`Unexpected network request: ${request.url}`);
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalCaches) Object.defineProperty(globalThis, 'caches', originalCaches);
  else delete globalThis.caches;
});

function upstream(response) {
  globalThis.fetch = async (input, init) => {
    requests.push(new Request(input, init));
    return response.clone();
  };
}

const request = (path, init) => new Request(`https://app.snaix.homes${path}`, init);
const fetchWorker = (path, init) => worker.fetch(request(path, init), env, ctx);
const flush = () => Promise.all(tasks);

test.each(['bcmr', 'pikpaktui'])('rewrites and caches the %s installer, including analytics on cache hits', async project => {
  upstream(new Response('#!/bin/sh\nDOWNLOAD_URL="https://github.com/upstream/${ASSET_NAME}"\necho ok\n'));
  const response = await fetchWorker(`/${project}/install.sh`, { headers: { 'CF-IPCountry': 'CN' } });
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
  expect(response.headers.get('cache-control')).toBe('public, max-age=300');
  expect(await response.text()).toBe(`#!/bin/sh\nDOWNLOAD_URL="https://app.snaix.homes/${project}/releases/latest/download/\${ASSET_NAME}"\necho ok\n`);
  expect(requests[0].url).toBe(`https://raw.githubusercontent.com/Bengerthelorf/${project}/main/install.sh`);
  expect(await flush()).toEqual([{ ok: true }]);
  const cached = await fetchWorker(`/${project}/install.sh`, { headers: { 'CF-IPCountry': 'CN' } });
  expect(await cached.text()).toContain('app.snaix.homes');
  expect(requests).toHaveLength(1);
  expect(points).toEqual(Array(2).fill({ blobs: [project, 'install', 'CN', '/install.sh'], indexes: [project] }));
});

test('preserves release bytes and metadata while caching a successful GET', async () => {
  upstream(new Response(new Uint8Array([0, 255, 128, 10]), {
    headers: { 'content-type': 'application/octet-stream', etag: '"asset-v1"' },
  }));
  const response = await fetchWorker('/bcmr/releases/download/v1/bcmr.tar.gz');
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([0, 255, 128, 10]));
  expect(response.headers.get('etag')).toBe('"asset-v1"');
  expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
  await flush();
  const cached = await fetchWorker('/bcmr/releases/download/v1/bcmr.tar.gz');
  expect(new Uint8Array(await cached.arrayBuffer())).toEqual(new Uint8Array([0, 255, 128, 10]));
  expect(requests).toHaveLength(1);
  expect(points[0]).toEqual({ blobs: ['bcmr', 'release', 'unknown', '/releases/download/v1/bcmr.tar.gz'], indexes: ['bcmr'] });
});

test.each(['/constructor/install.sh', '/toString/releases/latest', '/unknown/install.sh', '/bcmr/other'])('does not proxy unrecognized route %s', async path => {
  upstream(new Response('unexpected origin success'));
  const response = await fetchWorker(path);
  expect(response.status).toBe(404);
  expect(requests).toHaveLength(0);
  expect(points).toHaveLength(0);
});

test.each(['/bcmr/install.sh', '/pikpaktui/releases/latest'])('rejects POST on %s before cache or upstream work', async path => {
  upstream(new Response('should not be served'));
  const response = await fetchWorker(path, { method: 'POST', body: 'ignored payload' });
  expect(response.status).toBe(405);
  expect(response.headers.get('allow')).toBe('GET, HEAD');
  expect(requests).toHaveLength(0);
  expect(tasks).toHaveLength(0);
  expect(points).toHaveLength(0);
});

test('preserves the query string when proxying a release', async () => {
  upstream(new Response('asset'));
  const response = await fetchWorker('/pikpaktui/releases/download/v1/asset.zip?download=1&source=docs');
  expect(response.status).toBe(200);
  expect(requests[0].url).toBe('https://github.com/Bengerthelorf/pikpaktui/releases/download/v1/asset.zip?download=1&source=docs');
});

test('serves a cached GET for HEAD without a body or origin request', async () => {
  stored.set('https://app.snaix.homes/bcmr/releases/latest', new Response('cached release', { headers: { etag: '"v1"' } }));
  upstream(new Response('unexpected origin fetch'));
  const response = await fetchWorker('/bcmr/releases/latest', { method: 'HEAD' });
  expect(response.status).toBe(200);
  expect(response.headers.get('etag')).toBe('"v1"');
  expect(await response.text()).toBe('');
  expect(requests).toHaveLength(0);
});

test('uses upstream HEAD on release cache misses without caching an empty response', async () => {
  upstream(new Response(null, { headers: { 'content-length': '200000000' } }));
  const response = await fetchWorker('/bcmr/releases/latest/download/large.tar.gz', { method: 'HEAD' });
  expect(response.status).toBe(200);
  expect(requests[0].method).toBe('HEAD');
  expect(response.headers.get('content-length')).toBe('200000000');
  expect(await response.text()).toBe('');
  expect(tasks).toHaveLength(0);
  expect(stored.size).toBe(0);
});

test('installer HEAD keeps the transformed GET cache usable', async () => {
  upstream(new Response('DOWNLOAD_URL="original"\n'));
  const response = await fetchWorker('/bcmr/install.sh', { method: 'HEAD' });
  expect(await response.text()).toBe('');
  expect(await flush()).toEqual([{ ok: true }]);
  const get = await fetchWorker('/bcmr/install.sh');
  expect(await get.text()).toBe('DOWNLOAD_URL="https://app.snaix.homes/bcmr/releases/latest/download/${ASSET_NAME}"\n');
  expect(requests).toHaveLength(1);
});

test.each(['/bcmr/install.sh', '/bcmr/releases/latest'])('returns a controlled 502 for upstream connection failure on %s', async path => {
  const response = await fetchWorker(path);
  expect(response.status).toBe(502);
  expect(await response.text()).not.toContain('Unexpected network request');
  expect(tasks).toHaveLength(0);
});

test('an installer response that fails while reading its body produces 502', async () => {
  globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) { controller.error(new Error('body connection lost')); } }));
  const response = await fetchWorker('/bcmr/install.sh');
  expect(response.status).toBe(502);
  expect(tasks).toHaveLength(0);
});

test('a cache lookup outage falls back to upstream', async () => {
  cache.match = async () => { throw new Error('cache unavailable'); };
  upstream(new Response('release available'));
  const log = spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const response = await fetchWorker('/bcmr/releases/latest');
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('release available');
  } finally {
    log.mockRestore();
  }
});

test('a rejected background cache write does not reject request work', async () => {
  cache.put = async () => { throw new Error('cache object too large'); };
  upstream(new Response('release available'));
  const log = spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const response = await fetchWorker('/bcmr/releases/latest');
    expect(await response.text()).toBe('release available');
    expect(await flush()).toEqual([{ ok: true }]);
  } finally {
    log.mockRestore();
  }
});

test.each([404, 429, 500])('preserves upstream release failure status %s without caching', async status => {
  upstream(new Response('upstream error detail', { status }));
  const response = await fetchWorker('/bcmr/releases/latest');
  expect(response.status).toBe(status);
  expect(await response.text()).toBe('release not found');
  expect(tasks).toHaveLength(0);
});

test('cron skips a missing secret and schedules only its configured POST', async () => {
  await worker.scheduled({}, {}, ctx);
  expect(requests).toHaveLength(0);
  upstream(new Response('ok'));
  await worker.scheduled({}, { DEPLOY_HOOK: 'https://hook.invalid/test-only' }, ctx);
  expect(requests[0].url).toBe('https://hook.invalid/test-only');
  expect(requests[0].method).toBe('POST');
  expect(await flush()).toEqual([{ ok: true }]);
});
