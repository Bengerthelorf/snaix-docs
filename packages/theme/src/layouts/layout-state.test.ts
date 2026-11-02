import { expect, test } from 'bun:test';
import { readCodeTabLabel, nextTabIndex } from './layout-state';

test('ignores malformed or unrelated saved tab preferences', () => {
  for (const value of [null, 'null', '[]', '{', '"npm"', '{"_last":42}']) {
    expect(readCodeTabLabel(value)).toBeUndefined();
  }
  expect(readCodeTabLabel('{"_last":"Homebrew"}')).toBe('Homebrew');
});

test('tabs support wrapping arrows and Home/End without hijacking other keys', () => {
  expect(nextTabIndex('ArrowRight', 2, 3)).toBe(0);
  expect(nextTabIndex('ArrowLeft', 0, 3)).toBe(2);
  expect(nextTabIndex('Home', 2, 3)).toBe(0);
  expect(nextTabIndex('End', 0, 3)).toBe(2);
  expect(nextTabIndex('Enter', 0, 3)).toBeUndefined();
  expect(nextTabIndex('ArrowRight', 0, 0)).toBeUndefined();
});
