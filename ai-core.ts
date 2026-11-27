// Runtime-agnostic multi-provider AI engine (works in both Node.js & Cloudflare Workers).
// Supports: Google Gemini, OpenRouter, OpenAI, Groq, Ollama, Custom OpenAI-compatible,
// and a secret-code-protected server Fallback AI.

export type AIProviderId =
  | 'gemini'
  | 'openrouter'
  | 'openai'
  | 'groq'
  | 'ollama'
  | 'custom'
  | 'fallback';

export interface AIConfigPayload {
  provider?: AIProviderId;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  secretCode?: string;
}

export interface ServerAIEnv {
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GOOGLE_API_KEY?: string;
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
  API_KEY?: string;
  AI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GROQ_API_KEY?: string;
  SECRET_CODE?: string;
  FALLBACK_SECRET_CODE?: string;
  FALLBACK_AI_PROVIDER?: string;
  FALLBACK_AI_API_KEY?: string;
  FALLBACK_AI_MODEL?: string;
  FALLBACK_AI_BASE_URL?: string;
}

export interface DetectedModel {
  id: string;
  name: string;
  provider: Exclude<AIProviderId, 'fallback'>;
  contextLength?: number;
  isFree?: boolean;
}

export interface AIUsageMetrics {
  provider: Exclude<AIProviderId, 'fallback'>;
  usedFallback: boolean;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  estimatedCostUsd: number;
}

interface ResolvedAI {
  provider: Exclude<AIProviderId, 'fallback'>;
  apiKey: string;
  model: string;
  baseUrl: string;
  usedFallback: boolean;
}

const DEFAULT_BASE_URLS: Record<Exclude<AIProviderId, 'fallback'>, string> = {
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
  openrouter: 'https://openrouter.ai/api/v1',
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  ollama: 'http://localhost:11434',
  custom: '',
};

const DEFAULT_MODELS: Record<Exclude<AIProviderId, 'fallback'>, string> = {
  gemini: 'gemini-3.8-flash',
  openrouter: 'google/gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  groq: 'llama-3.3-70b-versatile',
  ollama: 'llama3.2',
  custom: 'gpt-4o-mini',
};

const AI_TIMEOUT_MS = 60_000;
const MODELS_TIMEOUT_MS = 12_000;

function timingSafeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    diff |= (a.charCodeAt(i % a.length) || 0) ^ (b.charCodeAt(i % b.length) || 0);
  }
  return diff === 0;
}

function cleanEnv(v: string | undefined): string {
  const s = (v || '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).trim();
  }
  return s;
}

function guessProviderFromKey(key: string): Exclude<AIProviderId, 'fallback'> {
  if (key.startsWith('sk-or-')) return 'openrouter';
  if (key.startsWith('gsk_')) return 'groq';
  if (key.startsWith('sk-')) return 'openai';
  return 'gemini';
}

function resolveEnvFallbackCredentials(env: ServerAIEnv): {
  apiKey: string;
  provider: Exclude<AIProviderId, 'fallback'>;
} | null {
  const validProviders: Exclude<AIProviderId, 'fallback'>[] = [
    'gemini',
    'openrouter',
    'openai',
    'groq',
    'ollama',
    'custom',
  ];
  const explicitProv = cleanEnv(env.FALLBACK_AI_PROVIDER).toLowerCase();
  const hasExplicitProv = validProviders.includes(explicitProv as Exclude<AIProviderId, 'fallback'>);

  const fallbackKey = cleanEnv(env.FALLBACK_AI_API_KEY);
  if (fallbackKey) {
    return {
      apiKey: fallbackKey,
      provider: hasExplicitProv
        ? (explicitProv as Exclude<AIProviderId, 'fallback'>)
        : guessProviderFromKey(fallbackKey),
    };
  }
  const geminiKey =
    cleanEnv(env.GEMINI_API_KEY) ||
    cleanEnv(env.GOOGLE_API_KEY) ||
    cleanEnv(env.GOOGLE_GENERATIVE_AI_API_KEY) ||
    cleanEnv(env.VITE_GEMINI_API_KEY);
  if (geminiKey) return { apiKey: geminiKey, provider: guessProviderFromKey(geminiKey) };
  const openrouterKey = cleanEnv(env.OPENROUTER_API_KEY);
  if (openrouterKey) return { apiKey: openrouterKey, provider: 'openrouter' };
  const openaiKey = cleanEnv(env.OPENAI_API_KEY);
  if (openaiKey) return { apiKey: openaiKey, provider: 'openai' };
  const groqKey = cleanEnv(env.GROQ_API_KEY);
  if (groqKey) return { apiKey: groqKey, provider: 'groq' };
  const genericKey = cleanEnv(env.AI_API_KEY) || cleanEnv(env.API_KEY);
  if (genericKey) return { apiKey: genericKey, provider: guessProviderFromKey(genericKey) };
  return null;
}

