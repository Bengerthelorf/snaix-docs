export function readCodeTabLabel(saved: string | null): string | undefined {
  try {
    const value: unknown = JSON.parse(saved ?? 'null');
    return value && typeof value === 'object' && '_last' in value && typeof value._last === 'string'
      ? value._last : undefined;
  } catch { return undefined; }
}

export function nextTabIndex(key: string, current: number, count: number): number | undefined {
  if (!count) return undefined;
  if (key === 'ArrowRight') return (current + 1) % count;
  if (key === 'ArrowLeft') return (current - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return undefined;
}
