import { describe, expect, test } from 'bun:test';
import { readTheme, toggleTheme } from './theme.ts';

function themeRoot(initial?: string) {
  let value = initial ?? null;
  return {
    getAttribute: () => value,
    setAttribute: (_name: string, next: string) => { value = next; },
  };
}

describe('theme preference', () => {
  test('toggles the actual document state and persists the result', () => {
    const root = themeRoot('dark');
    const saved: string[] = [];
    expect(toggleTheme(root, (theme) => saved.push(theme))).toBe('light');
    expect(readTheme(root)).toBe('light');
    expect(saved).toEqual(['light']);
    expect(toggleTheme(root, (theme) => saved.push(theme))).toBe('dark');
    expect(readTheme(root)).toBe('dark');
  });

  test('keeps theme controls working when storage is unavailable', () => {
    const root = themeRoot();
    expect(toggleTheme(root, () => { throw new Error('storage blocked'); })).toBe('dark');
    expect(readTheme(root)).toBe('dark');
  });

  test('treats invalid stored or document values as light', () => {
    expect(readTheme(themeRoot('unexpected'))).toBe('light');
    expect(readTheme()).toBe('light');
  });
});
