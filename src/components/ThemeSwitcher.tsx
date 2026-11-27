import { Moon, Sun } from 'lucide-react';
import { Theme } from '../hooks/useTheme';

interface ThemeSwitcherProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

export function ThemeSwitcher({ theme, onChange }: ThemeSwitcherProps) {
  const isDark = theme === 'dark';

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="relative inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-inner"
    >
      {/* Animated sliding pill */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-1 bottom-1 left-1 w-8 rounded-full transition-all duration-300 ease-out shadow-sm ${
          isDark
            ? 'translate-x-8 bg-slate-950 ring-1 ring-sky-400/35 shadow-sky-500/20'
            : 'translate-x-0 bg-white ring-1 ring-slate-200/80 shadow-amber-500/15'
        }`}
      />

      <button
        type="button"
        onClick={() => onChange('light')}
        aria-label="Switch to light mode"
        aria-pressed={!isDark}
        title="Light mode"
        className={`relative z-10 flex items-center justify-center w-8 h-7 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
          !isDark
            ? 'text-amber-500'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sun className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onChange('dark')}
        aria-label="Switch to dark mode"
        aria-pressed={isDark}
        title="Dark mode"
        className={`relative z-10 flex items-center justify-center w-8 h-7 rounded-full transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
          isDark
            ? 'text-sky-400'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Moon className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
