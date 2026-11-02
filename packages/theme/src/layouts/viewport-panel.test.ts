import { describe, expect, test } from 'bun:test';
import { selectDisplayPanel } from './viewport-panel';

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });

describe('physical display-gap fallback', () => {
  test('leaves normal and unsupported viewports unchanged', () => {
    expect(selectDisplayPanel(undefined, 820, 720)).toBeNull();
    expect(selectDisplayPanel([], 820, 720)).toBeNull();
    expect(selectDisplayPanel([rect(0, 0, 820, 720)], 820, 720)).toBeNull();
  });

  test('keeps a continuous folding display across its full width', () => {
    expect(selectDisplayPanel([rect(0, 0, 400, 720), rect(400, 0, 420, 720)], 820, 720)).toBeNull();
  });

  test('keeps a continuous horizontally folded display across its full height', () => {
    expect(selectDisplayPanel([rect(0, 0, 800, 400), rect(0, 400, 800, 420)], 800, 820)).toBeNull();
  });

  test('chooses one complete panel left of an opaque vertical hinge', () => {
    expect(selectDisplayPanel([rect(0, 0, 400, 720), rect(420, 0, 400, 720)], 820, 720))
      .toEqual(rect(0, 0, 400, 720));
  });

  test('chooses the upper panel above an opaque horizontal hinge', () => {
    expect(selectDisplayPanel([rect(0, 0, 800, 400), rect(0, 420, 800, 400)], 800, 820))
      .toEqual(rect(0, 0, 800, 400));
  });

  test('prefers the larger complete panel and does not depend on API array order', () => {
    expect(selectDisplayPanel([rect(0, 0, 350, 720), rect(370, 0, 450, 720)], 820, 720))
      .toEqual(rect(370, 0, 450, 720));
    expect(selectDisplayPanel([rect(420, 0, 400, 720), rect(0, 0, 400, 720)], 820, 720))
      .toEqual(rect(0, 0, 400, 720));
  });

  test('rejects invalid geometry instead of hiding valid page content', () => {
    for (const invalid of [rect(NaN, 0, 400, 720), rect(0, Infinity, 400, 720), rect(0, 0, 0, 720), rect(-1, 0, 400, 720), rect(0, 0, 900, 720)]) {
      expect(selectDisplayPanel([invalid, rect(420, 0, 400, 720)], 820, 720)).toBeNull();
    }
    expect(selectDisplayPanel([rect(0, 0, 400, 720), rect(420, 0, 400, 720)], NaN, 720)).toBeNull();
  });

  test('does not treat overlapping or diagonally separate rectangles as a physical hinge', () => {
    expect(selectDisplayPanel([rect(0, 0, 500, 720), rect(400, 0, 420, 720)], 820, 720)).toBeNull();
    expect(selectDisplayPanel([rect(0, 0, 400, 300), rect(420, 420, 400, 300)], 820, 720)).toBeNull();
  });
});
