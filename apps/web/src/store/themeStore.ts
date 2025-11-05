import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem('theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('theme', theme);
  }
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getPreferredTheme();

  if (typeof window !== 'undefined') {
    applyTheme(initialTheme);
  }

  return {
    theme: initialTheme,
    setTheme: (theme) => {
      set({ theme });
      applyTheme(theme);
    },
    toggleTheme: () => {
      const nextTheme: Theme = get().theme === 'dark' ? 'light' : 'dark';
      set({ theme: nextTheme });
      applyTheme(nextTheme);
    },
  };
});
