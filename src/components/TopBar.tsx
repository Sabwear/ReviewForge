import { Cpu, Download, Lock } from 'lucide-react';
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
  aiStatusLabel: string;
  isAIConfigured: boolean;
  isFallbackMode: boolean;
  onOpenAISettings: () => void;
}

export function TopBar({
  activeTab,
  onTabChange,
  reviewCount,
  exportFormat,
  onExportCSV,
  theme,
  onThemeChange,
  aiStatusLabel,
  isAIConfigured,
  isFallbackMode,
  onOpenAISettings,
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
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-[#161920]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] transition-colors duration-200">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
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
          className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/85 dark:bg-[#1C2029] border border-slate-200/70 dark:border-white/[0.07] overflow-x-auto"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#68AEE0] ${
                  isActive
                    ? 'bg-white dark:bg-[#232834] text-slate-900 dark:text-[#E4E6EB] shadow-sm ring-1 ring-slate-200/70 dark:ring-white/[0.10]'
                    : 'text-slate-600 dark:text-[#E4E6EB]/65 hover:text-slate-900 dark:hover:text-[#E4E6EB]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: AI Settings pill + Theme switcher + Export CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenAISettings}
            title="Configure AI provider, API key, models, and fallback secret code"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
              isAIConfigured
                ? 'bg-emerald-50/90 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100/80 dark:hover:bg-emerald-500/25'
                : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-500'
            }`}
          >
            {isFallbackMode && !isAIConfigured ? (
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
            ) : (
              <Cpu
                className={`w-3.5 h-3.5 shrink-0 ${
                  isAIConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'
                }`}
                aria-hidden="true"
              />
            )}
            <span className="max-w-[130px] truncate hidden md:inline">{aiStatusLabel}</span>
            <span className="md:hidden">AI</span>
          </button>

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
