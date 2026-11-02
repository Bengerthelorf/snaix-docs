import { afterEach, expect, spyOn, test } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fetchProductMeta, fetchRecentCommits, fetchReleases, readLastModifiedDate, sumProductStars } from './fetch-github.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('concurrent consumers share GitHub requests and receive the same metadata snapshot', async () => {
  const requests = new Map<string, number>();
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    requests.set(url, (requests.get(url) ?? 0) + 1);
    await Bun.sleep(5);
    return Response.json(url.endsWith('/releases/latest')
      ? { tag_name: `v${requests.get(url)}`, published_at: '2026-11-02T00:00:00Z' }
      : { stargazers_count: 3, description: 'Test tool', license: { spdx_id: 'MIT' }, homepage: '' });
  }) as typeof fetch;
  const [first, second] = await Promise.all([fetchProductMeta('test/dedupe'), fetchProductMeta('test/dedupe')]);
  expect(first).toEqual(second);
  expect(first.version).toBe('v1');
  expect([...requests.values()]).toEqual([1, 1]);
});

test('product stars preserve real zero and omit missing or malformed counts', async () => {
  const cases: { label: string; info: unknown; expected: number | undefined }[] = [
    { label: 'zero', info: { stargazers_count: 0 }, expected: 0 },
    { label: 'positive', info: { stargazers_count: 17 }, expected: 17 },
    { label: 'missing', info: {}, expected: undefined },
    { label: 'null-info', info: null, expected: undefined },
    { label: 'string', info: { stargazers_count: '17' }, expected: undefined },
    { label: 'null-count', info: { stargazers_count: null }, expected: undefined },
    { label: 'negative', info: { stargazers_count: -1 }, expected: undefined },
    { label: 'fractional', info: { stargazers_count: 1.5 }, expected: undefined },
    { label: 'unsafe', info: { stargazers_count: Number.MAX_SAFE_INTEGER + 1 }, expected: undefined },
  ];
  for (const item of cases) {
    globalThis.fetch = (async (input: string | URL | Request) => Response.json(String(input).endsWith('/releases/latest')
      ? { tag_name: 'v1', published_at: '2026-11-03T00:00:00Z' } : item.info)) as typeof fetch;
    const meta = await fetchProductMeta(`stars/${item.label}`);
    expect(meta.stars).toBe(item.expected);
    expect(meta.version).toBe('v1');
  }
});

test('failed repository metadata leaves product stars unknown while retaining the release', async () => {
  const warning = spyOn(console, 'warn').mockImplementation(() => {});
  globalThis.fetch = (async (input: string | URL | Request) => String(input).endsWith('/releases/latest')
    ? Response.json({ tag_name: 'v2' })
    : new Response('Unavailable', { status: 503 })) as typeof fetch;
  try {
    expect(await fetchProductMeta('stars/unavailable')).toMatchObject({ version: 'v2', stars: undefined });
  } finally {
    warning.mockRestore();
  }
});

test('aggregate stars retain true all-zero totals and require every product count', () => {
  expect(sumProductStars([{ stars: 0 }, { stars: 0 }, { stars: 0 }, { stars: 0 }])).toBe(0);
  expect(sumProductStars([{ stars: 3 }, { stars: 0 }, { stars: 17 }])).toBe(20);
  expect(sumProductStars([{ stars: 3 }, {}, { stars: 17 }])).toBeUndefined();
  expect(sumProductStars([{}, {}])).toBeUndefined();
  expect(sumProductStars([])).toBeUndefined();
  for (const stars of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(sumProductStars([{ stars: 3 }, { stars }])).toBeUndefined();
  }
  expect(sumProductStars([{ stars: Number.MAX_SAFE_INTEGER }, { stars: 1 }])).toBeUndefined();
});

test('a stalled GitHub request falls back within the build timeout', async () => {
  const warning = spyOn(console, 'warn').mockImplementation(() => {});
  globalThis.fetch = (async (_input: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal!.reason), { once: true });
  })) as typeof fetch;
  try {
    const result = await Promise.race([
      fetchRecentCommits('test/stalled'),
      Bun.sleep(5500).then(() => 'still waiting'),
    ]);
    expect(result).toEqual([]);
  } finally {
    warning.mockRestore();
  }
}, 7000);

test('malformed list items do not crash changelog or activity rendering', async () => {
  globalThis.fetch = (async (input: string | URL | Request) => Response.json(String(input).includes('/releases?')
    ? [null, { tag_name: 'v1', name: 'First', published_at: '2026-11-02T00:00:00Z', body: 'Notes', html_url: 'https://example.com/v1', draft: false, prerelease: false }]
    : [null, { sha: 'abcdef012345', commit: { author: { date: '2026-11-02T00:00:00Z' }, message: 'Fix docs\n\nDetails' } }]
  )) as typeof fetch;
  expect(await fetchReleases('test/malformed')).toEqual([
    { repo: 'test/malformed', tag: 'v1', name: 'First', date: '2026-11-02T00:00:00Z', bodyMarkdown: 'Notes', htmlUrl: 'https://example.com/v1', prerelease: false },
  ]);
  expect(await fetchRecentCommits('test/malformed')).toEqual([
    { repo: 'test/malformed', sha: 'abcdef0', date: '2026-11-02T00:00:00Z', message: 'Fix docs' },
  ]);
});

test('last-modified lookup handles apostrophes in checkout and file paths', async () => {
  const cwd = process.cwd();
  const root = await mkdtemp(join(tmpdir(), "snaix's-git-"));
  const path = "guide's.md";
  try {
    execFileSync('git', ['init', '--quiet', root]);
    await writeFile(join(root, path), 'Guide\n');
    execFileSync('git', ['-C', root, 'add', '--', path]);
    execFileSync('git', ['-C', root, '-c', 'user.name=Docs test', '-c', 'user.email=docs@example.com', 'commit', '--quiet', '-m', 'Add guide'], {
      env: { ...process.env, GIT_AUTHOR_DATE: '2001-02-03T12:00:00Z', GIT_COMMITTER_DATE: '2001-02-03T12:00:00Z' },
    });
    process.chdir(root);
    expect(readLastModifiedDate([path])).toBe('2001.02.03');
  } finally {
    process.chdir(cwd);
    await rm(root, { recursive: true, force: true });
  }
});
