import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Globe,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { FlagBadge } from './FlagBadge';
import { SAMPLE_BUSINESSES } from '../data/sampleCatalog';
import {
  CatalogProduct,
  EXPORT_FORMAT_OPTIONS,
  ExportFormat,
  GeneratedReview,
  LANGUAGE_OPTIONS,
  ReviewLanguage,
  SampleBusinessId,
  StoreVolumePreset,
} from '../types/reviews';
import { normalizeReviewBody } from '../utils/generator';
import { AnalyticsGraphs, PresetCurvePreviewGraph } from './AnalyticsGraphs';
import { ExportPreviewSidePanel } from './ExportPreviewSidePanel';
import {
  EndlessReviewBanner,
  LiveReviewSpotlightCarousel,
  ServiceShowcaseCarousel,
} from './ServiceShowcaseCarousel';

interface WorkbenchViewProps {
  totalProductsCount: number;
  eligibleProducts: CatalogProduct[];
  excludedCount: number;
  reviews: GeneratedReview[];
  exportFormat: ExportFormat;
  storeBaseUrl: string;
  volumePreset: StoreVolumePreset;
  minReviewsPerItem: number;
  maxReviewsPerItem: number;
  maxTotalReviews: number | null;
  zeroReviewRatio: number;
  selectedLanguages: ReviewLanguage[];
  activeBusinessLabel: string;
  isAdapted: boolean;
  isAdapting: boolean;
  websiteUrl: string;
  isScanningWebsite: boolean;
  scanError: string | null;
  onWebsiteUrlChange: (next: string) => void;
  onScanWebsite: (url: string) => void;
  onUploadFile: (file: File) => void;
  onLoadSampleBusiness: (id: SampleBusinessId) => void;
  onSelectExportFormat: (format: ExportFormat) => void;
  onRegenerateReview: (reviewId: string) => void;
  onDeleteReview: (reviewId: string) => void;
  onExportCSV: () => void;
  onCopyCSV: () => Promise<boolean>;
  onOpenDatasetTab: () => void;
  aiOnline: boolean;
  onOpenAISettings: () => void;
  onAuditReviews: (targetReviews: GeneratedReview[]) => Promise<void>;
  onRewriteFlaggedReviews: (flaggedReviews: GeneratedReview[]) => Promise<void>;
  isAuditingReviews: boolean;
  isRewritingReviews: boolean;
  auditError: string | null;
  reviewAuditMap: Record<
    string,
    { humanScore: number; verdict: 'human' | 'generic' | 'ai_flagged'; reason: string }
  >;
}

const VOICE_LABELS: Record<string, string> = {
  minimalist: 'Short note',
  casual: 'Casual buyer',
  sports: 'Regular user',
  family: 'Household',
  technical: 'Detail-focused',
};

type SentimentFilter =
  | 'all'
  | 'positive'
  | 'five_star'
  | 'mixed'
  | 'negative'
  | 'one_star';

function matchesSentiment(stars: number, sentiment: SentimentFilter): boolean {
  switch (sentiment) {
    case 'positive':
      return stars >= 4;
    case 'five_star':
      return stars === 5;
    case 'mixed':
      return stars === 3;
    case 'negative':
      return stars <= 2;
    case 'one_star':
      return stars === 1;
    case 'all':
    default:
      return true;
  }
}

