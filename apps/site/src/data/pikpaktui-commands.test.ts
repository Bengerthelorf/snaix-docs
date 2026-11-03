import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { pikpaktuiCommandCount, pikpaktuiCommandGroups } from './pikpaktui-commands';

const commands = pikpaktuiCommandGroups.flatMap(group => group.items);
const upstream = (path: string) => readFileSync(new URL(`../../../../content/pikpaktui/src/${path}`, import.meta.url), 'utf8');

test('the reference includes every public command from the upstream CLI registry', () => {
  const registry = upstream('cmd/mod.rs').split('pub const COMMAND_GROUPS:')[1].split('\n];')[0];
  const publicNames = [...registry.matchAll(/"([a-z][a-z-]*)"/g)].map(match => `pikpaktui ${match[1]}`);
  expect(commands.map(command => command.cmd).sort()).toEqual(publicNames.sort());
  expect(pikpaktuiCommandCount).toBe(publicNames.length);
});

test('login guidance uses the current credential filename and supplies required authentication inputs', () => {
  const config = upstream('config.rs');
  const filename = config.match(/Ok\(base\.join\("([^"]+)"\)\)/)?.[1];
  expect(filename).toBeDefined();
  const login = commands.find(command => command.cmd === 'pikpaktui login')!;
  expect(login.desc).toContain(filename!);
  for (const example of login.example ?? []) {
    // login.rs requires each value from an option or environment variable;
    // interactive first-run authentication belongs to the no-argument TUI.
    expect(/(?:-u\s|--user\s|PIKPAK_USER=)/.test(example)).toBe(true);
    expect(/(?:-p\s|--password\s|PIKPAK_PASS=)/.test(example)).toBe(true);
  }
});

test('download examples use options accepted by the actual parser and state the jobs scope', () => {
  const parser = upstream('cmd/download.rs');
  const acceptedOptions = new Set([...parser.matchAll(/"(-{1,2}[a-z][a-z-]*)"/g)].map(match => match[1]));
  const download = commands.find(command => command.cmd === 'pikpaktui download')!;
  for (const example of download.example ?? []) {
    const options = [...example.matchAll(/(?:^|\s)(-{1,2}[^\s]+)/g)].map(match => match[1]);
    for (const option of options) expect(acceptedOptions.has(option)).toBe(true);
  }
  const jobs = (download.flags ?? []).find(flag => flag.f.includes('--jobs'))!;
  const maxJobs = parser.match(/if jobs > (\d+)/)?.[1];
  expect(jobs.x).toContain('folder');
  expect(jobs.t).toContain(maxJobs!);
});

test('local hash and account JSON modes are documented; trash deletion retains preview and confirmation controls', () => {
  for (const name of ['hash', 'whoami']) {
    const command = commands.find(item => item.cmd === `pikpaktui ${name}`);
    expect(command).toBeDefined();
    expect((command!.flags ?? []).some(flag => flag.f.includes('--json'))).toBe(true);
    expect(upstream(`cmd/${name}.rs`)).toContain('"--json"');
  }
  const empty = commands.find(command => command.cmd === 'pikpaktui empty');
  expect(empty).toBeDefined();
  for (const option of ['--all', '--force', '--dry-run']) {
    expect((empty!.flags ?? []).some(flag => flag.f.includes(option))).toBe(true);
    expect(upstream('cmd/empty.rs')).toContain(`"${option}"`);
  }
  expect((empty!.flags ?? []).find(flag => flag.f.includes('--force'))!.d).toBe('false');
});
