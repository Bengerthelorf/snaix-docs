import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { validateIconDimensions, validateIconFile } from '../../lib/workbench/icon-preview';
import '../../styles/workbench-demos.css';

const DESIGNS = [
  { id: 'orbit', name: 'Orbit' },
  { id: 'blocks', name: 'Blocks' },
  { id: 'signal', name: 'Signal' },
  { id: 'frame', name: 'Frame' },
] as const;
type Design = typeof DESIGNS[number]['id'];
type Context = 'app' | 'folder' | 'dock';
interface LocalImage { url: string; name: string; width: number; height: number }

function IconArt({ design }: { design: Design }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" focusable="false">
      {design === 'orbit' && <>
        <rect width="100" height="100" fill="var(--c-blue, #1c4ce1)" />
        <circle cx="50" cy="50" r="29" stroke="var(--c-paper-pure, #fafaf7)" strokeWidth="8" />
        <path d="M28 66 50 27 72 66Z" fill="var(--c-yellow, #f5c518)" />
        <rect x="62" y="19" width="18" height="18" fill="var(--c-red, #e1261c)" />
      </>}
      {design === 'blocks' && <>
        <rect width="100" height="100" fill="var(--c-red, #e1261c)" />
        <rect x="19" y="19" width="28" height="62" fill="var(--c-yellow, #f5c518)" />
        <rect x="53" y="19" width="28" height="28" fill="var(--c-blue, #1c4ce1)" />
        <rect x="53" y="53" width="28" height="28" fill="var(--c-paper-pure, #fafaf7)" />
      </>}
      {design === 'signal' && <>
        <rect width="100" height="100" fill="var(--c-yellow, #f5c518)" />
        <path d="M20 25H80M20 50H62M20 75H44" stroke="var(--c-ink-0, #0a0a0b)" strokeWidth="11" />
        <circle cx="75" cy="75" r="10" fill="var(--c-red, #e1261c)" />
      </>}
      {design === 'frame' && <>
        <rect width="100" height="100" fill="var(--c-paper-pure, #fafaf7)" />
        <rect x="22" y="22" width="56" height="56" stroke="var(--c-ink-0, #0a0a0b)" strokeWidth="10" />
        <rect x="58" y="12" width="29" height="29" fill="var(--c-red, #e1261c)" />
      </>}
    </svg>
  );
}