export function isFallbackConfigured(env: ServerAIEnv): boolean {
  return Boolean(resolveEnvFallbackCredentials(env));
}

export function isFallbackSecretValid(secretCode: string | undefined, env: ServerAIEnv): boolean {
  const expected = cleanEnv(env.FALLBACK_SECRET_CODE) || cleanEnv(env.SECRET_CODE);
  if (!expected) return false;
  const provided = cleanEnv(secretCode);
  return timingSafeEqual(provided, expected);
}

export function getFallbackInfo(env: ServerAIEnv): {
  configured: boolean;
  requiresSecret: boolean;
  provider: Exclude<AIProviderId, 'fallback'>;
  defaultModel: string;
} {
  const creds = resolveEnvFallbackCredentials(env);
  const provider = creds?.provider || 'gemini';
  const defaultModel =
    cleanEnv(env.FALLBACK_AI_MODEL) || cleanEnv(env.GEMINI_MODEL) || DEFAULT_MODELS[provider];
  return {
    configured: Boolean(creds),
    requiresSecret: Boolean(cleanEnv(env.FALLBACK_SECRET_CODE) || cleanEnv(env.SECRET_CODE)),
    provider,
    defaultModel,
  };
}

export function resolveAIConfig(
  payload: AIConfigPayload | undefined,
  env: ServerAIEnv
): ResolvedAI | null {
  const provider = payload?.provider;
  const userKey = (payload?.apiKey || '').trim();
  const userBaseUrl = (payload?.baseUrl || '').trim().replace(/\/+$/, '');
  const userModel = (payload?.model || '').trim();

  // 1. Explicit user-supplied provider (with key, or Ollama without key)
  if (provider && provider !== 'fallback') {
    const needsKey = provider !== 'ollama';
    if (!needsKey || userKey) {
      return {
        provider,
        apiKey: userKey,
        model: userModel || DEFAULT_MODELS[provider],
        baseUrl: userBaseUrl || DEFAULT_BASE_URLS[provider],
        usedFallback: false,
      };
    }
  }

  // 2. Secret-code-protected server fallback AI
  const creds = resolveEnvFallbackCredentials(env);
  const fb = getFallbackInfo(env);
  if (creds && fb.configured) {
    const allowed = fb.requiresSecret
      ? isFallbackSecretValid(payload?.secretCode, env)
      : true;

    if (allowed) {
      return {
        provider: creds.provider,
        apiKey: creds.apiKey,
        model: userModel || fb.defaultModel,
        baseUrl: (cleanEnv(env.FALLBACK_AI_BASE_URL) || DEFAULT_BASE_URLS[creds.provider]).replace(/\/+$/, ''),
        usedFallback: true,
      };
    }
  }

  return null;
}

