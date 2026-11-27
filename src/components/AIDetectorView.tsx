import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
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
import { GeneratedReview, LANGUAGE_OPTIONS } from '../types/reviews';
import { FlagBadge } from './FlagBadge';

export interface ReviewAuditEntry {
  humanScore: number;
  verdict: 'human' | 'generic' | 'ai_flagged';
  reason: string;
  signals?: string[];
  flaggedPhrases?: string[];
  suggestion?: string;
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
  onRegenerateReview: (reviewId: string) => void;
  onDeleteReview: (reviewId: string) => void;
  onDeleteFlaggedReviews: (ids: string[]) => void;
  onClearAuditData: () => void;
  onExportHumanOnly: () => void;
}

type VerdictFilter = 'all' | 'ai_flagged' | 'generic' | 'human' | 'unchecked';

const VERDICT_COLORS = {
  human: '#62C49C',
  generic: '#E0B36A',
  ai_flagged: '#E58388',
  unchecked: '#64748B',
};

export function AIDetectorView({
  reviews,
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
  onRegenerateReview,
  onDeleteReview,
  onDeleteFlaggedReviews,
  onClearAuditData,
  onExportHumanOnly,
}: AIDetectorViewProps) {
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('all');

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
    return reviews.filter((r) => {
      const a = reviewAuditMap[r.id];
      if (verdictFilter === 'all') return true;
      if (verdictFilter === 'unchecked') return !a;
      return a?.verdict === verdictFilter;
    });
  }, [reviews, reviewAuditMap, verdictFilter]);

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

          {/* Filterable Review Audit Inspector */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: `All (${stats.total})` },
                    { id: 'ai_flagged', label: `AI Flagged (${stats.aiFlagged})` },
                    { id: 'generic', label: `Generic (${stats.generic})` },
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
                Showing {filteredReviews.length} rows
              </span>
            </div>

            <div className="divide-y divide-slate-200 max-h-[560px] overflow-y-auto">
              {filteredReviews.slice(0, 100).map((review) => {
                const audit = reviewAuditMap[review.id];
                const lang = langMap[review.language];
                return (
                  <div key={review.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-0.5 text-amber-600 font-mono font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {review.stars}.0
                        </span>
                        <span className="font-semibold text-slate-800">{review.item_name}</span>
                        {lang && (
                          <span className="inline-flex items-center gap-1">
                            <FlagBadge countryCode={lang.countryCode} emoji={lang.flag} size="sm" />
                            <span>{lang.label}</span>
                          </span>
                        )}
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

                          {audit.suggestion && audit.verdict !== 'human' && (
                            <div className="text-[11px] text-sky-700">
                              <span className="font-semibold">Tip:</span> {audit.suggestion}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
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
