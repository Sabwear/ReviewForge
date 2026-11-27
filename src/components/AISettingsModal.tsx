import { useMemo, useState } from 'react';
import {
  Activity,
  Award,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { AIConnectionStatus, ServerFallbackStatus } from '../hooks/useAISettings';
import {
  AI_PROVIDERS,
  AIProviderId,
  AISettings,
  AIUsageRecord,
  DetectedModel,
} from '../types/ai';
import {
  evaluateModelFit,
  PROVIDER_GUIDES,
  rankModelsForApp,
} from '../utils/modelAdvisor';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onUpdateSettings: (patch: Partial<AISettings>) => void;
  onSelectProvider: (provider: AIProviderId) => void;
  detectedModels: DetectedModel[];
  isLoadingModels: boolean;
  modelsError: string | null;
  onDetectModels: (override?: Partial<AISettings>) => Promise<DetectedModel[]>;
  onVerifySecretCode: (code: string) => Promise<{ provider?: string; defaultModel?: string }>;
  usageHistory: AIUsageRecord[];
  onClearUsage: () => void;
  onOpenDashboard: () => void;
  connectionStatus: AIConnectionStatus;
  serverFallback: ServerFallbackStatus;
}

export function AISettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onSelectProvider,
  detectedModels,
  isLoadingModels,
  modelsError,
  onDetectModels,
  onVerifySecretCode,
  usageHistory,
  onClearUsage,
  onOpenDashboard,
  connectionStatus,
  serverFallback,
}: AISettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'usage'>('config');
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [verifyingSecret, setVerifyingSecret] = useState(false);
  const [secretMessage, setSecretMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const activeProvider = useMemo(
    () => AI_PROVIDERS.find((p) => p.id === settings.provider) ?? AI_PROVIDERS[0],
    [settings.provider]
  );

  const rankedModels = useMemo(() => rankModelsForApp(detectedModels), [detectedModels]);
  const bestDetectedModel = rankedModels[0] ?? null;
  const providerGuide = PROVIDER_GUIDES[settings.provider];

  const selectedModelFit = useMemo(() => {
    const id = settings.model.trim();
    if (!id) return null;
    const match = rankedModels.find((m) => m.id === id);
    if (match) return match.fit;
    return evaluateModelFit({
      id,
      name: id,
      provider: settings.provider === 'fallback' ? 'gemini' : settings.provider,
    });
  }, [settings.model, settings.provider, rankedModels]);

  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    if (!q) return rankedModels;
    return rankedModels.filter(
      (m) =>
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.fit.tierLabel.toLowerCase().includes(q) ||
        m.fit.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [rankedModels, modelSearch]);

  const usageStats = useMemo(() => {
    const totalCalls = usageHistory.length;
    const totalTokens = usageHistory.reduce((s, r) => s + r.totalTokens, 0);
    const totalCost = usageHistory.reduce((s, r) => s + r.estimatedCostUsd, 0);
    const avgLatency =
      totalCalls > 0
        ? Math.round(usageHistory.reduce((s, r) => s + r.latencyMs, 0) / totalCalls)
        : 0;
    return { totalCalls, totalTokens, totalCost, avgLatency };
  }, [usageHistory]);

  if (!isOpen) return null;

  const handleVerifySecret = async () => {
    if (!settings.secretCode.trim()) {
      setSecretMessage({ type: 'err', text: 'Please enter the secret access code.' });
      return;
    }
    setVerifyingSecret(true);
    setSecretMessage(null);
    try {
      const res = await onVerifySecretCode(settings.secretCode);
      setSecretMessage({
        type: 'ok',
        text: `Unlocked! Server fallback ready (${res.provider || 'gemini'} · ${res.defaultModel || 'default'}).`,
      });
      await onDetectModels({
        provider: 'fallback',
        secretCode: settings.secretCode,
        fallbackUnlocked: true,
        model: res.defaultModel || settings.model,
      });
    } catch (err) {
      setSecretMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Incorrect secret code.',
      });
    } finally {
      setVerifyingSecret(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="AI Provider Settings"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-[#E4E6EB] flex items-center gap-2">
                <span>AI Studio & Provider Settings</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    connectionStatus === 'online'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-[#62C49C]/12 dark:text-[#62C49C] dark:border-[#62C49C]/30'
                      : connectionStatus === 'checking'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-[#E0B36A]/12 dark:text-[#E0B36A] dark:border-[#E0B36A]/30'
                      : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-white/[0.06] dark:text-[#E4E6EB]/70 dark:border-white/[0.10]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      connectionStatus === 'online'
                        ? 'bg-emerald-500'
                        : connectionStatus === 'checking'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-rose-400'
                    }`}
                  />
                  {connectionStatus === 'online'
                    ? 'Online'
                    : connectionStatus === 'checking'
                    ? 'Checking…'
                    : 'Offline'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bring your own API key (Gemini, OpenRouter, OpenAI, Groq, Ollama) or unlock hidden fallback AI.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI settings"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="px-6 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`inline-flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Providers & Models</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={`inline-flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'usage'
                ? 'border-sky-600 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>AI Usage ({usageStats.totalCalls})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'config' ? (
            <>
              {/* Provider Grid */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Select AI Provider
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {AI_PROVIDERS.map((p) => {
                    const selected = settings.provider === p.id;
                    const isFb = p.id === 'fallback';
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSecretMessage(null);
                          onSelectProvider(p.id);
                        }}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          selected
                            ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-500/15 ring-1 ring-sky-500/40'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {isFb &&
                              (settings.fallbackUnlocked ? (
                                <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              ))}
                            {p.shortLabel}
                          </span>
                          {p.badge && (
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                isFb
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                  : 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                              }`}
                            >
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400 line-clamp-2">
                          {p.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Provider-Specific Credentials */}
              {settings.provider === 'fallback' ? (
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Private Fallback AI Access</span>
                        {serverFallback.checked && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              serverFallback.fallbackConfigured
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-[#62C49C]/15 dark:text-[#62C49C]'
                                : 'bg-rose-100 text-rose-700 dark:bg-[#E58388]/15 dark:text-[#E58388]'
                            }`}
                          >
                            {serverFallback.fallbackConfigured
                              ? `Server key ready (${serverFallback.fallbackProvider})`
                              : 'No server key detected'}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {serverFallback.checked && !serverFallback.fallbackConfigured
                          ? 'No API key found on the server. On Cloudflare Workers, local .env files are not uploaded — add GEMINI_API_KEY (or FALLBACK_AI_API_KEY) and FALLBACK_SECRET_CODE in Cloudflare Dashboard → Worker → Settings → Variables and Secrets.'
                          : 'Enter your secret access code to unlock the server-hosted backup AI key without exposing it publicly.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={settings.secretCode}
                        onChange={(e) => {
                          onUpdateSettings({ secretCode: e.target.value, fallbackUnlocked: false });
                          setSecretMessage(null);
                        }}
                        placeholder="Enter secret access code..."
                        className="w-full h-10 pl-3 pr-10 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={showSecret ? 'Hide secret code' : 'Show secret code'}
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifySecret}
                      disabled={verifyingSecret}
                      className="inline-flex items-center justify-center gap-2 px-4 h-10 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {verifyingSecret ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                      <span>Verify & Unlock</span>
                    </button>
                  </div>

                  {secretMessage && (
                    <p
                      className={`text-xs font-medium ${
                        secretMessage.type === 'ok'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {secretMessage.text}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {activeProvider.needsBaseUrl && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {settings.provider === 'ollama' ? 'Ollama Server URL' : 'OpenAI-Compatible Base URL'}
                      </label>
                      <input
                        type="url"
                        value={settings.baseUrl}
                        onChange={(e) => onUpdateSettings({ baseUrl: e.target.value })}
                        placeholder={activeProvider.defaultBaseUrl}
                        className="w-full h-10 px-3 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  )}

                  {activeProvider.needsKey && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-sky-500" />
                          <span>{activeProvider.label} API Key</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Stored locally in your browser</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={settings.apiKey}
                          onChange={(e) => onUpdateSettings({ apiKey: e.target.value })}
                          placeholder={activeProvider.keyPlaceholder}
                          className="w-full h-10 pl-3 pr-10 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKey((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showKey ? 'Hide API key' : 'Show API key'}
                        >
                          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Model Auto-Detection & Smart Fit Advisor */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Model Selection & Smart Fit Advisor
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Auto-detects live models and ranks them for ReviewForge&apos;s nested JSON + 16-language logic.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDetectModels()}
                    disabled={isLoadingModels}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isLoadingModels ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>{isLoadingModels ? 'Detecting...' : 'Auto-Detect Models'}</span>
                  </button>
                </div>

                {/* Smart Recommendation Banner */}
                {bestDetectedModel ? (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50 via-indigo-50/70 to-white dark:from-sky-500/15 dark:via-indigo-500/10 dark:to-slate-900/60 border border-sky-200 dark:border-sky-500/30 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-sky-600 text-white">
                            <Award className="w-3 h-3" />
                            Best Fit · {bestDetectedModel.fit.score}/100
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white truncate">
                            {bestDetectedModel.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {bestDetectedModel.fit.reason}
                        </p>
                      </div>
                      {settings.model !== bestDetectedModel.id && (
                        <button
                          type="button"
                          onClick={() => onUpdateSettings({ model: bestDetectedModel.id })}
                          className="shrink-0 px-2.5 py-1.5 text-[11px] font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer"
                        >
                          Use Best Fit
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[
                        { label: 'JSON Schema', val: bestDetectedModel.fit.metrics.jsonReliability },
                        { label: 'Multilingual', val: bestDetectedModel.fit.metrics.multilingual },
                        { label: 'Speed / Value', val: bestDetectedModel.fit.metrics.speedValue },
                      ].map((bar) => (
                        <div key={bar.label} className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>{bar.label}</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                              {bar.val}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                              style={{ width: `${bar.val}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-500/10 border border-sky-200/80 dark:border-sky-500/25 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300">
                        <Award className="w-3.5 h-3.5" />
                        Recommended for {activeProvider.shortLabel}:{' '}
                        <code className="font-mono font-bold">{providerGuide.topPick}</code>
                      </span>
                      {providerGuide.topPick !== 'Server Default' && settings.model !== providerGuide.topPick && (
                        <button
                          type="button"
                          onClick={() => onUpdateSettings({ model: providerGuide.topPick })}
                          className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:underline cursor-pointer"
                        >
                          Apply recommended
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong>Why:</strong> {providerGuide.whyItFits}
                    </p>
                  </div>
                )}

                {/* Active Model Input */}
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={settings.model}
                    onChange={(e) => onUpdateSettings({ model: e.target.value })}
                    placeholder={activeProvider.defaultModel || 'Enter or select a model ID'}
                    className="w-full h-9 px-3 text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {selectedModelFit && (
                    <div className="flex items-center justify-between gap-2 text-[11px] px-1">
                      <span className="text-slate-500 dark:text-slate-400 truncate">
                        {selectedModelFit.reason}
                      </span>
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded font-semibold ${
                          selectedModelFit.tier === 'best'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : selectedModelFit.tier === 'great'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                            : selectedModelFit.tier === 'caution'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {selectedModelFit.tierLabel} ({selectedModelFit.score})
                      </span>
                    </div>
                  )}
                </div>

                {modelsError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg px-3 py-2">
                    {modelsError}
                  </p>
                )}

                {rankedModels.length > 0 && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder={`Filter ${rankedModels.length} detected models (ranked by best fit)...`}
                        className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                      {filteredModels.slice(0, 80).map((m) => {
                        const isSelected = settings.model === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => onUpdateSettings({ model: m.id })}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 font-semibold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="truncate font-mono">{m.id}</div>
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {m.fit.reason}
                              </div>
                            </div>
                            <span className="flex items-center gap-1.5 shrink-0">
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                                  m.fit.tier === 'best'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                    : m.fit.tier === 'great'
                                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
                                    : m.fit.tier === 'caution'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {m.fit.tierLabel} · {m.fit.score}
                              </span>
                              {m.isFree && (
                                <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                  FREE
                                </span>
                              )}
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Quick KPI summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Total Requests</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {usageStats.totalCalls}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Total Tokens</div>
                  <div className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                    {usageStats.totalTokens.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Avg Latency</div>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                    {usageStats.avgLatency > 0 ? `${(usageStats.avgLatency / 1000).toFixed(1)}s` : '—'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500">Est. Cost</div>
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${usageStats.totalCost.toFixed(4)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDashboard();
                  }}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  Open full AI Usage Graphs in Dashboard →
                </button>
                {usageHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearUsage}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear log
                  </button>
                )}
              </div>

              {usageHistory.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  No AI requests recorded yet. Scan a website or adapt copy to see live token & latency telemetry.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {usageHistory.slice(0, 12).map((u) => (
                    <div key={u.id} className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {u.operation === 'scan-website' ? 'Website Scan' : 'Copy Adaptation'}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 truncate">
                            {u.provider}/{u.model}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(u.timestamp).toLocaleString()}
                          {u.usedFallback ? ' · Fallback AI' : ''}
                        </div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className="text-slate-800 dark:text-slate-200">
                          {u.totalTokens.toLocaleString()} tok
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {(u.latencyMs / 1000).toFixed(1)}s · ${u.estimatedCostUsd.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Active:{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-mono">
              {settings.provider === 'fallback'
                ? settings.fallbackUnlocked
                  ? `Fallback (${settings.model || 'default'})`
                  : 'Fallback (Locked)'
                : `${activeProvider.shortLabel} · ${settings.model || 'select model'}`}
            </strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl transition-colors cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
