import { expect, test } from 'bun:test';
import {
  buildDailyUsage, filterUsageSessions, summarizeUsage,
  type UsageSession,
} from './usage-demo';

const sessions: UsageSession[] = [
  { id: 'old', project: 'docs', model: 'opus', startedAt: '2026-10-21T23:59:59Z', inputTokens: 100, outputTokens: 20, cacheReadTokens: 300, cacheWriteTokens: 40, costCents: 72 },
  { id: 'boundary', project: 'docs', model: 'sonnet', startedAt: '2026-10-22T00:00:00Z', inputTokens: 200, outputTokens: 50, cacheReadTokens: 500, cacheWriteTokens: 60, costCents: 31 },
  { id: 'offset', project: 'tools', model: 'haiku', startedAt: '2026-10-21T23:30:00-02:00', inputTokens: 10, outputTokens: 5, cacheReadTokens: 0, cacheWriteTokens: 0, costCents: 2 },
  { id: 'latest', project: 'docs', model: 'sonnet', startedAt: '2026-10-28T23:59:59Z', inputTokens: 400, outputTokens: 80, cacheReadTokens: 600, cacheWriteTokens: 70, costCents: 51 },
  { id: 'future', project: 'docs', model: 'sonnet', startedAt: '2026-10-29T00:00:00Z', inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, costCents: 1 },
];

test('range filtering uses inclusive UTC days and excludes future sessions', () => {
  const filtered = filterUsageSessions(sessions, { range: '7d', model: 'all', project: 'all' });
  expect(filtered.map((session) => session.id)).toEqual(['latest', 'offset', 'boundary']);
  expect(filterUsageSessions(sessions, { range: '1d', model: 'all', project: 'all' }).map((session) => session.id)).toEqual(['latest']);
});

test('model and project filters intersect and can produce an empty result', () => {
  expect(filterUsageSessions(sessions, { range: '14d', model: 'sonnet', project: 'docs' }).map((session) => session.id)).toEqual(['latest', 'boundary']);
  expect(filterUsageSessions(sessions, { range: '7d', model: 'opus', project: 'tools' })).toEqual([]);
});

test('summaries include every token category and add fixed costs exactly', () => {
  expect(summarizeUsage([sessions[1], sessions[2], sessions[3]])).toEqual({
    sessions: 3, tokens: 1975, costCents: 84, activeDays: 2,
    inputTokens: 610, outputTokens: 135, cacheReadTokens: 1100, cacheWriteTokens: 130,
  });
  expect(summarizeUsage([])).toEqual({
    sessions: 0, tokens: 0, costCents: 0, activeDays: 0,
    inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0,
  });
});

test('daily chart fills inactive days and groups offset timestamps by UTC day', () => {
  const filtered = filterUsageSessions(sessions, { range: '7d', model: 'all', project: 'all' });
  const days = buildDailyUsage(filtered, '7d');
  expect(days).toHaveLength(7);
  expect(days[0]).toEqual({ date: '2026-10-22', sessions: 2, tokens: 825, costCents: 33 });
  expect(days[1]).toEqual({ date: '2026-10-23', sessions: 0, tokens: 0, costCents: 0 });
  expect(days[6]).toEqual({ date: '2026-10-28', sessions: 1, tokens: 1150, costCents: 51 });
});
