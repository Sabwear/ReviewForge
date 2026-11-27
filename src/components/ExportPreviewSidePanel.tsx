import { useMemo, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  PanelRightClose,
  Sparkles,
  WrapText,
} from 'lucide-react';
import {
  EXPORT_FORMAT_OPTIONS,
  ExportFormat,
  GeneratedReview,
  SampleBusinessId,
} from '../types/reviews';
import { serializeReviewsByFormat } from '../utils/csv';
import { SyntaxHighlightedCode } from '../utils/syntaxHighlight';

interface ExportPreviewSidePanelProps {
  reviews: GeneratedReview[];
  filteredReviews: GeneratedReview[];
  exportFormat: ExportFormat;
  storeBaseUrl: string;
  activeBusinessLabel: string;
  onSelectExportFormat: (format: ExportFormat) => void;
  onExportDownload: () => void;
  onCopyExport: () => Promise<boolean>;
  onOpenDatasetTab: () => void;
  onLoadSampleBusiness: (id: SampleBusinessId) => void;
  onClose: () => void;
}

const ROW_LIMIT_OPTIONS = [5, 15, 30, 60] as const;

const SAMPLE_SCHEMA_REVIEWS: GeneratedReview[] = [
  {
    id: 'schema-1',
    item_id: '101',
    item_slug: 'signature-consultation',
    item_name: 'Signature Consultation',
    category: 'Services',
    reviewer_name: 'Nadia B.',
    reviewer_email: 'nadia.benali@example.com',
    stars: 5,
    subject: 'Clear roadmap from day one',
    body: 'Everything was explained step by step and the follow-up summary arrived the same afternoon.',
    review_date: '2026-03-14',
    review_timestamp: '2026-03-14 14:22:00 UTC',
    product_url: 'https://yourbusiness.com/products/signature-consultation',
    picture_urls: '',
    voice: 'casual',
    language: 'en',
    isReturningCustomer: false,
  },
  {
    id: 'schema-2',
    item_id: '102',
    item_slug: 'monthly-care-plan',
    item_name: 'Monthly Care Plan',
    category: 'Plans',
    reviewer_name: 'Lucas M.',
    reviewer_email: 'l.martin@example.com',
    stars: 4,
    subject: 'Reliable team and steady updates',
    body: 'Took two days to get our first session scheduled, but communication since then has been solid.',
    review_date: '2026-03-18',
    review_timestamp: '2026-03-18 09:10:00 UTC',
    product_url: 'https://yourbusiness.com/products/monthly-care-plan',
    picture_urls: '',
    voice: 'technical',
    language: 'en',
    isReturningCustomer: true,
  },
];

