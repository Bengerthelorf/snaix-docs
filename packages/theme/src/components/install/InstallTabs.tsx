import { Fragment, useState } from 'react';
import { Typewriter } from '../../motion/Typewriter.tsx';
import { CommandStream } from '../../motion/CommandStream.tsx';
import type { CmdLine } from '../../motion/CommandStream.tsx';

interface OsEntry {
  name: string;
  cmd: string;
  note: string;
}

export interface InstallStep {
  title: string;
  description: string;
  panelLabel?: string;
  script: CmdLine[];
  /** Optional rich link rendered below the terminal. */
  footer?: { href: string; label: string };
}

interface Props {
  options: Record<string, OsEntry>;
  steps?: InstallStep[];
}

export function InstallTabs({ options, steps = [] }: Props) {
  const keys = Object.keys(options);
  const [os, setOs] = useState(keys[0] ?? 'macos');
  const activeOs = options[os] ? os : keys[0] ?? '';
  const current = options[activeOs];

  if (!current) return null;

  return (
    <>
      <section className="install-options" aria-label="Installation methods">
        {Object.entries(options).map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={`install-opt ${activeOs === k ? 'is-active' : ''}`}
            aria-pressed={activeOs === k}
            onClick={() => setOs(k)}
            style={{ textAlign: 'left' }}
          >
            <span className="install-opt-os" style={{ display: 'block' }}>{k}</span>
            <span className="install-opt-name" style={{ display: 'block' }}>{v.name}</span>
            <span className="install-opt-cmd" style={{ display: 'block' }}>{v.cmd}</span>
          </button>
        ))}
      </section>

      <section className="install-step-shell">
        <div className="install-steps">
          <div className="install-step-n">01</div>
          <div className="install-step-body">
            <h3 className="lower">copy &amp; paste</h3>
            <p>run this in your terminal. you may be prompted for your password to install into <code>/usr/local/bin</code>.</p>
            <div className="terminal-shell" style={{ maxWidth: 720 }}>
              <div className="terminal-chrome">
                <div className="terminal-lights"><span /><span /><span /></div>
                <div className="t-mono-sm">{current.name.toLowerCase()}</div>
              </div>
              <div className="terminal-body" style={{ minHeight: 0, padding: '18px 22px' }}>
                <div className="cmd-line cmd-prompt">
                  <span className="cmd-sigil">$</span>
                  <Typewriter key={activeOs} text={current.cmd} speed={18} cursor={false} />
                </div>
              </div>
            </div>
            <p className="t-mono-sm" style={{ color: 'var(--steel-5)', marginTop: 10 }}>{current.note}</p>
          </div>

          {steps.map((step, i) => (
            <Fragment key={`${i}:${step.title}`}>
              <div className="install-step-n">{String(i + 2).padStart(2, '0')}</div>
              <div className="install-step-body">
                <h3 className="lower">{step.title}</h3>
                <p>{step.description}</p>
                <div className="terminal-shell" style={{ maxWidth: 720 }}>
                  <div className="terminal-chrome">
                    <div className="terminal-lights"><span /><span /><span /></div>
                    <div className="t-mono-sm">{step.panelLabel ?? step.title}</div>
                  </div>
                  <div className="terminal-body" style={{ minHeight: 0, padding: '18px 22px' }}>
                    <CommandStream lines={step.script} />
                  </div>
                </div>
                {step.footer && (
                  <p style={{ marginTop: 14 }}>
                    <a href={step.footer.href} className="link-u">{step.footer.label}</a>
                  </p>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      </section>
    </>
  );
}
