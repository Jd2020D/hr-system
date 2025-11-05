import { useThemeStore } from '../store/themeStore';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:text-gray-200 dark:hover:text-primary-400 dark:focus:ring-offset-gray-900"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="text-lg" aria-hidden="true">
        {isDark ? '🌙' : '☀️'}
      </span>
      <span>{isDark ? 'Dark' : 'Light'} mode</span>
    </button>
  );
};

export default ThemeToggle;