function formatByteSize(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function ExportPreviewSidePanel({
  reviews,
  filteredReviews,
  exportFormat,
  storeBaseUrl,
  activeBusinessLabel,
  onSelectExportFormat,
  onExportDownload,
  onCopyExport,
  onOpenDatasetTab,
  onLoadSampleBusiness,
  onClose,
}: ExportPreviewSidePanelProps) {
  const [rowLimit, setRowLimit] = useState<(typeof ROW_LIMIT_OPTIONS)[number]>(15);
  const [wrapLines, setWrapLines] = useState<boolean>(
    exportFormat === 'markdown' || exportFormat === 'txt'
  );
  const [scope, setScope] = useState<'all' | 'filtered'>('all');
  const [copied, setCopied] = useState(false);

  const activeFormat =
    EXPORT_FORMAT_OPTIONS.find((f) => f.id === exportFormat) ?? EXPORT_FORMAT_OPTIONS[0];

  const hasActiveFilter =
    reviews.length > 0 && filteredReviews.length !== reviews.length;

  const effectiveScope = hasActiveFilter ? scope : 'all';
  const sourceReviews = effectiveScope === 'filtered' ? filteredReviews : reviews;
  const isPlaceholder = reviews.length === 0;

  const previewRows = useMemo(() => {
    if (isPlaceholder) return SAMPLE_SCHEMA_REVIEWS;
    return sourceReviews.slice(0, rowLimit);
  }, [isPlaceholder, sourceReviews, rowLimit]);

  const previewCode = useMemo(() => {
    if (!isPlaceholder && sourceReviews.length === 0) {
      return '';
    }
    return serializeReviewsByFormat(
      previewRows,
      exportFormat,
      isPlaceholder ? 'https://yourbusiness.com' : storeBaseUrl,
      isPlaceholder ? 'Sample Business' : activeBusinessLabel
    );
  }, [
    isPlaceholder,
    sourceReviews.length,
    previewRows,
    exportFormat,
    storeBaseUrl,
    activeBusinessLabel,
  ]);

  const stats = useMemo(() => {
    const lineCount = previewCode ? previewCode.split('\n').length : 0;
    const previewBytes = previewCode ? formatByteSize(previewCode) : '0 B';
    return { lineCount, previewBytes };
  }, [previewCode]);

  const handleCopy = async () => {
    if (isPlaceholder || sourceReviews.length === 0) return;

    let ok = false;
    if (effectiveScope === 'all') {
      ok = await onCopyExport();
    } else {
      try {
        const filteredFull = serializeReviewsByFormat(
          sourceReviews,
          exportFormat,
          storeBaseUrl,
          activeBusinessLabel
        );
        await navigator.clipboard.writeText(filteredFull);
        ok = true;
      } catch {
        ok = false;
      }
    }

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <aside
      aria-label="Live export preview panel"
      className="w-full xl:w-[430px] 2xl:w-[470px] shrink-0 bg-white border-t xl:border-t-0 xl:border-l border-slate-200 flex flex-col xl:sticky xl:top-16 xl:h-[calc(100vh-4rem)]"
    >
      {/* Panel Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-900 truncate">
              Live Export Preview
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {activeFormat.label}
            <span aria-hidden="true"> · </span>
            <span className="font-mono text-[11px]">.{activeFormat.extension}</span>
            {!isPlaceholder && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="font-mono tabular-nums">
                  {sourceReviews.length.toLocaleString()} rows
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenDatasetTab}
            title="Open full Export Preview view"
            aria-label="Open full Export Preview view"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Collapse export preview panel"
            aria-label="Collapse export preview panel"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <PanelRightClose className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Format Switcher Tabs */}
      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 shrink-0 space-y-2.5">
        <div
          role="tablist"
          aria-label="Select export format"
          className="grid grid-cols-6 gap-1 p-1 bg-slate-200/70 rounded-lg"
        >
          {EXPORT_FORMAT_OPTIONS.map((fmt) => {
            const active = fmt.id === exportFormat;
            return (
              <button
                key={fmt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectExportFormat(fmt.id)}
                className={`px-1.5 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap truncate cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={fmt.description}
              >
                {fmt.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Toolbar: Row slice, scope, wrap, copy & download */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!isPlaceholder && (
              <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
                <span>Rows</span>
                <select
                  aria-label="Preview row count"
                  value={rowLimit}
                  onChange={(e) =>
                    setRowLimit(Number(e.target.value) as (typeof ROW_LIMIT_OPTIONS)[number])
                  }
                  className="h-7 px-1.5 text-[11px] font-mono tabular-nums rounded-md border border-slate-300 bg-white text-slate-800 focus:border-sky-600 focus:outline-none cursor-pointer"
                >
                  {ROW_LIMIT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {hasActiveFilter && (
              <div className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-md text-[11px]">
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-2 py-0.5 font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                    effectiveScope === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={`px-2 py-0.5 font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                    effectiveScope === 'filtered'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Filtered ({filteredReviews.length})
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setWrapLines((w) => !w)}
              aria-pressed={wrapLines}
              title="Toggle line wrapping"
              className={`inline-flex items-center gap-1 h-7 px-2 text-[11px] font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                wrapLines
                  ? 'bg-sky-50 border-sky-300 text-sky-800'
                  : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              <WrapText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Wrap</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopy}
              disabled={isPlaceholder || sourceReviews.length === 0}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onExportDownload}
              disabled={isPlaceholder || reviews.length === 0}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>.{activeFormat.extension}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Format Structure Notice when no dataset loaded yet */}
      {isPlaceholder && (
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-300 leading-snug">
            Showing <span className="font-semibold text-white">{activeFormat.label}</span> schema example. Scan a URL or upload a CSV for live rows.
          </p>
          <button
            type="button"
            onClick={() => onLoadSampleBusiness('services')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-sky-200 bg-sky-950/90 hover:bg-sky-900 border border-sky-800 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>Load Sample</span>
          </button>
        </div>
      )}

      {/* Syntax-Highlighted Code Viewport */}
      <div className="flex-1 min-h-[340px] xl:min-h-0 bg-[#0F172A] overflow-auto">
        {!isPlaceholder && sourceReviews.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <p className="text-sm font-medium text-slate-200">
              No rows match your current filters
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Switch scope to All or clear filters in the Workbench to inspect generated export lines.
            </p>
          </div>
        ) : (
          <div className="py-3 min-w-0">
            <SyntaxHighlightedCode
              code={previewCode}
              format={exportFormat}
              wrapLines={wrapLines}
            />
          </div>
        )}
      </div>

      {/* Factual Status Footer */}
      <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
        <span className="truncate">
          {isPlaceholder
            ? `Schema sample · ${stats.lineCount} lines`
            : `Showing ${previewRows.length} of ${sourceReviews.length.toLocaleString()} rows · ${stats.lineCount} lines`}
        </span>
        <span className="shrink-0 text-slate-500">
          {stats.previewBytes} · UTF-8
        </span>
      </div>
    </aside>
  );
}
