import { expect, test } from 'bun:test';
import { validateIconDimensions, validateIconFile } from './icon-preview';

test('accepts supported local images at the upload size boundary', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
    expect(validateIconFile({ type, size: 5 * 1024 * 1024 })).toBeNull();
  }
});

test('rejects empty, oversized and unsupported files before decoding', () => {
  expect(validateIconFile({ type: 'image/png', size: 0 })).toMatch(/empty/i);
  expect(validateIconFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 })).toMatch(/5 MiB/);
  expect(validateIconFile({ type: 'image/svg+xml', size: 128 })).toMatch(/PNG, JPEG or WebP/);
  expect(validateIconFile({ type: '', size: 128 })).toMatch(/PNG, JPEG or WebP/);
});

test('rejects invalid or excessive image dimensions after decoding', () => {
  expect(validateIconDimensions(4096, 4096)).toBeNull();
  expect(validateIconDimensions(4097, 128)).toMatch(/4096/);
  expect(validateIconDimensions(128, 4097)).toMatch(/4096/);
  expect(validateIconDimensions(0, 128)).toMatch(/read/i);
  expect(validateIconDimensions(Number.NaN, 128)).toMatch(/read/i);
});
