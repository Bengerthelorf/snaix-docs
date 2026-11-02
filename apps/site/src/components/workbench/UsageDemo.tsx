import { useMemo, useState } from 'react';
import {
  buildDailyUsage, DEMO_SESSIONS, filterUsageSessions, MODEL_LABELS, summarizeUsage,
  type UsageFilters, type UsageModel, type UsageRange,
} from '../../lib/workbench/usage-demo';
import { formatUsageDay, formatUsageRange, formatUsageSessionTime } from '../../lib/workbench/usage-format';
import '../../styles/workbench-demos.css';

const DEFAULT_FILTERS: UsageFilters = { range: '7d', model: 'all', project: 'all' };
const PROJECTS = [...new Set(DEMO_SESSIONS.map((session) => session.project))].sort();
const number = new Intl.NumberFormat('en-US');
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = (cents: number) => usd.format(cents / 100);

export default function UsageDemo() {
  const [filters, setFilters] = useState<UsageFilters>(DEFAULT_FILTERS);
  const [chartMetric, setChartMetric] = useState<'cost' | 'tokens'>('cost');
  const sessions = useMemo(() => filterUsageSessions(DEMO_SESSIONS, filters), [filters]);
  const totals = useMemo(() => summarizeUsage(sessions), [sessions]);
  const days = useMemo(() => buildDailyUsage(sessions, filters.range), [sessions, filters.range]);
  const chartMax = Math.max(1, ...days.map((day) => chartMetric === 'cost' ? day.costCents : day.tokens));
  const rangeLabel = formatUsageRange(days[0].date, days[days.length - 1].date);
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
        <p>18 sample sessions · October 15–28, 2026 · USD</p>
      </div>

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
        <div className="wb-metric"><dt>Example cost</dt><dd data-usage-total="cost">{money(totals.costCents)}</dd></div>
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
                <button type="button" aria-pressed={chartMetric === 'cost'} onClick={() => setChartMetric('cost')}>Example cost</button>
                <button type="button" aria-pressed={chartMetric === 'tokens'} onClick={() => setChartMetric('tokens')}>Tokens</button>
              </div>
            </div>
            <ol className="ud-chart-days" aria-label={`Daily ${chartMetric === 'cost' ? 'example cost in USD' : 'token count'}`}>
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
              <h3>Example cost by model</h3>
              <dl>{(Object.keys(MODEL_LABELS) as UsageModel[]).map((model) => {
                const modelTotal = summarizeUsage(sessions.filter((session) => session.model === model));
                return <div key={model}><dt>{MODEL_LABELS[model]} <span>({modelTotal.sessions})</span></dt><dd>{money(modelTotal.costCents)}</dd></div>;
              })}</dl>
            </div>
          </section>
        </div>

        <section className="wb-panel ud-session-panel" aria-labelledby="usage-sessions-title">
          <div className="ud-panel-heading"><h2 id="usage-sessions-title">Sample sessions</h2><span>{totals.sessions} shown</span></div>
          <p className="wb-note ud-scroll-hint">Scroll for more columns.</p>
          <div className="ud-table-scroll" role="region" aria-label="Sample sessions table" tabIndex={0}>
            <table className="ud-session-table">
              <caption>Example sessions · UTC</caption>
              <thead><tr><th scope="col">Session (UTC)</th><th scope="col">Project</th><th scope="col">Model</th><th scope="col">Total tokens</th><th scope="col">Example cost</th></tr></thead>
              <tbody>{sessions.map((session) => <tr key={session.id}>
                <th scope="row"><time dateTime={session.startedAt}>{formatUsageSessionTime(session.startedAt)}</time><span className="ud-session-id">{session.id}</span></th>
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

      <div className="ud-next-step"><a className="wb-button" href="/claudit/install">Install Claudit</a><a href="/claudit/docs/getting-started">Read the guide</a></div>
    </div>
  );
}