function estimateCostUsd(
  provider: Exclude<AIProviderId, 'fallback'>,
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  if (provider === 'ollama') return 0;
  const m = model.toLowerCase();
  if (m.includes(':free')) return 0;
  // Rough per-1M token rates (input / output USD)
  let inRate = 0.2;
  let outRate = 0.6;
  if (m.includes('flash')) {
    inRate = 0.15;
    outRate = 0.6;
  } else if (m.includes('pro') || m.includes('sonnet') || m.includes('gpt-4o') && !m.includes('mini')) {
    inRate = 2.5;
    outRate = 10.0;
  } else if (m.includes('mini') || m.includes('haiku') || provider === 'groq') {
    inRate = 0.15;
    outRate = 0.6;
  }
  const cost = (promptTokens / 1_000_000) * inRate + (completionTokens / 1_000_000) * outRate;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

// ---------- Model Auto-Detection ----------

export async function listProviderModels(
  payload: AIConfigPayload | undefined,
  env: ServerAIEnv
): Promise<{ models: DetectedModel[]; provider: Exclude<AIProviderId, 'fallback'>; usedFallback: boolean }> {
  const resolved = resolveAIConfig(payload, env);
  if (!resolved) {
    const fb = getFallbackInfo(env);
    if (payload?.provider === 'fallback' && fb.requiresSecret) {
      throw new Error('Invalid or missing secret access code for Fallback AI.');
    }
    throw new Error('Please enter an API key (or unlock Fallback AI with your secret code) to load models.');
  }

  const { provider, apiKey, baseUrl, usedFallback } = resolved;

  if (provider === 'gemini') {
    const url = `${baseUrl}/models?key=${encodeURIComponent(apiKey)}&pageSize=100`;
    const res = await fetch(url, { signal: AbortSignal.timeout(MODELS_TIMEOUT_MS) });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 180) || res.statusText}`);
    }
    const data = (await res.json()) as {
      models?: Array<{
        name?: string;
        displayName?: string;
        inputTokenLimit?: number;
        supportedGenerationMethods?: string[];
      }>;
    };
    const models: DetectedModel[] = (data.models || [])
      .filter(
        (m) =>
          m.name &&
          Array.isArray(m.supportedGenerationMethods) &&
          m.supportedGenerationMethods.includes('generateContent') &&
          !/embedding|aqa|imagen|veo|tts/i.test(m.name)
      )
      .map((m) => {
        const id = m.name!.replace(/^models\//, '');
        return {
          id,
          name: m.displayName || id,
          provider: 'gemini' as const,
          contextLength: m.inputTokenLimit,
        };
      })
      .sort((a, b) => {
        const score = (id: string) =>
          id.includes('3.8-flash')
            ? 0
            : id.includes('3-flash') || id.includes('flash-lite')
            ? 1
            : id.includes('flash')
            ? 2
            : id.includes('pro')
            ? 3
            : 4;
        return score(a.id) - score(b.id) || b.id.localeCompare(a.id);
      });
    return { models, provider, usedFallback };
  }

  if (provider === 'ollama') {
    if (!baseUrl) throw new Error('Please enter an Ollama server URL (e.g. http://localhost:11434).');
    const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(MODELS_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`Could not connect to Ollama at ${baseUrl} (HTTP ${res.status}).`);
    const data = (await res.json()) as { models?: Array<{ name?: string; model?: string }> };
    const models: DetectedModel[] = (data.models || [])
      .filter((m) => m.name || m.model)
      .map((m) => {
        const id = (m.name || m.model)!;
        return { id, name: id, provider: 'ollama' as const, isFree: true };
      });
    return { models, provider, usedFallback };
  }

  // OpenRouter / OpenAI / Groq / Custom OpenAI-compatible
  if (!baseUrl) throw new Error('Please enter a Base URL for your custom OpenAI-compatible provider.');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://reviewforge.app';
    headers['X-Title'] = 'ReviewForge';
  }

  const res = await fetch(`${baseUrl}/models`, {
    headers,
    signal: AbortSignal.timeout(MODELS_TIMEOUT_MS),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`${provider} API error (${res.status}): ${errText.slice(0, 180) || res.statusText}`);
  }
  const data = (await res.json()) as {
    data?: Array<{
      id?: string;
      name?: string;
      context_length?: number;
      pricing?: { prompt?: string; completion?: string };
    }>;
  };

  let rawModels = (data.data || []).filter((m) => Boolean(m.id));
  if (provider === 'openai') {
    rawModels = rawModels.filter((m) => /^(gpt-|o1|o3|o4|chatgpt)/i.test(m.id!) && !/audio|realtime|tts|whisper|dall-e|embedding/i.test(m.id!));
  }

  const models: DetectedModel[] = rawModels
    .slice(0, 250)
    .map((m) => {
      const isFree =
        m.id!.includes(':free') ||
        (m.pricing?.prompt === '0' && m.pricing?.completion === '0');
      return {
        id: m.id!,
        name: m.name || m.id!,
        provider,
        contextLength: m.context_length,
        isFree,
      };
    })
    .sort((a, b) => {
      if (provider === 'openrouter' && Boolean(a.isFree) !== Boolean(b.isFree)) {
        return a.isFree ? -1 : 1;
      }
      return a.id.localeCompare(b.id);
    });

  return { models, provider, usedFallback };
}

// ---------- Unified JSON Generation ----------

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
  // Strip ```json ... ``` fences
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  // Fallback: slice between first { and last }
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

function rankCheapestEfficient(models: DetectedModel[], failedModel: string): DetectedModel[] {
  const failedLower = failedModel.toLowerCase();
  const score = (m: DetectedModel): number => {
    const id = m.id.toLowerCase();
    if (/(embedding|imagen|veo|tts|whisper|audio|realtime|moderation|guard)/i.test(id)) return 999;
    if (m.isFree) return 5;
    if (id.includes('3.8-flash') || id.includes('flash-lite')) return 10;
    if (id.includes('3-flash') || id.includes('3.5-flash')) return 12;
    if (id.includes('flash')) return 15;
    if (id.includes('nano') || id.includes('gpt-4o-mini') || id.includes('4.1-mini')) return 18;
    if (id.includes('haiku') || id.includes('deepseek-chat') || id.includes('70b-versatile')) return 22;
    if (id.includes('8b-instant') || id.includes('mini')) return 26;
    if (id.includes('pro') || id.includes('sonnet')) return 40;
    return 50;
  };
  return models
    .filter((m) => m.id.toLowerCase() !== failedLower && score(m) < 900)
    .sort((a, b) => score(a) - score(b) || b.id.localeCompare(a.id));
}

function isModelUnavailableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b(404|400|429|503)\b|no longer available|not found|deprecated|not supported|model.*does not exist|quota|overloaded/i.test(
    msg
  );
}

async function callProviderJsonOnce(
  resolved: ResolvedAI,
  systemInstruction: string,
  fullPrompt: string
): Promise<{ rawText: string; promptTokens: number; completionTokens: number }> {
  const { provider, apiKey, model, baseUrl } = resolved;

  if (provider === 'gemini') {
    const url = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini error (${res.status}): ${errText.slice(0, 220) || res.statusText}`);
    }
    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    return {
      rawText: json.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '',
      promptTokens: json.usageMetadata?.promptTokenCount || 0,
      completionTokens: json.usageMetadata?.candidatesTokenCount || 0,
    };
  }

  if (provider === 'ollama') {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: fullPrompt },
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Ollama error (${res.status}): ${errText.slice(0, 220) || res.statusText}`);
    }
    const json = (await res.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };
    return {
      rawText: json.message?.content || '',
      promptTokens: json.prompt_eval_count || 0,
      completionTokens: json.eval_count || 0,
    };
  }

  // OpenRouter / OpenAI / Groq / Custom OpenAI-compatible
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://reviewforge.app';
    headers['X-Title'] = 'ReviewForge';
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: fullPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`${provider} error (${res.status}): ${errText.slice(0, 220) || res.statusText}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  return {
    rawText: json.choices?.[0]?.message?.content || '',
    promptTokens: json.usage?.prompt_tokens || 0,
    completionTokens: json.usage?.completion_tokens || 0,
  };
}

