import { afterEach, expect, spyOn, test } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fetchProductMeta, fetchRecentCommits, fetchReleases, readLastModifiedDate } from './fetch-github.ts';

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
