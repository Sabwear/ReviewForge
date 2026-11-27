import { Download } from 'lucide-react';
import { ActiveTab, EXPORT_FORMAT_OPTIONS, ExportFormat } from '../types/reviews';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  reviewCount: number;
  exportFormat: ExportFormat;
  onExportCSV: () => void;
}

export function TopBar({
  activeTab,
  onTabChange,
  reviewCount,
  exportFormat,
  onExportCSV,
}: TopBarProps) {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'workbench', label: 'Workbench' },
    { id: 'dataset', label: 'Export Preview' },
    { id: 'library', label: 'Review Library' },
  ];

  const activeFormat =
    EXPORT_FORMAT_OPTIONS.find((f) => f.id === exportFormat) ?? EXPORT_FORMAT_OPTIONS[0];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('workbench');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded"
        >
          ReviewForge
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary" className="flex items-center gap-6 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-sm cursor-pointer ${
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 bottom-0 h-0.5 bg-sky-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onExportCSV}
            disabled={reviewCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export {activeFormat.label}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
