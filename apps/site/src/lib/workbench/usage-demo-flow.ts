import { buildDailyUsage, DEMO_SESSIONS, filterUsageSessions, MODEL_LABELS, summarizeUsage, type UsageModel } from './usage-demo';
import { formatUsageRange, formatUsageSessionTime } from './usage-format';

export const DEMO_SNAPSHOT = '2026-10-28T17:30:00Z';
export const DEMO_QUOTA_WINDOWS = [
  { label: '5h Window', utilization: 62, resetsAt: '2026-10-28T19:00:00Z' },
  { label: '7-Day', utilization: 41, resetsAt: '2026-11-01T00:00:00Z' },
] as const;

export interface DemoConversation {
  sessionId: string;
  project: string;
  title: string;
  request: string;
  thinking: string;
  tool: { name: string; input: string; output: string };
  reply: string;
}

export function quotaTimeRemaining(resetsAt: string, snapshotAt: string): string {
  const minutes = Math.ceil((Date.parse(resetsAt) - Date.parse(snapshotAt)) / 60_000);
  if (minutes <= 0) return 'Reset due';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainder = minutes % 60;
  return [days ? `${days}d` : '', hours ? `${hours}h` : '', remainder ? `${remainder}m` : ''].filter(Boolean).join(' ');
}

const CONVERSATIONS: Record<string, Omit<DemoConversation, 'sessionId' | 'project'>> = {
  claudit: {
    title: 'Inspect a quota reset',
    request: 'Find where the 5-hour reset time is displayed.',
    thinking: 'I’ll inspect the quota view and the time formatter it uses.',
    tool: {
      name: 'Read',
      input: '{ "file_path": "Claudit/Views/QuotaView.swift" }',
      output: 'if let remaining = quota.fiveHourTimeRemaining {\n    Label(ClauditFormatter.duration(remaining), systemImage: "clock")\n}',
    },
    reply: 'The quota view displays the remaining time beside “5h Window”. Its timeline updates every minute.',
  },
  'snaix-docs': {
    title: 'Review the installation guide',
    request: 'Check which installation instructions the getting-started guide links to.',
    thinking: 'I’ll read the getting-started document and inspect its next-step links.',
    tool: {
      name: 'Read',
      input: '{ "file_path": "docs/getting-started.md" }',
      output: '## Getting started\n\nInstall from Homebrew or GitHub Releases.\n\n## Next steps\n- Installation\n- Configuration\n- Command reference',
    },
    reply: 'The guide links to installation, configuration and the command reference. These are the paths a new user can follow after the first launch.',
  },
  iconchanger: {
    title: 'Locate cached-icon restoration',
    request: 'Show where scheduled icon restoration is configured.',
    thinking: 'I’ll inspect the background service’s restoration settings.',
    tool: {
      name: 'Read',
      input: '{ "file_path": "IconChanger/Services/BackgroundService.swift" }',
      output: '@Published var enableScheduledRestore: Bool {\n    didSet {\n        UserDefaults.standard.set(enableScheduledRestore, forKey: "enableScheduledRestore")\n    }\n}',
    },
    reply: 'Scheduled restoration reapplies cached custom icons. It can be enabled independently of app-update checks.',
  },
  bcmr: {
    title: 'Inspect copy verification',
    request: 'Find the flag for verifying a copied file.',
    thinking: 'I’ll look for the copy command’s verification option.',
    tool: {
      name: 'Grep',
      input: '{ "pattern": "pub verify", "path": "src/cli.rs" }',
      output: '/// Verify copied data with BLAKE3\n#[arg(short = \'V\', long, default_value_t = false)]\npub verify: bool,',
    },
    reply: 'Use --verify (or -V) to verify the copied data with BLAKE3.',
  },
};

export function getDemoConversation(sessionId: string): DemoConversation | undefined {
  const session = DEMO_SESSIONS.find((item) => item.id === sessionId);
  if (!session || !CONVERSATIONS[session.project]) return undefined;
  return { sessionId, project: session.project, ...CONVERSATIONS[session.project] };
}
export function getDemoDashboardPreview() {
  const sessions = filterUsageSessions(DEMO_SESSIONS, { range: '7d', model: 'all', project: 'all' });
  const days = buildDailyUsage(sessions, '7d');
  return {
    period: formatUsageRange(days[0].date, days[days.length - 1].date),
    totals: summarizeUsage(sessions),
    days,
    models: (Object.keys(MODEL_LABELS) as UsageModel[]).map((model) => ({
      name: MODEL_LABELS[model],
      costCents: summarizeUsage(sessions.filter((session) => session.model === model)).costCents,
    })).sort((a, b) => b.costCents - a.costCents),
    projects: [...new Set(sessions.map((session) => session.project))].map((name) => ({
      name,
      costCents: summarizeUsage(sessions.filter((session) => session.project === name)).costCents,
    })).sort((a, b) => b.costCents - a.costCents),
    recentSessions: sessions.slice(0, 6).map((session) => ({
      id: session.id, time: formatUsageSessionTime(session.startedAt), project: session.project,
      model: MODEL_LABELS[session.model], costCents: session.costCents,
    })),
  };
}

