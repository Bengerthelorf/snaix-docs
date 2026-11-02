#!/usr/bin/env bun
import { copyFile, mkdir, readdir, readFile, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const products = ['bcmr', 'claudit', 'pikpaktui', 'iconchanger'];
const root = process.argv[2]
  ? resolve(process.argv[2])
  : fileURLToPath(new URL('../../../', import.meta.url));

// Engineering notes can share docs/ with the published guides. Only stage
// Markdown that opts in with frontmatter; Astro still validates its full schema.
// In particular, do not parse, repair, or discard malformed frontmatter here.
async function copyDocs(
  source: string,
  destination: string,
  prefix: string,
): Promise<{ pages: number; skipped: number }> {
  await mkdir(destination, { recursive: true });
  let pages = 0;
  let skipped = 0;
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    const path = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      const nested = await copyDocs(from, to, path);
      pages += nested.pages;
      skipped += nested.skipped;
    } else if (entry.isFile()) {
      if (/\.mdx?$/i.test(entry.name)) {
        const body = await readFile(from, 'utf8');
        if (!/^\uFEFF?---[\t ]*(?:\r?\n|$)/.test(body)) {
          console.log(`[prepare-docs] skipped ${path} (no frontmatter)`);
          skipped++;
          continue;
        }
        pages++;
      }
      await copyFile(from, to);
    } else {
      throw new Error(`Unsupported docs entry: ${from}; use regular files and directories`);
    }
  }
  return { pages, skipped };
}

// Validate all checkouts before replacing the cache. Missing content must fail
// the build explicitly instead of silently producing incomplete product docs.
for (const slug of products) {
  const source = join(root, 'content', slug, 'docs');
  if (!(await stat(source).catch(() => null))?.isDirectory()) {
    throw new Error(`Missing product docs: ${source}; populate content/${slug} first`);
  }
}

for (const slug of products) {
  const source = join(root, 'content', slug, 'docs');
  const destination = join(root, '.cache', 'docs', slug);
  await rm(destination, { recursive: true, force: true });
  const { pages, skipped } = await copyDocs(source, destination, slug);
  console.log(`[prepare-docs] ${slug}: ${pages} pages staged, ${skipped} notes skipped`);
}
