import { afterEach, beforeEach, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./prepare-docs.ts', import.meta.url));
let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'snaix-prepare-docs-'));
  for (const slug of ['bcmr', 'claudit', 'pikpaktui', 'iconchanger']) {
    await mkdir(join(root, 'content', slug, 'docs'), { recursive: true });
  }
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function source(path: string, body: string) {
  const target = join(root, 'content', 'iconchanger', 'docs', path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, body);
  return target;
}

function prepare() {
  return Bun.spawnSync([process.execPath, script, root]);
}

const staged = (path: string) => join(root, '.cache', 'docs', 'iconchanger', path);

test('stages public Markdown, localized MDX, and relative assets without changing source', async () => {
  const guide = '---\ntitle: Quick Start\nsection: guide\n---\n![screen](images/screen.svg)\n';
  const localized = '---\r\ntitle: 快速开始\r\nlocale: zh\r\n---\r\n<Text />\r\n';
  const original = await source('getting-started.md', guide);
  await source('zh/getting-started.mdx', localized);
  await source('images/screen.svg', '<svg viewBox="0 0 1 1" />');
  await source('docs.config.ts', 'export default { slug: "iconchanger" };\n');
  await source('.git/config', 'private git metadata');
  await source('images/.hidden.svg', '<svg />');

  const result = prepare();
  expect(result.exitCode).toBe(0);
  expect(await readFile(staged('getting-started.md'), 'utf8')).toBe(guide);
  expect(await readFile(staged('zh/getting-started.mdx'), 'utf8')).toBe(localized);
  expect(await readFile(staged('images/screen.svg'), 'utf8')).toBe('<svg viewBox="0 0 1 1" />');
  expect(await readFile(staged('docs.config.ts'), 'utf8')).toBe('export default { slug: "iconchanger" };\n');
  expect(existsSync(staged('.git'))).toBe(false);
  expect(existsSync(staged('images/.hidden.svg'))).toBe(false);
  expect(await readFile(original, 'utf8')).toBe(guide);
});

test('skips engineering notes without frontmatter and reports each skipped path', async () => {
  const note = '# Settings layout verification\n\nInternal release audit.\n';
  const original = await source('settings-layout-2026-10-23.md', note);
  await source('superpowers/plans/repair.md', '# Repair plan\n');

  const result = prepare();
  expect(result.exitCode).toBe(0);
  expect(existsSync(staged('settings-layout-2026-10-23.md'))).toBe(false);
  expect(existsSync(staged('superpowers/plans/repair.md'))).toBe(false);
  expect(result.stdout.toString()).toContain('iconchanger/settings-layout-2026-10-23.md');
  expect(result.stdout.toString()).toContain('iconchanger/superpowers/plans/repair.md');
  expect(await readFile(original, 'utf8')).toBe(note);
});

test('retains malformed or incomplete frontmatter for strict Astro validation', async () => {
  const cases = {
    'missing-title.md': '---\nsection: guide\n---\nMissing title.\n',
    'invalid-title.md': '---\ntitle: [unclosed\n---\nMalformed YAML.\n',
    'unclosed.mdx': '---\ntitle: Missing closing delimiter\n',
  };
  for (const [path, body] of Object.entries(cases)) await source(path, body);

  const result = prepare();
  expect(result.exitCode).toBe(0);
  for (const [path, body] of Object.entries(cases)) {
    expect(await readFile(staged(path), 'utf8')).toBe(body);
  }
});

test('removes stale pages and assets on the next staging run', async () => {
  const original = await source('old.md', '---\ntitle: Old page\n---\n');
  const image = await source('images/old.svg', '<svg />');
  expect(prepare().exitCode).toBe(0);
  expect(existsSync(staged('old.md'))).toBe(true);
  await rm(original);
  await rm(image);
  await source('new.md', '---\ntitle: New page\n---\n');

  expect(prepare().exitCode).toBe(0);
  expect(existsSync(staged('old.md'))).toBe(false);
  expect(existsSync(staged('images/old.svg'))).toBe(false);
  expect(existsSync(staged('new.md'))).toBe(true);
});

test('fails explicitly when a product content checkout is missing', async () => {
  await rm(join(root, 'content', 'pikpaktui'), { recursive: true });
  const result = prepare();
  expect(result.exitCode).not.toBe(0);
  expect(result.stderr.toString()).toContain('content/pikpaktui/docs');
});

test.each([
  ['missing title', '---\nsection: guide\n---\nMissing title.\n', /title.*Required/s],
  ['invalid title', '---\ntitle: 42\n---\nWrong title type.\n', /title.*string/s],
  ['malformed YAML', '---\ntitle: [unclosed\n---\nBroken YAML.\n', /YAML|flow collection/i],
])('Astro rejects staged %s using the unchanged production schema', async (_name, body, error) => {
  await source('broken.md', body);
  expect(prepare().exitCode).toBe(0);
  await mkdir(join(root, 'src', 'content', 'commands'), { recursive: true });
  await writeFile(join(root, 'package.json'), '{"type":"module"}\n');
  await symlink(fileURLToPath(new URL('../node_modules', import.meta.url)), join(root, 'node_modules'));
  await copyFile(
    fileURLToPath(new URL('../src/content/config.ts', import.meta.url)),
    join(root, 'src', 'content', 'config.ts'),
  );
  for (const slug of ['bcmr', 'claudit', 'pikpaktui', 'iconchanger']) {
    await symlink(join(root, '.cache', 'docs', slug), join(root, 'src', 'content', slug));
  }

  const result = Bun.spawnSync([
    process.execPath,
    fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url)),
    'sync',
    '--root', root,
  ], { cwd: root, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
  const output = result.stdout.toString() + result.stderr.toString();
  expect(result.exitCode).not.toBe(0);
  expect(output).toContain('broken.md');
  expect(output).toMatch(error);
}, 30_000);
