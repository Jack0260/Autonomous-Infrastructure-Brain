import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('atlas-theme') as Theme | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    } else {
      applyTheme('dark');
    }
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('atlas-theme', next);
  };

  return { theme, toggle };
}

function applyTheme(t: Theme) {
  if (t === 'dark') {
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
  }
}
