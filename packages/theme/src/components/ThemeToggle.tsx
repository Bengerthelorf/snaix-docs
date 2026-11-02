import { useCallback, useEffect, useState } from 'react';

import { readTheme, toggleTheme, type Theme } from './theme.ts';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(readTheme(document.documentElement));
  }, []);

  const toggle = useCallback(() => {
    setTheme(toggleTheme(document.documentElement));
  }, []);

  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      title={isDark ? 'switch to light' : 'switch to dark'}
      aria-label="dark theme"
      aria-pressed={isDark}
    >
      <span className="tt-track" aria-hidden>
        <span className={`tt-sq ${isDark ? 'is-dark' : ''}`} />
        <span className={`tt-ci ${isDark ? 'is-dark' : ''}`} />
      </span>
      <span className="tt-label">{isDark ? 'dark' : 'light'}</span>
    </button>
  );
}
