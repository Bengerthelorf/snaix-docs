import { expect, test } from 'bun:test';
import { formatUsageDay, formatUsageRange, formatUsageSessionTime } from './usage-format';

test('session labels use a fixed comma and 24-hour UTC time across engines', () => {
  expect(formatUsageSessionTime('2026-10-28T17:15:00Z')).toBe('Oct 28, 17:15');
  expect(formatUsageSessionTime('2026-10-28T00:04:00Z')).toBe('Oct 28, 00:04');
  expect(formatUsageSessionTime('2026-10-28T23:59:59Z')).toBe('Oct 28, 23:59');
});

test('day and session labels resolve offsets at UTC day and year boundaries', () => {
  expect(formatUsageDay('2026-10-28')).toBe('Oct 28');
  expect(formatUsageSessionTime('2026-10-28T00:15:00+02:00')).toBe('Oct 27, 22:15');
  expect(formatUsageSessionTime('2026-12-31T23:30:00-02:00')).toBe('Jan 1, 01:30');
  expect(formatUsageDay('2028-02-29T23:59:59Z')).toBe('Feb 29');
});

test('sample range labels derive years and handle single days and year changes', () => {
  expect(formatUsageRange('2026-10-22', '2026-10-28')).toBe('Oct 22–Oct 28, 2026');
  expect(formatUsageRange('2026-10-28', '2026-10-28')).toBe('Oct 28, 2026');
  expect(formatUsageRange('2026-12-31', '2027-01-01')).toBe('Dec 31, 2026–Jan 1, 2027');
});
