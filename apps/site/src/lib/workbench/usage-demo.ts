export type UsageModel = 'sonnet' | 'opus' | 'haiku';
export type UsageRange = '1d' | '7d' | '14d';
export interface UsageSession {
  id: string;
  project: string;
  model: UsageModel;
  startedAt: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costCents: number;
}
export interface UsageFilters {
  range: UsageRange;
  model: UsageModel | 'all';
  project: string;
}

export const DEMO_END_DATE = '2026-10-28';
export const MODEL_LABELS: Record<UsageModel, string> = {
  sonnet: 'Claude Sonnet', opus: 'Claude Opus', haiku: 'Claude Haiku',
};
const DAY_MS = 86_400_000;
const RANGE_DAYS: Record<UsageRange, number> = { '1d': 1, '7d': 7, '14d': 14 };

function rangeBounds(range: UsageRange) {
  const end = Date.parse(`${DEMO_END_DATE}T00:00:00Z`) + DAY_MS;
  return { start: end - RANGE_DAYS[range] * DAY_MS, end };
}

export function filterUsageSessions(sessions: readonly UsageSession[], filters: UsageFilters): UsageSession[] {
  const { start, end } = rangeBounds(filters.range);
  return sessions.filter((session) => {
    const timestamp = Date.parse(session.startedAt);
    return timestamp >= start && timestamp < end
      && (filters.model === 'all' || session.model === filters.model)
      && (filters.project === 'all' || session.project === filters.project);
  }).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
}

