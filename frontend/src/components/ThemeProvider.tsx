'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  // Once mounted on client, we can show the UI
  useEffect(() => {
    setMounted(true);
    
    // Check system preference if no theme was persisted (or if it's the first time)
    if (!localStorage.getItem('autisense-storage')) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDark ? 'dark' : 'light');
    }
  }, [setTheme]);

  useEffect(() => {
    if (mounted) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, mounted]);

  // To prevent hydration mismatch, render children normally but apply a generic class if not mounted
  // or just render children as is and let the effect add the class to HTML.
  return <>{children}</>;
}
