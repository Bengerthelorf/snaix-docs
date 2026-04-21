#!/usr/bin/env bun
import { parse } from 'yaml';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = parse(readFileSync(join(root, '.github/repos.yml'), 'utf8')) as {
  repos: { repo: string; paths: string[]; dispatchTypes?: string[] }[];
};

const token = process.env.CROSS_REPO_TOKEN;
const deployHook = process.env.SNAIX_DOCS_DEPLOY_HOOK;
if (!token) throw new Error('CROSS_REPO_TOKEN not set');
if (!deployHook) throw new Error('SNAIX_DOCS_DEPLOY_HOOK not set');

const ghHeaders = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'snaix-docs-sync',
};

async function gh<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`https://api.github.com${path}`, {
    method,
    headers: { ...ghHeaders, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok && r.status !== 404 && r.status !== 422) {
    throw new Error(`${method} ${path} → ${r.status} ${await r.text()}`);
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T);
}

const yamlFor = (paths: string[], dispatchTypes?: string[]) =>
  `name: Trigger snaix.homes deploy

on:
  push:
    branches: [main]
    paths:
${paths.map((p) => `      - '${p}'`).join('\n')}
  release:
    types: [published]${dispatchTypes?.length ? `
  repository_dispatch:
    types: [${dispatchTypes.join(', ')}]` : ''}
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: POST deploy hook
        run: |
          if [ -z "$HOOK" ]; then
            echo "::warning::SNAIX_DOCS_DEPLOY_HOOK not set — skipping ping"
            exit 0
          fi
          curl -fsS -X POST "$HOOK"
        env:
          HOOK: \${{ secrets.SNAIX_DOCS_DEPLOY_HOOK }}
`;

async function syncRepo({ repo, paths, dispatchTypes }: { repo: string; paths: string[]; dispatchTypes?: string[] }) {
  const desired = yamlFor(paths, dispatchTypes);
  const apiPath = `/repos/${repo}/contents/.github/workflows/docs.yml`;
  const existing = await gh<{ sha?: string; content?: string }>('GET', apiPath);
  const current = existing.content ? Buffer.from(existing.content, 'base64').toString() : '';
  if (current.trim() === desired.trim()) {
    console.log(`✓ ${repo} docs.yml up to date`);
  } else {
    await gh('PUT', apiPath, {
      message: 'ci(docs): sync from snaix-docs/.github/repos.yml',
      content: Buffer.from(desired).toString('base64'),
      sha: existing.sha,
    });
    console.log(`↑ ${repo} docs.yml updated`);
  }

  const pubKey = await gh<{ key: string; key_id: string }>('GET', `/repos/${repo}/actions/secrets/public-key`);
  const sodium = await import('libsodium-wrappers');
  await sodium.default.ready;
  const messageBytes = sodium.default.from_string(deployHook!);
  const keyBytes = sodium.default.from_base64(pubKey.key, sodium.default.base64_variants.ORIGINAL);
  const encrypted = sodium.default.crypto_box_seal(messageBytes, keyBytes);
  const encryptedValue = sodium.default.to_base64(encrypted, sodium.default.base64_variants.ORIGINAL);
  await gh('PUT', `/repos/${repo}/actions/secrets/SNAIX_DOCS_DEPLOY_HOOK`, {
    encrypted_value: encryptedValue,
    key_id: pubKey.key_id,
  });
  console.log(`✓ ${repo} SNAIX_DOCS_DEPLOY_HOOK set`);
}

for (const r of config.repos) await syncRepo(r);
console.log(`\nsynced ${config.repos.length} repos`);