export function summarizeUsage(sessions: readonly UsageSession[]) {
  const totals = { sessions: sessions.length, tokens: 0, costCents: 0, activeDays: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
  const days = new Set<string>();
  for (const session of sessions) {
    totals.inputTokens += session.inputTokens;
    totals.outputTokens += session.outputTokens;
    totals.cacheReadTokens += session.cacheReadTokens;
    totals.cacheWriteTokens += session.cacheWriteTokens;
    totals.costCents += session.costCents;
    days.add(new Date(session.startedAt).toISOString().slice(0, 10));
  }
  totals.tokens = totals.inputTokens + totals.outputTokens + totals.cacheReadTokens + totals.cacheWriteTokens;
  totals.activeDays = days.size;
  return totals;
}

export function buildDailyUsage(sessions: readonly UsageSession[], range: UsageRange) {
  const { start, end } = rangeBounds(range);
  const days = new Map<string, { date: string; sessions: number; tokens: number; costCents: number }>();
  for (let timestamp = start; timestamp < end; timestamp += DAY_MS) {
    const date = new Date(timestamp).toISOString().slice(0, 10);
    days.set(date, { date, sessions: 0, tokens: 0, costCents: 0 });
  }
  for (const session of sessions) {
    const day = days.get(new Date(session.startedAt).toISOString().slice(0, 10));
    if (!day) continue;
    day.sessions += 1;
    day.tokens += session.inputTokens + session.outputTokens + session.cacheReadTokens + session.cacheWriteTokens;
    day.costCents += session.costCents;
  }
  return [...days.values()];
}

// Fictional sessions and fixed example cost values. These are not API price calculations.
export const DEMO_SESSIONS: readonly UsageSession[] = [
  { id: 'sample-001', project: 'claudit', model: 'sonnet', startedAt: '2026-10-15T09:15:00Z', inputTokens: 18000, outputTokens: 6200, cacheReadTokens: 65000, cacheWriteTokens: 4500, costCents: 89 },
  { id: 'sample-002', project: 'iconchanger', model: 'haiku', startedAt: '2026-10-16T14:30:00Z', inputTokens: 8000, outputTokens: 2100, cacheReadTokens: 12000, cacheWriteTokens: 1800, costCents: 12 },
  { id: 'sample-003', project: 'bcmr', model: 'opus', startedAt: '2026-10-17T10:10:00Z', inputTokens: 27000, outputTokens: 11000, cacheReadTokens: 92000, cacheWriteTokens: 9000, costCents: 328 },
  { id: 'sample-004', project: 'snaix-docs', model: 'sonnet', startedAt: '2026-10-18T08:40:00Z', inputTokens: 19000, outputTokens: 7400, cacheReadTokens: 54000, cacheWriteTokens: 5300, costCents: 112 },
  { id: 'sample-005', project: 'claudit', model: 'sonnet', startedAt: '2026-10-20T13:20:00Z', inputTokens: 24000, outputTokens: 8100, cacheReadTokens: 86000, cacheWriteTokens: 6800, costCents: 138 },
  { id: 'sample-006', project: 'bcmr', model: 'opus', startedAt: '2026-10-21T11:00:00Z', inputTokens: 31000, outputTokens: 12400, cacheReadTokens: 105000, cacheWriteTokens: 12000, costCents: 396 },
  { id: 'sample-007', project: 'iconchanger', model: 'haiku', startedAt: '2026-10-21T16:10:00Z', inputTokens: 5600, outputTokens: 1800, cacheReadTokens: 14000, cacheWriteTokens: 1200, costCents: 9 },
  { id: 'sample-008', project: 'snaix-docs', model: 'sonnet', startedAt: '2026-10-22T09:25:00Z', inputTokens: 22000, outputTokens: 7300, cacheReadTokens: 72000, cacheWriteTokens: 5600, costCents: 124 },
  { id: 'sample-009', project: 'bcmr', model: 'opus', startedAt: '2026-10-23T10:45:00Z', inputTokens: 35000, outputTokens: 14000, cacheReadTokens: 118000, cacheWriteTokens: 13000, costCents: 445 },
  { id: 'sample-010', project: 'snaix-docs', model: 'sonnet', startedAt: '2026-10-23T15:20:00Z', inputTokens: 12500, outputTokens: 4900, cacheReadTokens: 48000, cacheWriteTokens: 3200, costCents: 76 },
  { id: 'sample-011', project: 'iconchanger', model: 'haiku', startedAt: '2026-10-24T12:00:00Z', inputTokens: 9500, outputTokens: 3000, cacheReadTokens: 21000, cacheWriteTokens: 2400, costCents: 17 },
  { id: 'sample-012', project: 'claudit', model: 'sonnet', startedAt: '2026-10-26T08:35:00Z', inputTokens: 29000, outputTokens: 9800, cacheReadTokens: 104000, cacheWriteTokens: 7800, costCents: 169 },
  { id: 'sample-013', project: 'bcmr', model: 'opus', startedAt: '2026-10-26T14:10:00Z', inputTokens: 26000, outputTokens: 10200, cacheReadTokens: 94000, cacheWriteTokens: 9500, costCents: 319 },
  { id: 'sample-014', project: 'snaix-docs', model: 'haiku', startedAt: '2026-10-27T09:40:00Z', inputTokens: 7200, outputTokens: 2400, cacheReadTokens: 18000, cacheWriteTokens: 1700, costCents: 13 },
  { id: 'sample-015', project: 'iconchanger', model: 'sonnet', startedAt: '2026-10-27T16:25:00Z', inputTokens: 17000, outputTokens: 5800, cacheReadTokens: 60000, cacheWriteTokens: 4300, costCents: 98 },
  { id: 'sample-016', project: 'claudit', model: 'sonnet', startedAt: '2026-10-28T08:10:00Z', inputTokens: 21000, outputTokens: 6900, cacheReadTokens: 78000, cacheWriteTokens: 5700, costCents: 121 },
  { id: 'sample-017', project: 'claudit', model: 'sonnet', startedAt: '2026-10-28T14:50:00Z', inputTokens: 14000, outputTokens: 4600, cacheReadTokens: 45000, cacheWriteTokens: 3600, costCents: 79 },
  { id: 'sample-018', project: 'snaix-docs', model: 'haiku', startedAt: '2026-10-28T17:15:00Z', inputTokens: 6100, outputTokens: 1900, cacheReadTokens: 13000, cacheWriteTokens: 1400, costCents: 10 },
];
