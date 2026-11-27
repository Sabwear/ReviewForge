import React, { useMemo, useState } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  Calendar,
  Download,
  Globe2,
  RotateCcw,
  Star,
} from 'lucide-react';
import { SAMPLE_BUSINESSES } from '../data/sampleCatalog';
import {
  CatalogProduct,
  EXPORT_FORMAT_OPTIONS,
  ExportFormat,
  GeneratedReview,
  LANGUAGE_OPTIONS,
  ReviewLanguage,
  SampleBusinessId,
} from '../types/reviews';
import { normalizeReviewBody } from '../utils/generator';

interface DashboardViewProps {
  reviews: GeneratedReview[];
  eligibleProducts: CatalogProduct[];
  exportFormat: ExportFormat;
  activeBusinessLabel: string;
  onExportCSV: () => void;
  onOpenWorkbench: () => void;
  onLoadSampleBusiness: (id: SampleBusinessId) => void;
}

type TimeGranularity = 'day' | 'week' | 'month';
type StarChartMode = 'bar' | 'donut';

const STAR_COLORS: Record<number, string> = {
  5: '#059669', // emerald-600
  4: '#0284C7', // sky-600
  3: '#D97706', // amber-600
  2: '#EA580C', // orange-600
  1: '#DC2626', // red-600
};

const LANGUAGE_PALETTE = [
  '#0284C7',
  '#0D9488',
  '#4F46E5',
  '#D97706',
  '#059669',
  '#7C3AED',
  '#DB2777',
  '#2563EB',
  '#EA580C',
  '#0891B2',
  '#65A30D',
  '#9333EA',
  '#E11D48',
  '#0F766E',
  '#4338CA',
  '#B45309',
];

function getWeekStartISO(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return isoDate;
  const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const day = dt.getUTCDay();
  const diff = (day + 6) % 7; // Monday as start of week
  dt.setUTCDate(dt.getUTCDate() - diff);
  return dt.toISOString().slice(0, 10);
}

function formatBucketLabel(key: string, granularity: TimeGranularity): string {
  if (granularity === 'month') {
    const [y, m] = key.split('-').map(Number);
    if (!y || !m) return key;
    const dt = new Date(Date.UTC(y, m - 1, 1));
    return dt.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    });
  }
  const [y, m, d] = key.split('-').map(Number);
  if (!y || !m || !d) return key;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function TimelineTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as
    | {
        count: number;
        avgStars: number;
        returningCount: number;
        rawKey: string;
      }
    | undefined;
  if (!row) return null;

  return (
    <div className="bg-slate-900 text-slate-100 border border-slate-700 rounded-lg px-3.5 py-2.5 shadow-lg text-xs space-y-1">
      <div className="font-semibold text-white">
        {label} <span className="font-mono text-slate-400 font-normal">({row.rawKey})</span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-sky-300">Reviews</span>
        <span className="font-semibold text-white">{row.count}</span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-amber-300">Avg rating</span>
        <span className="font-semibold text-white">{row.avgStars.toFixed(2)}★</span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-emerald-300">Returning buyers</span>
        <span className="font-semibold text-white">{row.returningCount}</span>
      </div>
    </div>
  );
}

function StarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as
    | { label: string; count: number; pct: number; star: number }
    | undefined;
  if (!row) return null;

  return (
    <div className="bg-slate-900 text-slate-100 border border-slate-700 rounded-lg px-3.5 py-2.5 shadow-lg text-xs space-y-1">
      <div className="font-semibold text-white">{row.label}</div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-slate-300">Count</span>
        <span className="font-semibold text-white">{row.count.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-slate-300">Share</span>
        <span className="font-semibold text-white">{row.pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function LanguageTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as
    | {
        flag: string;
        label: string;
        count: number;
        pct: number;
        avgStars: number;
      }
    | undefined;
  if (!row) return null;

  return (
    <div className="bg-slate-900 text-slate-100 border border-slate-700 rounded-lg px-3.5 py-2.5 shadow-lg text-xs space-y-1">
      <div className="font-semibold text-white">
        {row.flag} {row.label}
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-slate-300">Reviews</span>
        <span className="font-semibold text-white">{row.count.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-slate-300">Share</span>
        <span className="font-semibold text-white">{row.pct.toFixed(1)}%</span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-amber-300">Avg rating</span>
        <span className="font-semibold text-white">{row.avgStars.toFixed(2)}★</span>
      </div>
    </div>
  );
}

function CategoryTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload as
    | { firstTime: number; returning: number; total: number; avgStars: number }
    | undefined;
  if (!row) return null;

  return (
    <div className="bg-slate-900 text-slate-100 border border-slate-700 rounded-lg px-3.5 py-2.5 shadow-lg text-xs space-y-1">
      <div className="font-semibold text-white">{label}</div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-sky-300">First-time buyers</span>
        <span className="font-semibold text-white">{row.firstTime}</span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-emerald-300">Returning buyers</span>
        <span className="font-semibold text-white">{row.returning}</span>
      </div>
      <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-amber-300">Avg rating</span>
        <span className="font-semibold text-white">{row.avgStars.toFixed(2)}★</span>
      </div>
    </div>
  );
}

export function DashboardView({
  reviews,
  eligibleProducts,
  exportFormat,
  activeBusinessLabel,
  onExportCSV,
  onOpenWorkbench,
  onLoadSampleBusiness,
}: DashboardViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<ReviewLanguage | 'all'>('all');
  const [starFilter, setStarFilter] = useState<number | 'all'>('all');
  const [granularity, setGranularity] = useState<TimeGranularity>('week');
  const [starChartMode, setStarChartMode] = useState<StarChartMode>('bar');

  const activeFormat =
    EXPORT_FORMAT_OPTIONS.find((f) => f.id === exportFormat) ?? EXPORT_FORMAT_OPTIONS[0];

  const languageMetaMap = useMemo(() => {
    const map: Record<string, (typeof LANGUAGE_OPTIONS)[number]> = {};
    for (const opt of LANGUAGE_OPTIONS) map[opt.code] = opt;
    return map;
  }, []);

  const allCategories = useMemo(
    () => Array.from(new Set(reviews.map((r) => r.category))).sort(),
    [reviews]
  );

  const presentLanguages = useMemo(() => {
    const set = new Set(reviews.map((r) => r.language));
    return LANGUAGE_OPTIONS.filter((opt) => set.has(opt.code));
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
      if (languageFilter !== 'all' && r.language !== languageFilter) return false;
      if (starFilter !== 'all' && r.stars !== starFilter) return false;
      return true;
    });
  }, [reviews, categoryFilter, languageFilter, starFilter]);

  const hasFilters =
    categoryFilter !== 'all' || languageFilter !== 'all' || starFilter !== 'all';

  const resetFilters = () => {
    setCategoryFilter('all');
    setLanguageFilter('all');
    setStarFilter('all');
  };

  // Summary metrics
  const metrics = useMemo(() => {
    const total = filteredReviews.length;
    if (total === 0) {
      return {
        total: 0,
        avgRating: 0,
        positiveShare: 0,
        uniqueBuyers: 0,
        returningPct: 0,
        uniqueBodyPct: 100,
        activeLangCount: 0,
        minDate: '',
        maxDate: '',
        spanDays: 0,
      };
    }

    let starSum = 0;
    let positiveCount = 0;
    let returningCount = 0;
    const emails = new Set<string>();
    const langs = new Set<ReviewLanguage>();
    const bodyCounts = new Map<string, number>();
    let minDate = filteredReviews[0].review_date;
    let maxDate = filteredReviews[0].review_date;

    for (const r of filteredReviews) {
      starSum += r.stars;
      if (r.stars >= 4) positiveCount += 1;
      if (r.isReturningCustomer) returningCount += 1;
      emails.add(r.reviewer_email);
      langs.add(r.language);
      const norm = normalizeReviewBody(r.body);
      bodyCounts.set(norm, (bodyCounts.get(norm) || 0) + 1);
      if (r.review_date < minDate) minDate = r.review_date;
      if (r.review_date > maxDate) maxDate = r.review_date;
    }

    let dupRows = 0;
    for (const c of bodyCounts.values()) {
      if (c > 1) dupRows += c;
    }

    const startMs = Date.parse(minDate);
    const endMs = Date.parse(maxDate);
    const spanDays =
      Number.isFinite(startMs) && Number.isFinite(endMs)
        ? Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1)
        : 1;

    return {
      total,
      avgRating: starSum / total,
      positiveShare: (positiveCount / total) * 100,
      uniqueBuyers: emails.size,
      returningPct: (returningCount / total) * 100,
      uniqueBodyPct: ((total - dupRows) / total) * 100,
      activeLangCount: langs.size,
      minDate,
      maxDate,
      spanDays,
    };
  }, [filteredReviews]);

  // 1. Star rating distribution data (5★ down to 1★)
  const starDistribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of filteredReviews) {
      counts[r.stars] = (counts[r.stars] || 0) + 1;
    }
    const total = filteredReviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      label: `${star} Stars`,
      shortLabel: `${star}★`,
      count: counts[star] || 0,
      pct: ((counts[star] || 0) / total) * 100,
      color: STAR_COLORS[star],
    }));
  }, [filteredReviews]);

  // 2. Language distribution data
  const languageDistribution = useMemo(() => {
    const agg = new Map<
      ReviewLanguage,
      {
        count: number;
        starSum: number;
        fiveStarCount: number;
        returningCount: number;
        minDate: string;
        maxDate: string;
      }
    >();

    for (const r of filteredReviews) {
      const existing = agg.get(r.language);
      if (!existing) {
        agg.set(r.language, {
          count: 1,
          starSum: r.stars,
          fiveStarCount: r.stars === 5 ? 1 : 0,
          returningCount: r.isReturningCustomer ? 1 : 0,
          minDate: r.review_date,
          maxDate: r.review_date,
        });
      } else {
        existing.count += 1;
        existing.starSum += r.stars;
        if (r.stars === 5) existing.fiveStarCount += 1;
        if (r.isReturningCustomer) existing.returningCount += 1;
        if (r.review_date < existing.minDate) existing.minDate = r.review_date;
        if (r.review_date > existing.maxDate) existing.maxDate = r.review_date;
      }
    }

    const total = filteredReviews.length || 1;
    return Array.from(agg.entries())
      .map(([code, data], idx) => {
        const meta = languageMetaMap[code];
        return {
          code,
          flag: meta?.flag || '🌐',
          label: meta?.label || code,
          axisLabel: `${meta?.flag || ''} ${meta?.label || code}`.trim(),
          count: data.count,
          pct: (data.count / total) * 100,
          avgStars: data.starSum / data.count,
          fiveStarPct: (data.fiveStarCount / data.count) * 100,
          returningPct: (data.returningCount / data.count) * 100,
          minDate: data.minDate,
          maxDate: data.maxDate,
          color: LANGUAGE_PALETTE[idx % LANGUAGE_PALETTE.length],
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [filteredReviews, languageMetaMap]);

  // 3. Generation date distribution data
  const dateTimeline = useMemo(() => {
    const buckets = new Map<
      string,
      { count: number; starSum: number; returningCount: number }
    >();

    for (const r of filteredReviews) {
      const iso = r.review_date;
      const key =
        granularity === 'day'
          ? iso
          : granularity === 'week'
            ? getWeekStartISO(iso)
            : iso.slice(0, 7);

      const existing = buckets.get(key);
      if (!existing) {
        buckets.set(key, {
          count: 1,
          starSum: r.stars,
          returningCount: r.isReturningCustomer ? 1 : 0,
        });
      } else {
        existing.count += 1;
        existing.starSum += r.stars;
        if (r.isReturningCustomer) existing.returningCount += 1;
      }
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([rawKey, val]) => ({
        rawKey,
        label: formatBucketLabel(rawKey, granularity),
        count: val.count,
        avgStars: Number((val.starSum / val.count).toFixed(2)),
        returningCount: val.returningCount,
      }));
  }, [filteredReviews, granularity]);

  // 4. Category buyer composition (First-time vs Returning)
  const categoryBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { firstTime: number; returning: number; starSum: number }
    >();
    for (const r of filteredReviews) {
      const existing = map.get(r.category) || {
        firstTime: 0,
        returning: 0,
        starSum: 0,
      };
      if (r.isReturningCustomer) existing.returning += 1;
      else existing.firstTime += 1;
      existing.starSum += r.stars;
      map.set(r.category, existing);
    }

    return Array.from(map.entries())
      .map(([category, v]) => {
        const total = v.firstTime + v.returning;
        return {
          category: category.length > 20 ? `${category.slice(0, 18)}…` : category,
          fullCategory: category,
          firstTime: v.firstTime,
          returning: v.returning,
          total,
          avgStars: total > 0 ? v.starSum / total : 0,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredReviews]);

  if (reviews.length === 0) {
    return (
      <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
            Dataset Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Interactive charts for star rating distribution, review languages, and generation date timelines populate automatically once reviews are generated.
          </p>
        </div>

        <section className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />
                <span>Star Rating Distribution</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Switch between bar and donut breakdowns of 1★–5★ ratings with click-to-filter cross-highlighting.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Globe2 className="w-4 h-4 text-sky-600" aria-hidden="true" />
                <span>Review Language Mix</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Compare volume, share percentage, and average rating across all 16 supported global languages.
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Generation Date Cadence</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Inspect daily, weekly, or monthly review volume alongside rolling average rating trends.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
              <span className="font-medium text-slate-700">Load a sample dataset to preview charts:</span>
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

            <button
              type="button"
              onClick={onOpenWorkbench}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Scan Website or Upload CSV</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  const languageChartHeight = Math.max(240, Math.min(440, languageDistribution.length * 36 + 32));

  return (
    <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-6">
      {/* Header & Global Cross-Filters */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 text-balance">
            Dataset Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-semibold text-slate-800">{activeBusinessLabel}</span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono tabular-nums text-xs text-slate-600">
              {filteredReviews.length.toLocaleString()}
              {hasFilters ? ` / ${reviews.length.toLocaleString()}` : ''} reviews
            </span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono tabular-nums text-xs text-slate-500">
              {eligibleProducts.length} offerings
            </span>
            {metrics.minDate && (
              <>
                <span aria-hidden="true"> · </span>
                <span className="font-mono tabular-nums text-xs text-slate-500">
                  {metrics.minDate} to {metrics.maxDate}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            aria-label="Filter dashboard by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter dashboard by language"
            value={languageFilter}
            onChange={(e) =>
              setLanguageFilter(e.target.value as ReviewLanguage | 'all')
            }
            className="h-9 px-3 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
          >
            <option value="all">All Languages</option>
            {presentLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter dashboard by star rating"
            value={starFilter}
            onChange={(e) =>
              setStarFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
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

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportCSV}
            className="inline-flex items-center gap-2 h-9 px-3.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export {activeFormat.shortLabel}</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <section
        aria-label="Dashboard summary metrics"
        className="bg-white border border-slate-200 rounded-xl grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200"
      >
        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Reviews in View</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {metrics.total.toLocaleString()}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {metrics.uniqueBuyers.toLocaleString()} buyers
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Average Star Rating</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {metrics.total > 0 ? metrics.avgRating.toFixed(2) : '—'}★
            </span>
            <span className="text-xs font-mono tabular-nums text-emerald-700">
              {metrics.positiveShare.toFixed(0)}% 4–5★
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Active Languages</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {metrics.activeLangCount}
            </span>
            <span className="text-xs text-slate-500 truncate">
              {languageDistribution
                .slice(0, 6)
                .map((l) => l.flag)
                .join(' ')}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="text-xs font-medium text-slate-500">Date Span & Uniqueness</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {metrics.spanDays}d
            </span>
            <span className="text-xs font-mono tabular-nums text-emerald-700">
              {metrics.uniqueBodyPct.toFixed(0)}% unique copy
            </span>
          </div>
        </div>
      </section>

      {filteredReviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            No reviews match the selected dashboard filters
          </p>
          <p className="text-xs text-slate-500">
            Clear one or more filters above to inspect star, language, and date distributions.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <>
          {/* Hero Chart: Generation Dates Distribution & Rolling Star Rating */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Generation Dates Distribution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review posting volume over time paired with average rating per period
                  <span aria-hidden="true"> · </span>
                  <span className="font-mono tabular-nums">
                    {dateTimeline.length} {granularity === 'day' ? 'days' : granularity === 'week' ? 'weeks' : 'months'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" aria-hidden="true" />
                    <span>Review count</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 bg-amber-500 inline-block" aria-hidden="true" />
                    <span>Avg rating</span>
                  </span>
                </div>

                <div
                  role="tablist"
                  aria-label="Timeline granularity"
                  className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
                >
                  {(['day', 'week', 'month'] as TimeGranularity[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={granularity === mode}
                      onClick={() => setGranularity(mode)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer whitespace-nowrap ${
                        granularity === mode
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode === 'day' ? 'Daily' : mode === 'week' ? 'Weekly' : 'Monthly'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={dateTimeline}
                  margin={{ top: 10, right: 12, left: -12, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="dashboardDateFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284C7" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                    minTickGap={22}
                  />
                  <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tickFormatter={(v: number) => `${v}★`}
                    tick={{ fontSize: 11, fill: '#B45309' }}
                    tickLine={false}
                    axisLine={false}
                    width={34}
                  />
                  <Tooltip content={<TimelineTooltip />} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    name="Reviews"
                    stroke="#0284C7"
                    strokeWidth={2}
                    fill="url(#dashboardDateFill)"
                    activeDot={{ r: 5, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgStars"
                    name="Avg rating"
                    stroke="#D97706"
                    strokeWidth={2}
                    dot={dateTimeline.length <= 24 ? { r: 3, fill: '#D97706' } : false}
                    activeDot={{ r: 5, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* 2-Column Row: Star Ratings Distribution + Review Languages Distribution */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Star Rating Distribution */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Star Rating Distribution
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any rating tier to cross-filter the dashboard
                  </p>
                </div>

                <div
                  role="tablist"
                  aria-label="Star chart style"
                  className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={starChartMode === 'bar'}
                    onClick={() => setStarChartMode('bar')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      starChartMode === 'bar'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={starChartMode === 'donut'}
                    onClick={() => setStarChartMode('donut')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      starChartMode === 'donut'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Donut
                  </button>
                </div>
              </div>

              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  {starChartMode === 'bar' ? (
                    <BarChart
                      data={starDistribution}
                      margin={{ top: 8, right: 12, left: -14, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="shortLabel"
                        tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                        tickLine={false}
                        axisLine={{ stroke: '#CBD5E1' }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<StarTooltip />} cursor={{ fill: '#F1F5F9' }} />
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={56}
                        onClick={(_data, index) => {
                          const item = starDistribution[index];
                          if (item) setStarFilter((prev) => (prev === item.star ? 'all' : item.star));
                        }}
                        className="cursor-pointer"
                      >
                        {starDistribution.map((entry) => (
                          <Cell
                            key={entry.star}
                            fill={entry.color}
                            fillOpacity={
                              starFilter === 'all' || starFilter === entry.star ? 1 : 0.3
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <PieChart>
                      <Pie
                        data={starDistribution.filter((d) => d.count > 0)}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={104}
                        paddingAngle={2}
                        onClick={(_data, index) => {
                          const nonZero = starDistribution.filter((d) => d.count > 0);
                          const item = nonZero[index];
                          if (item) setStarFilter((prev) => (prev === item.star ? 'all' : item.star));
                        }}
                        className="cursor-pointer"
                      >
                        {starDistribution
                          .filter((d) => d.count > 0)
                          .map((entry) => (
                            <Cell key={entry.star} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip content={<StarTooltip />} />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Clean tabular legend row */}
              <div className="grid grid-cols-5 gap-2 pt-3 border-t border-slate-100">
                {starDistribution.map((item) => {
                  const selected = starFilter === item.star;
                  return (
                    <button
                      key={item.star}
                      type="button"
                      onClick={() =>
                        setStarFilter((prev) => (prev === item.star ? 'all' : item.star))
                      }
                      className={`p-2 rounded-lg text-left transition-colors cursor-pointer ${
                        selected
                          ? 'bg-slate-900 text-white'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                          aria-hidden="true"
                        />
                        <span>{item.shortLabel}</span>
                      </div>
                      <div
                        className={`text-xs font-mono tabular-nums mt-0.5 ${
                          selected ? 'text-slate-200' : 'text-slate-900 font-semibold'
                        }`}
                      >
                        {item.count}
                      </div>
                      <div
                        className={`text-[11px] font-mono tabular-nums ${
                          selected ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {item.pct.toFixed(1)}%
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Review Language Distribution */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Review Language Distribution
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Volume across {languageDistribution.length} active language
                  {languageDistribution.length === 1 ? '' : 's'} — click any bar to filter
                </p>
              </div>

              <div className="w-full" style={{ height: `${languageChartHeight}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={languageDistribution}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={{ stroke: '#CBD5E1' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="axisLabel"
                      width={132}
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<LanguageTooltip />} cursor={{ fill: '#F1F5F9' }} />
                    <Bar
                      dataKey="count"
                      radius={[0, 6, 6, 0]}
                      maxBarSize={26}
                      onClick={(_data, index) => {
                        const item = languageDistribution[index];
                        if (item) {
                          setLanguageFilter((prev) => (prev === item.code ? 'all' : item.code));
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {languageDistribution.map((entry) => (
                        <Cell
                          key={entry.code}
                          fill={entry.color}
                          fillOpacity={
                            languageFilter === 'all' || languageFilter === entry.code ? 1 : 0.3
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Bottom Row: Category Buyer Mix Chart + Language Summary Table */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Stacked Bar: Category vs Buyer Type */}
            <section className="xl:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Buyer Mix by Category
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    First-time vs returning customer reviews across top categories
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" aria-hidden="true" />
                  <span>First-time</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" aria-hidden="true" />
                  <span>Returning</span>
                </span>
              </div>

              <div className="w-full h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryBreakdown}
                    margin={{ top: 6, right: 8, left: -16, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      tickLine={false}
                      axisLine={{ stroke: '#CBD5E1' }}
                      interval={0}
                      angle={categoryBreakdown.length > 4 ? -20 : 0}
                      textAnchor={categoryBreakdown.length > 4 ? 'end' : 'middle'}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CategoryTooltip />} cursor={{ fill: '#F1F5F9' }} />
                    <Bar
                      dataKey="firstTime"
                      stackId="buyers"
                      fill="#0284C7"
                      maxBarSize={44}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="returning"
                      stackId="buyers"
                      fill="#059669"
                      maxBarSize={44}
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Language Performance Breakdown Table */}
            <section className="xl:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Language Breakdown
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any row to isolate that language across all charts
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {languageDistribution.length} languages
                </span>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-medium text-slate-500">
                      <th className="py-2.5 px-5">Language</th>
                      <th className="py-2.5 px-4 text-right">Reviews</th>
                      <th className="py-2.5 px-4 text-right">Share</th>
                      <th className="py-2.5 px-4 text-right">Avg Rating</th>
                      <th className="py-2.5 px-4 text-right">5★ Rate</th>
                      <th className="py-2.5 px-4 text-right">Returning</th>
                      <th className="py-2.5 px-5 text-right">Date Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {languageDistribution.map((row) => {
                      const isSelected = languageFilter === row.code;
                      return (
                        <tr
                          key={row.code}
                          onClick={() =>
                            setLanguageFilter((prev) =>
                              prev === row.code ? 'all' : row.code
                            )
                          }
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50/80'
                              : 'hover:bg-slate-50/90'
                          }`}
                        >
                          <td className="py-2.5 px-5 font-medium text-slate-900 whitespace-nowrap">
                            <span className="mr-2" aria-hidden="true">
                              {row.flag}
                            </span>
                            <span>{row.label}</span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                            {row.count.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                            {row.pct.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                            {row.avgStars.toFixed(2)}★
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700">
                            {row.fiveStarPct.toFixed(0)}%
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                            {row.returningPct.toFixed(0)}%
                          </td>
                          <td className="py-2.5 px-5 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                            {row.minDate} – {row.maxDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