export function WorkbenchView({
  totalProductsCount,
  eligibleProducts,
  excludedCount,
  reviews,
  exportFormat,
  storeBaseUrl,
  volumePreset,
  minReviewsPerItem,
  maxReviewsPerItem,
  maxTotalReviews,
  zeroReviewRatio,
  selectedLanguages,
  activeBusinessLabel,
  isAdapted,
  isAdapting,
  websiteUrl,
  isScanningWebsite,
  scanError,
  onWebsiteUrlChange,
  onScanWebsite,
  onUploadFile,
  onLoadSampleBusiness,
  onSelectExportFormat,
  onRegenerateReview,
  onDeleteReview,
  onExportCSV,
  onCopyCSV,
  onOpenDatasetTab,
  aiOnline,
  onOpenAISettings,
  onAuditReviews,
  onRewriteFlaggedReviews,
  isAuditingReviews,
  isRewritingReviews,
  auditError,
  reviewAuditMap,
}: WorkbenchViewProps) {
  const emptyFileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<ReviewLanguage | 'all'>('all');
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [buyerFilter, setBuyerFilter] = useState<'all' | 'returning' | 'first'>('all');
  const [copied, setCopied] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(true);

  const handleSelectSentiment = (next: SentimentFilter) => {
    setSentimentFilter((prev) => (prev === next && next !== 'all' ? 'all' : next));
    setStarFilter('all');
  };

  const handleSelectStarFilter = (next: number | 'all') => {
    setStarFilter(next);
    if (next === 'all') {
      setSentimentFilter('all');
    } else if (next === 5) {
      setSentimentFilter('five_star');
    } else if (next === 3) {
      setSentimentFilter('mixed');
    } else if (next === 1) {
      setSentimentFilter('one_star');
    } else {
      setSentimentFilter('all');
    }
  };

  const activeFormat =
    EXPORT_FORMAT_OPTIONS.find((f) => f.id === exportFormat) ?? EXPORT_FORMAT_OPTIONS[0];

  const languageMetaMap = useMemo(() => {
    const map: Record<string, (typeof LANGUAGE_OPTIONS)[number]> = {};
    for (const opt of LANGUAGE_OPTIONS) map[opt.code] = opt;
    return map;
  }, []);

  const analytics = useMemo(() => {
    const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const reviewsPerProduct = new Map<string, number>();
    const emailCounts = new Map<string, number>();
    const bodyCounts = new Map<string, number>();
    const categories = new Set<string>();
    let sumStars = 0;

    for (const p of eligibleProducts) {
      reviewsPerProduct.set(`${p.item_id}::${p.item_slug}`, 0);
    }

    for (const r of reviews) {
      starCounts[r.stars] = (starCounts[r.stars] || 0) + 1;
      sumStars += r.stars;
      categories.add(r.category);
      const key = `${r.item_id}::${r.item_slug}`;
      reviewsPerProduct.set(key, (reviewsPerProduct.get(key) || 0) + 1);
      emailCounts.set(r.reviewer_email, (emailCounts.get(r.reviewer_email) || 0) + 1);
      const normBody = normalizeReviewBody(r.body);
      bodyCounts.set(normBody, (bodyCounts.get(normBody) || 0) + 1);
    }

    // Long-tail product distribution buckets aligned with 0–15 skewed organic curve
    const buckets = [
      { label: '0 reviews', count: 0 },
      { label: '1–2 reviews', count: 0 },
      { label: '3–5 reviews', count: 0 },
      { label: '6–10 reviews', count: 0 },
      { label: '11+ reviews', count: 0 },
    ];

    let reviewedProductCount = 0;
    let zeroReviewProductCount = 0;

    for (const count of reviewsPerProduct.values()) {
      if (count === 0) {
        buckets[0].count += 1;
        zeroReviewProductCount += 1;
      } else {
        reviewedProductCount += 1;
        if (count <= 2) buckets[1].count += 1;
        else if (count <= 5) buckets[2].count += 1;
        else if (count <= 10) buckets[3].count += 1;
        else buckets[4].count += 1;
      }
    }

    let returningBuyerEmails = 0;
    let returningReviewRows = 0;
    for (const freq of emailCounts.values()) {
      if (freq > 1) {
        returningBuyerEmails += 1;
        returningReviewRows += freq;
      }
    }

    const returningReviewPct =
      reviews.length > 0 ? (returningReviewRows / reviews.length) * 100 : 0;

    let duplicateBodyRows = 0;
    for (const count of bodyCounts.values()) {
      if (count > 1) duplicateBodyRows += count;
    }
    const uniqueBodyPct =
      reviews.length > 0 ? ((reviews.length - duplicateBodyRows) / reviews.length) * 100 : 100;

    return {
      starCounts,
      average: reviews.length > 0 ? sumStars / reviews.length : 0,
      categories: Array.from(categories),
      buckets,
      reviewedProductCount,
      zeroReviewProductCount,
      uniqueBuyers: emailCounts.size,
      returningBuyerEmails,
      returningReviewRows,
      returningReviewPct,
      uniqueBodyPct,
      duplicateBodyRows,
    };
  }, [eligibleProducts, reviews]);

  const sentimentCounts = useMemo(() => {
    const counts = {
      all: reviews.length,
      positive: 0,
      five_star: 0,
      mixed: 0,
      negative: 0,
      one_star: 0,
    };
    for (const r of reviews) {
      if (r.stars >= 4) counts.positive += 1;
      if (r.stars === 5) counts.five_star += 1;
      if (r.stars === 3) counts.mixed += 1;
      if (r.stars <= 2) counts.negative += 1;
      if (r.stars === 1) counts.one_star += 1;
    }
    return counts;
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reviews.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (languageFilter !== 'all' && r.language !== languageFilter) return false;
      if (starFilter !== 'all' && r.stars !== starFilter) return false;
      if (!matchesSentiment(r.stars, sentimentFilter)) return false;
      if (buyerFilter === 'returning' && !r.isReturningCustomer) return false;
      if (buyerFilter === 'first' && r.isReturningCustomer) return false;
      if (q) {
        const hay = `${r.item_name} ${r.subject} ${r.body} ${r.reviewer_email} ${r.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reviews, searchQuery, categoryFilter, languageFilter, starFilter, sentimentFilter, buyerFilter]);

  const isInspectingCriticalFeedback =
    sentimentFilter === 'negative' ||
    sentimentFilter === 'one_star' ||
    sentimentFilter === 'mixed' ||
    starFilter === 1 ||
    starFilter === 2 ||
    starFilter === 3;

  const criticalPatternOfferings = useMemo(() => {
    if (!isInspectingCriticalFeedback || filteredReviews.length === 0) return [];
    const counts = new Map<string, number>();
    for (const r of filteredReviews) {
      counts.set(r.item_name, (counts.get(r.item_name) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [isInspectingCriticalFeedback, filteredReviews]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'all' ||
    languageFilter !== 'all' ||
    starFilter !== 'all' ||
    sentimentFilter !== 'all' ||
    buyerFilter !== 'all';

  const resetAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setLanguageFilter('all');
    setStarFilter('all');
    setSentimentFilter('all');
    setBuyerFilter('all');
  };

  const previewLimit = 24;
  const visibleReviews = filteredReviews.slice(0, previewLimit);

  const handleCopy = async () => {
    const ok = await onCopyCSV();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleEmptyUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim() || isScanningWebsite) return;
    onScanWebsite(websiteUrl.trim());
  };

  if (totalProductsCount === 0) {
    return (
      <div className="flex-1 min-w-0 flex flex-col xl:flex-row">
        <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                Generate Organic Reviews for Any Business
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
                Paste any website URL to automatically scan its services or store catalog, or upload a Shopify, Judge.me, or standard CSV. Nothing is preloaded—every run adapts fresh across 16 global languages.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCodePanel((prev) => !prev)}
              aria-pressed={showCodePanel}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                showCodePanel
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {showCodePanel ? (
                <>
                  <PanelRightClose className="w-4 h-4" aria-hidden="true" />
                  <span>Hide Code</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-4 h-4" aria-hidden="true" />
                  <span>Live Export</span>
                </>
              )}
            </button>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: Scan any website */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Globe className="w-4 h-4 text-sky-700" aria-hidden="true" />
                <span>Scan Any Website</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Works with service websites, agencies, clinics, SaaS tools, hotels, salons, and online stores. Automatically extracts offerings and generates tailored multilingual reviews.
              </p>
            </div>

            <form onSubmit={handleEmptyUrlSubmit} className="space-y-3">
              <input
                type="text"
                inputMode="url"
                value={websiteUrl}
                onChange={(e) => onWebsiteUrlChange(e.target.value)}
                placeholder="https://yourbusiness.com"
                aria-label="Website URL to scan"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
              <button
                type="submit"
                disabled={!websiteUrl.trim() || isScanningWebsite}
                className="w-full h-10 inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              >
                {isScanningWebsite ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Scanning website...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>Scan & Generate Reviews</span>
                  </>
                )}
              </button>
              {scanError && (
                <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {scanError}
                </p>
              )}
            </form>
          </section>

          {/* Option B: Upload any product CSV */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Upload className="w-4 h-4 text-sky-700" aria-hidden="true" />
                <span>Upload Product CSV</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Supports Judge.me exports, Shopify product CSVs, or any simple catalog list. Auto-detects handles, URLs, product IDs, and categories.
              </p>
            </div>

            <div>
              <input
                ref={emptyFileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadFile(file);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => emptyFileInputRef.current?.click()}
                className="w-full h-10 inline-flex items-center justify-center gap-2 px-4 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-600" aria-hidden="true" />
                <span>Choose CSV File</span>
              </button>
            </div>
          </section>
        </div>

        {/* Endless Moving Multi-Industry Reviews Banner */}
        <EndlessReviewBanner />

        {/* Horizontal Slide Carousel Across 8 Business Types */}
        <ServiceShowcaseCarousel onLoadSampleBusiness={onLoadSampleBusiness} />

        {/* Live Distribution Curve Preview Graph */}
        <PresetCurvePreviewGraph
          volumePreset={volumePreset}
          minReviewsPerItem={minReviewsPerItem}
          maxReviewsPerItem={maxReviewsPerItem}
          maxTotalReviews={maxTotalReviews}
          zeroReviewRatio={zeroReviewRatio}
          selectedLanguages={selectedLanguages}
        />

        {/* Quiet optional sample demos */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Or load a sample catalog directly:</span>
            {SAMPLE_BUSINESSES.map((biz, idx) => (
              <React.Fragment key={biz.id}>
                {idx > 0 && <span aria-hidden="true" className="text-slate-300">·</span>}
                <button
                  type="button"
                  onClick={() => onLoadSampleBusiness(biz.id)}
                  className="text-sky-700 hover:text-sky-900 font-medium transition-colors cursor-pointer"
                >
                  {biz.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
        </div>

        {showCodePanel && (
          <ExportPreviewSidePanel
            reviews={reviews}
            filteredReviews={filteredReviews}
            exportFormat={exportFormat}
            storeBaseUrl={storeBaseUrl}
            activeBusinessLabel={activeBusinessLabel}
            onSelectExportFormat={onSelectExportFormat}
            onExportDownload={onExportCSV}
            onCopyExport={onCopyCSV}
            onOpenDatasetTab={onOpenDatasetTab}
            onLoadSampleBusiness={onLoadSampleBusiness}
            onClose={() => setShowCodePanel(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col xl:flex-row">
      <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-8">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
              Organic Review Workbench
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Active voice:{' '}
              <span className="font-semibold text-slate-800">{activeBusinessLabel}</span>
              {' · '}
              <span className="font-mono text-xs text-slate-600">
                {activeFormat.label}
              </span>
              {isAdapting ? (
                <span className="text-sky-700"> · Auto-scanning products & tailoring copy...</span>
              ) : isAdapted ? (
                <span className="text-emerald-700"> · Scanned & adapted</span>
              ) : (
                <span className="text-slate-500"> · Category-aware ready</span>
              )}
              {excludedCount > 0 && (
                <span className="text-slate-500 font-mono tabular-nums">
                  {' '}· {excludedCount} excluded
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCodePanel((prev) => !prev)}
              aria-pressed={showCodePanel}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                showCodePanel
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {showCodePanel ? (
                <>
                  <PanelRightClose className="w-4 h-4" aria-hidden="true" />
                  <span>Hide Code</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-4 h-4" aria-hidden="true" />
                  <span>Live Export</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={reviews.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>Copied {activeFormat.shortLabel}</span>
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

        {/* Flat Summary Metrics Strip */}
        <section
          aria-label="Dataset summary"
          className={`bg-white border border-slate-200 rounded-xl grid grid-cols-2 divide-y divide-slate-200 ${
            showCodePanel
              ? '2xl:grid-cols-4 2xl:divide-y-0 2xl:divide-x'
              : 'xl:grid-cols-4 xl:divide-y-0 xl:divide-x'
          }`}
        >
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Generated Reviews</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {reviews.length.toLocaleString()}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {analytics.uniqueBuyers.toLocaleString()} buyers
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Reviewed Offerings</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {analytics.reviewedProductCount.toLocaleString()}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              / {eligibleProducts.length} · {analytics.zeroReviewProductCount} at 0
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Returning Customer Rows</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {analytics.returningReviewPct.toFixed(0)}%
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {analytics.returningBuyerEmails} repeat buyers
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Unique Review Bodies</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {reviews.length > 0 ? `${analytics.uniqueBodyPct.toFixed(0)}%` : '—'}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {analytics.duplicateBodyRows} duplicates · {analytics.average.toFixed(2)}★ avg
            </span>
          </div>
        </div>
      </section>

      {/* Endless Moving Banner of Generated Reviews */}
      {reviews.length > 0 && <EndlessReviewBanner reviews={reviews} />}

      {/* 4 Interactive Analytics Graphs (Spread, Timeline, Language Mix, Star Curve) */}
      {eligibleProducts.length > 0 && (
        <AnalyticsGraphs
          eligibleProducts={eligibleProducts}
          reviews={reviews}
          volumePreset={volumePreset}
          minReviewsPerItem={minReviewsPerItem}
          maxReviewsPerItem={maxReviewsPerItem}
          maxTotalReviews={maxTotalReviews}
          starCounts={analytics.starCounts}
          averageRating={analytics.average}
          buckets={analytics.buckets}
          starFilter={starFilter}
          languageFilter={languageFilter}
          onSelectStarFilter={handleSelectStarFilter}
          onSelectLanguageFilter={setLanguageFilter}
        />
      )}

      {/* Horizontal Slide Spotlight Carousel */}
      {reviews.length > 0 && (
        <LiveReviewSpotlightCarousel
          reviews={reviews}
          onRegenerateReview={onRegenerateReview}
        />
      )}

      {/* Live Preview Feed */}
      <section aria-label="Generated review preview" className="bg-white border border-slate-200 rounded-xl">
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Live Review Preview
              </h2>
              <span className="text-xs text-slate-400" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                Showing {visibleReviews.length} of {filteredReviews.length.toLocaleString()}
              </span>
              {hasActiveFilters && (
                <>
                  <span className="text-xs text-slate-400" aria-hidden="true">
                    ·
                  </span>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-900 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>Reset filters</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:flex-initial">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search product, email, text..."
                  className="w-full sm:w-52 h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
                />
              </div>

              <select
                aria-label="Filter by language"
                value={languageFilter}
                onChange={(e) =>
                  setLanguageFilter(e.target.value as ReviewLanguage | 'all')
                }
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
                aria-label="Filter by buyer type"
                value={buyerFilter}
                onChange={(e) =>
                  setBuyerFilter(e.target.value as 'all' | 'returning' | 'first')
                }
                className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
              >
                <option value="all">All Buyers</option>
                <option value="returning">Returning Customers</option>
                <option value="first">One-Time Buyers</option>
              </select>

              <select
                aria-label="Filter by category"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {analytics.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by star rating"
                value={starFilter}
                onChange={(e) =>
                  handleSelectStarFilter(
                    e.target.value === 'all' ? 'all' : Number(e.target.value)
                  )
                }
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
          </div>

          {/* Sentiment Visibility Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Sentiment</span>
              <div
                role="tablist"
                aria-label="Filter reviews by sentiment"
                className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg"
              >
                {(
                  [
                    {
                      id: 'all',
                      label: 'All',
                      count: sentimentCounts.all,
                      activeText: 'text-slate-900',
                    },
                    {
                      id: 'positive',
                      label: 'Positive (4–5★)',
                      count: sentimentCounts.positive,
                      activeText: 'text-emerald-700',
                    },
                    {
                      id: 'five_star',
                      label: '5-Star Only',
                      count: sentimentCounts.five_star,
                      activeText: 'text-emerald-700',
                    },
                    {
                      id: 'mixed',
                      label: 'Mixed (3★)',
                      count: sentimentCounts.mixed,
                      activeText: 'text-amber-700',
                    },
                    {
                      id: 'negative',
                      label: 'Negative (1–2★)',
                      count: sentimentCounts.negative,
                      activeText: 'text-rose-700',
                    },
                    {
                      id: 'one_star',
                      label: '1-Star Only',
                      count: sentimentCounts.one_star,
                      activeText: 'text-rose-700',
                    },
                  ] as const
                ).map((opt) => {
                  const isActive = sentimentFilter === opt.id && starFilter === 'all';
                  const isExactMatch =
                    isActive ||
                    (opt.id === 'five_star' && starFilter === 5) ||
                    (opt.id === 'mixed' && starFilter === 3) ||
                    (opt.id === 'one_star' && starFilter === 1);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="tab"
                      aria-selected={isExactMatch}
                      onClick={() => handleSelectSentiment(opt.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                        isExactMatch
                          ? `bg-white shadow-xs ${opt.activeText}`
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span
                        className={`font-mono tabular-nums text-[11px] ${
                          isExactMatch ? 'opacity-80' : 'text-slate-400'
                        }`}
                      >
                        {opt.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Negative / Mixed Feedback Pattern Strip */}
        {isInspectingCriticalFeedback && filteredReviews.length > 0 && (
          <div
            className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
              sentimentFilter === 'mixed' || starFilter === 3
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                : 'bg-rose-50/70 border-rose-200/80 text-rose-950'
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <AlertTriangle
                className={`w-3.5 h-3.5 shrink-0 ${
                  sentimentFilter === 'mixed' || starFilter === 3
                    ? 'text-amber-600'
                    : 'text-rose-600'
                }`}
                aria-hidden="true"
              />
              <span className="font-semibold">
                {sentimentFilter === 'mixed' || starFilter === 3
                  ? 'Mixed feedback pattern'
                  : 'Negative feedback pattern'}
              </span>
              <span aria-hidden="true" className="opacity-40">
                ·
              </span>
              <span className="font-mono tabular-nums">
                {filteredReviews.length} review{filteredReviews.length === 1 ? '' : 's'}
                {reviews.length > 0
                  ? ` (${((filteredReviews.length / reviews.length) * 100).toFixed(1)}% of dataset)`
                  : ''}
              </span>
              {criticalPatternOfferings.length > 0 && (
                <>
                  <span aria-hidden="true" className="opacity-40">
                    ·
                  </span>
                  <span>Most affected:</span>
                  {criticalPatternOfferings.map(([name, count], idx) => (
                    <React.Fragment key={name}>
                      {idx > 0 && (
                        <span aria-hidden="true" className="opacity-40">
                          ,
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSearchQuery(name)}
                        className="underline decoration-current/40 hover:decoration-current font-medium cursor-pointer"
                        title={`Filter to ${name}`}
                      >
                        {name} ({count})
                      </button>
                    </React.Fragment>
                  ))}
                </>
              )}
            </div>
            <span className="text-[11px] opacity-75">
              Use the regenerate or delete icons on any row to adjust copy
            </span>
          </div>
        )}

        {/* AI Authenticity & Genericness Detector Bar */}
        {visibleReviews.length > 0 && (() => {
          const auditedVisible = visibleReviews
            .map((r) => ({ review: r, audit: reviewAuditMap[r.id] }))
            .filter((x) => Boolean(x.audit));
          const flaggedVisible = auditedVisible
            .filter((x) => x.audit.verdict !== 'human')
            .map((x) => x.review);
          const avgHuman =
            auditedVisible.length > 0
              ? Math.round(
                  auditedVisible.reduce((s, x) => s + x.audit.humanScore, 0) /
                    auditedVisible.length
                )
              : null;

          return (
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-sky-600" aria-hidden="true" />
                  <span>AI Review Detector</span>
                </span>
                {avgHuman !== null ? (
                  <>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                        avgHuman >= 80
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : avgHuman >= 60
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {avgHuman}% Human Score ({auditedVisible.length} checked)
                    </span>
                    {flaggedVisible.length > 0 && (
                      <span className="text-[11px] text-rose-700 font-medium">
                        {flaggedVisible.length} generic / AI-flagged
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-500">
                    Check if generated reviews sound generic, off-domain, or AI-written.
                  </span>
                )}
                {auditError && (
                  <span className="text-[11px] text-rose-600 font-medium">{auditError}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {flaggedVisible.length > 0 && (
                  <button
                    type="button"
                    disabled={isRewritingReviews || isAuditingReviews}
                    onClick={() => onRewriteFlaggedReviews(flaggedVisible)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 rounded-lg transition-all cursor-pointer"
                  >
                    {isRewritingReviews ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isRewritingReviews
                        ? 'Rewriting…'
                        : `AI Rewrite Flagged (${flaggedVisible.length})`}
                    </span>
                  </button>
                )}

                {aiOnline ? (
                  <button
                    type="button"
                    disabled={isAuditingReviews || isRewritingReviews}
                    onClick={() => onAuditReviews(visibleReviews.slice(0, 35))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {isAuditingReviews ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    )}
                    <span>
                      {isAuditingReviews
                        ? 'Scanning…'
                        : auditedVisible.length > 0
                        ? 'Re-Scan Batch'
                        : `Detect AI / Generic (${Math.min(35, visibleReviews.length)})`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenAISettings}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Connect AI to Detect</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {visibleReviews.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-900">
              {reviews.length === 0
                ? 'No reviews generated yet'
                : 'No reviews match your current filters'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {reviews.length === 0
                ? 'Select one or more product categories on the left and click Randomize & Generate Reviews.'
                : 'Clear the search box or reset filters to see more rows.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {visibleReviews.map((review) => (
              <article
                key={review.id}
                className="p-5 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Clean unboxed metadata row */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-0.5 text-amber-600 font-mono font-semibold">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < review.stars
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-slate-200 fill-slate-200'
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                        <span className="ml-1 text-slate-700">{review.stars}.0</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-800">
                        {review.item_name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{review.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {review.review_date}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1.5">
                        {languageMetaMap[review.language] && (
                          <FlagBadge
                            countryCode={languageMetaMap[review.language].countryCode}
                            emoji={languageMetaMap[review.language].flag}
                            size="sm"
                          />
                        )}
                        <span>{languageMetaMap[review.language]?.label || review.language}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{VOICE_LABELS[review.voice] || review.voice}</span>
                      {review.stars <= 2 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-rose-700">Negative</span>
                        </>
                      )}
                      {review.stars === 3 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-amber-700">Mixed</span>
                        </>
                      )}
                      {review.isReturningCustomer && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-sky-700">
                            Returning customer
                          </span>
                        </>
                      )}
                      {reviewAuditMap[review.id] && (() => {
                        const audit = reviewAuditMap[review.id];
                        return (
                          <>
                            <span aria-hidden="true">·</span>
                            <span
                              title={audit.reason}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                audit.verdict === 'human'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : audit.verdict === 'generic'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {audit.verdict === 'human'
                                ? `Human ${audit.humanScore}%`
                                : audit.verdict === 'generic'
                                ? `Generic ${audit.humanScore}%`
                                : `AI Flagged ${audit.humanScore}%`}
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    {reviewAuditMap[review.id] && reviewAuditMap[review.id].verdict !== 'human' && (
                      <p className="text-[11px] text-amber-700 pt-0.5">
                        Detector note: {reviewAuditMap[review.id].reason}
                      </p>
                    )}

                    <div dir={review.language === 'ar' || review.language === 'he' ? 'rtl' : 'ltr'}>
                      <h3 className="text-sm font-semibold text-slate-900 pt-1">
                        {review.subject}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed max-w-[74ch]">
                        {review.body}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 pt-1">
                      <span className="font-medium text-slate-700">{review.reviewer_name}</span>
                      {' · '}
                      <span className="font-mono text-slate-400">{review.reviewer_email}</span>
                      {' · '}
                      <span className="font-mono text-slate-400">{review.item_slug}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onRegenerateReview(review.id)}
                      title="Regenerate this review"
                      aria-label={`Regenerate review for ${review.item_name}`}
                      className="p-2 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteReview(review.id)}
                      title="Remove this review"
                      aria-label={`Delete review for ${review.item_name}`}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {filteredReviews.length > previewLimit && (
          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-4 rounded-b-xl">
            <span className="text-xs text-slate-600 font-mono tabular-nums">
              + {(filteredReviews.length - previewLimit).toLocaleString()} additional rows ready in full CSV table
            </span>
            <button
              type="button"
              onClick={onOpenDatasetTab}
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 cursor-pointer whitespace-nowrap"
            >
              Inspect All Rows →
            </button>
          </div>
        )}
      </section>
      </div>

      {showCodePanel && (
        <ExportPreviewSidePanel
          reviews={reviews}
          filteredReviews={filteredReviews}
          exportFormat={exportFormat}
          storeBaseUrl={storeBaseUrl}
          activeBusinessLabel={activeBusinessLabel}
          onSelectExportFormat={onSelectExportFormat}
          onExportDownload={onExportCSV}
          onCopyExport={onCopyCSV}
          onOpenDatasetTab={onOpenDatasetTab}
          onLoadSampleBusiness={onLoadSampleBusiness}
          onClose={() => setShowCodePanel(false)}
        />
      )}
    </div>
  );
}
