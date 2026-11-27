import { Download } from 'lucide-react';
import { Theme } from '../hooks/useTheme';
import { ActiveTab, EXPORT_FORMAT_OPTIONS, ExportFormat } from '../types/reviews';
import { BrandLogo } from './BrandLogo';
import { ThemeSwitcher } from './ThemeSwitcher';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  reviewCount: number;
  exportFormat: ExportFormat;
  onExportCSV: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function TopBar({
  activeTab,
  onTabChange,
  reviewCount,
  exportFormat,
  onExportCSV,
  theme,
  onThemeChange,
}: TopBarProps) {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'workbench', label: 'Workbench' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'dataset', label: 'Export Preview' },
    { id: 'library', label: 'Review Library' },
  ];

  const activeFormat =
    EXPORT_FORMAT_OPTIONS.find((f) => f.id === exportFormat) ?? EXPORT_FORMAT_OPTIONS[0];

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand mark & wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('workbench');
          }}
          className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-xl"
        >
          <BrandLogo />
        </a>

        {/* Zone 2: Pill-framed navigation links */}
        <nav
          aria-label="Primary"
          className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/85 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800/90 overflow-x-auto"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme switcher + primary Export action */}
        <div className="flex items-center gap-3 shrink-0">
          <ThemeSwitcher theme={theme} onChange={onThemeChange} />

          <button
            type="button"
            onClick={onExportCSV}
            disabled={reviewCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed rounded-xl shadow-sm shadow-sky-600/20 dark:shadow-sky-500/20 transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Export {activeFormat.label}</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>
    </header>
  );
}
