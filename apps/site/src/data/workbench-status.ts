import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function readCheckoutRevision(directory: string): { sha: string; date: string } | null {
  try {
    const root = execFileSync('git', ['-C', directory, 'rev-parse', '--show-toplevel'], {
      stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000,
    }).toString().trim();
    // A copied docs directory can inherit the enclosing website repository.
    // Only identify a product source when it is its own checkout root.
    if (realpathSync(root) !== realpathSync(directory)) return null;
    const output = execFileSync('git', ['-C', directory, 'log', '-1', '--format=%H%n%cI'], {
      stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000,
    }).toString().trim().split('\n');
    if (!output[0] || !/^[a-f0-9]{40}$/.test(output[0])) return null;
    return { sha: output[0], date: output[1] ?? '' };
  } catch { return null; }
}

/** The local docs checkout revision, independent of the latest stable release. */
export function readContentRevision(slug: string): { sha: string; date: string } | null {
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) return null;
  return readCheckoutRevision(fileURLToPath(new URL(`../../../../content/${slug}/`, import.meta.url)));
}
