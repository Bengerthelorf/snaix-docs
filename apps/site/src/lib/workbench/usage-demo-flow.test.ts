import { expect, test } from 'bun:test';
import { DEMO_SESSIONS } from './usage-demo';
import { DEMO_QUOTA_WINDOWS, DEMO_SNAPSHOT, getDemoConversation, getDemoDashboardPreview, quotaTimeRemaining } from './usage-demo-flow';

test('quota reset labels use the fixed account snapshot rather than the browser clock', () => {
  expect(quotaTimeRemaining(DEMO_QUOTA_WINDOWS[0].resetsAt, DEMO_SNAPSHOT)).toBe('1h 30m');
  expect(quotaTimeRemaining(DEMO_QUOTA_WINDOWS[1].resetsAt, DEMO_SNAPSHOT)).toBe('3d 6h 30m');
  expect(quotaTimeRemaining('2026-10-28T19:00:00+02:00', DEMO_SNAPSHOT)).toBe('Reset due');
  expect(quotaTimeRemaining('2026-10-28T17:31:00Z', DEMO_SNAPSHOT)).toBe('1m');
});

test('every listed session opens a project-matched conversation with inspectable tool output', () => {
  for (const session of DEMO_SESSIONS) {
    const conversation = getDemoConversation(session.id);
    expect(conversation?.sessionId).toBe(session.id);
    expect(conversation?.project).toBe(session.project);
    expect(conversation?.request.length).toBeGreaterThan(0);
    expect(conversation?.tool.input.length).toBeGreaterThan(0);
    expect(conversation?.tool.output.length).toBeGreaterThan(0);
    expect(conversation?.reply.length).toBeGreaterThan(0);
  }
  expect(getDemoConversation('missing-session')).toBeUndefined();
});

test('the latest documentation session opens documentation content rather than another project transcript', () => {
  const conversation = getDemoConversation('sample-018');
  expect(conversation?.project).toBe('snaix-docs');
  expect(conversation?.tool.name).toBe('Read');
  expect(conversation?.tool.input).toContain('getting-started.md');
  expect(conversation?.request).toContain('installation');
});

test('the landing dashboard uses the same seven-day sample totals, groups and recent sessions', () => {
  const preview = getDemoDashboardPreview();
  expect(preview.period).toBe('Oct 22–Oct 28, 2026');
  expect(preview.totals.costCents).toBe(1471);
  expect(preview.totals.tokens).toBe(999300);
  expect(preview.totals.sessions).toBe(11);
  expect(preview.models.reduce((sum, row) => sum + row.costCents, 0)).toBe(1471);
  expect(preview.projects.reduce((sum, row) => sum + row.costCents, 0)).toBe(1471);
  expect(preview.days.reduce((sum, row) => sum + row.tokens, 0)).toBe(999300);
  expect(preview.recentSessions).toHaveLength(6);
  expect(preview.recentSessions[0].id).toBe('sample-018');
  expect(preview.recentSessions[0].costCents).toBe(10);
});
