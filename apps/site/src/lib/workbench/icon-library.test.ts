import { expect, test } from 'bun:test';
import { createIconDemo, iconDemoReducer, iconFor, iconsForApp } from './icon-library';

test('browsing the library leaves the current icon unchanged until Apply', () => {
  const initial = createIconDemo();
  const choice = iconsForApp('firefox')[0];
  const preview = iconDemoReducer(initial, { type: 'preview', iconId: choice.id });
  expect(preview.current.firefox).toBe('firefox-default');
  expect(preview.preview?.iconId).toBe(choice.id);
  const cancelled = iconDemoReducer(preview, { type: 'close-preview' });
  expect(cancelled.current).toEqual(initial.current);
  expect(cancelled.preview).toBeNull();
});

test('Apply changes only the chosen application and Done keeps the result', () => {
  const choice = iconsForApp('firefox')[0];
  let state = iconDemoReducer(createIconDemo(), { type: 'preview', iconId: choice.id });
  state = iconDemoReducer(state, { type: 'apply' });
  expect(state.current).toEqual({ firefox: choice.id, vscode: 'vscode-default' });
  expect(state.preview?.applied).toBe(true);
  state = iconDemoReducer(state, { type: 'close-preview' });
  state = iconDemoReducer(state, { type: 'select-app', appId: 'vscode' });
  expect(state.current.firefox).toBe(choice.id);
});

test('Undo restores the previous custom icon rather than always using the default', () => {
  const [first, second] = iconsForApp('firefox');
  let state = createIconDemo();
  for (const choice of [first, second]) {
    state = iconDemoReducer(state, { type: 'preview', iconId: choice.id });
    state = iconDemoReducer(state, { type: 'apply' });
    if (choice === first) state = iconDemoReducer(state, { type: 'close-preview' });
  }
  state = iconDemoReducer(state, { type: 'undo' });
  expect(state.current.firefox).toBe(first.id);
  expect(state.preview?.applied).toBe(false);
});

test('Restore Default requires confirmation and preserves other applications', () => {
  let state = createIconDemo();
  for (const appId of ['firefox', 'vscode'] as const) {
    state = iconDemoReducer(state, { type: 'select-app', appId });
    state = iconDemoReducer(state, { type: 'preview', iconId: iconsForApp(appId)[0].id });
    state = iconDemoReducer(state, { type: 'apply' });
    state = iconDemoReducer(state, { type: 'close-preview' });
  }
  const before = state.current;
  state = iconDemoReducer(state, { type: 'request-restore' });
  expect(state.current).toEqual(before);
  state = iconDemoReducer(state, { type: 'cancel-restore' });
  expect(state.current).toEqual(before);
  state = iconDemoReducer(state, { type: 'request-restore' });
  state = iconDemoReducer(state, { type: 'confirm-restore' });
  expect(state.current.vscode).toBe('vscode-default');
  expect(state.current.firefox).toBe(before.firefox);
});

test('a library icon from another application cannot be applied to the active sample', () => {
  const state = createIconDemo();
  expect(iconDemoReducer(state, { type: 'preview', iconId: iconsForApp('vscode')[0].id })).toBe(state);
  expect(iconDemoReducer(state, { type: 'apply' })).toBe(state);
  expect(iconFor('firefox-default').author).toBe('Mozilla');
});
