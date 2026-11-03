import { useEffect, useReducer, useRef, useState } from 'react';
import { createIconDemo, iconDemoReducer, iconFor, iconsForApp, SAMPLE_APPS } from '../../lib/workbench/icon-library';
import '../../styles/icon-library-demo.css';

export default function IconLibraryDemo() {
  const [state, dispatch] = useReducer(iconDemoReducer, undefined, createIconDemo);
  const [query, setQuery] = useState('');
  const previewDialog = useRef<HTMLDialogElement>(null);
  const restoreDialog = useRef<HTMLDialogElement>(null);
  const applyButton = useRef<HTMLButtonElement>(null);
  const doneButton = useRef<HTMLButtonElement>(null);
  const app = SAMPLE_APPS.find((item) => item.id === state.appId)!;
  const current = iconFor(state.current[state.appId]);
  const icons = iconsForApp(state.appId);
  const apps = SAMPLE_APPS.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = state.preview ? iconFor(state.preview.iconId) : null;
  const before = state.preview ? iconFor(state.preview.beforeIconId) : null;

  // Native close events are asynchronous. State owns closing so an old
  // close event cannot dismiss a preview that the user just reopened.
  useEffect(() => {
    const dialog = previewDialog.current;
    if (!dialog) return;
    if (state.preview) {
      if (!dialog.open) dialog.showModal();
      (state.preview.applied ? doneButton : applyButton).current?.focus();
    } else if (dialog.open) dialog.close();
  }, [state.preview]);
  useEffect(() => {
    const dialog = restoreDialog.current;
    if (state.restoreAppId && !dialog?.open) dialog?.showModal();
    else if (!state.restoreAppId && dialog?.open) dialog.close();
  }, [state.restoreAppId]);

  return (
    <div className="il-demo" data-tool="icon-library">
      <div className="il-intro"><span className="il-demo-tag">Browser demo</span></div>
      <div className="il-window">
        <div className="il-titlebar"><span className="il-window-lights" aria-hidden="true"><i /><i /><i /></span><b>IconChanger</b><span>Sample applications</span></div>
        <div className="il-workspace">
          <aside className="il-sidebar" aria-label="Sample applications">
            <label className="wb-field" htmlFor="icon-app-search"><span>Find an app</span><input id="icon-app-search" type="search" placeholder="Search apps" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <div className="il-apps">
              {apps.map((item) => <button type="button" key={item.id} aria-pressed={state.appId === item.id} onClick={() => dispatch({ type: 'select-app', appId: item.id })}>
                <img src={iconFor(state.current[item.id]).image} width="34" height="34" alt="" /><span>{item.name}<small>{state.current[item.id] === item.defaultIcon ? 'Default icon' : 'Custom icon'}</small></span>
              </button>)}
              {!apps.length && <div className="il-empty"><p>No matching sample apps.</p><button type="button" onClick={() => setQuery('')}>Clear search</button></div>}
            </div>
          </aside>
          <section className="il-content" aria-label={`${app.name} icons`}>
            <div className="il-app-heading"><div><h2>{app.name}</h2><p>Select a library icon to preview it.</p></div><button type="button" className="wb-button" disabled={current.id === app.defaultIcon} onClick={() => dispatch({ type: 'request-restore' })}>Restore Default</button></div>
            <div className="il-current"><img data-current-icon src={current.image} width="66" height="66" alt={`${app.name} current icon`} /><div><span>Current icon</span><b>{current.id === app.defaultIcon ? 'Default' : `By ${current.author}`}</b></div></div>
            <div className="il-library-heading"><h3><a href="https://macosicons.com/">macOSicons.com</a></h3><span>{icons.length} sample icons</span></div>
            <div className="il-gallery">
              {icons.map((icon) => <article className="il-card" key={icon.id} data-library-icon={icon.id}>
                <button type="button" className="il-preview-button" onClick={() => dispatch({ type: 'preview', iconId: icon.id })} aria-label={`Preview ${icon.name} by ${icon.author}`}>
                  <img src={icon.image} alt="" width="96" height="96" /><span>{icon.name}</span>{current.id === icon.id && <small>Applied</small>}
                </button>
                <a href={icon.page} className="il-credit" target="_blank" rel="noreferrer">by {icon.author}</a>
              </article>)}
            </div>
            <div className="il-dock-preview"><span>Dock preview</span><div className="il-dock" aria-label="Sample Dock">
              {SAMPLE_APPS.map((item) => <div key={item.id}><img data-dock-icon={item.id} src={iconFor(state.current[item.id]).image} alt={item.name} width="58" height="58" /><small>{item.name}</small></div>)}
            </div></div>
          </section>
        </div>
      </div>
      <div className="il-next"><p>In the Mac app, add your macOSicons API key in Settings → Advanced.</p><a className="wb-button is-primary" href="/iconchanger/install">Install IconChanger</a><a href="/iconchanger/docs/api-key">Connect the icon library</a></div>

      <dialog ref={previewDialog} className="il-dialog" aria-labelledby="icon-preview-title" onCancel={(event) => { event.preventDefault(); dispatch({ type: 'close-preview' }); }}>
        {selected && before && state.preview && <>
          <div className="il-dialog-heading"><span>Icon preview</span><h2 id="icon-preview-title">{app.name}</h2></div>
          <div className="il-comparison"><figure><img src={before.image} alt="Current icon before this change" width="112" height="112" /><figcaption>Current</figcaption></figure><span aria-hidden="true">→</span><figure><img src={selected.image} alt={`Selected icon by ${selected.author}`} width="112" height="112" /><figcaption>Selected</figcaption></figure></div>
          <p className="il-dialog-credit"><a href={selected.page} target="_blank" rel="noreferrer">Icon by {selected.author} on macOSicons.com</a></p>
          <p className="il-apply-status" role="status">{state.preview.applied ? 'Applied in this demo.' : ''}</p>
          <div className="il-dialog-actions">
            <button ref={doneButton} type="button" className="wb-button" onClick={() => dispatch({ type: 'close-preview' })}>{state.preview.applied ? 'Done' : 'Cancel'}</button>
            {state.preview.applied ? <button type="button" className="wb-button" onClick={() => dispatch({ type: 'undo' })}>Undo</button> : <button ref={applyButton} type="button" className="wb-button is-primary" onClick={() => dispatch({ type: 'apply' })}>Apply in demo</button>}
          </div>
        </>}
      </dialog>
      <dialog ref={restoreDialog} className="il-dialog il-restore-dialog" aria-labelledby="icon-restore-title" onCancel={(event) => { event.preventDefault(); dispatch({ type: 'cancel-restore' }); }}>
        <h2 id="icon-restore-title">Restore {app.name}?</h2><p>Replace the custom icon with the default icon.</p>
        <div className="il-dialog-actions"><button type="button" className="wb-button" onClick={() => dispatch({ type: 'cancel-restore' })}>Cancel</button><button type="button" className="wb-button is-primary" onClick={() => dispatch({ type: 'confirm-restore' })}>Restore in demo</button></div>
      </dialog>
    </div>
  );
}
