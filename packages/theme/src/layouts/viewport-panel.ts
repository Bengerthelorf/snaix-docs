export interface DisplayPanel {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Select a complete readable panel only when hardware leaves a real gap. */
export function selectDisplayPanel(
  segments: readonly DisplayPanel[] | undefined,
  viewportWidth: number,
  viewportHeight: number,
): DisplayPanel | null {
  if (!segments || segments.length < 2 || !Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportWidth <= 0 || viewportHeight <= 0) return null;
  const panels = segments.map(({ x, y, width, height }) => ({ x, y, width, height }));
  if (panels.some((r) => !Object.values(r).every(Number.isFinite) || r.x < 0 || r.y < 0 || r.width <= 0 || r.height <= 0 || r.x + r.width > viewportWidth + 0.5 || r.y + r.height > viewportHeight + 0.5)) return null;

  let hasGap = false;
  for (let i = 0; i < panels.length; i++) {
    for (let j = i + 1; j < panels.length; j++) {
      const a = panels[i]!;
      const b = panels[j]!;
      const gapX = Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width);
      const gapY = Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height);
      if (gapX < -0.5 && gapY < -0.5) return null;
      const vertical = Math.abs(a.y - b.y) < 0.5 && Math.abs(a.height - b.height) < 0.5 && gapX > 0.5;
      const horizontal = Math.abs(a.x - b.x) < 0.5 && Math.abs(a.width - b.width) < 0.5 && gapY > 0.5;
      hasGap ||= vertical || horizontal;
    }
  }
  if (!hasGap) return null;
  // Prefer space for reading; stable top/left ordering keeps equal panels
  // from moving the page when a browser returns its rectangles in a new order.
  return panels.sort((a, b) => b.width * b.height - a.width * a.height || a.y - b.y || a.x - b.x)[0]!;
}