export default function IconPreview() {
  const [design, setDesign] = useState<Design>('orbit');
  const [context, setContext] = useState<Context>('app');
  const [name, setName] = useState('Studio');
  const [iconSize, setIconSize] = useState(104);
  const [localImage, setLocalImage] = useState<LocalImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('Orbit design selected.');
  const inputRef = useRef<HTMLInputElement>(null);
  const activeUrl = useRef<string | null>(null);
  const pendingUrl = useRef<string | null>(null);
  const pendingImage = useRef<HTMLImageElement | null>(null);
  const generation = useRef(0);

  function cancelPending() {
    if (pendingImage.current) {
      pendingImage.current.onload = null;
      pendingImage.current.onerror = null;
      pendingImage.current = null;
    }
    if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current);
    pendingUrl.current = null;
  }

  function clearLocalImage() {
    generation.current += 1;
    cancelPending();
    if (activeUrl.current) URL.revokeObjectURL(activeUrl.current);
    activeUrl.current = null;
    setLocalImage(null);
    setLoading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  useEffect(() => () => {
    generation.current += 1;
    cancelPending();
    if (activeUrl.current) URL.revokeObjectURL(activeUrl.current);
  }, []);

  function chooseDesign(next: Design) {
    clearLocalImage();
    setDesign(next);
    setError('');
    setAnnouncement(`${DESIGNS.find((item) => item.id === next)!.name} design selected.`);
  }

  function resetPreview() {
    clearLocalImage();
    setDesign('orbit');
    setContext('app');
    setName('Studio');
    setIconSize(104);
    setError('');
    setAnnouncement('Preview reset to the Orbit design.');
  }

  function loadFile(file: File | undefined) {
    if (!file) return;
    generation.current += 1;
    const request = generation.current;
    cancelPending();
    setError('');
    setLoading(false);
    const fileError = validateIconFile(file);
    if (fileError) { setError(fileError); setAnnouncement(''); return; }

    const url = URL.createObjectURL(file);
    const image = new Image();
    pendingUrl.current = url;
    pendingImage.current = image;
    setLoading(true);
    setAnnouncement('Reading your image locally…');

    const fail = (message: string) => {
      if (request !== generation.current) return;
      cancelPending();
      setLoading(false);
      setError(message);
      setAnnouncement('');
    };

    image.onload = () => {
      if (request !== generation.current) return;
      const dimensionError = validateIconDimensions(image.naturalWidth, image.naturalHeight);
      if (dimensionError) { fail(dimensionError); return; }
      image.onload = null;
      image.onerror = null;
      pendingImage.current = null;
      pendingUrl.current = null;
      if (activeUrl.current) URL.revokeObjectURL(activeUrl.current);
      activeUrl.current = url;
      setLocalImage({ url, name: file.name, width: image.naturalWidth, height: image.naturalHeight });
      setLoading(false);
      setAnnouncement(`${file.name} loaded. ${image.naturalWidth} by ${image.naturalHeight} pixels.`);
    };
    image.onerror = () => fail('This image could not be read. Choose another PNG, JPEG or WebP image.');
    image.src = url;
  }

  const displayName = name.trim() || 'Studio';
  const designName = DESIGNS.find((item) => item.id === design)!.name;
  const artwork = localImage ? <img src={localImage.url} alt="" draggable="false" /> : <IconArt design={design} />;
  const icon = <div className="ip-icon-shell">{artwork}</div>;

  return (
    <div className="wb-tool ip-tool" data-tool="icon-preview">
      <p className="wb-note ip-local-note"><span className="ip-local-mark" aria-hidden="true" />Your image stays in this browser. Preview only; macOS icons are unchanged.</p>
      <div className="ip-grid">
        <section className="wb-panel ip-controls" aria-label="Icon controls">
          <fieldset className="ip-fieldset">
            <legend>Start with a design</legend>
            <div className="ip-swatches">
              {DESIGNS.map((item) => <button key={item.id} type="button" className="ip-swatch" aria-pressed={!localImage && design === item.id} onClick={() => chooseDesign(item.id)}>
                <span className="ip-swatch-art"><IconArt design={item.id} /></span>
                <span>{item.name}</span>
              </button>)}
            </div>
          </fieldset>
          <div className="ip-upload">
            <h2>Or try your image</h2>
            <input ref={inputRef} id="icon-upload" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose a local icon image" hidden onChange={(event) => {
              loadFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = '';
            }} />
            <button className="wb-button" type="button" onClick={() => inputRef.current?.click()} aria-describedby="icon-upload-help">{localImage ? 'Replace local image' : 'Choose local image'}</button>
            <p className="wb-note" id="icon-upload-help">PNG, JPEG or WebP. Up to 5 MiB and 4096 × 4096 px. Images fit inside the preview.</p>
            {localImage && <p className="ip-file-info"><b>{localImage.name}</b><span>{localImage.width} × {localImage.height} px</span></p>}
            {error && <p className="wb-error" role="alert">{error}{localImage && ' Your previous image is still selected.'}</p>}
            <p className="ip-upload-status wb-note" role="status" aria-live="polite">{announcement}</p>
          </div>
          <div className="wb-field">
            <label htmlFor="icon-name">Preview name</label>
            <input id="icon-name" value={name} maxLength={36} onChange={(event) => setName(event.target.value)} autoComplete="off" spellCheck="false" />
          </div>
          <div className="wb-field ip-size-field">
            <label htmlFor="icon-size">Icon size <output htmlFor="icon-size">{iconSize} px</output></label>
            <input id="icon-size" type="range" min="64" max="144" step="8" value={iconSize} onChange={(event) => setIconSize(Number(event.target.value))} />
            <p className="wb-note">Dock icons fit the available space.</p>
          </div>
          <button type="button" className="wb-button ip-reset" onClick={resetPreview}>Reset preview</button>
        </section>

        <section className="wb-panel ip-preview-panel" aria-label="Icon preview">
          <div className="ip-preview-heading">
            <h2>See it in context</h2>
            <div className="ip-contexts" role="group" aria-label="Preview context">
              {(['app', 'folder', 'dock'] as const).map((item) => <button key={item} type="button" aria-pressed={context === item} onClick={() => setContext(item)}>{item === 'app' ? 'Application' : item === 'folder' ? 'Folder' : 'Dock'}</button>)}
            </div>
          </div>
          <div className={`ip-desktop ip-context-${context}`} style={{ '--preview-size': `${iconSize}px` } as CSSProperties} data-preview-context={context} role="img" aria-label={`${context === 'app' ? 'Application' : context === 'folder' ? 'Folder' : 'Dock'} preview of ${displayName}, using ${localImage ? 'your local image' : `the ${designName} design`}${loading ? '. Reading a replacement image.' : '.'}`}>
            <div className="ip-menubar" aria-hidden="true"><b>Preview</b><span>File</span><span>View</span><span className="ip-menubar-end">Local only</span></div>
            <div className="ip-wallpaper-shape" aria-hidden="true" />
            {context !== 'dock' ? <div className="ip-desktop-item" aria-hidden="true">
              {context === 'folder' ? <div className="ip-folder"><span className="ip-folder-tab" /><div className="ip-folder-front">{icon}</div></div> : icon}
              <span className="ip-desktop-label">{displayName}{context === 'app' ? '.app' : ''}</span>
            </div> : <div className="ip-dock-scene" aria-hidden="true">
              <span className="ip-dock-tooltip">{displayName}</span>
              <div className="ip-dock">
                <span className="ip-dock-neighbor ip-neighbor-grid"><i /><i /><i /><i /></span>
                <span className="ip-dock-neighbor ip-neighbor-circle"><i /></span>
                <div className="ip-active-icon">{icon}<span className="ip-running-dot" /></div>
                <span className="ip-dock-neighbor ip-neighbor-lines"><i /><i /><i /></span>
                <span className="ip-dock-divider" />
                <span className="ip-dock-neighbor ip-neighbor-bin"><i /></span>
              </div>
            </div>}
            <span className="ip-simulation-label" aria-hidden="true">Simulated desktop</span>
          </div>
          <div className="ip-preview-caption"><b>{localImage ? 'Your local image' : `${designName} design`}</b><span>{context === 'app' ? 'Application icon' : context === 'folder' ? 'Folder icon' : 'Dock icon'}</span></div>
          <div className="ip-next-step">
            <p>Ready to change the real thing?</p>
            <a href="/iconchanger/install">Install IconChanger</a>
            <a href="/iconchanger/docs/getting-started">Read the guide</a>
          </div>
        </section>
      </div>
    </div>
  );
}
