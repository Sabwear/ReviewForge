import { useCallback, useEffect, useState } from 'react';
import {
  AI_PROVIDERS,
  AIProviderId,
  AISettings,
  AIUsageMetrics,
  AIUsageRecord,
  DetectedModel,
} from '../types/ai';
import { rankModelsForApp } from '../utils/modelAdvisor';

export type AIConnectionStatus = 'online' | 'offline' | 'checking';

export interface ServerFallbackStatus {
  checked: boolean;
  fallbackConfigured: boolean;
  fallbackRequiresSecret: boolean;
  fallbackProvider: string | null;
}

const SETTINGS_KEY = 'reviewforge-ai-settings-v1';
const USAGE_KEY = 'reviewforge-ai-usage-v1';
const MAX_USAGE_RECORDS = 500;

const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.5-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  secretCode: '',
  fallbackUnlocked: false,
};

function loadSettings(): AISettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AISettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadUsage(): AIUsageRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function useAISettings() {
  const [settings, setSettingsState] = useState<AISettings>(loadSettings);
  const [usageHistory, setUsageHistory] = useState<AIUsageRecord[]>(loadUsage);
  const [detectedModels, setDetectedModels] = useState<DetectedModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<AIConnectionStatus>('offline');
  const [serverFallback, setServerFallback] = useState<ServerFallbackStatus>({
    checked: false,
    fallbackConfigured: false,
    fallbackRequiresSecret: false,
    fallbackProvider: null,
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(USAGE_KEY, JSON.stringify(usageHistory));
    } catch {
      // ignore storage errors
    }
  }, [usageHistory]);

  // Fetch server fallback status on mount (never exposes secrets)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/ai/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setServerFallback({
          checked: true,
          fallbackConfigured: Boolean(data.fallbackConfigured),
          fallbackRequiresSecret: Boolean(data.fallbackRequiresSecret),
          fallbackProvider: data.fallbackProvider || null,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setServerFallback((prev) => ({ ...prev, checked: true }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<AISettings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
    if (patch.apiKey !== undefined || patch.baseUrl !== undefined || patch.secretCode !== undefined) {
      setConnectionStatus('offline');
    }
  }, []);

  const selectProvider = useCallback((provider: AIProviderId) => {
    const meta = AI_PROVIDERS.find((p) => p.id === provider);
    setDetectedModels([]);
    setModelsError(null);
    setConnectionStatus('offline');
    setSettingsState((prev) => ({
      ...prev,
      provider,
      baseUrl: meta?.defaultBaseUrl || prev.baseUrl,
      model: meta?.defaultModel || '',
    }));
  }, []);

  const getRequestPayload = useCallback(() => {
    return {
      provider: settings.provider,
      apiKey: settings.provider === 'fallback' ? '' : settings.apiKey.trim(),
      model: settings.model.trim(),
      baseUrl: settings.baseUrl.trim(),
      secretCode: settings.secretCode.trim(),
    };
  }, [settings]);

  const isAIConfigured = Boolean(
    (settings.provider === 'fallback' && settings.fallbackUnlocked && (settings.secretCode.trim() || !serverFallback.fallbackRequiresSecret)) ||
      (settings.provider === 'ollama' && settings.baseUrl.trim()) ||
      (settings.provider !== 'fallback' && settings.provider !== 'ollama' && settings.apiKey.trim())
  );

  const detectModels = useCallback(
    async (override?: Partial<AISettings>) => {
      const cfg = { ...settings, ...override };
      setIsLoadingModels(true);
      setModelsError(null);
      setConnectionStatus('checking');

      try {
        if (cfg.provider === 'ollama' && /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(cfg.baseUrl.trim())) {
          try {
            const direct = await fetch(`${cfg.baseUrl.trim().replace(/\/+$/, '')}/api/tags`);
            if (direct.ok) {
              const data = (await direct.json()) as { models?: Array<{ name?: string; model?: string }> };
              const models: DetectedModel[] = (data.models || [])
                .filter((m) => m.name || m.model)
                .map((m) => {
                  const id = (m.name || m.model)!;
                  return { id, name: id, provider: 'ollama', isFree: true };
                });
              const ranked = rankModelsForApp(models);
              setDetectedModels(ranked);
              setConnectionStatus(ranked.length > 0 ? 'online' : 'offline');
              if (ranked.length > 0 && !ranked.some((m) => m.id === cfg.model)) {
                setSettingsState((prev) => ({ ...prev, model: ranked[0].id }));
              }
              return ranked;
            }
          } catch {
            // Fall through to backend proxy
          }
        }

        const res = await fetch('/api/ai/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aiConfig: {
              provider: cfg.provider,
              apiKey: cfg.provider === 'fallback' ? '' : cfg.apiKey.trim(),
              model: cfg.model.trim(),
              baseUrl: cfg.baseUrl.trim(),
              secretCode: cfg.secretCode.trim(),
            },
          }),
        });
        const payload = (await res.json().catch(() => ({}))) as {
          models?: DetectedModel[];
          error?: string;
        };
        if (!res.ok || !Array.isArray(payload.models)) {
          throw new Error(payload.error || `Failed to fetch models (HTTP ${res.status}).`);
        }
        const ranked = rankModelsForApp(payload.models);
        setDetectedModels(ranked);
        setConnectionStatus(ranked.length > 0 ? 'online' : 'offline');
        if (ranked.length > 0 && !ranked.some((m) => m.id === cfg.model)) {
          setSettingsState((prev) => ({ ...prev, model: ranked[0].id }));
        }
        return ranked;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to detect models.';
        setModelsError(message);
        setDetectedModels([]);
        setConnectionStatus('offline');
        return [];
      } finally {
        setIsLoadingModels(false);
      }
    },
    [settings]
  );

  // Silent connectivity check on initial page load if credentials are already saved
  useEffect(() => {
    const hasSavedCreds =
      (settings.provider === 'fallback' && settings.fallbackUnlocked) ||
      (settings.provider !== 'fallback' && settings.provider !== 'ollama' && Boolean(settings.apiKey.trim()));
    if (!hasSavedCreds) {
      setConnectionStatus('offline');
      return;
    }
    let cancelled = false;
    setConnectionStatus('checking');
    fetch('/api/ai/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aiConfig: {
          provider: settings.provider,
          apiKey: settings.provider === 'fallback' ? '' : settings.apiKey.trim(),
          model: settings.model.trim(),
          baseUrl: settings.baseUrl.trim(),
          secretCode: settings.secretCode.trim(),
        },
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.models) && data.models.length > 0) {
          setDetectedModels(rankModelsForApp(data.models));
          setConnectionStatus('online');
        } else {
          setConnectionStatus('offline');
        }
      })
      .catch(() => {
        if (!cancelled) setConnectionStatus('offline');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifySecretCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    setConnectionStatus('checking');
    const res = await fetch('/api/ai/verify-secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretCode: trimmed }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      valid?: boolean;
      provider?: string;
      defaultModel?: string;
      error?: string;
    };
    if (!res.ok || !payload.valid) {
      setSettingsState((prev) => ({ ...prev, fallbackUnlocked: false }));
      setConnectionStatus('offline');
      throw new Error(payload.error || 'Invalid secret access code.');
    }
    setSettingsState((prev) => ({
      ...prev,
      provider: 'fallback',
      secretCode: trimmed,
      fallbackUnlocked: true,
      fallbackProvider: payload.provider,
      model: payload.defaultModel || prev.model,
    }));
    setConnectionStatus('online');
    return payload;
  }, []);

  const recordUsage = useCallback(
    (
      operation: 'scan-website' | 'adapt-business' | 'detect-reviews' | 'rewrite-reviews',
      metrics: AIUsageMetrics | null | undefined,
      status: 'success' | 'error' = 'success',
      errorMessage?: string
    ) => {
      if (status === 'success') {
        setConnectionStatus('online');
      }
      const fallbackProvider =
        settings.provider === 'fallback'
          ? ((settings.fallbackProvider as Exclude<AIProviderId, 'fallback'>) || 'gemini')
          : settings.provider;
      const entry: AIUsageRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        operation,
        status,
        errorMessage,
        provider: metrics?.provider || fallbackProvider,
        usedFallback: metrics?.usedFallback ?? settings.provider === 'fallback',
        model: metrics?.model || settings.model || 'unknown',
        promptTokens: metrics?.promptTokens ?? 0,
        completionTokens: metrics?.completionTokens ?? 0,
        totalTokens: metrics?.totalTokens ?? 0,
        latencyMs: metrics?.latencyMs ?? 0,
        estimatedCostUsd: metrics?.estimatedCostUsd ?? 0,
      };
      setUsageHistory((prev) => [entry, ...prev].slice(0, MAX_USAGE_RECORDS));
    },
    [settings]
  );

  const clearUsageHistory = useCallback(() => {
    setUsageHistory([]);
  }, []);

  return {
    settings,
    updateSettings,
    selectProvider,
    getRequestPayload,
    isAIConfigured,
    connectionStatus,
    serverFallback,
    detectedModels,
    isLoadingModels,
    modelsError,
    detectModels,
    verifySecretCode,
    usageHistory,
    recordUsage,
    clearUsageHistory,
  };
}
