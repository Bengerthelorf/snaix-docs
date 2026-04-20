import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return (document.documentElement.getAttribute('data-theme') as Theme) || 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('snaix-theme', next); } catch {}
      return next;
    });
  }, []);

  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle"
      title={isDark ? 'switch to light' : 'switch to dark'}
      aria-label="toggle theme"
    >
      <span className="tt-track" aria-hidden>
        <span className={`tt-sq ${isDark ? 'is-dark' : ''}`} />
        <span className={`tt-ci ${isDark ? 'is-dark' : ''}`} />
      </span>
      <span className="tt-label">{isDark ? 'dark' : 'light'}</span>
    </button>
  );
}
