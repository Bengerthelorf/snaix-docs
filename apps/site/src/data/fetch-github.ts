import { execFileSync } from 'node:child_process';

export interface ProductMeta {
  repo: string;
  version: string;
  releaseDate: string;
  stars: number;
  description: string;
  license: string;
  homepage: string;
}

function ghHeaders(): HeadersInit {
  const h: Record<string, string> = { 'User-Agent': 'snaix-docs-build' };
  const tok = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (tok) h['Authorization'] = `Bearer ${tok}`;
  return h;
}

const jsonCache = new Map<string, { expires: number; response: Promise<unknown> }>();
const CACHE_TTL_MS = 60_000;
const FETCH_TIMEOUT_MS = 5_000;

function ghJson(path: string): Promise<unknown> {
  const cached = jsonCache.get(path);
  if (cached && cached.expires > Date.now()) return cached.response;

  const response = (async () => {
    try {
      const r = await fetch(`https://api.github.com/${path}`, {
        headers: ghHeaders(),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!r.ok) {
        console.warn(`[site/fetch-github] ${r.status} ${r.statusText} ← ${path}`);
        return null;
      }
      return await r.json();
    } catch (err) {
      console.warn(`[site/fetch-github] fetch failed for ${path}:`, (err as Error).message);
      return null;
    }
  })();
  // Cache the promise as well as its result so simultaneous page renders share
  // one request. The short TTL also lets a long-running dev server refresh.
  jsonCache.set(path, { expires: Date.now() + CACHE_TTL_MS, response });
  return response;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const record = (value: unknown): Record<string, unknown> => isRecord(value) ? value : {};
const string = (value: unknown): string => typeof value === 'string' ? value : '';

export async function fetchProductMeta(repo: string): Promise<ProductMeta> {
  const [rel, info] = await Promise.all([
    ghJson(`repos/${repo}/releases/latest`),
    ghJson(`repos/${repo}`),
  ]);
  const release = record(rel);
  const repository = record(info);
  return {
    repo,
    version: string(release.tag_name),
    releaseDate: string(release.published_at).slice(0, 10).replaceAll('-', '.'),
    stars: typeof repository.stargazers_count === 'number' ? repository.stargazers_count : 0,
    description: string(repository.description),
    license: string(record(repository.license).spdx_id).toLowerCase(),
    homepage: string(repository.homepage),
  };
}

export interface ReleaseEntry {
  repo: string;
  tag: string;
  name: string;
  date: string;
  bodyMarkdown: string;
  htmlUrl: string;
  prerelease: boolean;
}

export async function fetchReleases(repo: string, limit = 20): Promise<ReleaseEntry[]> {
  const data = await ghJson(`repos/${repo}/releases?per_page=${limit}`);
  if (!Array.isArray(data)) return [];
  return data
    .filter(isRecord)
    .filter((r) => !r.draft)
    .map((r) => ({
      repo,
      tag: string(r.tag_name),
      name: string(r.name ?? r.tag_name),
      date: string(r.published_at ?? r.created_at),
      bodyMarkdown: string(r.body),
      htmlUrl: string(r.html_url),
      prerelease: Boolean(r.prerelease),
    }));
}

export interface RecentCommit {
  repo: string;
  sha: string;
  date: string;
  message: string;
}

export async function fetchRecentCommits(repo: string, limit = 10): Promise<RecentCommit[]> {
  const data = await ghJson(`repos/${repo}/commits?per_page=${limit}`);
  if (!Array.isArray(data)) return [];
  return data.filter(isRecord).map((c) => {
    const commit = record(c.commit);
    return {
      repo,
      sha: string(c.sha).slice(0, 7),
      date: string(record(commit.author).date ?? record(commit.committer).date),
      message: string(commit.message).split('\n', 1)[0]!.trim(),
    };
  }).filter((c) => c.sha && c.date && c.message);
}

export function readLastModifiedDate(paths: string[]): string {
  try {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5_000,
    }).toString().trim();
    if (!root) return '';
    const out = execFileSync(
      'git', ['-C', root, 'log', '-1', '--format=%aI', '--', ...paths],
      { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5_000 },
    ).toString().trim();
    if (!out) return '';
    const d = new Date(out);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

export interface BuildInfo {
  sha: string;
  date: string;
  sig: string;
}

export function readBuildInfo(): BuildInfo {
  let sha = '';
  try {
    sha = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5_000 })
      .toString()
      .trim();
  } catch {
    // git unavailable (e.g. tarball deploy); sha stays empty
  }
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
  return { sha, date, sig: '' };
}
