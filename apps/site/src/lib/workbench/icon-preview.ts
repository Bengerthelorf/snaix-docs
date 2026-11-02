export const MAX_ICON_BYTES = 5 * 1024 * 1024;
export const MAX_ICON_DIMENSION = 4096;
export const ICON_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export function validateIconFile(file: { type: string; size: number }): string | null {
  if (!(ICON_FILE_TYPES as readonly string[]).includes(file.type)) {
    return 'Choose a PNG, JPEG or WebP image.';
  }
  if (!Number.isFinite(file.size) || file.size <= 0) return 'This file is empty. Choose another image.';
  if (file.size > MAX_ICON_BYTES) return 'This image is larger than 5 MiB. Choose a smaller file.';
  return null;
}

export function validateIconDimensions(width: number, height: number): string | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 'This image could not be read. Choose another PNG, JPEG or WebP image.';
  }
  if (width > MAX_ICON_DIMENSION || height > MAX_ICON_DIMENSION) {
    return 'Choose an image no larger than 4096 pixels on either side.';
  }
  return null;
}
