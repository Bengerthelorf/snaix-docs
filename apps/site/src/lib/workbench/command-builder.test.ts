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

test('copy rejects the unsupported dash sentinel while allowing a file named dash', () => {
  for (const key of ['source', 'destination'] as const) {
    const result = buildCommand({ ...commandPresets.backup.options, [key]: '-' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[key]).toContain('./-');
    expect(buildCommand({ ...commandPresets.backup.options, [key]: './-' }).ok).toBe(true);
  }
});

test('wildcard guidance follows the actual operation instead of promising check expansion', () => {
  const copied = buildCommand({ ...commandPresets.backup.options, source: './photos/*' });
  const checked = buildCommand({ ...commandPresets.check.options, source: './photos/*' });
  expect(copied.ok && copied.notes.join(' ')).toContain('bcmr itself expands *');
  expect(checked.ok && checked.command).toContain("'./photos/*'");
  expect(checked.ok && checked.notes.join(' ')).not.toContain('bcmr itself expands *');
  expect(checked.ok && checked.notes.join(' ')).toContain('literal path');
});

test('resume guidance distinguishes saved checkpoints from strict partial-file comparison', () => {
  const saved = buildCommand({ ...commandPresets.resume.options, strict: false });
  const strict = buildCommand(commandPresets.resume.options);
  expect(saved.ok && saved.notes.join(' ')).toContain('saved checkpoints');
  expect(saved.ok && saved.notes.join(' ')).not.toContain('Strict resume');
  expect(strict.ok && strict.notes.join(' ')).toContain('Strict resume hashes');
});
