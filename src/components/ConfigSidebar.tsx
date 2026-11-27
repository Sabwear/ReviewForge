import React, { useRef, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  FileSpreadsheet,
  Globe,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { CORE_TARGET_CATEGORIES, SAMPLE_BUSINESSES } from '../data/sampleCatalog';
import { isIPTVCatalog } from '../data/universalComposer';
import { FlagBadge } from './FlagBadge';
import {
  BusinessVoicePack,
  CatalogFormat,
  CatalogProduct,
  EXPORT_FORMAT_OPTIONS,
  GeneratorConfig,
  LANGUAGE_OPTIONS,
  ReviewLanguage,
  SampleBusinessId,
  StoreVolumePreset,
} from '../types/reviews';
import {
  VOLUME_PRESET_CURVES,
  isExcludedByKeywords,
  parseExclusionKeywords,
} from '../utils/generator';

interface ConfigSidebarProps {
  products: CatalogProduct[];
  sourceLabel: string;
  detectedFormat: CatalogFormat;
  activeSampleId: SampleBusinessId | null;
  parseError: string | null;
  config: GeneratorConfig;
  eligibleCount: number;
  websiteUrl: string;
  isScanningWebsite: boolean;
  scanError: string | null;
  businessContext: string;
  adaptedPack: BusinessVoicePack | null;
  isAdapting: boolean;
  adaptError: string | null;
  onWebsiteUrlChange: (next: string) => void;
  onScanWebsite: (url: string) => void;
  onBusinessContextChange: (next: string) => void;
  onAdaptBusiness: () => void;
  onResetAdaptedPack: () => void;
  onConfigChange: (next: GeneratorConfig) => void;
  onUploadFile: (file: File) => void;
  onPasteCSV: (rawText: string) => void;
  onLoadSampleBusiness: (id: SampleBusinessId) => void;
  onClearWorkspace: () => void;
  onGenerate: () => void;
}

const FORMAT_LABELS: Record<CatalogFormat, string> = {
  judge_me: 'Judge.me CSV detected',
  shopify: 'Shopify store catalog detected',
  website: 'Website services & offerings scanned',
  standard: 'Standard CSV',
};

export function ConfigSidebar({
  products,
  sourceLabel,
  detectedFormat,
  activeSampleId,
  parseError,
  config,
  eligibleCount,
  websiteUrl,
  isScanningWebsite,
  scanError,
  businessContext,
  adaptedPack,
  isAdapting,
  adaptError,
  onWebsiteUrlChange,
  onScanWebsite,
  onBusinessContextChange,
  onAdaptBusiness,
  onResetAdaptedPack,
  onConfigChange,
  onUploadFile,
  onPasteCSV,
  onLoadSampleBusiness,
  onClearWorkspace,
  onGenerate,
}: ConfigSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourceMode, setSourceMode] = useState<'website' | 'csv'>('website');
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');

  const exclusionKeywords = React.useMemo(
    () => (config.excludeByKeywords ? parseExclusionKeywords(config.excludeKeywords) : []),
    [config.excludeByKeywords, config.excludeKeywords]
  );

  const iptvDetected = React.useMemo(() => isIPTVCatalog(products), [products]);
  const hasEmbeddedProductUrls = React.useMemo(
    () => products.some((p) => Boolean(p.product_url && p.product_url.trim())),
    [products]
  );

  const categoryStats = React.useMemo(() => {
    const map = new Map<string, { total: number; eligible: number }>();
    for (const p of products) {
      const existing = map.get(p.category) || { total: 0, eligible: 0 };
      existing.total += 1;
      if (!isExcludedByKeywords(p, exclusionKeywords)) {
        existing.eligible += 1;
      }
      map.set(p.category, existing);
    }
    return Array.from(map.entries()).map(([name, counts]) => ({
      name,
      total: counts.total,
      eligible: counts.eligible,
    }));
  }, [products, exclusionKeywords]);

  const allCategoryNames = categoryStats.map((c) => c.name);
  const hasIPTVCategories = React.useMemo(
    () =>
      allCategoryNames.some((cat) =>
        CORE_TARGET_CATEGORIES.some((core) => core.toLowerCase() === cat.toLowerCase())
      ),
    [allCategoryNames]
  );

  const toggleCategory = (categoryName: string) => {
    const exists = config.selectedCategories.includes(categoryName);
    const next = exists
      ? config.selectedCategories.filter((c) => c !== categoryName)
      : [...config.selectedCategories, categoryName];
    onConfigChange({ ...config, selectedCategories: next });
  };

  const selectAllCategories = () => {
    onConfigChange({ ...config, selectedCategories: allCategoryNames });
  };

  const selectCoreCategories = () => {
    const core = allCategoryNames.filter((cat) =>
      CORE_TARGET_CATEGORIES.some(
        (target) => target.toLowerCase() === cat.toLowerCase()
      )
    );
    onConfigChange({
      ...config,
      selectedCategories: core.length > 0 ? core : allCategoryNames,
      excludeByKeywords: true,
    });
  };

  const clearCategories = () => {
    onConfigChange({ ...config, selectedCategories: [] });
  };

  const toggleLanguage = (lang: ReviewLanguage) => {
    const exists = config.selectedLanguages.includes(lang);
    const next = exists
      ? config.selectedLanguages.filter((l) => l !== lang)
      : [...config.selectedLanguages, lang];
    onConfigChange({ ...config, selectedLanguages: next });
  };

  const selectAllLanguages = () => {
    onConfigChange({
      ...config,
      selectedLanguages: LANGUAGE_OPTIONS.map((l) => l.code),
    });
  };

  const selectGlobalTop5 = () => {
    onConfigChange({
      ...config,
      selectedLanguages: ['en', 'fr', 'es', 'de', 'ar'],
    });
  };

  const selectMaghrebMix = () => {
    onConfigChange({
      ...config,
      selectedLanguages: ['en', 'fr', 'darija_latin', 'ar'],
    });
  };

  const [languageSort, setLanguageSort] = useState<'selected' | 'alpha' | 'region'>('selected');

  const filteredLanguageOptions = React.useMemo(() => {
    const q = languageSearch.trim().toLowerCase();
    const filtered = !q
      ? [...LANGUAGE_OPTIONS]
      : LANGUAGE_OPTIONS.filter(
          (lang) =>
            lang.label.toLowerCase().includes(q) ||
            lang.nativeLabel.toLowerCase().includes(q) ||
            lang.code.toLowerCase().includes(q) ||
            lang.region.toLowerCase().includes(q)
        );

    const selectedSet = new Set(config.selectedLanguages);
    if (languageSort === 'alpha') {
      return filtered.sort((a, b) => a.label.localeCompare(b.label));
    }
    if (languageSort === 'region') {
      const regionOrder: Record<string, number> = { Global: 0, MENA: 1, Europe: 2, Asia: 3 };
      return filtered.sort(
        (a, b) =>
          (regionOrder[a.region] ?? 9) - (regionOrder[b.region] ?? 9) ||
          a.label.localeCompare(b.label)
      );
    }
    // 'selected': active languages float to the top, preserving regional priority inside each group
    return filtered.sort((a, b) => {
      const aSel = selectedSet.has(a.code) ? 0 : 1;
      const bSel = selectedSet.has(b.code) ? 0 : 1;
      return aSel - bSel;
    });
  }, [languageSearch, languageSort, config.selectedLanguages]);

  const handleFileSelection = (file: File | undefined) => {
    if (file) {
      onUploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelection(file);
  };

  const handleApplyPaste = () => {
    if (pasteText.trim()) {
      onPasteCSV(pasteText);
      setShowPasteBox(false);
      setPasteText('');
    }
  };

  const handleWebsiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim() || isScanningWebsite) return;
    onScanWebsite(websiteUrl.trim());
  };

  const volumePresets: { id: StoreVolumePreset; label: string }[] = [
    { id: 'quiet', label: 'Quiet' },
    { id: 'realistic', label: 'Organic' },
    { id: 'busy', label: 'High Volume' },
  ];

  const activeExportMeta =
    EXPORT_FORMAT_OPTIONS.find((f) => f.id === config.exportFormat) ??
    EXPORT_FORMAT_OPTIONS[0];

  const missingAdaptedLanguages = React.useMemo(() => {
    if (!adaptedPack) return [];
    const covered = new Set(adaptedPack.languagePacks.map((lp) => lp.language));
    return config.selectedLanguages.filter((l) => !covered.has(l));
  }, [adaptedPack, config.selectedLanguages]);

  const isBusy = isScanningWebsite || isAdapting;

  return (
    <aside className="w-full lg:w-[376px] xl:w-[404px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
      {/* Section 1: Website URL Scanner or CSV Upload */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            01. Website Link or Product CSV
          </h2>
          {sourceMode === 'csv' && (
            <button
              type="button"
              onClick={() => setShowPasteBox((v) => !v)}
              className="text-xs text-sky-700 hover:text-sky-800 font-medium transition-colors cursor-pointer"
            >
              {showPasteBox ? 'Close Paste' : 'Paste CSV'}
            </button>
          )}
        </div>

        {/* Clean 2-Mode Source Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-3.5">
          <button
            type="button"
            onClick={() => setSourceMode('website')}
            className={`py-1.5 px-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
              sourceMode === 'website'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Scan Website</span>
          </button>
          <button
            type="button"
            onClick={() => setSourceMode('csv')}
            className={`py-1.5 px-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
              sourceMode === 'csv'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Upload CSV</span>
          </button>
        </div>

        {sourceMode === 'website' ? (
          <form onSubmit={handleWebsiteSubmit} className="space-y-2.5">
            <div>
              <label htmlFor="website-url-input" className="sr-only">
                Business website URL
              </label>
              <div className="relative">
                <Globe
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="website-url-input"
                  type="text"
                  inputMode="url"
                  value={websiteUrl}
                  onChange={(e) => onWebsiteUrlChange(e.target.value)}
                  placeholder="https://yourbusiness.com"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Auto-scans services, plans, or store products on any website (agencies, clinics, SaaS, salons, or Shopify stores).
              </p>
            </div>

            <button
              type="submit"
              disabled={!websiteUrl.trim() || isBusy || config.selectedLanguages.length === 0}
              className="w-full h-10 inline-flex items-center justify-center gap-2 px-3.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
            >
              {isScanningWebsite ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span>Scanning website & services...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Scan Website & Generate Reviews</span>
                </>
              )}
            </button>

            {scanError && (
              <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {scanError}
              </p>
            )}
          </form>
        ) : (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`rounded-lg border border-dashed p-4 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                isDragging
                  ? 'border-sky-600 bg-sky-50'
                  : 'border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  handleFileSelection(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <Upload className="w-5 h-5 text-slate-500 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-900">
                Upload Judge.me, Shopify, or product CSV
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Auto-scans handles, URLs, product IDs & categories on upload
              </p>
            </div>

            {showPasteBox && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={5}
                  placeholder="Paste Judge.me CSV, Shopify export, or simple product list:&#10;title,body,rating,review_date,reviewer_name,reviewer_email,product_url,picture_urls,product_id,product_handle"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasteBox(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyPaste}
                    disabled={!pasteText.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-md transition-colors cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" aria-hidden="true" />
                    Load & Auto-Scan CSV
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Sample Industry Switcher */}
        <div className="mt-3.5">
          <span className="block text-xs text-slate-500 mb-1.5">
            Or load a sample catalog:
          </span>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {SAMPLE_BUSINESSES.map((biz) => {
              const active = activeSampleId === biz.id;
              return (
                <button
                  key={biz.id}
                  type="button"
                  onClick={() => onLoadSampleBusiness(biz.id)}
                  className={`py-1.5 px-1.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer truncate ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={biz.label}
                >
                  {biz.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* File / Website & Format Metadata */}
        <div className="mt-3 space-y-1">
          {products.length > 0 ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5 min-w-0">
                  {detectedFormat === 'website' ? (
                    <Globe className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
                  )}
                  <span className="truncate font-medium text-slate-800">{sourceLabel}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="font-mono tabular-nums text-slate-500">
                    {products.length} {detectedFormat === 'website' ? 'services' : 'items'}
                  </span>
                  <button
                    type="button"
                    onClick={onClearWorkspace}
                    className="text-slate-400 hover:text-slate-800 font-medium transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pl-5">
                {FORMAT_LABELS[detectedFormat]}
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-500">
              No website or catalog loaded yet. Scan a link, upload a CSV, or try a sample above.
            </p>
          )}
        </div>

        {/* Export Format Selector (CSV, Markdown .md, JSON, HTML, TXT) */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="block text-xs font-medium text-slate-600">
              Export format
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              .{activeExportMeta.extension}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {EXPORT_FORMAT_OPTIONS.map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onConfigChange({ ...config, exportFormat: fmt.id })}
                title={fmt.description}
                className={`py-1.5 px-1.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap truncate ${
                  config.exportFormat === fmt.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {fmt.shortLabel}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            {activeExportMeta.description}
          </p>

          {config.exportFormat === 'judge_me' && !hasEmbeddedProductUrls && (
            <div className="pt-1">
              <label
                htmlFor="store-base-url"
                className="block text-[11px] text-slate-500 mb-1"
              >
                Store URL prefix (for Judge.me <span className="font-mono">product_url</span>)
              </label>
              <input
                id="store-base-url"
                type="url"
                value={config.storeBaseUrl}
                onChange={(e) =>
                  onConfigChange({ ...config, storeBaseUrl: e.target.value })
                }
                placeholder="https://your-store.myshopify.com/products"
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
            </div>
          )}
        </div>

        {parseError && (
          <p role="alert" className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {parseError}
          </p>
        )}
      </div>

      {/* Section 2: Business Voice & Fine-Tuning */}
      <div className="p-6 border-b border-slate-200 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            02. Business Voice & Niche
          </h2>
          {adaptedPack && (
            <button
              type="button"
              onClick={onResetAdaptedPack}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Add optional brand or location notes, or re-adapt review copy after changing languages.
        </p>

        <div>
          <label htmlFor="business-context" className="sr-only">
            Optional store or service notes
          </label>
          <textarea
            id="business-context"
            rows={2}
            value={businessContext}
            onChange={(e) => onBusinessContextChange(e.target.value)}
            placeholder="Optional: city/country, tone, warranty, booking style, or target audience..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20 resize-none"
          />
        </div>

        <button
          type="button"
          onClick={onAdaptBusiness}
          disabled={isBusy || products.length === 0 || config.selectedLanguages.length === 0}
          className="w-full h-9 inline-flex items-center justify-center gap-2 px-3.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
        >
          {isAdapting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Adapting vocabulary...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
              <span>
                {adaptedPack ? 'Re-Adapt Copy to Current Offerings' : 'Adapt Copy to Current Offerings'}
              </span>
            </>
          )}
        </button>

        {/* Active Business Voice Readout (clean unboxed metadata) */}
        <div className="pt-1 text-xs space-y-1">
          {adaptedPack ? (
            <>
              <p className="font-semibold text-slate-800">
                Active: {adaptedPack.detectedBusinessName}
              </p>
              <p className="text-slate-500 leading-relaxed">
                {adaptedPack.businessSummary}
              </p>
              {missingAdaptedLanguages.length > 0 && (
                <p className="text-amber-700">
                  Language added since last scan—click Re-Adapt to include it.
                </p>
              )}
            </>
          ) : (
            <p className="text-slate-500">
              Active:{' '}
              <span className="font-medium text-slate-700">
                {products.length === 0
                  ? 'Auto-detects from your website or CSV'
                  : iptvDetected
                    ? 'IPTV & Streaming (built-in)'
                    : 'Category-Aware Storefront (built-in)'}
              </span>
            </p>
          )}
        </div>

        {adaptError && (
          <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {adaptError}
          </p>
        )}
      </div>

      {/* Section 3: Category Selection Checkboxes */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h2 className="text-sm font-semibold text-slate-900">
            03. Target Categories
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {config.selectedCategories.length}/{categoryStats.length} active
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Auto-grouped from scanned services or uploaded products.
        </p>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-3">
          {hasIPTVCategories && (
            <button
              type="button"
              onClick={selectCoreCategories}
              className="flex-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              Core Only
            </button>
          )}
          <button
            type="button"
            onClick={selectAllCategories}
            className="flex-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={clearCategories}
            className="flex-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Clear
          </button>
        </div>

        <div
          role="group"
          aria-label="Service or product categories"
          className="divide-y divide-slate-100 border-t border-b border-slate-200 max-h-[224px] overflow-y-auto"
        >
          {categoryStats.length === 0 ? (
            <p className="py-6 text-xs text-slate-500 text-center">
              Scan a website or upload a CSV to detect categories.
            </p>
          ) : (
            categoryStats.map((cat) => {
              const checked = config.selectedCategories.includes(cat.name);
              const isFullyExcluded = config.excludeByKeywords && cat.eligible === 0;

              return (
                <label
                  key={cat.name}
                  className={`flex items-center justify-between gap-3 py-2.5 px-2 min-h-[40px] cursor-pointer transition-colors select-none ${
                    checked
                      ? 'bg-sky-50/60 hover:bg-sky-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        checked
                          ? 'bg-sky-700 border-sky-700 text-white'
                          : 'bg-white border-slate-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(cat.name)}
                      className="sr-only"
                    />
                    <span
                      className={`text-sm truncate ${
                        checked ? 'font-semibold text-slate-900' : 'text-slate-700'
                      } ${isFullyExcluded ? 'line-through text-slate-400' : ''}`}
                    >
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                    {config.excludeByKeywords && cat.eligible !== cat.total
                      ? `${cat.eligible}/${cat.total}`
                      : `${cat.total}`}
                  </span>
                </label>
              );
            })
          )}
        </div>

        {/* Flexible Keyword Exclusion */}
        <div className="mt-3 space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer select-none py-0.5">
            <input
              type="checkbox"
              checked={config.excludeByKeywords}
              onChange={(e) =>
                onConfigChange({ ...config, excludeByKeywords: e.target.checked })
              }
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600 cursor-pointer accent-sky-700"
            />
            <span className="text-xs text-slate-600 leading-relaxed">
              Exclude items matching keywords
            </span>
          </label>
          {config.excludeByKeywords && (
            <input
              type="text"
              aria-label="Comma-separated keywords to exclude"
              value={config.excludeKeywords}
              onChange={(e) =>
                onConfigChange({ ...config, excludeKeywords: e.target.value })
              }
              placeholder="e.g. test, trial, sample, gift card"
              className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            />
          )}
        </div>
      </div>

      {/* Section 4: Review Languages */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h2 className="text-sm font-semibold text-slate-900">
            04. Review Languages
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {config.selectedLanguages.length}/{LANGUAGE_OPTIONS.length} active
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Mix any of {LANGUAGE_OPTIONS.length} global languages with native idioms, regional names, and Darija (Latin).
        </p>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-2">
          <button
            type="button"
            onClick={selectGlobalTop5}
            className="flex-1 px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Top 5 Global
          </button>
          <button
            type="button"
            onClick={selectMaghrebMix}
            className="flex-1 px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            EN/FR/Darija/AR
          </button>
          <button
            type="button"
            onClick={selectAllLanguages}
            className="px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            All {LANGUAGE_OPTIONS.length}
          </button>
        </div>

        <div className="flex items-center gap-1.5 mb-2.5">
          <input
            type="search"
            value={languageSearch}
            onChange={(e) => setLanguageSearch(e.target.value)}
            placeholder="Filter by language or region (e.g. Swedish, Asia)..."
            aria-label="Filter languages"
            className="flex-1 min-w-0 h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
          />
          <select
            aria-label="Sort languages"
            value={languageSort}
            onChange={(e) => setLanguageSort(e.target.value as 'selected' | 'alpha' | 'region')}
            className="h-8 px-2 rounded-lg border border-slate-200 bg-slate-50/70 text-[11px] font-medium text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer shrink-0"
          >
            <option value="selected">Selected</option>
            <option value="alpha">A–Z</option>
            <option value="region">Region</option>
          </select>
        </div>

        <div
          role="group"
          aria-label="Review languages"
          className="divide-y divide-slate-100 border-t border-b border-slate-200 max-h-[272px] overflow-y-auto"
        >
          {filteredLanguageOptions.map((lang) => {
            const checked = config.selectedLanguages.includes(lang.code);
            return (
              <label
                key={lang.code}
                className={`flex items-center justify-between gap-3 py-2 px-2 min-h-[38px] cursor-pointer transition-colors select-none ${
                  checked ? 'bg-sky-50/60 hover:bg-sky-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                      checked
                        ? 'bg-sky-700 border-sky-700 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLanguage(lang.code)}
                    className="sr-only"
                  />
                  <FlagBadge countryCode={lang.countryCode} emoji={lang.flag} />
                  <span
                    className={`text-sm truncate ${
                      checked ? 'font-semibold text-slate-900' : 'text-slate-700'
                    }`}
                  >
                    {lang.label}
                  </span>
                </div>
                <span
                  dir={lang.dir}
                  className="text-xs text-slate-500 shrink-0"
                >
                  {lang.nativeLabel}
                </span>
              </label>
            );
          })}
          {filteredLanguageOptions.length === 0 && (
            <p className="py-4 text-xs text-slate-500 text-center">
              No matching languages
            </p>
          )}
        </div>
      </div>

      {/* Section 5: Organic Distribution & Generation Limits */}
      <div className="p-6 space-y-5 flex-1">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-1">
            05. Organic Randomization & Limits
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            Skewed organic counts, custom per-item & total limits, returning customers, and 0% duplicate bodies.
          </p>

          <span className="block text-xs font-medium text-slate-600 mb-1.5">
            Activity curve preset
          </span>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {volumePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  const presetMax =
                    (VOLUME_PRESET_CURVES[preset.id] ?? VOLUME_PRESET_CURVES.realistic)
                      .maxCount;
                  onConfigChange({
                    ...config,
                    volumePreset: preset.id,
                    maxReviewsPerItem: Math.max(config.minReviewsPerItem, presetMax),
                  });
                }}
                className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  config.volumePreset === preset.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Active range:{' '}
            <span className="font-mono tabular-nums text-slate-700">
              {config.minReviewsPerItem}–{config.maxReviewsPerItem}
            </span>{' '}
            per item
            {config.maxTotalReviews ? (
              <>
                {' '}· max{' '}
                <span className="font-mono tabular-nums text-slate-700">
                  {config.maxTotalReviews}
                </span>{' '}
                total
              </>
            ) : (
              ' · unlimited total'
            )}
          </p>
        </div>

        {/* Review Generation Limits */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">Generation limits</span>
            <span className="text-[11px] text-slate-400">Per offering & total</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label
                htmlFor="min-per-item"
                className="block text-[11px] text-slate-500 mb-1"
              >
                Min / item
              </label>
              <input
                id="min-per-item"
                type="number"
                min={0}
                max={50}
                value={config.minReviewsPerItem}
                onChange={(e) => {
                  const nextMin = Math.max(0, Math.min(50, Number(e.target.value) || 0));
                  onConfigChange({
                    ...config,
                    minReviewsPerItem: nextMin,
                    maxReviewsPerItem: Math.max(nextMin, config.maxReviewsPerItem),
                  });
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white font-mono tabular-nums text-xs text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="max-per-item"
                className="block text-[11px] text-slate-500 mb-1"
              >
                Max / item
              </label>
              <input
                id="max-per-item"
                type="number"
                min={1}
                max={100}
                value={config.maxReviewsPerItem}
                onChange={(e) => {
                  const raw = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                  onConfigChange({
                    ...config,
                    maxReviewsPerItem: Math.max(config.minReviewsPerItem, raw),
                  });
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white font-mono tabular-nums text-xs text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="max-total-reviews"
                className="block text-[11px] text-slate-500 mb-1"
              >
                Total limit
              </label>
              <input
                id="max-total-reviews"
                type="number"
                min={1}
                max={10000}
                placeholder="None"
                value={config.maxTotalReviews ?? ''}
                onChange={(e) => {
                  const trimmed = e.target.value.trim();
                  if (!trimmed) {
                    onConfigChange({ ...config, maxTotalReviews: null });
                    return;
                  }
                  const parsed = Math.max(1, Math.min(10000, Math.floor(Number(trimmed) || 1)));
                  onConfigChange({ ...config, maxTotalReviews: parsed });
                }}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white font-mono tabular-nums text-xs text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
            </div>
          </div>

          {/* Quick Total Cap Shortcuts */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 shrink-0">Quick cap:</span>
            {[
              { label: 'No limit', val: null },
              { label: '50', val: 50 },
              { label: '150', val: 150 },
              { label: '500', val: 500 },
            ].map((cap) => {
              const active = config.maxTotalReviews === cap.val;
              return (
                <button
                  key={cap.label}
                  type="button"
                  onClick={() =>
                    onConfigChange({ ...config, maxTotalReviews: cap.val })
                  }
                  className={`px-2 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                    active
                      ? 'bg-sky-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cap.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Unreviewed items % */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="zero-ratio" className="font-medium text-slate-700">
              Offerings left with 0 reviews
            </label>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {config.minReviewsPerItem > 0 ? '0% (Min > 0)' : `~${config.zeroReviewRatio}%`}
            </span>
          </div>
          <input
            id="zero-ratio"
            type="range"
            min={0}
            max={45}
            step={5}
            disabled={config.minReviewsPerItem > 0}
            value={config.zeroReviewRatio}
            onChange={(e) =>
              onConfigChange({
                ...config,
                zeroReviewRatio: Number(e.target.value),
              })
            }
            className="w-full accent-sky-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-slate-500">
            {config.minReviewsPerItem > 0
              ? `Disabled while Min / item is set to ${config.minReviewsPerItem}. Set Min to 0 to allow unreviewed items.`
              : 'Leaves niche or newer items unreviewed so coverage looks natural.'}
          </p>
        </div>

        {/* Returning customers % */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="returning-rate" className="font-medium text-slate-700">
              Returning client rate
            </label>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              ~{config.returningCustomerRate}%
            </span>
          </div>
          <input
            id="returning-rate"
            type="range"
            min={0}
            max={50}
            step={2}
            value={config.returningCustomerRate}
            onChange={(e) =>
              onConfigChange({
                ...config,
                returningCustomerRate: Number(e.target.value),
              })
            }
            className="w-full accent-sky-700 cursor-pointer"
          />
          <p className="text-xs text-slate-500">
            Reuses real buyer names & emails across different offerings with spaced dates.
          </p>
        </div>

        {/* Date Window */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="date-start"
              className="block text-xs text-slate-500 mb-1"
            >
              From date
            </label>
            <input
              id="date-start"
              type="date"
              value={config.dateStart}
              onChange={(e) =>
                onConfigChange({ ...config, dateStart: e.target.value })
              }
              className="w-full h-10 px-2.5 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            />
          </div>
          <div>
            <label
              htmlFor="date-end"
              className="block text-xs text-slate-500 mb-1"
            >
              To date
            </label>
            <input
              id="date-end"
              type="date"
              value={config.dateEnd}
              onChange={(e) =>
                onConfigChange({ ...config, dateEnd: e.target.value })
              }
              className="w-full h-10 px-2.5 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            />
          </div>
        </div>

        {/* Active Realism Safeguards Note */}
        <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">Active realism safeguards</p>
          <p>
            Natural 1–5★ curve · 0% duplicate bodies · Zero scam or undelivered-order allegations
          </p>
        </div>

        {/* Generate Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onGenerate}
            disabled={eligibleCount === 0 || config.selectedLanguages.length === 0 || isBusy}
            className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Randomize & Generate Reviews</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
