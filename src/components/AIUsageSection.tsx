import { useMemo } from 'react';
import {
  Activity,
  Clock,
  Cpu,
  DollarSign,
  Settings2,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AIUsageRecord } from '../types/ai';

interface AIUsageSectionProps {
  usageHistory: AIUsageRecord[];
  activeProviderLabel: string;
  isAIConfigured: boolean;
  onOpenAISettings: () => void;
  onClearUsage: () => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#0284C7',
  openrouter: '#6366F1',
  openai: '#10B981',
  groq: '#F59E0B',
  ollama: '#8B5CF6',
  custom: '#EC4899',
};

export function AIUsageSection({
  usageHistory,
  activeProviderLabel,
  isAIConfigured,
  onOpenAISettings,
  onClearUsage,
}: AIUsageSectionProps) {
  const stats = useMemo(() => {
    const totalCalls = usageHistory.length;
    const successCalls = usageHistory.filter((r) => r.status === 'success').length;
    const totalTokens = usageHistory.reduce((s, r) => s + r.totalTokens, 0);
    const totalPrompt = usageHistory.reduce((s, r) => s + r.promptTokens, 0);
    const totalCompletion = usageHistory.reduce((s, r) => s + r.completionTokens, 0);
    const totalCost = usageHistory.reduce((s, r) => s + r.estimatedCostUsd, 0);
    const avgLatencyMs =
      totalCalls > 0
        ? Math.round(usageHistory.reduce((s, r) => s + r.latencyMs, 0) / totalCalls)
        : 0;
    const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 100;
    return {
      totalCalls,
      successRate,
      totalTokens,
      totalPrompt,
      totalCompletion,
      totalCost,
      avgLatencyMs,
    };
  }, [usageHistory]);

  // Chronological timeline (oldest -> newest, up to last 25 calls)
  const timelineData = useMemo(() => {
    return [...usageHistory]
      .slice(0, 25)
      .reverse()
      .map((r, i) => ({
        label: `#${i + 1}`,
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        prompt: r.promptTokens,
        completion: r.completionTokens,
        total: r.totalTokens,
        latencySec: Number((r.latencyMs / 1000).toFixed(2)),
        model: r.model,
      }));
  }, [usageHistory]);

  // Breakdown by provider/model
  const modelBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; provider: string; tokens: number; calls: number }
    >();
    for (const r of usageHistory) {
      const key = `${r.provider} · ${r.model}`;
      const existing = map.get(key) || {
        name: r.model.length > 24 ? `${r.model.slice(0, 22)}…` : r.model,
        provider: r.provider,
        tokens: 0,
        calls: 0,
      };
      existing.tokens += r.totalTokens;
      existing.calls += 1;
      map.set(key, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 6);
  }, [usageHistory]);

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/15 to-indigo-500/15 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              AI Usage & Telemetry
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isAIConfigured
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isAIConfigured ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                {activeProviderLabel}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live token consumption, latency, and model distribution across your AI requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {usageHistory.length > 0 && (
            <button
              type="button"
              onClick={onClearUsage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAISettings}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Configure AI</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>AI Requests</span>
            <Sparkles className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {stats.totalCalls}
          </div>
          <div className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {stats.successRate}% success rate
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Tokens</span>
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {stats.totalTokens.toLocaleString()}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {stats.totalPrompt.toLocaleString()} in · {stats.totalCompletion.toLocaleString()} out
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Avg Latency</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {stats.avgLatencyMs > 0 ? `${(stats.avgLatencyMs / 1000).toFixed(2)}s` : '—'}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Per API round-trip
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Est. Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            ${stats.totalCost.toFixed(4)}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            $0.00 for Ollama / free tier
          </div>
        </div>
      </div>

      {/* Charts */}
      {usageHistory.length === 0 ? (
        <div className="py-10 px-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <Cpu className="w-8 h-8 text-slate-400 mx-auto mb-2.5" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No AI telemetry recorded yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Connect Gemini, OpenRouter, OpenAI, Groq, Ollama, or unlock the hidden Fallback AI, then scan a website or adapt review copy to populate live usage graphs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Token Usage Timeline */}
          <div className="lg:col-span-2 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
              Token Consumption Over Recent Calls
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="aiPromptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284C7" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#0284C7" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="aiCompGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.32} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Area type="monotone" dataKey="prompt" name="Prompt Tokens" stackId="1" stroke="#0284C7" strokeWidth={2} fill="url(#aiPromptGrad)" />
                  <Area type="monotone" dataKey="completion" name="Completion Tokens" stackId="1" stroke="#6366F1" strokeWidth={2} fill="url(#aiCompGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
              Tokens by Model
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelBreakdown} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={{ stroke: '#CBD5E1' }} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: '#F8FAFC',
                    }}
                  />
                  <Bar dataKey="tokens" name="Total Tokens" radius={[0, 6, 6, 0]}>
                    {modelBreakdown.map((entry, idx) => (
                      <Cell key={idx} fill={PROVIDER_COLORS[entry.provider] || '#0284C7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
