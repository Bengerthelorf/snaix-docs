import { expect, test } from 'bun:test';
import { buildCommand, commandPresets, quotePosixArgument } from './command-builder.ts';

test('POSIX quoting preserves shell syntax as one literal argument', () => {
  expect(quotePosixArgument("a'b $(touch /tmp/nope); `whoami` & 雪")).toBe("'a'\"'\"'b $(touch /tmp/nope); `whoami` & 雪'");
  expect(quotePosixArgument('')).toBe("''");
});

test('copy options precede an explicit option terminator for hyphen-prefixed paths', () => {
  const result = buildCommand({ ...commandPresets.backup.options, source: '-photos', destination: '--help' });
  expect(result.ok && result.command).toBe("bcmr copy --recursive --preserve --verify -- '-photos' '--help'");
});

test('local home paths expand only HOME while other shell metacharacters stay literal', () => {
  const result = buildCommand({ ...commandPresets.backup.options, source: '~/My $data/', destination: "user@host:~/a'b/" });
  expect(result.ok && result.command).toBe("bcmr copy --recursive --preserve --verify -- \"$HOME\"/'My $data/' 'user@host:~/a'\"'\"'b/'");
});

test('multiline and control-character input never produces a copyable command', () => {
  for (const source of ['one\ntwo', 'one\rtwo', 'one\ttwo', 'one\0two', 'one\x7ftwo', 'one\u2028two']) {
    const result = buildCommand({ ...commandPresets.backup.options, source });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.source).toContain('single line');
  }
});

test('blank paths fail validation without trimming valid filename spaces', () => {
  expect(buildCommand({ ...commandPresets.backup.options, destination: '   ' }).ok).toBe(false);
  const result = buildCommand({ ...commandPresets.backup.options, source: ' file with spaces ' });
  expect(result.ok && result.command).toContain("' file with spaces '");
});

test('check emits only supported comparison flags and includes both endpoints', () => {
  const result = buildCommand({ ...commandPresets.check.options, noHash: true, verify: true, dryRun: true, resume: true, preserve: true });
  expect(result.ok && result.command).toBe("bcmr check --recursive --no-hash -- './photos/' './backup/'");
  expect(result.ok && result.notes.join(' ')).toContain('size and modification time');
});

test('all presets create commands and resume requests strict verification', () => {
  for (const preset of Object.values(commandPresets)) expect(buildCommand(preset.options).ok).toBe(true);
  const result = buildCommand(commandPresets.resume.options);
  expect(result.ok && result.command).toContain('--verify --resume --strict');
  expect(buildCommand({ ...commandPresets.check.options, source: 'first:/photos/', destination: 'second:/backup/' }).ok).toBe(false);
});

test('local colon filenames and SSH endpoints are distinguished for two-remote checks', () => {
  expect(buildCommand({ ...commandPresets.check.options, source: './a:b', destination: 'host:/backup/' }).ok).toBe(true);
  expect(buildCommand({ ...commandPresets.check.options, source: '../a:b', destination: 'host:/backup/' }).ok).toBe(true);
  expect(buildCommand({ ...commandPresets.check.options, source: 'C:\\a', destination: 'host:/backup/' }).ok).toBe(true);
});
