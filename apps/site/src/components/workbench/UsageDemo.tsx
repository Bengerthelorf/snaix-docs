import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildDailyUsage, DEMO_SESSIONS, filterUsageSessions, MODEL_LABELS, summarizeUsage,
  type UsageFilters, type UsageModel, type UsageRange,
} from '../../lib/workbench/usage-demo';
import { formatUsageDay, formatUsageRange, formatUsageSessionTime } from '../../lib/workbench/usage-format';
import { DEMO_QUOTA_WINDOWS, DEMO_SNAPSHOT, getDemoConversation, quotaTimeRemaining } from '../../lib/workbench/usage-demo-flow';
import '../../styles/workbench-demos.css';
import '../../styles/usage-demo.css';

const DEFAULT_FILTERS: UsageFilters = { range: '7d', model: 'all', project: 'all' };
const PROJECTS = [...new Set(DEMO_SESSIONS.map((session) => session.project))].sort();
const number = new Intl.NumberFormat('en-US');
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = (cents: number) => usd.format(cents / 100);

export default function UsageDemo() {
  const [filters, setFilters] = useState<UsageFilters>(DEFAULT_FILTERS);
  const [chartMetric, setChartMetric] = useState<'cost' | 'tokens'>('cost');
  const [screen, setScreen] = useState<'menubar' | 'dashboard'>('menubar');
  const [popoverOpen, setPopoverOpen] = useState(true);
  const [popoverView, setPopoverView] = useState<'usage' | 'quota'>('usage');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const sessionsHeading = useRef<HTMLHeadingElement>(null);
  const shouldFocusHeading = useRef(false);
  const returnToSessions = useRef(false);
  const sessions = useMemo(() => filterUsageSessions(DEMO_SESSIONS, filters), [filters]);
  const totals = useMemo(() => summarizeUsage(sessions), [sessions]);
  const days = useMemo(() => buildDailyUsage(sessions, filters.range), [sessions, filters.range]);
  const chartMax = Math.max(1, ...days.map((day) => chartMetric === 'cost' ? day.costCents : day.tokens));
  const rangeLabel = formatUsageRange(days[0].date, days[days.length - 1].date);
  const today = summarizeUsage(filterUsageSessions(DEMO_SESSIONS, { range: '1d', model: 'all', project: 'all' }));
  const allTime = summarizeUsage(DEMO_SESSIONS);
  const selectedSession = selectedSessionId ? DEMO_SESSIONS.find((session) => session.id === selectedSessionId) : undefined;
  const conversation = selectedSessionId ? getDemoConversation(selectedSessionId) : undefined;

  useEffect(() => {
    if (!shouldFocusHeading.current) return;
    shouldFocusHeading.current = false;
    (returnToSessions.current ? sessionsHeading.current : heading.current)?.focus();
    returnToSessions.current = false;
  }, [screen, selectedSessionId]);

  function openDashboard() {
    shouldFocusHeading.current = true;
    setSelectedSessionId(null);
    setScreen('dashboard');
  }

  function openConversation(sessionId: string) {
    shouldFocusHeading.current = true;
    setSelectedSessionId(sessionId);
  }
  const tokenTypes = [
    { label: 'Input', value: totals.inputTokens, className: 'ud-token-input' },
    { label: 'Output', value: totals.outputTokens, className: 'ud-token-output' },
    { label: 'Cache read', value: totals.cacheReadTokens, className: 'ud-token-read' },
    { label: 'Cache write', value: totals.cacheWriteTokens, className: 'ud-token-write' },
  ];

  return (
    <div className="wb-tool ud-tool" data-tool="usage-demo">
      <div className="ud-example-banner">
        <span className="ud-example-tag">Example data</span>
        <p>October 15–28, 2026 · Snapshot {formatUsageSessionTime(DEMO_SNAPSHOT)} UTC · USD</p>
      </div>

      {screen === 'menubar' ? <section className="ud-native-demo" aria-label="Claudit menu bar experience">
        <div className="ud-screen-heading"><h2 ref={heading} tabIndex={-1}>Menu bar</h2></div>
        <div className="ud-desktop-preview">
          <div className="ud-system-bar">
            <span className="ud-system-app">Terminal</span>
            <button type="button" className="ud-status-item" aria-expanded={popoverOpen} aria-controls={popoverOpen ? 'usage-popover' : undefined} onClick={() => setPopoverOpen(!popoverOpen)}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 13V8M8 13V3M14 13V6" stroke="currentColor" strokeWidth="3" /></svg>
              <span>Claudit</span><b>{money(today.costCents)}</b>
            </button>
            <span className="ud-system-time">17:30</span>
          </div>
          {popoverOpen ? <div className="ud-popover" id="usage-popover">
            <div className="ud-popover-tabs" role="group" aria-label="Menu bar view">
              <button type="button" aria-pressed={popoverView === 'usage'} onClick={() => setPopoverView('usage')}>Usage</button>
              <button type="button" aria-pressed={popoverView === 'quota'} onClick={() => setPopoverView('quota')}>Quota</button>
            </div>
            {popoverView === 'usage' ? <div className="ud-popover-body" data-popover-view="usage">
              <h3>Today’s estimated cost</h3>
              <p className="ud-today-cost">{money(today.costCents)}</p>
              <dl className="ud-popover-tokens">
                <div><dt>Input</dt><dd>{number.format(today.inputTokens)}</dd></div>
                <div><dt>Output</dt><dd>{number.format(today.outputTokens)}</dd></div>
                <div><dt>Cache read</dt><dd>{number.format(today.cacheReadTokens)}</dd></div>
                <div><dt>Cache write</dt><dd>{number.format(today.cacheWriteTokens)}</dd></div>
              </dl>
              <dl className="ud-period-totals"><div><dt>This month</dt><dd>{money(allTime.costCents)}</dd></div><div><dt>All time</dt><dd>{money(allTime.costCents)}</dd></div></dl>
            </div> : <div className="ud-popover-body" data-popover-view="quota">
              <h3>Account quota</h3>
              <div className="ud-quota-windows">{DEMO_QUOTA_WINDOWS.map((window) => <section key={window.label} className="ud-quota-window" aria-label={window.label}>
                <div className="ud-quota-label"><h4>{window.label}</h4><span>Resets in {quotaTimeRemaining(window.resetsAt, DEMO_SNAPSHOT)}</span></div>
                <p>{window.utilization}<span>% used</span></p>
                <div className="ud-quota-track" role="meter" aria-label={`${window.label} utilization`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={window.utilization}><span style={{ width: `${window.utilization}%` }} /></div>
              </section>)}</div>
            </div>}
            <div className="ud-popover-footer"><button type="button" onClick={openDashboard}>Open Dashboard <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M6 18 18 6M6 6h12v12" /></svg></button></div>
          </div> : <button type="button" className="ud-open-popover" onClick={() => setPopoverOpen(true)}>Open Claudit in the menu bar</button>}
        </div>
      </section> : <>
        <div className="ud-screen-heading">
          <div><span className="ud-screen-context">Claudit / {conversation ? 'Sessions' : 'Dashboard'}</span><h2 ref={heading} tabIndex={-1}>{conversation?.title ?? 'Dashboard'}</h2></div>
          <button type="button" className="wb-button" onClick={() => {
            shouldFocusHeading.current = true;
            if (selectedSessionId) { returnToSessions.current = true; setSelectedSessionId(null); }
            else setScreen('menubar');
          }}>{conversation ? 'Back to sessions' : 'Back to menu bar'}</button>
        </div>

        {conversation && selectedSession ? <section className="wb-panel ud-conversation" aria-label="Session conversation">
          <div className="ud-conversation-meta"><span>{selectedSession.project}</span><span>{MODEL_LABELS[selectedSession.model]}</span><time dateTime={selectedSession.startedAt}>{formatUsageSessionTime(selectedSession.startedAt)} UTC</time><span>{number.format(selectedSession.inputTokens + selectedSession.outputTokens + selectedSession.cacheReadTokens + selectedSession.cacheWriteTokens)} tokens</span><span>{money(selectedSession.costCents)} estimated cost</span></div>
          <h3 className="ud-transcript-title">Conversation excerpt</h3>
          <div className="ud-message ud-message-user"><h4>You</h4><p>{conversation.request}</p></div>
          <div className="ud-message ud-message-assistant"><h4>Claude</h4>
            <details className="ud-thinking"><summary>Thinking</summary><p>{conversation.thinking}</p></details>
            <details className="ud-tool-call"><summary><b>{conversation.tool.name}</b><span>Tool call</span></summary><div><h5>Input</h5><pre>{conversation.tool.input}</pre><h5>Result</h5><pre>{conversation.tool.output}</pre></div></details>
            <p>{conversation.reply}</p>
          </div>
        </section> : <>
      <section className="wb-panel ud-filters" aria-label="Example usage filters">
        <div className="wb-field">
          <label htmlFor="usage-range">Sample date range</label>
          <select id="usage-range" value={filters.range} onChange={(event) => setFilters({ ...filters, range: event.target.value as UsageRange })}>
            <option value="1d">October 28</option>
            <option value="7d">October 22–28</option>
            <option value="14d">October 15–28</option>
          </select>
        </div>
        <div className="wb-field">
          <label htmlFor="usage-model">Model</label>
          <select id="usage-model" value={filters.model} onChange={(event) => setFilters({ ...filters, model: event.target.value as UsageModel | 'all' })}>
            <option value="all">All models</option>
            {Object.entries(MODEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="wb-field">
          <label htmlFor="usage-project">Project</label>
          <select id="usage-project" value={filters.project} onChange={(event) => setFilters({ ...filters, project: event.target.value })}>
            <option value="all">All projects</option>
            {PROJECTS.map((project) => <option key={project} value={project}>{project}</option>)}
          </select>
        </div>
        <button className="wb-button" type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
      </section>

      <div className="ud-result-heading"><h2>{rangeLabel}</h2><p role="status" aria-live="polite">{totals.sessions} example {totals.sessions === 1 ? 'session matches' : 'sessions match'}. All times UTC.</p></div>
      <dl className="ud-metrics">
        <div className="wb-metric"><dt>Estimated cost</dt><dd data-usage-total="cost">{money(totals.costCents)}</dd></div>
        <div className="wb-metric"><dt>Total tokens</dt><dd data-usage-total="tokens">{number.format(totals.tokens)}</dd></div>
        <div className="wb-metric"><dt>Sessions</dt><dd data-usage-total="sessions">{number.format(totals.sessions)}</dd></div>
        <div className="wb-metric"><dt>Active days</dt><dd data-usage-total="days">{totals.activeDays}<span> / {days.length}</span></dd></div>
      </dl>

      {sessions.length === 0 ? <section className="wb-panel ud-empty" aria-label="No matching sessions">
        <div className="ud-empty-mark" aria-hidden="true"><span /><span /><span /></div>
        <h2>No sessions in this selection</h2>

        <button className="wb-button is-primary" type="button" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</button>
      </section> : <>
        <div className="ud-analysis-grid">
          <section className="wb-panel ud-chart" aria-labelledby="usage-chart-title">
            <div className="ud-panel-heading">
              <h2 id="usage-chart-title">Daily activity</h2>
              <div className="ud-chart-toggle" role="group" aria-label="Daily chart measure">
                <button type="button" aria-pressed={chartMetric === 'cost'} onClick={() => setChartMetric('cost')}>Estimated cost</button>
                <button type="button" aria-pressed={chartMetric === 'tokens'} onClick={() => setChartMetric('tokens')}>Tokens</button>
              </div>
            </div>
            <ol className="ud-chart-days" aria-label={`Daily ${chartMetric === 'cost' ? 'estimated cost in USD' : 'token count'}`}>
              {days.map((day) => {
                const value = chartMetric === 'cost' ? day.costCents : day.tokens;
                return <li key={day.date}>
                  <time dateTime={day.date}>{formatUsageDay(day.date)}</time>
                  <span className="ud-bar-track" aria-hidden="true"><span className={`ud-bar ud-bar-${chartMetric}`} style={{ width: `${value / chartMax * 100}%` }} /></span>
                  <span className="ud-chart-value">{chartMetric === 'cost' ? money(value) : number.format(value)}</span>
                  <span className="ud-sr-only">{day.sessions} {day.sessions === 1 ? 'session' : 'sessions'}</span>
                </li>;
              })}
            </ol>
          </section>

          <section className="wb-panel ud-token-panel" aria-labelledby="usage-tokens-title">
            <h2 id="usage-tokens-title">Token breakdown</h2>
            <div className="ud-token-strip" aria-hidden="true">{tokenTypes.map((type) => <span key={type.label} className={type.className} style={{ width: `${type.value / totals.tokens * 100}%` }} />)}</div>
            <dl className="ud-token-list">{tokenTypes.map((type) => <div key={type.label}><dt><span className={`ud-token-key ${type.className}`} aria-hidden="true" />{type.label}</dt><dd>{number.format(type.value)}</dd></div>)}</dl>
            <div className="ud-model-summary">
              <h3>Estimated cost by model</h3>
              <dl>{(Object.keys(MODEL_LABELS) as UsageModel[]).map((model) => {
                const modelTotal = summarizeUsage(sessions.filter((session) => session.model === model));
                return <div key={model}><dt>{MODEL_LABELS[model]} <span>({modelTotal.sessions})</span></dt><dd>{money(modelTotal.costCents)}</dd></div>;
              })}</dl>
            </div>
          </section>
        </div>

        <section className="wb-panel ud-session-panel" aria-labelledby="usage-sessions-title">
          <div className="ud-panel-heading"><h2 id="usage-sessions-title" ref={sessionsHeading} tabIndex={-1}>Sessions</h2><span>{totals.sessions} shown</span></div>
          <p className="wb-note ud-scroll-hint">Scroll for more columns.</p>
          <div className="ud-table-scroll" role="region" aria-label="Sessions table" tabIndex={0}>
            <table className="ud-session-table">
              <caption>Select a session to read its conversation.</caption>
              <thead><tr><th scope="col">Session (UTC)</th><th scope="col">Project</th><th scope="col">Model</th><th scope="col">Total tokens</th><th scope="col">Estimated cost</th></tr></thead>
              <tbody>{sessions.map((session) => <tr key={session.id}>
                <th scope="row"><button type="button" className="ud-session-open" onClick={() => openConversation(session.id)} aria-label={`Read ${getDemoConversation(session.id)?.title}, ${session.project}, ${formatUsageSessionTime(session.startedAt)} UTC`}><span>{getDemoConversation(session.id)?.title}</span><time dateTime={session.startedAt}>{formatUsageSessionTime(session.startedAt)}</time></button></th>
                <td><code>{session.project}</code></td>
                <td><span className="ud-model" data-model={session.model}>{MODEL_LABELS[session.model]}</span></td>
                <td className="ud-numeric">{number.format(session.inputTokens + session.outputTokens + session.cacheReadTokens + session.cacheWriteTokens)}</td>
                <td className="ud-numeric">{money(session.costCents)}</td>
              </tr>)}</tbody>
              <tfoot><tr><th scope="row" colSpan={3}>Selection total</th><td className="ud-numeric">{number.format(totals.tokens)}</td><td className="ud-numeric">{money(totals.costCents)}</td></tr></tfoot>
            </table>
          </div>
        </section>
      </>}

        </>}
      </>}

      <div className="ud-next-step"><a className="wb-button" href="/claudit/install">Install Claudit</a><a href="/claudit/docs/getting-started">Read the guide</a></div>
    </div>
  );
}
