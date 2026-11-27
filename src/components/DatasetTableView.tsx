import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Search,
  Star,
  WrapText,
} from 'lucide-react';
import {
  EXPORT_FORMAT_OPTIONS,
  ExportFormat,
  GeneratedReview,
  LANGUAGE_OPTIONS,
  ReviewLanguage,
} from '../types/reviews';
import { resolveProductUrl, serializeReviewsByFormat } from '../utils/csv';
import { SyntaxHighlightedCode } from '../utils/syntaxHighlight';

interface DatasetTableViewProps {
  reviews: GeneratedReview[];
  exportFormat: ExportFormat;
  storeBaseUrl: string;
  activeBusinessLabel: string;
  onExportCSV: () => void;
  onCopyCSV: () => Promise<boolean>;
}

const PAGE_SIZE = 40;

export function DatasetTableView({
  reviews,
  exportFormat,
  storeBaseUrl,
  activeBusinessLabel,
  onExportCSV,
  onCopyCSV,
}: DatasetTableViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState<ReviewLanguage | 'all'>('all');
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [previewMode, setPreviewMode] = useState<'table' | 'raw'>(
    exportFormat === 'markdown' ||
      exportFormat === 'json' ||
      exportFormat === 'html' ||
      exportFormat === 'txt'
      ? 'raw'
      : 'table'
  );

  useEffect(() => {
    setPreviewMode(
      exportFormat === 'markdown' ||
        exportFormat === 'json' ||
        exportFormat === 'html' ||
        exportFormat === 'txt'
        ? 'raw'
        : 'table'
    );
  }, [exportFormat]);

  const isJudgeMe = exportFormat === 'judge_me';
  const activeFormat =
    EXPORT_FORMAT_OPTIONS.find((f) => f.id === exportFormat) ?? EXPORT_FORMAT_OPTIONS[0];

  const categories = useMemo(() => {
    return Array.from(new Set(reviews.map((r) => r.category)));
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (languageFilter !== 'all' && r.language !== languageFilter) return false;
      if (starFilter !== 'all' && r.stars !== starFilter) return false;
      if (q) {
        const hay = `${r.item_id} ${r.item_slug} ${r.item_name} ${r.category} ${r.reviewer_name} ${r.reviewer_email} ${r.subject} ${r.body}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, search, categoryFilter, languageFilter, starFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handleCopy = async () => {
    const ok = await onCopyCSV();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const rawPreviewText = useMemo(() => {
    if (previewMode !== 'raw') return '';
    return serializeReviewsByFormat(
      filtered.slice(0, 60),
      exportFormat,
      storeBaseUrl,
      activeBusinessLabel
    );
  }, [previewMode, filtered, exportFormat, storeBaseUrl, activeBusinessLabel]);

  return (
    <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
            {activeFormat.label} Export Preview
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {activeFormat.description}
            {' · '}
            <span className="font-mono text-xs text-slate-500">
              .{activeFormat.extension}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setPreviewMode('table')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                previewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('raw')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                previewMode === 'raw'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw .{activeFormat.extension}
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={reviews.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>Copy {activeFormat.shortLabel}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onExportCSV}
            disabled={reviews.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-200 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Download {activeFormat.label}</span>
          </button>
        </div>
      </div>

      {/* Raw File Preview Panel (when Raw tab selected) */}
      {previewMode === 'raw' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              Live {activeFormat.label} Output Preview
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono tabular-nums">
                Showing {Math.min(filtered.length, 60)} of {filtered.length} rows
              </span>
              <button
                type="button"
                onClick={() => setWrapLines((w) => !w)}
                aria-pressed={wrapLines}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                  wrapLines
                    ? 'bg-sky-50 border-sky-300 text-sky-800'
                    : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                <WrapText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Wrap</span>
              </button>
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              No reviews generated yet. Scan a website or upload a CSV to preview output.
            </p>
          ) : (
            <div className="bg-[#0F172A] overflow-auto max-h-[640px] py-3">
              <SyntaxHighlightedCode
                code={rawPreviewText}
                format={exportFormat}
                wrapLines={wrapLines}
              />
            </div>
          )}
        </div>
      ) : (
      /* Table Panel */
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter rows by handle, name, email..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
            </div>

            <select
              aria-label="Filter table by language"
              value={languageFilter}
              onChange={(e) => {
                setLanguageFilter(e.target.value as ReviewLanguage | 'all');
                setPage(1);
              }}
              className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All Languages</option>
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter table by category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter table by stars"
              value={starFilter}
              onChange={(e) => {
                setStarFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setPage(1);
              }}
              className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
            >
              <option value="all">All Stars</option>
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>
                  {s} Stars
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-mono tabular-nums text-slate-500">
            {filtered.length.toLocaleString()} rows
          </div>
        </div>

        {/* High-Density Table */}
        <div className="overflow-x-auto">
          {isJudgeMe ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-mono text-slate-500">
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">title</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">body</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap text-right">rating</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">review_date</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">reviewer_name</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">reviewer_email</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">product_url</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">product_id</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">product_handle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No rows available. Select categories in the sidebar and click Randomize & Generate Reviews.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/90 transition-colors align-top"
                    >
                      <td
                        dir={row.language === 'ar' ? 'rtl' : 'ltr'}
                        className="py-2.5 px-3 font-medium text-slate-900 min-w-[180px] max-w-[220px]"
                      >
                        {row.subject}
                      </td>
                      <td
                        dir={row.language === 'ar' ? 'rtl' : 'ltr'}
                        className="py-2.5 px-3 text-slate-600 min-w-[280px] max-w-[380px] leading-relaxed"
                      >
                        {row.body}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          {row.stars}
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {row.review_timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                        {row.reviewer_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {row.reviewer_email}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 max-w-[240px] truncate">
                        {resolveProductUrl(row, storeBaseUrl) || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {row.item_id}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                        {row.item_slug}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-mono text-slate-500">
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">item_id</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">item_name</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">category</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">reviewer_email</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap text-right">stars</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">subject</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap">body</th>
                  <th className="py-2.5 px-3 font-medium whitespace-nowrap text-right">review_date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No rows available. Select categories in the sidebar and click Randomize & Generate Reviews.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/90 transition-colors align-top"
                    >
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {row.item_id}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                        <div>{row.item_name}</div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {row.item_slug}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {row.category}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {row.reviewer_email}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          {row.stars}
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                        </span>
                      </td>
                      <td
                        dir={row.language === 'ar' ? 'rtl' : 'ltr'}
                        className="py-2.5 px-3 font-medium text-slate-900 min-w-[200px] max-w-[240px]"
                      >
                        {row.subject}
                      </td>
                      <td
                        dir={row.language === 'ar' ? 'rtl' : 'ltr'}
                        className="py-2.5 px-3 text-slate-600 min-w-[300px] max-w-[420px] leading-relaxed"
                      >
                        {row.body}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500 text-right whitespace-nowrap">
                        {row.review_date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {filtered.length > PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4 text-xs">
            <span className="font-mono tabular-nums text-slate-600">
              Showing {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                Prev
              </button>
              <span className="font-mono tabular-nums text-slate-600 px-1">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
