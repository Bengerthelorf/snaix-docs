import { useEffect, useMemo, useRef, useState } from 'react';
import { CommandStream } from '../../motion/CommandStream.tsx';
import type { CmdLine } from '../../motion/CommandStream.tsx';

export interface CliFlag {
  f: string;
  t: string;
  d: string;
  x: string;
}

export interface CliCommand {
  cmd: string;
  sig: string;
  desc: string;
  tags: string[];
  /** Falls back to `spec.flagsByGroup[group]` when absent. */
  flags?: CliFlag[];
  example?: string[];
  related?: string[];
}

export interface CliGroup {
  group: string;
  items: CliCommand[];
}

export interface CliSpec {
  groups: CliGroup[];
  flagsByGroup?: Record<string, CliFlag[]>;
  examples?: Record<string, string[]>;
  shellLabel?: string;
}

interface Props {
  spec: CliSpec;
}

const STORAGE_KEY = 'snaix-cli-cmd';

export function CliReference({ spec }: Props) {
  const flat = useMemo(() => spec.groups.flatMap((g) => g.items), [spec]);
  const initial = flat[0]!;

  const [selected, setSelected] = useState<CliCommand>(initial);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const found = flat.find((c) => c.cmd === saved);
      if (found) setSelected(found);
    } catch {}
  }, [flat]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, selected.cmd);
    } catch {}
  }, [selected]);

  const filtered = useMemo(
    () =>
      spec.groups
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (it) =>
              !query ||
              it.cmd.toLowerCase().includes(query.toLowerCase()) ||
              it.desc.toLowerCase().includes(query.toLowerCase()),
          ),
        }))
        .filter((g) => g.items.length > 0),
    [spec, query],
  );

  const visibleFlat = useMemo(() => filtered.flatMap((g) => g.items), [filtered]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (isInput) return;
      if (visibleFlat.length === 0) return;
      const idx = visibleFlat.findIndex((c) => c.cmd === selected.cmd);
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(visibleFlat[Math.min(visibleFlat.length - 1, idx + 1)] ?? visibleFlat[0]!);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(visibleFlat[Math.max(0, idx - 1)] ?? visibleFlat[0]!);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visibleFlat, selected]);

  const activeGroup =
    spec.groups.find((g) => g.items.some((i) => i.cmd === selected.cmd))?.group ?? '';
  const flags: CliFlag[] =
    selected.flags ?? spec.flagsByGroup?.[activeGroup] ?? [];
  const example: string[] =
    selected.example ?? spec.examples?.[selected.cmd] ?? ['ok'];
  const related: string[] = selected.related ?? [];

  const lines: CmdLine[] = [
    { type: 'prompt', text: `${selected.cmd} ${selected.sig}`.trim() },
    ...example.map((text, i) => ({
      type: (i === example.length - 1 ? 'ok' : 'out') as CmdLine['type'],
      text,
      pause: 140 + i * 20,
    })),
  ];

  const selectByCmd = (cmd: string) => {
    const found = flat.find((c) => c.cmd === cmd);
    if (found) setSelected(found);
  };

  return (
    <section className="cli-body">
      <aside className="cli-sidebar">
        <div className="cli-search">
          <span className="t-mono-sm">?</span>
          <input
            ref={searchRef}
            placeholder="grep commands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {filtered.map((g) => (
          <div key={g.group} className="cli-group">
            <div className="cli-group-label t-small">{g.group}</div>
            {g.items.map((it) => (
              <button
                key={it.cmd}
                className={`cli-item ${selected.cmd === it.cmd ? 'is-selected' : ''}`}
                onClick={() => setSelected(it)}
              >
                <span className="cli-item-cmd t-mono">{it.cmd}</span>
                <span className="cli-item-desc">{it.desc}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      <main className="cli-main">
        <div key={selected.cmd} className="cmd-detail fade-up">
          <div className="cmd-detail-head">
            <div>
              <div className="t-small" style={{ color: 'var(--steel-5)' }}>command</div>
              <h2 className="cmd-detail-name t-h1 lower">{selected.cmd}</h2>
              <div className="cmd-detail-sig t-mono">
                <span className="cmd-sigil">$</span> {selected.cmd}{' '}
                <span className="sig-args">{selected.sig || '[no args]'}</span>
              </div>
            </div>
            <div className="cmd-detail-tags">
              {selected.tags.map((t) => (
                <span key={t} className={`cmd-tag is-${t}`}>{t}</span>
              ))}
            </div>
          </div>

          <p className="cmd-detail-desc">{selected.desc}.</p>

          <div className="cmd-detail-grid">
            <div>
              <div className="t-small" style={{ marginBottom: 12 }}>usage</div>
              <div className="terminal-shell">
                <div className="terminal-chrome">
                  <div className="terminal-lights"><span /><span /><span /></div>
                  <div className="t-mono-sm">{spec.shellLabel ?? 'zsh'}</div>
                </div>
                <div className="terminal-body" style={{ minHeight: 0, padding: '18px 22px' }}>
                  <CommandStream lines={lines} />
                </div>
              </div>
            </div>

            <div>
              <div className="t-small" style={{ marginBottom: 12 }}>flags</div>
              <table className="flags-table">
                <thead>
                  <tr>
                    <th>flag</th>
                    <th>type</th>
                    <th>default</th>
                    <th>description</th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map((fl) => (
                    <tr key={fl.f}>
                      <td><code>{fl.f}</code></td>
                      <td>{fl.t}</td>
                      <td>{fl.d}</td>
                      <td>{fl.x}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {related.length > 0 && (
            <div className="cmd-related">
              <div className="t-small">related</div>
              <div className="cmd-related-list">
                {related.map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    className="link-u"
                    onClick={() => selectByCmd(cmd)}
                    style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </section>
  );
}
