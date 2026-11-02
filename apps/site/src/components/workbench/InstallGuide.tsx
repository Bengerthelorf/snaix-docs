import ArrowUpRight from '../ArrowUpRight.tsx';
import { useEffect, useRef, useState } from 'react';
import { getArchitectures, getChannels, getInstallPlan, getPlatforms, installationProducts, productFromQuery, type Architecture, type InstallChannel, type InstallSelection, type Platform, type ProductId } from '../../lib/workbench/install-guide.ts';

const platformLabels: Record<Platform, string> = { macos: 'macOS', linux: 'Linux', windows: 'Windows', freebsd: 'FreeBSD' };
const architectureLabels: Record<Architecture, string> = { arm64: 'ARM64 / Apple Silicon', x86_64: 'x86_64 / Intel & AMD' };
const channelLabels: Record<InstallChannel, string> = { homebrew: 'Homebrew', installer: 'Release installer', cargo: 'Cargo / build from source', download: 'Manual download' };

function CopyCommand({ command, label = 'Copy' }: { command: string; label?: string }) {
  const [status, setStatus] = useState('');
  const commandField = useRef<HTMLTextAreaElement>(null);
  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(command);
      setStatus('Copied.');
    } catch {
      commandField.current?.focus();
      commandField.current?.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* Keep selected for keyboard copy. */ }
      setStatus(copied ? 'Copied.' : 'Selected. Press ⌘C or Ctrl+C.');
    }
  }
  return <div className="setup-command">
    <textarea ref={commandField} className="wb-output" aria-label="Terminal command" value={command} readOnly rows={2} spellCheck={false} />
    <div className="wb-row"><button type="button" className="wb-button" onClick={copy}>{label}</button><span className="wb-note" role="status" aria-live="polite">{status}</span></div>
  </div>;
}

export default function InstallGuide() {
  const [selection, setSelection] = useState<InstallSelection>({ product: 'bcmr', platform: 'macos', architecture: 'arm64', channel: 'homebrew' });
  const product = installationProducts.find(item => item.id === selection.product)!;
  const plan = getInstallPlan(selection);

  useEffect(() => {
    const id = productFromQuery(window.location.search);
    setSelection(previous => ({ ...previous, product: id, channel: getChannels(id, previous.platform)[0] }));
  }, []);

  function chooseProduct(id: ProductId) {
    const platform = getPlatforms(id).includes(selection.platform) ? selection.platform : getPlatforms(id)[0];
    const architecture = getArchitectures(id, platform).includes(selection.architecture) ? selection.architecture : getArchitectures(id, platform)[0];
    const channel = getChannels(id, platform)[0];
    setSelection({ product: id, platform, architecture, channel });
  }

  function choosePlatform(platform: Platform) {
    const architecture = getArchitectures(selection.product, platform).includes(selection.architecture) ? selection.architecture : getArchitectures(selection.product, platform)[0];
    setSelection(previous => ({ ...previous, platform, architecture, channel: getChannels(previous.product, platform)[0] }));
  }

  return <div className="wb-tool install-guide">
    <section aria-labelledby="setup-product-heading">
      <div className="wb-row setup-section-head"><h2 id="setup-product-heading">What are you setting up?</h2><span className="wb-kicker">01 / choose a product</span></div>
      <div className="setup-products">
        {installationProducts.map(item => <button type="button" key={item.id} className={`setup-product${item.id === selection.product ? ' is-selected' : ''}`} aria-pressed={item.id === selection.product} onClick={() => chooseProduct(item.id)}>{item.title}<span aria-hidden="true"><ArrowUpRight /></span></button>)}
      </div>
    </section>

    <div className="wb-grid setup-grid">
      <aside className="wb-panel setup-options" aria-labelledby="setup-platform-heading">
        <div className="wb-kicker">02 / your machine</div>
        <h2 id="setup-platform-heading">Choose your environment</h2>
        <p className="wb-note">{product.requirement}</p>
        <div className="wb-field">
          <label htmlFor="setup-platform">Operating system</label>
          <select id="setup-platform" value={selection.platform} onChange={event => choosePlatform(event.target.value as Platform)}>{getPlatforms(selection.product).map(platform => <option key={platform} value={platform}>{platformLabels[platform]}</option>)}</select>
        </div>
        <div className="wb-field">
          <label htmlFor="setup-architecture">Processor</label>
          <select id="setup-architecture" value={selection.architecture} onChange={event => setSelection(previous => ({ ...previous, architecture: event.target.value as Architecture }))}>{getArchitectures(selection.product, selection.platform).map(architecture => <option key={architecture} value={architecture}>{architectureLabels[architecture]}</option>)}</select>
          <small>Find this in your system’s About panel. On macOS, “Chip” means Apple Silicon.</small>
        </div>
        <div className="wb-field">
          <label htmlFor="setup-channel">Installation method</label>
          <select id="setup-channel" value={selection.channel} onChange={event => setSelection(previous => ({ ...previous, channel: event.target.value as InstallChannel }))}>{getChannels(selection.product, selection.platform).map(channel => <option key={channel} value={channel}>{channelLabels[channel]}</option>)}</select>
        </div>
        <p className="wb-note">Commands run on the machine where you paste them. The installer detects its architecture; Cargo builds for its local toolchain.</p>
      </aside>

      <section className="wb-panel setup-plan" aria-labelledby="setup-plan-heading" aria-live="polite">
        <div className="wb-row setup-section-head"><h2 id="setup-plan-heading">Your installation steps</h2><span className="wb-kicker">03 / install &amp; verify</span></div>
        {plan.ok ? <>
          <div className="setup-plan-meta"><span>{product.title}</span><span>{platformLabels[selection.platform]}</span><span>{selection.architecture === 'arm64' ? 'ARM64' : 'x86_64'}</span></div>
          <ol className="setup-steps">
            {plan.steps.map((step, index) => <li key={`${selection.product}-${selection.channel}-${selection.platform}-${index}`}>
              <div className="setup-step-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
              <div><h3>{step.title}</h3><p className="wb-note">{step.detail}</p>{step.command && <CopyCommand key={step.command} command={step.command} />}{step.href && <a className="setup-doc-link" href={step.href}>{step.href.startsWith('https:') ? 'Open release downloads' : 'Open the command builder'} <span aria-hidden="true">→</span></a>}</div>
            </li>)}
          </ol>
          <div className="setup-verification"><div className="wb-kicker">check the installed version</div><p className="wb-note">{plan.verification.detail}</p><CopyCommand key={plan.verification.command} command={plan.verification.command} label="Copy version check" /></div>
          <div className="wb-actions"><a className="wb-button" href={plan.docsHref}>Full getting started guide</a><a className="wb-button" href={plan.releaseUrl}>Published releases <span aria-hidden="true"><ArrowUpRight /></span></a></div>
        </> : <p className="wb-error" role="alert">{plan.error}</p>}
      </section>
    </div>

    <section className="setup-troubleshooting" aria-labelledby="setup-help-heading">
      <div className="wb-row setup-section-head"><div><div className="wb-kicker">when something gets stuck</div><h2 id="setup-help-heading">Find your symptom.</h2></div><a className="setup-doc-link" href={`/${product.id}/docs/getting-started`}>{product.title} documentation <span aria-hidden="true">→</span></a></div>
      <div className="setup-symptoms">{product.troubleshooting.map(item => <details key={`${product.id}-${item.title}`}><summary>{item.title}<span aria-hidden="true">+</span></summary><div><p>{item.detail}</p><a className="setup-doc-link" href={item.href}>Read the related guide <span aria-hidden="true">→</span></a></div></details>)}</div>
    </section>
  </div>;
}
