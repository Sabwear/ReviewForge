import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AIConnectionStatus } from '../hooks/useAISettings';
import {
  BusinessVoicePack,
  CatalogProduct,
  GeneratedReview,
  LANGUAGE_OPTIONS,
} from '../types/reviews';
import {
  QualityScorecard,
  runDatasetIntegrityAudit,
} from '../utils/datasetIntegrity';
import { maskCustomerEmail } from '../utils/csv';
import { FlagBadge } from './FlagBadge';

export interface ReviewAuditEntry {
  humanScore: number;
  verdict: 'human' | 'generic' | 'ai_flagged';
  reason: string;
  signals?: string[];
  flaggedPhrases?: string[];
  suggestion?: string;
  suggestedItemSlug?: string;
  dimensions?: {
    naturalTone: number;
    domainFit: number;
    specificity: number;
  };
  auditedAt?: string;
}

function highlightFlaggedText(text: string, phrases?: string[]): React.ReactNode {
  if (!phrases || phrases.length === 0) return text;
  const escaped = phrases
    .filter((p) => p.trim().length >= 3)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return text;
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <mark
        key={idx}
        className="px-1 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-[#E58388]/20 dark:text-[#E58388] font-medium"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export interface AuditRunSummary {
  id: string;
  timestamp: string;
  checkedCount: number;
  avgHumanScore: number;
  flaggedCount: number;
}

interface AIDetectorViewProps {
  reviews: GeneratedReview[];
  rejectedReviews: GeneratedReview[];
  validOfferings: CatalogProduct[];
  adaptedPack: BusinessVoicePack | null;
  detectedCountryCode?: string;
  baselineScorecard: QualityScorecard | null;
  autoFixProgress: string | null;
  maskEmailsOnExport: boolean;
  onToggleMaskEmails: () => void;
  reviewAuditMap: Record<string, ReviewAuditEntry>;
  auditRuns: AuditRunSummary[];
  activeBusinessLabel: string;
  aiConnectionStatus: AIConnectionStatus;
  aiOnline: boolean;
  isAuditing: boolean;
  isRewriting: boolean;
  auditError: string | null;
  onOpenAISettings: () => void;
  onOpenWorkbench: () => void;
  onAuditReviews: (target: GeneratedReview[]) => Promise<void>;
  onRewriteFlagged: (target: GeneratedReview[]) => Promise<void>;
  onAutoFixDataset: () => Promise<void>;
  onSurgicalAuditClean: () => void;
  onRegenerateReview: (reviewId: string) => void;
  onDeleteReview: (reviewId: string) => void;
  onDeleteFlaggedReviews: (ids: string[]) => void;
  onClearAuditData: () => void;
  onExportHumanOnly: () => void;
  verifiedIds: string[];
  onToggleVerified: (reviewId: string) => void;
  onApproveCleanReviews: (ids: string[]) => void;
  onExportVerifiedOnly: () => void;
  onExportRejectedCSV: () => void;
  onExportQCReport: () => void;
}

type VerdictFilter = 'all' | 'ai_flagged' | 'generic' | 'human' | 'unchecked' | 'issues';
type RowSortMode = 'flagged_first' | 'lowest_score' | 'newest' | 'default';

const VERDICT_COLORS = {
  human: '#62C49C',
  generic: '#E0B36A',
  ai_flagged: '#E58388',
  unchecked: '#64748B',
};

export function AIDetectorView({
  reviews,
  rejectedReviews,
  validOfferings,
  adaptedPack,
  detectedCountryCode,
  baselineScorecard,
  autoFixProgress,
  maskEmailsOnExport,
  onToggleMaskEmails,
  reviewAuditMap,
  auditRuns,
  activeBusinessLabel,
  aiConnectionStatus,
  aiOnline,
  isAuditing,
  isRewriting,
  auditError,
  onOpenAISettings,
  onOpenWorkbench,
  onAuditReviews,
  onRewriteFlagged,
  onAutoFixDataset,
  onSurgicalAuditClean,
  onRegenerateReview,
  onDeleteReview,
  onDeleteFlaggedReviews,
  onClearAuditData,
  onExportHumanOnly,
  verifiedIds,
  onToggleVerified,
  onApproveCleanReviews,
  onExportVerifiedOnly,
  onExportRejectedCSV,
  onExportQCReport,
}: AIDetectorViewProps) {
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rowSort, setRowSort] = useState<RowSortMode>('flagged_first');
  const verifiedSet = useMemo(() => new Set(verifiedIds), [verifiedIds]);
  const integrity = useMemo(
    () =>
      runDatasetIntegrityAudit(reviews, {
        verifiedIds,
        validOfferings,
        adaptedPack,
        companyName: activeBusinessLabel,
        detectedCountryCode,
      }),
    [reviews, verifiedIds, validOfferings, adaptedPack, activeBusinessLabel, detectedCountryCode]
  );

  const emailCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reviews) {
      const k = r.reviewer_email.trim().toLowerCase();
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [reviews]);

  const rowsWithIssuesCount = useMemo(
    () => reviews.filter((r) => integrity.flaggedReviewIds.includes(r.id)).length,
    [reviews, integrity]
  );

  const langMap = useMemo(() => {
    const m: Record<string, (typeof LANGUAGE_OPTIONS)[number]> = {};
    for (const l of LANGUAGE_OPTIONS) m[l.code] = l;
    return m;
  }, []);

  const stats = useMemo(() => {
    let human = 0;
    let generic = 0;
    let aiFlagged = 0;
    let unchecked = 0;
    let scoreSum = 0;
    const flaggedReviews: GeneratedReview[] = [];
    const uncheckedReviews: GeneratedReview[] = [];

    for (const r of reviews) {
      const a = reviewAuditMap[r.id];
      if (!a) {
        unchecked += 1;
        uncheckedReviews.push(r);
      } else {
        scoreSum += a.humanScore;
        if (a.verdict === 'human') human += 1;
        else if (a.verdict === 'generic') {
          generic += 1;
          flaggedReviews.push(r);
        } else {
          aiFlagged += 1;
          flaggedReviews.push(r);
        }
      }
    }
    const auditedCount = human + generic + aiFlagged;
    const avgScore = auditedCount > 0 ? Math.round(scoreSum / auditedCount) : null;

    return {
      total: reviews.length,
      auditedCount,
      human,
      generic,
      aiFlagged,
      unchecked,
      avgScore,
      flaggedReviews,
      uncheckedReviews,
    };
  }, [reviews, reviewAuditMap]);

  const verdictPieData = useMemo(
    () =>
      [
        { name: 'Human-Sounding', value: stats.human, color: VERDICT_COLORS.human },
        { name: 'Generic', value: stats.generic, color: VERDICT_COLORS.generic },
        { name: 'AI / Off-Domain', value: stats.aiFlagged, color: VERDICT_COLORS.ai_flagged },
        { name: 'Unchecked', value: stats.unchecked, color: VERDICT_COLORS.unchecked },
      ].filter((d) => d.value > 0),
    [stats]
  );

  const scoreBuckets = useMemo(() => {
    const buckets = [
      { range: '0–29', count: 0, color: '#E58388' },
      { range: '30–49', count: 0, color: '#E58388' },
      { range: '50–69', count: 0, color: '#E0B36A' },
      { range: '70–84', count: 0, color: '#68AEE0' },
      { range: '85–100', count: 0, color: '#62C49C' },
    ];
    for (const r of reviews) {
      const a = reviewAuditMap[r.id];
      if (!a) continue;
      if (a.humanScore < 30) buckets[0].count += 1;
      else if (a.humanScore < 50) buckets[1].count += 1;
      else if (a.humanScore < 70) buckets[2].count += 1;
      else if (a.humanScore < 85) buckets[3].count += 1;
      else buckets[4].count += 1;
    }
    return buckets;
  }, [reviews, reviewAuditMap]);

  const languageScores = useMemo(() => {
    const map = new Map<string, { label: string; sum: number; count: number; flagged: number }>();
    for (const r of reviews) {
      const a = reviewAuditMap[r.id];
      if (!a) continue;
      const entry = map.get(r.language) || {
        label: langMap[r.language]?.label || r.language,
        sum: 0,
        count: 0,
        flagged: 0,
      };
      entry.sum += a.humanScore;
      entry.count += 1;
      if (a.verdict !== 'human') entry.flagged += 1;
      map.set(r.language, entry);
    }
    return Array.from(map.values())
      .map((e) => ({
        name: e.label,
        avgScore: Math.round(e.sum / e.count),
        count: e.count,
        flagged: e.flagged,
      }))
      .sort((a, b) => a.avgScore - b.avgScore);
  }, [reviews, reviewAuditMap, langMap]);

  const topSignals = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reviews) {
      const a = reviewAuditMap[r.id];
      if (!a || a.verdict === 'human' || !a.signals) continue;
      for (const s of a.signals) {
        const key = s.trim();
        if (!key) continue;
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([signal, count]) => ({ signal, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [reviews, reviewAuditMap]);

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = reviews.filter((r) => {
      const a = reviewAuditMap[r.id];
      const hasIssues = Boolean(integrity.issuesByReviewId[r.id]?.length);
      if (verdictFilter === 'unchecked' && a) return false;
      if (verdictFilter === 'issues' && !hasIssues) return false;
      if (
        verdictFilter !== 'all' &&
        verdictFilter !== 'unchecked' &&
        verdictFilter !== 'issues' &&
        a?.verdict !== verdictFilter
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = `${r.item_name} ${r.category} ${r.reviewer_name} ${r.reviewer_email} ${r.subject} ${r.body} ${r.review_date} ${a?.reason || ''} ${(a?.signals || []).join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });

    const verdictRank = (v?: string) =>
      v === 'ai_flagged' ? 0 : v === 'generic' ? 1 : v === 'human' ? 3 : 2;

    if (rowSort === 'flagged_first') {
      return [...list].sort((a, b) => {
        const aIss = integrity.issuesByReviewId[a.id]?.length ? 0 : 1;
        const bIss = integrity.issuesByReviewId[b.id]?.length ? 0 : 1;
        const vr = verdictRank(reviewAuditMap[a.id]?.verdict) - verdictRank(reviewAuditMap[b.id]?.verdict);
        if (vr !== 0) return vr;
        if (aIss !== bIss) return aIss - bIss;
        return (reviewAuditMap[a.id]?.humanScore ?? 100) - (reviewAuditMap[b.id]?.humanScore ?? 100);
      });
    }
    if (rowSort === 'lowest_score') {
      return [...list].sort(
        (a, b) => (reviewAuditMap[a.id]?.humanScore ?? 101) - (reviewAuditMap[b.id]?.humanScore ?? 101)
      );
    }
    if (rowSort === 'newest') {
      return [...list].sort((a, b) => b.review_date.localeCompare(a.review_date));
    }
    return list;
  }, [reviews, reviewAuditMap, verdictFilter, searchQuery, rowSort, integrity]);

  const hasSavedData = Object.keys(reviewAuditMap).length > 0 || auditRuns.length > 0;
  const nextScanBatch =
    stats.uncheckedReviews.length > 0 ? stats.uncheckedReviews.slice(0, 35) : reviews.slice(0, 35);

  return (
    <div className="flex-1 min-w-0 p-6 lg:p-8 space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AI Review Authenticity Detector
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                aiConnectionStatus === 'online'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  aiConnectionStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-400'
                }`}
              />
              {aiConnectionStatus === 'online' ? 'AI Online' : 'AI Offline'}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-semibold text-slate-800">{activeBusinessLabel}</span>
            {' · '}
            <span className="font-mono tabular-nums text-xs">
              {stats.auditedCount} / {stats.total} reviews audited
            </span>
            {' · '}
            <span className="text-xs text-slate-500">
              Results auto-saved locally in your browser
            </span>
          </p>
        </div>

        {/* Quick Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {aiOnline ? (
            <button
              type="button"
              disabled={reviews.length === 0 || isAuditing || isRewriting}
              onClick={() => onAuditReviews(nextScanBatch)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {isAuditing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>
                {isAuditing
                  ? 'Scanning Batch…'
                  : stats.uncheckedReviews.length > 0
                  ? `Scan Next ${Math.min(35, stats.uncheckedReviews.length)} Unchecked`
                  : `Re-Scan Batch (${Math.min(35, reviews.length)})`}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAISettings}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-xl transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Connect AI Provider</span>
            </button>
          )}

          {stats.flaggedReviews.length > 0 && (
            <>
              <button
                type="button"
                disabled={!aiOnline || isRewriting || isAuditing}
                onClick={() => onRewriteFlagged(stats.flaggedReviews)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
              >
                {isRewriting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {isRewriting
                    ? 'Rewriting…'
                    : `AI Rewrite Flagged (${Math.min(20, stats.flaggedReviews.length)})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onDeleteFlaggedReviews(
                    stats.flaggedReviews
                      .filter((r) => reviewAuditMap[r.id]?.verdict === 'ai_flagged')
                      .map((r) => r.id)
                  )
                }
                disabled={stats.aiFlagged === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove AI-Flagged ({stats.aiFlagged})</span>
              </button>
            </>
          )}

          {stats.human > 0 && (
            <button
              type="button"
              onClick={onExportHumanOnly}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Human-Only ({stats.human})</span>
            </button>
          )}

          {verifiedIds.length > 0 && (
            <button
              type="button"
              onClick={onExportVerifiedOnly}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Export Verified ({verifiedIds.length})</span>
            </button>
          )}

          {hasSavedData && (
            <button
              type="button"
              onClick={onClearAuditData}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Saved Data</span>
            </button>
          )}
        </div>
      </div>

      {auditError && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{auditError}</span>
        </div>
      )}

      {/* KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Avg Human Score</span>
            <ShieldCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900">
            {stats.avgScore !== null ? `${stats.avgScore}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.auditedCount} audited · {auditRuns.length} saved runs
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Human-Sounding</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-700">
            {stats.human}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.auditedCount > 0 ? `${Math.round((stats.human / stats.auditedCount) * 100)}% pass rate` : 'Score 75–100'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Generic Copy</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-amber-700">
            {stats.generic}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Score 50–74 · recommend rewrite
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>AI / Off-Domain Flagged</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-rose-700">
            {stats.aiFlagged}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Score &lt; 50 · fix or remove
          </div>
        </div>
      </section>

      {/* Graphs Grid */}
      {reviews.length === 0 ? (
        <section className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <ShieldCheck className="w-9 h-9 text-slate-400 mx-auto" />
          <h2 className="text-base font-semibold text-slate-900">No reviews generated yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Generate a review dataset first in the Workbench, then run the AI Review Authenticity Detector to inspect charts and rewrite generic rows.
          </p>
          <button
            type="button"
            onClick={onOpenWorkbench}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg cursor-pointer"
          >
            Go to Workbench
          </button>
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Verdict Pie */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Authenticity Verdict Split
              </h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={verdictPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {verdictPieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161920',
                        borderColor: 'rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#E4E6EB',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-[11px] text-slate-500 mt-1">
                {verdictPieData.map((d) => (
                  <span key={d.name} className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}: <strong className="font-mono text-slate-700">{d.value}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Score Distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Human Score Distribution
              </h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreBuckets} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#161920',
                        borderColor: 'rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#E4E6EB',
                      }}
                    />
                    <Bar dataKey="count" name="Reviews" radius={[6, 6, 0, 0]}>
                      {scoreBuckets.map((b, idx) => (
                        <Cell key={idx} fill={b.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Avg Human Score by Language */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Avg Human Score by Language
              </h2>
              {languageScores.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-500 text-center px-4">
                  Click &ldquo;Scan Next Unchecked&rdquo; above to see per-language authenticity scores.
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={languageScores}
                      layout="vertical"
                      margin={{ top: 4, right: 14, left: 4, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={82} tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161920',
                          borderColor: 'rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          fontSize: '12px',
                          color: '#E4E6EB',
                        }}
                      />
                      <Bar dataKey="avgScore" name="Avg Human %" radius={[0, 6, 6, 0]}>
                        {languageScores.map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={
                              entry.avgScore >= 75
                                ? VERDICT_COLORS.human
                                : entry.avgScore >= 50
                                ? VERDICT_COLORS.generic
                                : VERDICT_COLORS.ai_flagged
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          {/* Mandatory 100-Point Quality-Control Audit, AI Auto-Fix & Deliverables Gate */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-sm font-bold text-slate-900">
                    Mandatory Quality-Control Audit & Publication Gate
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      integrity.scorecard.publicationApproved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {integrity.scorecard.publicationApproved
                      ? `APPROVED · ${integrity.scorecard.weightedTotal100}/100`
                      : `HOLD · ${integrity.scorecard.weightedTotal100}/100 (Target ≥ 90/100)`}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                    Content Readiness: {integrity.scorecard.contentReadiness100}/100
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Evaluates Source Authenticity (30%), Originality (20%), Natural Language (15%), Service Relevance (15%), Data Consistency (10%), and Multilingual Quality (10%). Missing source verification prevents publication approval.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={reviews.length === 0 || isRewriting || isAuditing}
                  onClick={onSurgicalAuditClean}
                  title="Fixes slug typos, service mappings, and title-language mismatches without regenerating customer text, and quarantines templated/contradictory rows to Rejected CSV"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Surgical Clean (No Rewrite · Preserve Wording)</span>
                </button>

                {aiOnline && (
                  <button
                    type="button"
                    disabled={reviews.length === 0 || isRewriting || isAuditing}
                    onClick={() => void onAutoFixDataset()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    {isRewriting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isRewriting
                        ? autoFixProgress || 'AI Auto-Fixing…'
                        : `AI Auto-Fix Flagged (${integrity.flaggedReviewIds.length})`}
                    </span>
                  </button>
                )}

                {integrity.flaggedReviewIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onDeleteFlaggedReviews(integrity.flaggedReviewIds)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move Unsupported to Rejected ({integrity.flaggedReviewIds.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const cleanIds = reviews
                      .filter((r) => {
                        const hasContentIssue = integrity.flaggedReviewIds.includes(r.id);
                        const audit = reviewAuditMap[r.id];
                        return !hasContentIssue && (!audit || audit.verdict === 'human');
                      })
                      .map((r) => r.id);
                    onApproveCleanReviews(cleanIds);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Source Verification on Clean Rows</span>
                </button>
              </div>
            </div>

            {/* 6 Weighted Dimensions + Before/After Comparison */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                {
                  label: 'Source Auth (30%)',
                  before: baselineScorecard?.sourceAuthenticity100,
                  after: integrity.scorecard.sourceAuthenticity100,
                },
                {
                  label: 'Originality (20%)',
                  before: baselineScorecard?.originality100,
                  after: integrity.scorecard.originality100,
                },
                {
                  label: 'Natural Lang (15%)',
                  before: baselineScorecard?.naturalLanguage100,
                  after: integrity.scorecard.naturalLanguage100,
                },
                {
                  label: 'Service Fit (15%)',
                  before: baselineScorecard?.serviceRelevance100,
                  after: integrity.scorecard.serviceRelevance100,
                },
                {
                  label: 'Consistency (10%)',
                  before: baselineScorecard?.dataConsistency100,
                  after: integrity.scorecard.dataConsistency100,
                },
                {
                  label: 'Multilingual (10%)',
                  before: baselineScorecard?.multilingual100,
                  after: integrity.scorecard.multilingual100,
                },
              ].map((dim) => (
                <div
                  key={dim.label}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200/90 space-y-1"
                >
                  <div className="text-[11px] font-medium text-slate-500 truncate">{dim.label}</div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-lg font-bold font-mono tabular-nums ${
                        dim.after >= 90
                          ? 'text-emerald-700'
                          : dim.after >= 70
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {dim.after}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">/100</span>
                    {typeof dim.before === 'number' && dim.before !== dim.after && (
                      <span className="text-[10px] font-mono text-slate-500 ml-auto">
                        was {dim.before}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 5 Target Benchmarks (0-10 Scale) + Mandatory Hard Gates */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-800">
                  Before vs. After Benchmark Scores (0–10 Scale)
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    {
                      name: 'Natural Lang',
                      before: baselineScorecard?.rubric10.naturalLanguage,
                      cur: integrity.scorecard.rubric10.naturalLanguage,
                      target: 9.0,
                    },
                    {
                      name: 'Originality',
                      before: baselineScorecard?.rubric10.originality,
                      cur: integrity.scorecard.rubric10.originality,
                      target: 9.0,
                    },
                    {
                      name: 'Tech Fit',
                      before: baselineScorecard?.rubric10.technicalRelevance,
                      cur: integrity.scorecard.rubric10.technicalRelevance,
                      target: 9.5,
                    },
                    {
                      name: 'Service Map',
                      before: baselineScorecard?.rubric10.serviceCategorization,
                      cur: integrity.scorecard.rubric10.serviceCategorization,
                      target: 10.0,
                    },
                    {
                      name: 'Overall',
                      before: baselineScorecard?.rubric10.overallQuality,
                      cur: integrity.scorecard.rubric10.overallQuality,
                      target: 9.0,
                    },
                  ].map((b) => (
                    <div key={b.name} className="p-2 rounded bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-500 truncate">{b.name}</div>
                      <div
                        className={`text-sm font-bold font-mono mt-0.5 ${
                          b.cur >= b.target ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {b.cur.toFixed(1)}/10
                      </div>
                      <div className="text-[9px] font-mono text-slate-400">
                        {typeof b.before === 'number' ? `before ${b.before.toFixed(1)}` : `target ${b.target}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-800">
                  6 Mandatory Publication Conditions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  {[
                    {
                      ok: integrity.scorecard.mandatoryGates.zeroExactDuplicates,
                      label: `Zero exact duplicates (${integrity.exactDuplicateCount})`,
                    },
                    {
                      ok: integrity.scorecard.mandatoryGates.zeroHeadingServices,
                      label: `Zero website headings as services (${integrity.insertedHeadingCount})`,
                    },
                    {
                      ok: integrity.scorecard.mandatoryGates.zeroMixedLanguageLabels,
                      label: `Zero mixed-language labels (${integrity.mixedLanguageServiceCount + integrity.languageMismatchCount})`,
                    },
                    {
                      ok: integrity.scorecard.mandatoryGates.zeroFabricatedOrOffDomain,
                      label: `Zero off-domain / broken grammar (${integrity.offDomainCount + integrity.brokenGrammarCount})`,
                    },
                    {
                      ok: integrity.scorecard.mandatoryGates.allServicesVerifiedOrFlagged,
                      label: `All service mappings accurate (${integrity.incorrectServiceCount + integrity.mechanicalInsertionCount} bad)`,
                    },
                    {
                      ok: integrity.scorecard.mandatoryGates.allUnsupportedExcludedAndVerified,
                      label: `Sources verified & ratings consistent (${integrity.unverifiedSourceCount} unverified)`,
                    },
                  ].map((g) => (
                    <div key={g.label} className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          g.ok ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className={g.ok ? 'text-slate-700' : 'text-rose-700 font-medium'}>
                        {g.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {integrity.scorecard.blockingReasons.length > 0 && (
              <div className="px-3.5 py-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-semibold">Remaining Gates Before Publication Approval:</div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {integrity.scorecard.blockingReasons.map((br) => (
                    <li key={br}>{br}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Deliverables Export Bar (Cleaned CSV, Rejected/Flagged CSV, Detailed QC Report, Email Privacy) */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={maskEmailsOnExport}
                  onChange={onToggleMaskEmails}
                  className="w-4 h-4 rounded border-slate-300 text-sky-700 accent-sky-700 cursor-pointer"
                />
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Keep customer emails private on export (mask PII)</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!integrity.scorecard.publicationApproved && verifiedIds.length === 0}
                  onClick={onExportVerifiedOnly}
                  title={
                    integrity.scorecard.publicationApproved
                      ? 'Download verified publication-ready CSV'
                      : 'Verify clean rows against source records first to unlock publication CSV'
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    1. Publication-Ready CSV ({verifiedIds.length} verified)
                  </span>
                </button>

                <button
                  type="button"
                  disabled={
                    rejectedReviews.length === 0 &&
                    integrity.flaggedReviewIds.length === 0 &&
                    integrity.unverifiedSourceCount === 0
                  }
                  onClick={onExportRejectedCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    2. Rejected / Flagged CSV ({rejectedReviews.length + integrity.flaggedReviewIds.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onExportQCReport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>3. Detailed QC Report (.md)</span>
                </button>
              </div>
            </div>
          </section>

          {/* Top Flagged Signals Summary */}
          {topSignals.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Why Reviews Were Flagged (Top Signals)
                </h2>
                <span className="text-[11px] text-slate-500">
                  Detected across {stats.generic + stats.aiFlagged} flagged reviews
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {topSignals.map((item) => (
                  <span
                    key={item.signal}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                  >
                    <span>{item.signal}</span>
                    <span className="px-1.5 py-0.2 rounded bg-white/70 dark:bg-black/20 font-mono text-[10px] font-bold">
                      {item.count}
                    </span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Filterable Review Audit Inspector — Shows ALL Rows with Full Forensic Details */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'all', label: `All (${stats.total})` },
                      { id: 'ai_flagged', label: `AI Flagged (${stats.aiFlagged})` },
                      { id: 'generic', label: `Generic (${stats.generic})` },
                      { id: 'issues', label: `Integrity Warnings (${rowsWithIssuesCount})` },
                      { id: 'human', label: `Human (${stats.human})` },
                      { id: 'unchecked', label: `Unchecked (${stats.unchecked})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setVerdictFilter(tab.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        verdictFilter === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Showing all {filteredReviews.length} of {reviews.length} rows
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reviewer, email, service, text, or flag reason…"
                  className="flex-1 min-w-[220px] h-8 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-600 focus:outline-none"
                />
                <select
                  aria-label="Sort detector rows"
                  value={rowSort}
                  onChange={(e) => setRowSort(e.target.value as RowSortMode)}
                  className="h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:border-sky-600 focus:outline-none cursor-pointer"
                >
                  <option value="flagged_first">Sort: Flagged First</option>
                  <option value="lowest_score">Sort: Lowest Human Score</option>
                  <option value="newest">Sort: Newest Date</option>
                  <option value="default">Sort: Original Order</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {filteredReviews.map((review, rowIdx) => {
                const audit = reviewAuditMap[review.id];
                const lang = langMap[review.language];
                const emailKey = review.reviewer_email.trim().toLowerCase();
                const emailCount = emailCountMap.get(emailKey) || 1;
                const wordCount = review.body.trim().split(/\s+/).filter(Boolean).length;
                const rowIssues = integrity.issuesByReviewId[review.id] || [];
                return (
                  <div key={review.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono text-[11px] text-slate-400">#{rowIdx + 1}</span>
                        <span className="inline-flex items-center gap-0.5 text-amber-600 font-mono font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {review.stars}.0
                        </span>
                        <span className="font-semibold text-slate-800">{review.item_name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">
                          {review.category}
                        </span>
                        {lang && (
                          <span className="inline-flex items-center gap-1">
                            <FlagBadge countryCode={lang.countryCode} emoji={lang.flag} size="sm" />
                            <span>{lang.label}</span>
                          </span>
                        )}
                        <span className="font-mono text-[11px]">{review.review_date}</span>
                        <span className="font-mono text-[11px] text-slate-400">{wordCount}w</span>
                        {audit ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
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
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                            Unchecked
                          </span>
                        )}
                        {verifiedSet.has(review.id) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Verified
                          </span>
                        )}
                      </div>

                      {/* Reviewer & Email Metadata Row */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">{review.reviewer_name}</span>
                        <span className="font-mono text-slate-400">
                          {maskEmailsOnExport
                            ? maskCustomerEmail(review.reviewer_email)
                            : review.reviewer_email}
                        </span>
                        {emailCount > 1 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            Repeat Reviewer ({emailCount}×)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Unique Email
                          </span>
                        )}
                        {review.modificationLog && review.modificationLog.length > 0 && (
                          <span
                            title={review.modificationLog
                              .map((m) => `${m.field}: "${m.before}" → "${m.after}" (${m.reason})`)
                              .join('\n')}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                          >
                            Remediated ({review.modificationLog.length} edit{review.modificationLog.length === 1 ? '' : 's'})
                          </span>
                        )}
                      </div>

                      <div dir={review.language === 'ar' || review.language === 'he' ? 'rtl' : 'ltr'}>
                        <p className="text-sm font-semibold text-slate-900">
                          {highlightFlaggedText(review.subject, audit?.flaggedPhrases)}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {highlightFlaggedText(review.body, audit?.flaggedPhrases)}
                        </p>
                      </div>

                      {audit && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-2">
                          <div className="text-[11px] text-slate-700">
                            <span className="font-semibold text-slate-900">Why:</span> {audit.reason}
                          </div>

                          {audit.dimensions && (
                            <div className="grid grid-cols-3 gap-2.5 max-w-md">
                              {[
                                { label: 'Natural Tone', val: audit.dimensions.naturalTone },
                                { label: 'Domain Fit', val: audit.dimensions.domainFit },
                                { label: 'Specificity', val: audit.dimensions.specificity },
                              ].map((d) => (
                                <div key={d.label} className="space-y-0.5">
                                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                                    <span>{d.label}</span>
                                    <span className="font-mono font-semibold text-slate-700">{d.val}%</span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${d.val}%`,
                                        backgroundColor:
                                          d.val >= 75
                                            ? VERDICT_COLORS.human
                                            : d.val >= 50
                                            ? VERDICT_COLORS.generic
                                            : VERDICT_COLORS.ai_flagged,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {audit.flaggedPhrases && audit.flaggedPhrases.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="font-semibold text-rose-700">Flagged phrases:</span>
                              {audit.flaggedPhrases.map((phrase) => (
                                <span
                                  key={phrase}
                                  className="px-1.5 py-0.5 rounded font-mono bg-rose-50 text-rose-700 border border-rose-200"
                                >
                                  “{phrase}”
                                </span>
                              ))}
                            </div>
                          )}

                          {audit.signals && audit.signals.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {audit.signals.map((sig) => (
                                <span
                                  key={sig}
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                    audit.verdict === 'human'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : audit.verdict === 'generic'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {sig}
                                </span>
                              ))}
                            </div>
                          )}

                          {audit.suggestion && (
                            <div className="text-[11px] text-sky-700">
                              <span className="font-semibold">Tip:</span> {audit.suggestion}
                            </div>
                          )}
                        </div>
                      )}
                      {rowIssues.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rowIssues.map((iss, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              {iss.detail}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleVerified(review.id)}
                        title={verifiedSet.has(review.id) ? 'Verified for publishing (click to unverify)' : 'Mark as verified genuine review'}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          verifiedSet.has(review.id)
                            ? 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      {aiOnline && (
                        <button
                          type="button"
                          disabled={isRewriting}
                          onClick={() => onRewriteFlagged([review])}
                          title="AI Rewrite this review"
                          className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRegenerateReview(review.id)}
                        title="Quick regenerate locally"
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteReview(review.id)}
                        title="Delete review"
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