export async function generateJsonWithAI<T = Record<string, unknown>>(
  payload: AIConfigPayload | undefined,
  env: ServerAIEnv,
  opts: {
    systemInstruction: string;
    prompt: string;
    jsonShapeHint?: string;
  }
): Promise<{ data: T; usage: AIUsageMetrics }> {
  const resolved = resolveAIConfig(payload, env);
  if (!resolved) {
    throw new Error('No AI provider configured. Open AI Settings to add your API key or enter the secret access code.');
  }

  const startedAt = Date.now();
  const fullPrompt = opts.jsonShapeHint
    ? `${opts.prompt}\n\nRETURN ONLY VALID JSON (no markdown, no commentary) matching this exact structure:\n${opts.jsonShapeHint}`
    : `${opts.prompt}\n\nRETURN ONLY VALID JSON (no markdown fences, no commentary).`;

  let activeModel = resolved.model;
  let result: { rawText: string; promptTokens: number; completionTokens: number } | null = null;
  let lastError: unknown = null;

  try {
    result = await callProviderJsonOnce(resolved, opts.systemInstruction, fullPrompt);
  } catch (err) {
    lastError = err;
    // Automatic smart fallback to the cheapest & most efficient working model on this provider
    if (isModelUnavailableError(err)) {
      try {
        const listed = await listProviderModels(payload, env);
        const candidates = rankCheapestEfficient(listed.models, resolved.model).slice(0, 3);
        for (const candidate of candidates) {
          try {
            activeModel = candidate.id;
            result = await callProviderJsonOnce(
              { ...resolved, model: candidate.id },
              opts.systemInstruction,
              fullPrompt
            );
            lastError = null;
            break;
          } catch (retryErr) {
            lastError = retryErr;
          }
        }
      } catch {
        // Keep original error if model discovery itself fails
      }
    }
  }

  if (!result) {
    throw lastError instanceof Error ? lastError : new Error('AI request failed.');
  }

  const { provider, usedFallback } = resolved;
  const { rawText } = result;
  let { promptTokens, completionTokens } = result;

  const latencyMs = Date.now() - startedAt;
  const cleaned = extractJsonObject(rawText);
  if (!cleaned) {
    throw new Error(`Model (${activeModel}) returned an empty response. Please try again.`);
  }

  let parsed: T;
  try {
    parsed = JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Model (${activeModel}) returned invalid JSON. Try another model.`);
  }

  if (promptTokens === 0) promptTokens = Math.max(1, Math.round((opts.systemInstruction.length + fullPrompt.length) / 4));
  if (completionTokens === 0) completionTokens = Math.max(1, Math.round(rawText.length / 4));
  const totalTokens = promptTokens + completionTokens;

  return {
    data: parsed,
    usage: {
      provider,
      usedFallback,
      model: activeModel,
      promptTokens,
      completionTokens,
      totalTokens,
      latencyMs,
      estimatedCostUsd: estimateCostUsd(provider, activeModel, promptTokens, completionTokens),
    },
  };
}

export const VOICE_PACK_JSON_HINT = `{
  "detectedBusinessName": "2-5 word business label",
  "businessSummary": "One concise sentence summarizing the business and its core offerings.",
  "productClassifications": [{ "item_slug": "slug", "cleanName": "Display Name", "category": "Category" }],
  "categoryContext": [{ "category": "Category", "language": "en", "contextA": ["5-6 scenarios"], "contextB": ["5-6 qualities"], "openers": ["4-5 sentences"], "middles": ["4-5 sentences"] }],
  "languagePacks": [{
    "language": "en",
    "tokens": { "contextA": ["6-8 items"], "contextB": ["6-8 items"], "duration": ["5-7 items"], "timeframe": ["5-6 items like 24h, 2 days"] },
    "stars": [{ "star": 5, "subjects": ["5-8 titles"], "openers": ["5-7 sentences"], "middles": ["4-6 sentences"], "closers": ["3-5 sentences"] }],
    "extraTails": ["5-6 short follow-up sentences"]
  }]
}`;

export const SCAN_WEBSITE_JSON_HINT = `{
  "businessType": "service or ecommerce",
  "discoveredItems": [{ "item_name": "Offering Name", "item_slug": "offering-slug", "category": "Category", "product_url": "https://..." }],
  "detectedBusinessName": "2-5 word business label",
  "businessSummary": "One concise sentence summarizing the business.",
  "productClassifications": [{ "item_slug": "offering-slug", "cleanName": "Offering Name", "category": "Category" }],
  "categoryContext": [{ "category": "Category", "language": "en", "contextA": ["5-6 scenarios"], "contextB": ["5-6 qualities"], "openers": ["4-5 sentences"], "middles": ["4-5 sentences"] }],
  "languagePacks": [{
    "language": "en",
    "tokens": { "contextA": ["6-8 items"], "contextB": ["6-8 items"], "duration": ["5-7 items"], "timeframe": ["5-6 items"] },
    "stars": [{ "star": 5, "subjects": ["5-8 titles"], "openers": ["5-7 sentences"], "middles": ["4-6 sentences"], "closers": ["3-5 sentences"] }],
    "extraTails": ["5-6 short follow-up sentences"]
  }]
}`;

export interface ReviewAuditInput {
  id: string;
  item_name: string;
  category: string;
  stars: number;
  language: string;
  subject: string;
  body: string;
}

export interface ReviewAuditResult {
  id: string;
  humanScore: number; // 0-100 (higher = more human & domain-accurate)
  verdict: 'human' | 'generic' | 'ai_flagged';
  reason: string;
  signals: string[];
  flaggedPhrases: string[];
  suggestion: string;
  dimensions: {
    naturalTone: number;
    domainFit: number;
    specificity: number;
  };
}

export async function detectReviewsWithAI(
  payload: AIConfigPayload | undefined,
  env: ServerAIEnv,
  reviews: ReviewAuditInput[],
  businessContext: string
): Promise<{ results: ReviewAuditResult[]; usage: AIUsageMetrics }> {
  const batch = reviews.slice(0, 35);
  const formatted = batch
    .map(
      (r) =>
        `ID="${r.id}" | Lang=${r.language} | Stars=${r.stars} | Offering="${r.item_name}" (${r.category}) | Title="${r.subject}" | Body="${r.body}"`
    )
    .join('\n');

  const prompt = `Audit these generated customer reviews in depth for authenticity, natural human phrasing, and business-domain accuracy.

Business context: ${businessContext || '(Infer from offerings — pay close attention to whether this is a SERVICE business like plumbing/heating/clinic/agency vs an e-commerce store)'}

Reviews to audit:
${formatted}

SCORING RULES (strict):
- Give LOW humanScore (10–49, verdict="ai_flagged") if a review:
  * Uses e-commerce/shipping/packaging/gift/item-swap phrasing ("bought", "shipping", "box", "packaging", "colis", "emballage", "cet article", "dit artikel", "cadeau") for a SERVICE business!
  * Sounds robotic, overly polished, or uses AI clichés ("game-changer", "exceeded expectations", "thoughtful and sturdy").
  * Reviews a city name or navigation label as if it were a product.
- Give MEDIUM humanScore (50–74, verdict="generic") if it is grammatically fine but too vague/template-like and could apply to any business.
- Give HIGH humanScore (75–98, verdict="human") if it sounds like a real human client/buyer with natural cadence and concrete, domain-accurate details.

For EVERY review ID, return:
- humanScore (0-100) and verdict ("human" | "generic" | "ai_flagged")
- dimensions: naturalTone (0-100), domainFit (0-100), specificity (0-100)
- reason: clear 1-sentence explanation of WHY it scored this way
- signals: 2-3 short tags (e.g. "Off-domain e-commerce wording", "AI cliché", "Too generic", "Natural cadence", "Concrete service detail")
- flaggedPhrases: exact words/phrases quoted from the review that look AI/generic/off-domain (empty array [] if human)
- suggestion: concrete 1-sentence tip to improve it (or "Looks authentic — ready to export." if human)`;

  const { data, usage } = await generateJsonWithAI<{ results?: Partial<ReviewAuditResult>[] }>(payload, env, {
    systemInstruction:
      'You are a strict multilingual review authenticity detector and forensic QA editor. Return rich, structured diagnostics explaining exactly WHY each review passed or was flagged.',
    prompt,
    jsonShapeHint: `{ "results": [{ "id": "exact-id", "humanScore": 42, "verdict": "ai_flagged", "reason": "Mentions shipping box and packaging for a plumbing repair service.", "signals": ["Off-domain wording", "E-commerce template"], "flaggedPhrases": ["shipping box", "packaging"], "suggestion": "Replace shipping mention with technician punctuality and repair quality.", "dimensions": { "naturalTone": 65, "domainFit": 18, "specificity": 40 } }] }`,
  });

  const clamp = (n: unknown, fb: number) =>
    Math.max(0, Math.min(100, Math.round(typeof n === 'number' && !Number.isNaN(n) ? n : fb)));

  const normalized: ReviewAuditResult[] = (data?.results || []).map((r) => {
    const score = clamp(r.humanScore, 50);
    const verdict: ReviewAuditResult['verdict'] =
      score >= 75 ? 'human' : score >= 50 ? 'generic' : 'ai_flagged';
    return {
      id: String(r.id || ''),
      humanScore: score,
      verdict,
      reason: String(r.reason || '').slice(0, 180) || 'Evaluated by AI detector.',
      signals: Array.isArray(r.signals)
        ? r.signals.map((s) => String(s).trim()).filter(Boolean).slice(0, 4)
        : [],
      flaggedPhrases: Array.isArray(r.flaggedPhrases)
        ? r.flaggedPhrases.map((p) => String(p).trim()).filter(Boolean).slice(0, 5)
        : [],
      suggestion:
        String(r.suggestion || '').slice(0, 180) ||
        (verdict === 'human' ? 'Looks authentic — ready to export.' : 'Rewrite with specific business details.'),
      dimensions: {
        naturalTone: clamp(r.dimensions?.naturalTone, score),
        domainFit: clamp(r.dimensions?.domainFit, score),
        specificity: clamp(r.dimensions?.specificity, score),
      },
    };
  });

  return { results: normalized, usage };
}

export async function rewriteReviewsWithAI(
  payload: AIConfigPayload | undefined,
  env: ServerAIEnv,
  reviews: ReviewAuditInput[],
  businessContext: string
): Promise<{ rewrites: Array<{ id: string; subject: string; body: string }>; usage: AIUsageMetrics }> {
  const batch = reviews.slice(0, 20);
  const formatted = batch
    .map(
      (r) =>
        `ID="${r.id}" | Lang=${r.language} | Stars=${r.stars} | Offering="${r.item_name}" (${r.category}) | OldTitle="${r.subject}" | OldBody="${r.body}"`
    )
    .join('\n');

  const prompt = `Rewrite these flagged customer reviews so they sound 100% like authentic, everyday human customers for this exact business.

Business context: ${businessContext || '(Match the exact offerings — if plumbing/heating/repair/clinic/agency, write about booking an appointment, technician punctuality, diagnosis, clean work, fair quote — NEVER shipping/packaging/buying items!)'}

Flagged reviews to rewrite (keep the EXACT same language and star rating for each ID):
${formatted}

RULES:
- Write in the EXACT language code specified (e.g. nl = natural Belgian/Dutch, fr = natural French, en = natural English, darija_latin = Moroccan Darija in Latin script).
- To avoid generic reviews, weave concrete real-life details naturally into medium/detailed reviews:
  1) What problem the customer experienced (e.g. boiler losing pressure, leak under sink, heating cut out)
  2) What the technician actually did (e.g. replaced worn valve, checked sensor, sealed cracked joint)
  3) How the appointment went (e.g. texted 15 mins before, arrived in window, clear quote upfront)
  4) Whether the problem was resolved (e.g. running steadily for weeks, zero drips since)
  5) 1–2 personal observations (e.g. wiped the floor clean, showed how to check pressure, no pushy upselling)
  6) Mention the SPECIFIC company name in ~40% of rewritten reviews so they clearly belong to this business and not any generic company!
- Still vary lengths naturally (some ultra-short 5–12 words, some 1–2 sentences, some detailed 3–4 sentences), use diverse titles, and include occasional natural human quirks (~20%: minor phone typos like "reccomend"/"tres"/"rdv", occasional lowercase or missing final period).
- PRESERVE negative/mixed 1–3 star reviews honestly (minor scheduling wait, slight preference mismatch — never scam/fraud allegations).`;

  const { data, usage } = await generateJsonWithAI<{
    rewrites?: Array<{ id: string; subject: string; body: string }>;
  }>(payload, env, {
    systemInstruction:
      'You are an expert multilingual human-voice copywriter who rewrites generic or off-domain reviews into authentic, natural, domain-accurate customer reviews.',
    prompt,
    jsonShapeHint: `{ "rewrites": [{ "id": "exact-id", "subject": "Short natural title", "body": "Authentic human review body" }] }`,
  });

  return {
    rewrites: (data?.rewrites || []).map((r) => ({
      id: String(r.id),
      subject: String(r.subject || '').trim(),
      body: String(r.body || '').trim(),
    })),
    usage,
  };
}
