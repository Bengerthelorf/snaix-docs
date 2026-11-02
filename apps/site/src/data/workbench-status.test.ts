import { expect, test } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCheckoutRevision, readContentRevision } from './workbench-status';

test('docs source revision belongs to an independent checkout, never its enclosing site', () => {
  const root = mkdtempSync(join(tmpdir(), 'snaix-source-'));
  try {
    execFileSync('git', ['init', '--quiet', root]);
    writeFileSync(join(root, 'README.md'), 'Docs\n');
    execFileSync('git', ['-C', root, 'add', 'README.md']);
    execFileSync('git', ['-C', root, '-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '--quiet', '-m', 'Docs']);
    const sha = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD']).toString().trim();
    expect(readCheckoutRevision(root)?.sha).toBe(sha);
    const copied = join(root, 'copied-product-docs');
    mkdirSync(copied);
    expect(readCheckoutRevision(copied)).toBeNull();
    expect(readCheckoutRevision(join(root, 'missing'))).toBeNull();
    expect(readContentRevision('../..')).toBeNull();
  } finally { rmSync(root, { recursive: true, force: true }); }
});
