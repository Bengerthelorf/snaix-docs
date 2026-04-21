import { execSync } from 'node:child_process';

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

async function ghJson(path: string): Promise<any | null> {
  try {
    const r = await fetch(`https://api.github.com/${path}`, { headers: ghHeaders() });
    if (!r.ok) {
      console.warn(`[site/fetch-github] ${r.status} ${r.statusText} ← ${path}`);
      return null;
    }
    return await r.json();
  } catch (err) {
    console.warn(`[site/fetch-github] fetch failed for ${path}:`, (err as Error).message);
    return null;
  }
}

export async function fetchProductMeta(repo: string): Promise<ProductMeta> {
  const [rel, info] = await Promise.all([
    ghJson(`repos/${repo}/releases/latest`),
    ghJson(`repos/${repo}`),
  ]);
  return {
    repo,
    version: rel?.tag_name ?? '',
    releaseDate: (rel?.published_at ?? '').slice(0, 10).replaceAll('-', '.'),
    stars: typeof info?.stargazers_count === 'number' ? info.stargazers_count : 0,
    description: info?.description ?? '',
    license: info?.license?.spdx_id ? String(info.license.spdx_id).toLowerCase() : '',
    homepage: info?.homepage ?? '',
  };
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
  return data.map((c: any) => ({
    repo,
    sha: String(c.sha ?? '').slice(0, 7),
    date: c.commit?.author?.date ?? c.commit?.committer?.date ?? '',
    message: String(c.commit?.message ?? '').split('\n', 1)[0].trim(),
  })).filter((c) => c.sha && c.date && c.message);
}

export function readLocalCommits(limit = 10): RecentCommit[] {
  try {
    const out = execSync(
      `git log -n ${limit} --format='%H%x1f%aI%x1f%s' --no-merges`,
      { stdio: ['ignore', 'pipe', 'ignore'] },
    ).toString();
    return out
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [sha, date, message] = line.split('\x1f');
        return { repo: 'local', sha: sha.slice(0, 7), date, message };
      });
  } catch {
    return [];
  }
}

export function readLastModifiedDate(paths: string[]): string {
  try {
    const root = execSync('git rev-parse --show-toplevel', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    if (!root) return '';
    const out = execSync(
      `git -C '${root}' log -1 --format=%aI -- ${paths.map((p) => `'${p}'`).join(' ')}`,
      { stdio: ['ignore', 'pipe', 'ignore'] },
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
    sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    // git unavailable (e.g. tarball deploy); sha stays empty
  }
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '.');
  return { sha, date, sig: '' };
}
