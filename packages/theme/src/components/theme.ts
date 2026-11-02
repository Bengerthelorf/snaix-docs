export type Theme = 'light' | 'dark';

type ThemeRoot = Pick<Element, 'getAttribute' | 'setAttribute'>;

export function readTheme(root?: Pick<ThemeRoot, 'getAttribute'>): Theme {
  return root?.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function toggleTheme(
  root: ThemeRoot,
  persist: (theme: Theme) => void = (theme) => localStorage.setItem('snaix-theme', theme),
): Theme {
  const next: Theme = readTheme(root) === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { persist(next); } catch {}
  return next;
}
