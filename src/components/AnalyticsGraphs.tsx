import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import {
  CatalogProduct,
  GeneratedReview,
  LANGUAGE_OPTIONS,
  ReviewLanguage,
  StoreVolumePreset,
} from '../types/reviews';
import { VOLUME_PRESET_CURVES } from '../utils/generator';

const LANG_META = Object.fromEntries(
  LANGUAGE_OPTIONS.map((opt) => [opt.code, opt])
);

interface AnalyticsGraphsProps {
  eligibleProducts: CatalogProduct[];
  reviews: GeneratedReview[];
  volumePreset: StoreVolumePreset;
  minReviewsPerItem: number;
  maxReviewsPerItem: number;
  maxTotalReviews: number | null;
  starCounts: Record<number, number>;
  averageRating: number;
  buckets: { label: string; count: number }[];
  starFilter: number | 'all';
  languageFilter: ReviewLanguage | 'all';
  onSelectStarFilter: (star: number | 'all') => void;
  onSelectLanguageFilter: (lang: ReviewLanguage | 'all') => void;
}

export function AnalyticsGraphs({
  eligibleProducts,
  reviews,
  volumePreset,
  minReviewsPerItem,
  maxReviewsPerItem,
  maxTotalReviews,
  starCounts,
  averageRating,
  buckets,
  starFilter,
  languageFilter,
  onSelectStarFilter,
  onSelectLanguageFilter,
}: AnalyticsGraphsProps) {
  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const activeCurve =
    VOLUME_PRESET_CURVES[volumePreset] ?? VOLUME_PRESET_CURVES.realistic;

  // Timeline series: group reviews into up to 8 chronological buckets
  const timelinePoints = useMemo(() => {
    if (reviews.length === 0) return [];
    const sorted = [...reviews].sort((a, b) =>
      a.review_date.localeCompare(b.review_date)
    );
    const minMs = Date.parse(sorted[0].review_date);
    const maxMs = Date.parse(sorted[sorted.length - 1].review_date);
    const span = Math.max(86400000, maxMs - minMs);
    const numBins = 8;
    const binSize = span / numBins;

    const bins = Array.from({ length: numBins }, (_, i) => {
      const startMs = minMs + i * binSize;
      const d = new Date(startMs);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { label, count: 0, starSum: 0 };
    });

    for (const r of sorted) {
      const ms = Date.parse(r.review_date);
      const idx = Math.min(numBins - 1, Math.max(0, Math.floor((ms - minMs) / binSize)));
      bins[idx].count += 1;
      bins[idx].starSum += r.stars;
    }

    return bins.map((b) => ({
      label: b.label,
      count: b.count,
      avg: b.count > 0 ? b.starSum / b.count : 0,
    }));
  }, [reviews]);

  // Language mix sorted descending
  const languageBreakdown = useMemo(() => {
    const counts = new Map<ReviewLanguage, number>();
    for (const r of reviews) {
      counts.set(r.language, (counts.get(r.language) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([code, count]) => ({
        code,
        count,
        pct: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
        meta: LANG_META[code],
      }))
      .sort((a, b) => b.count - a.count);
  }, [reviews]);

  const maxBucketCount = Math.max(1, ...buckets.map((b) => b.count));
  const maxTimelineCount = Math.max(1, ...timelinePoints.map((p) => p.count));

  // SVG Timeline geometry
  const svgW = 420;
  const svgH = 156;
  const padX = 22;
  const padTop = 18;
  const padBottom = 26;
  const chartW = svgW - padX * 2;
  const chartH = svgH - padTop - padBottom;

  const coords = timelinePoints.map((pt, idx) => {
    const x =
      timelinePoints.length > 1
        ? padX + (idx / (timelinePoints.length - 1)) * chartW
        : padX + chartW / 2;
    const y = padTop + chartH - (pt.count / maxTimelineCount) * chartH;
    return { ...pt, x, y };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`
      : '';

  // Rating Ring SVG geometry
  const ringRadius = 32;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ratingFraction = Math.min(1, Math.max(0, averageRating / 5));
  const ringDashOffset = ringCircumference * (1 - ratingFraction);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Graph 1: Vertical Column Chart — Long-Tail Product Spread */}
      <section
        aria-label="Product review count spread chart"
        className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Long-Tail Product Spread
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Items grouped by review volume
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {minReviewsPerItem}–{maxReviewsPerItem} / item · {activeCurve.label}
            {maxTotalReviews ? ` · cap ${maxTotalReviews}` : ''}
          </span>
        </div>

        <div className="relative h-44 flex items-end gap-3 pt-4 pb-1 px-1 border-b border-slate-200">
          {/* Subtle horizontal gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-4 bottom-1 flex flex-col justify-between">
            {[0, 1, 2].map((g) => (
              <div key={g} className="w-full border-t border-dashed border-slate-100" />
            ))}
          </div>

          {buckets.map((bucket, idx) => {
            const heightPct = (bucket.count / maxBucketCount) * 100;
            const sharePct =
              eligibleProducts.length > 0
                ? (bucket.count / eligibleProducts.length) * 100
                : 0;
            const isHovered = hoveredBucket === idx;

            return (
              <div
                key={bucket.label}
                onMouseEnter={() => setHoveredBucket(idx)}
                onMouseLeave={() => setHoveredBucket(null)}
                className="relative flex-1 h-full flex flex-col items-center justify-end z-10 cursor-default"
              >
                <span
                  className={`text-[11px] font-mono tabular-nums mb-1.5 transition-colors ${
                    isHovered ? 'text-sky-700 font-semibold' : 'text-slate-600'
                  }`}
                >
                  {bucket.count}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(bucket.count > 0 ? 6 : 2, heightPct)}%` }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-full max-w-[44px] rounded-t-md transition-colors ${
                    isHovered
                      ? 'bg-sky-600'
                      : idx === 0
                        ? 'bg-slate-300'
                        : 'bg-sky-700/85'
                  }`}
                />
                {isHovered && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] font-mono tabular-nums px-2 py-0.5 rounded shadow-sm pointer-events-none">
                    {bucket.count} items ({sharePct.toFixed(0)}%)
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-5 gap-2 pt-2.5 text-center">
          {buckets.map((b) => (
            <span key={b.label} className="text-[11px] text-slate-500 font-medium truncate">
              {b.label.replace(' reviews', '')}
            </span>
          ))}
        </div>
      </section>

      {/* Graph 2: Area Line Chart — Review Volume Over Time */}
      <section
        aria-label="Review timeline chart"
        className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Review Cadence Timeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organic publishing velocity across your date range
            </p>
          </div>
          {hoveredPoint !== null && coords[hoveredPoint] ? (
            <span className="text-xs font-mono tabular-nums text-sky-700 font-semibold">
              {coords[hoveredPoint].label}: {coords[hoveredPoint].count} reviews ({coords[hoveredPoint].avg.toFixed(1)}★)
            </span>
          ) : (
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {reviews.length.toLocaleString()} total rows
            </span>
          )}
        </div>

        <div className="w-full">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-44 overflow-visible"
            role="img"
            aria-label="Area chart of reviews published over time"
          >
            <defs>
              <linearGradient id="reviewTimelineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0369a1" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {[0, 0.5, 1].map((frac) => {
              const y = padTop + chartH * (1 - frac);
              return (
                <line
                  key={frac}
                  x1={padX}
                  x2={svgW - padX}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray={frac === 0 ? undefined : '3 3'}
                  strokeWidth={1}
                />
              );
            })}

            {areaPath && <path d={areaPath} fill="url(#reviewTimelineFill)" />}
            {linePath && (
              <motion.path
                d={linePath}
                fill="none"
                stroke="#0369a1"
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              />
            )}

            {coords.map((pt, idx) => {
              const isActive = hoveredPoint === idx;
              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredPoint(idx)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isActive ? 5.5 : 3.5}
                    fill={isActive ? '#0284c7' : '#ffffff'}
                    stroke="#0369a1"
                    strokeWidth={2}
                  />
                  {/* Larger hit area */}
                  <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
                  {(idx % 2 === 0 || idx === coords.length - 1) && (
                    <text
                      x={pt.x}
                      y={svgH - 6}
                      textAnchor="middle"
                      className="fill-slate-400 text-[10px] font-mono"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* Graph 3: Language Distribution with Flags */}
      <section
        aria-label="Language distribution chart"
        className="bg-white border border-slate-200 rounded-xl p-6"
      >
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Language Mix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any language to filter the review feed
            </p>
          </div>
          {languageFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectLanguageFilter('all')}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
          {languageBreakdown.map((item) => {
            const isSelected = languageFilter === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() =>
                  onSelectLanguageFilter(isSelected ? 'all' : item.code)
                }
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 ring-1 ring-sky-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                    <span className="text-sm leading-none" aria-hidden="true">
                      {item.meta?.flag}
                    </span>
                    <span>{item.meta?.label || item.code}</span>
                    <span className="text-[11px] text-slate-400">
                      {item.meta?.nativeLabel}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-600">
                    {item.count} ({item.pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.pct}%` }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full bg-sky-700 rounded-full"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Graph 4: Organic Star Curve + Average Rating Ring */}
      <section
        aria-label="Star rating distribution chart"
        className="bg-white border border-slate-200 rounded-xl p-6"
      >
        <div className="flex items-baseline justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Organic Star Curve
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any star tier to filter · benign low-star friction only
            </p>
          </div>
          {starFilter !== 'all' && (
            <button
              type="button"
              onClick={() => onSelectStarFilter('all')}
              className="text-xs font-medium text-sky-700 hover:text-sky-900 cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Crisp SVG Rating Ring */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
              <circle
                cx="40"
                cy="40"
                r={ringRadius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="7"
              />
              <motion.circle
                cx="40"
                cy="40"
                r={ringRadius}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                initial={{ strokeDashoffset: ringCircumference }}
                animate={{ strokeDashoffset: ringDashOffset }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900 leading-none">
                {averageRating.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">avg ★</span>
            </div>
          </div>

          {/* Interactive 5★ to 1★ Bars */}
          <div className="flex-1 w-full space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = starCounts[star] || 0;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              const isSelected = starFilter === star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => onSelectStarFilter(isSelected ? 'all' : star)}
                  className={`w-full text-left px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    isSelected ? 'bg-sky-50 ring-1 ring-sky-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                      {star}
                      <Star
                        className="w-3 h-3 fill-amber-500 text-amber-500"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {count} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

interface PresetCurvePreviewGraphProps {
  volumePreset: StoreVolumePreset;
  minReviewsPerItem: number;
  maxReviewsPerItem: number;
  maxTotalReviews: number | null;
  zeroReviewRatio: number;
  selectedLanguages: ReviewLanguage[];
}

export function PresetCurvePreviewGraph({
  volumePreset,
  minReviewsPerItem,
  maxReviewsPerItem,
  maxTotalReviews,
  zeroReviewRatio,
  selectedLanguages,
}: PresetCurvePreviewGraphProps) {
  const curve = VOLUME_PRESET_CURVES[volumePreset] ?? VOLUME_PRESET_CURVES.realistic;
  const safeMin = Math.max(0, Math.floor(minReviewsPerItem));
  const safeMax = Math.max(safeMin, Math.min(50, Math.floor(maxReviewsPerItem)));

  // Compute expected probability distribution across safeMin..safeMax
  const bars = useMemo(() => {
    const result: { count: number; pct: number }[] = [];
    if (safeMin === 0) {
      const pZero = Math.max(0, Math.min(100, zeroReviewRatio)) / 100;
      const pNonZero = 1 - pZero;
      result.push({ count: 0, pct: pZero * 100 });
      const upperCap = Math.max(1, safeMax);
      for (let k = 1; k <= upperCap; k++) {
        const upper = Math.pow(k / upperCap, 1 / curve.skewExponent);
        const lower = Math.pow((k - 1) / upperCap, 1 / curve.skewExponent);
        result.push({ count: k, pct: pNonZero * (upper - lower) * 100 });
      }
      return result;
    }

    const span = safeMax - safeMin + 1;
    for (let i = 0; i < span; i++) {
      const k = safeMin + i;
      const upper = Math.pow((i + 1) / span, 1 / curve.skewExponent);
      const lower = Math.pow(i / span, 1 / curve.skewExponent);
      result.push({ count: k, pct: (upper - lower) * 100 });
    }
    return result;
  }, [curve, zeroReviewRatio, safeMin, safeMax]);

  const maxPct = Math.max(1, ...bars.map((b) => b.pct));

  return (
    <section
      aria-label="Live distribution curve preview"
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Live Organic Distribution Curve
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Updates live as you adjust the sidebar limits, activity curve, or 0-review ratio
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-600">
          {curve.label} · {safeMin}–{safeMax} / item
          {safeMin === 0 ? ` · ~${zeroReviewRatio}% at 0` : ''}
          {maxTotalReviews ? ` · max ${maxTotalReviews} total` : ''}
        </span>
      </div>

      {/* Live Bar Curve */}
      <div className="h-28 flex items-end gap-1 pt-2 border-b border-slate-200">
        {bars.map((bar) => (
          <div
            key={bar.count}
            title={`${bar.count} reviews: ~${bar.pct.toFixed(1)}% of offerings`}
            className="flex-1 h-full flex flex-col items-center justify-end group"
          >
            <motion.div
              initial={false}
              animate={{ height: `${Math.max(4, (bar.pct / maxPct) * 100)}%` }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full rounded-t-sm transition-colors ${
                bar.count === 0
                  ? 'bg-slate-300 group-hover:bg-slate-400'
                  : bar.count <= Math.max(5, safeMin + 3)
                    ? 'bg-sky-700 group-hover:bg-sky-600'
                    : 'bg-sky-400 group-hover:bg-sky-500'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
        <span>Min: {safeMin}</span>
        <span>Skewed organic core</span>
        <span>Max cap: {safeMax}</span>
      </div>

      {/* Active Languages Flag Strip */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">
          Active languages ({selectedLanguages.length}/{LANGUAGE_OPTIONS.length}):
        </span>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {selectedLanguages.length === 0 ? (
            <span className="text-amber-700">Select at least one language on the left</span>
          ) : (
            selectedLanguages.map((code) => {
              const opt = LANG_META[code];
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 text-slate-700 font-medium"
                >
                  <span aria-hidden="true">{opt?.flag}</span>
                  <span>{opt?.label || code}</span>
                </span>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
