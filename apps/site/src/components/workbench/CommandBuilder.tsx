import ArrowUpRight from '../ArrowUpRight.tsx';
import { useRef, useState } from 'react';
import { buildCommand, commandPresets, type CommandOptions, type PresetId } from '../../lib/workbench/command-builder.ts';

export default function CommandBuilder() {
  const [options, setOptions] = useState<CommandOptions>({ ...commandPresets.backup.options });
  const [preset, setPreset] = useState<PresetId | null>('backup');
  const [copyStatus, setCopyStatus] = useState('');
  const output = useRef<HTMLTextAreaElement>(null);
  const result = buildCommand(options);

  function update<K extends keyof CommandOptions>(key: K, value: CommandOptions[K]) {
    setOptions(previous => ({ ...previous, [key]: value }));
    setPreset(null);
    setCopyStatus('');
  }

  function usePreset(id: PresetId) {
    setOptions({ ...commandPresets[id].options });
    setPreset(id);
    setCopyStatus('');
  }

  async function copy() {
    if (!result.ok) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(result.command);
      setCopyStatus('Command copied.');
    } catch {
      output.current?.focus();
      output.current?.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* Keep the command selected for manual copy. */ }
      setCopyStatus(copied ? 'Command copied.' : 'Command selected. Press ⌘C or Ctrl+C to copy.');
    }
  }

  const toggles: { key: keyof Pick<CommandOptions, 'recursive' | 'preserve' | 'verify' | 'resume' | 'strict' | 'dryRun' | 'noHash'>; label: string; detail: string }[] = options.operation === 'copy' ? [
    { key: 'recursive', label: 'Copy a directory', detail: '--recursive · include its contents' },
    { key: 'preserve', label: 'Keep file attributes', detail: '--preserve · permissions and timestamps' },
    { key: 'verify', label: 'Verify copied content', detail: '--verify · BLAKE3 readback' },
    { key: 'resume', label: 'Resume an interrupted copy', detail: '--resume · reuse available saved state' },
    { key: 'strict', label: 'Check the partial content', detail: '--strict · hash the existing prefix' },
    { key: 'dryRun', label: 'Preview without writing', detail: '--dry-run · inspect the copy layout' },
  ] : [
    { key: 'recursive', label: 'Compare directories', detail: '--recursive · include their contents' },
    { key: 'noHash', label: 'Compare metadata only', detail: '--no-hash · skip content hashing' },
  ];

  return (
    <div className="wb-tool command-builder">
      <section aria-labelledby="command-presets-heading">
        <div className="wb-row command-section-head">
          <h2 id="command-presets-heading">Start with a task</h2>
          <span className="wb-kicker">01 / choose a starting point</span>
        </div>
        <div className="command-presets">
          {(Object.entries(commandPresets) as [PresetId, typeof commandPresets[PresetId]][]).map(([id, item]) => (
            <button type="button" className={`command-preset${preset === id ? ' is-selected' : ''}`} key={id} onClick={() => usePreset(id)} aria-pressed={preset === id}>
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="wb-grid command-grid">
        <section className="wb-panel" aria-labelledby="command-options-heading">
          <div className="wb-row command-section-head">
            <h2 id="command-options-heading">Your paths &amp; options</h2>
            <span className="wb-kicker">02 / make it yours</span>
          </div>
          <div className="wb-field">
            <label htmlFor="bcmr-operation">Operation</label>
            <select id="bcmr-operation" value={options.operation} onChange={event => update('operation', event.target.value as CommandOptions['operation'])}>
              <option value="copy">Copy files</option>
              <option value="check">Compare source and destination</option>
            </select>
          </div>
          {(['source', 'destination'] as const).map(key => {
            const error = result.ok ? undefined : result.errors[key];
            return <div className="wb-field" key={key}>
              <label htmlFor={`bcmr-${key}`}>{key === 'source' ? 'Source path' : 'Destination path'}</label>
              <textarea id={`bcmr-${key}`} rows={2} value={options[key]} onChange={event => update(key, event.target.value)} spellCheck={false} autoCapitalize="none" autoCorrect="off" aria-invalid={Boolean(error)} aria-describedby={`bcmr-${key}-help${error ? ` bcmr-${key}-error` : ''}`} />
              <small id={`bcmr-${key}-help`}>{key === 'source' ? 'One path, without shell quotes. Use ./ before a local filename containing a colon.' : 'Use a trailing / for a parent folder, or user@host:/path/ for SSH.'}</small>
              {error && <p id={`bcmr-${key}-error`} className="wb-error">{error}</p>}
            </div>;
          })}
          <fieldset className="command-toggles">
            <legend>{options.operation === 'copy' ? 'Copy behavior' : 'Comparison behavior'}</legend>
            {toggles.map(toggle => <label className="command-toggle" key={toggle.key}>
              <input type="checkbox" checked={options[toggle.key]} onChange={event => update(toggle.key, event.target.checked)} />
              <span><strong>{toggle.label}</strong><small>{toggle.detail}</small></span>
            </label>)}
          </fieldset>
        </section>

        <section className="wb-panel command-result" aria-labelledby="command-output-heading">
          <div className="wb-row command-section-head">
            <h2 id="command-output-heading">Your command</h2>
            <span className="wb-kicker">03 / review &amp; copy</span>
          </div>
          <p className="wb-note">Bash / Zsh</p>
          <label className="command-output-label" htmlFor="bcmr-generated-command">{preset ? commandPresets[preset].label : 'Custom command'}</label>
          <textarea ref={output} id="bcmr-generated-command" className="wb-output command-output" value={result.ok ? result.command : ''} placeholder="Fix the highlighted path to generate your command." readOnly rows={6} spellCheck={false} aria-describedby="command-shell-note" />
          <div className="wb-actions">
            <button className="wb-button is-primary" type="button" disabled={!result.ok} onClick={copy}>Copy command <span aria-hidden="true"><ArrowUpRight /></span></button>
            <a className="wb-button" href="/bcmr/commands">All bcmr flags</a>
          </div>
          <p className="command-copy-status wb-note" role="status" aria-live="polite">{copyStatus}</p>
          <p className="wb-note" id="command-shell-note">Enter literal paths. <code>~/</code> expands to your home directory.</p>
          {!result.ok && result.errors.operation && <p className="wb-error" role="alert">{result.errors.operation}</p>}
          {result.ok && <div className="command-notes">
            <h3>Options in this command</h3>
            <ul>{result.notes.map(note => <li key={note}>{note}</li>)}</ul>
            {result.notes.length === 0 && <p>Copies the source to the destination using bcmr’s default behavior.</p>}
          </div>}
          <a className="command-guide-link" href="/bcmr/docs/getting-started">New to bcmr? Read the getting started guide <span aria-hidden="true">→</span></a>
        </section>
      </div>
    </div>
  );
}
