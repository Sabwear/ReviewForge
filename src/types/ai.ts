export type AIProviderId =
  | 'gemini'
  | 'openrouter'
  | 'openai'
  | 'groq'
  | 'ollama'
  | 'custom'
  | 'fallback';

export interface AISettings {
  provider: AIProviderId;
  apiKey: string;
  model: string;
  baseUrl: string;
  secretCode: string;
  fallbackUnlocked: boolean;
  fallbackProvider?: string;
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

export interface AIUsageRecord extends AIUsageMetrics {
  id: string;
  timestamp: string;
  operation: 'scan-website' | 'adapt-business' | 'detect-reviews' | 'rewrite-reviews';
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface ProviderMeta {
  id: AIProviderId;
  label: string;
  shortLabel: string;
  description: string;
  needsKey: boolean;
  needsBaseUrl: boolean;
  defaultBaseUrl: string;
  defaultModel: string;
  keyPlaceholder: string;
  badge?: string;
}

export const AI_PROVIDERS: ProviderMeta[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    shortLabel: 'Gemini',
    description: 'Fast, high-quality JSON generation with generous free tier.',
    needsKey: true,
    needsBaseUrl: false,
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-3.8-flash',
    keyPlaceholder: 'AIzaSy...',
    badge: 'Recommended',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    shortLabel: 'OpenRouter',
    description: 'Access 200+ models (Claude, GPT, Gemini, DeepSeek, free models).',
    needsKey: true,
    needsBaseUrl: false,
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.5-flash',
    keyPlaceholder: 'sk-or-v1-...',
    badge: 'Multi-Model',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    shortLabel: 'OpenAI',
    description: 'GPT-4o mini, GPT-4.1, and o-series models directly from OpenAI.',
    needsKey: true,
    needsBaseUrl: false,
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'groq',
    label: 'Groq',
    shortLabel: 'Groq',
    description: 'Ultra-fast inference for Llama 3.3, Qwen, and Mixtral.',
    needsKey: true,
    needsBaseUrl: false,
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    keyPlaceholder: 'gsk_...',
    badge: 'Ultra Fast',
  },
  {
    id: 'ollama',
    label: 'Ollama (Local)',
    shortLabel: 'Ollama',
    description: 'Run private open-source models locally on your machine.',
    needsKey: false,
    needsBaseUrl: true,
    defaultBaseUrl: 'http://localhost:11434',
    defaultModel: 'llama3.2',
    keyPlaceholder: 'Not required',
    badge: '100% Free',
  },
  {
    id: 'custom',
    label: 'Custom OpenAI API',
    shortLabel: 'Custom',
    description: 'Any OpenAI-compatible endpoint (LM Studio, Together, DeepSeek, vLLM).',
    needsKey: true,
    needsBaseUrl: true,
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'fallback',
    label: 'Hidden Fallback AI',
    shortLabel: 'Fallback',
    description: 'Server-hosted backup AI protected by your private secret code.',
    needsKey: false,
    needsBaseUrl: false,
    defaultBaseUrl: '',
    defaultModel: '',
    keyPlaceholder: '',
    badge: 'Secret Code',
  },
];
