import catalog from '../../data/icon-library.json';

export const SAMPLE_APPS = [
  { id: 'firefox', name: 'Firefox', defaultIcon: 'firefox-default' },
  { id: 'vscode', name: 'Visual Studio Code', defaultIcon: 'vscode-default' },
] as const;
export type SampleAppId = typeof SAMPLE_APPS[number]['id'];
export type LibraryIcon = typeof catalog[number];

export function iconFor(id: string): LibraryIcon {
  const icon = catalog.find((item) => item.id === id);
  if (!icon) throw new Error(`Unknown sample icon: ${id}`);
  return icon;
}
export function iconsForApp(appId: SampleAppId): LibraryIcon[] {
  return catalog.filter((icon) => icon.appId === appId && !icon.id.endsWith('-default'));
}

interface IconPreviewState {
  appId: SampleAppId;
  iconId: string;
  beforeIconId: string;
  applied: boolean;
}
export interface IconDemoState {
  appId: SampleAppId;
  current: Record<SampleAppId, string>;
  preview: IconPreviewState | null;
  restoreAppId: SampleAppId | null;
}
export type IconDemoAction =
  | { type: 'select-app'; appId: SampleAppId }
  | { type: 'preview'; iconId: string }
  | { type: 'apply' | 'undo' | 'close-preview' | 'request-restore' | 'cancel-restore' | 'confirm-restore' };

export function createIconDemo(): IconDemoState {
  return { appId: 'firefox', current: { firefox: 'firefox-default', vscode: 'vscode-default' }, preview: null, restoreAppId: null };
}

export function iconDemoReducer(state: IconDemoState, action: IconDemoAction): IconDemoState {
  switch (action.type) {
    case 'select-app': return { ...state, appId: action.appId, preview: null, restoreAppId: null };
    case 'preview': {
      const icon = catalog.find((item) => item.id === action.iconId);
      if (!icon || icon.appId !== state.appId || icon.id.endsWith('-default')) return state;
      return { ...state, preview: { appId: state.appId, iconId: icon.id, beforeIconId: state.current[state.appId], applied: false } };
    }
    case 'apply': {
      if (!state.preview || state.preview.applied) return state;
      return { ...state, current: { ...state.current, [state.preview.appId]: state.preview.iconId }, preview: { ...state.preview, applied: true } };
    }
    case 'undo': {
      if (!state.preview?.applied) return state;
      return { ...state, current: { ...state.current, [state.preview.appId]: state.preview.beforeIconId }, preview: { ...state.preview, applied: false } };
    }
    case 'close-preview': return state.preview ? { ...state, preview: null } : state;
    case 'request-restore': return state.current[state.appId] === `${state.appId}-default` ? state : { ...state, restoreAppId: state.appId };
    case 'cancel-restore': return { ...state, restoreAppId: null };
    case 'confirm-restore': return state.restoreAppId ? { ...state, current: { ...state.current, [state.restoreAppId]: `${state.restoreAppId}-default` }, restoreAppId: null } : state;
  }
}
