import { AIProviderId, DetectedModel } from '../types/ai';

export type ModelFitTier = 'best' | 'great' | 'good' | 'caution';

export interface ModelFitAssessment {
  score: number;
  tier: ModelFitTier;
  tierLabel: string;
  tags: string[];
  reason: string;
  /** Short breakdown scores (0-100) for UI bars */
  metrics: {
    jsonReliability: number;
    multilingual: number;
    speedValue: number;
  };
}

export interface RankedModel extends DetectedModel {
  fit: ModelFitAssessment;
}

export interface ProviderGuide {
  topPick: string;
  runnerUp?: string;
  summary: string;
  whyItFits: string;
}

export const PROVIDER_GUIDES: Record<AIProviderId, ProviderGuide> = {
  gemini: {
    topPick: 'gemini-3.8-flash',
    runnerUp: 'gemini-3-flash',
    summary: 'Best overall fit for ReviewForge.',
    whyItFits:
      'Native JSON mode, huge context for multi-page website scrapes, ultra-fast & low cost, and top-tier Arabic, French, Dutch & Darija fluency.',
  },
  openrouter: {
    topPick: 'google/gemini-2.5-flash',
    runnerUp: 'anthropic/claude-sonnet-4',
    summary: 'Pick Gemini Flash for speed/cost, Claude Sonnet for richest human tone, or :free 70B+ models.',
    whyItFits:
      'ReviewForge needs strict nested JSON + natural multilingual copy. Models with >=32k context and strong instruction following score highest.',
  },
  openai: {
    topPick: 'gpt-4o-mini',
    runnerUp: 'gpt-4.1-mini',
    summary: 'GPT-4o mini / 4.1 mini give the best speed-to-quality ratio.',
    whyItFits:
      'Rock-solid JSON object adherence, fast multi-language generation, and low cost per 100+ review packs.',
  },
  groq: {
    topPick: 'llama-3.3-70b-versatile',
    runnerUp: 'qwen/qwen3-32b',
    summary: 'Llama 3.3 70B or Qwen 32B for ultra-fast structured JSON.',
    whyItFits:
      'Avoid tiny 8B/instant models for multi-language packs—70B & Qwen models keep nested JSON valid and multilingual phrasing natural.',
  },
  ollama: {
    topPick: 'qwen2.5:14b',
    runnerUp: 'llama3.1:8b',
    summary: 'Qwen 2.5 (7B–14B+) or Llama 3.1/3.3 8B+ work best locally.',
    whyItFits:
      'Qwen 2.5 has the strongest local JSON adherence and Arabic/French/English support. Tiny 1B–3B models often truncate nested review schemas.',
  },
  custom: {
    topPick: 'deepseek-chat',
    runnerUp: 'qwen-plus',
    summary: 'Choose a general chat model (32k+ context) with JSON mode support.',
    whyItFits:
      'Avoid code-only or reasoning-only endpoints that emit extra prose outside JSON.',
  },
  fallback: {
    topPick: 'Server Default',
    summary: 'Uses the admin-configured backup AI model once unlocked.',
    whyItFits:
      'Pre-tuned for reliable structured JSON website scanning and multilingual copy adaptation.',
  },
};

export function evaluateModelFit(model: DetectedModel): ModelFitAssessment {
  const id = `${model.id} ${model.name}`.toLowerCase();

  let jsonReliability = 72;
  let multilingual = 72;
  let speedValue = 75;
  const tags: string[] = [];
  const notes: string[] = [];

  // ---- Penalize models poorly suited to ReviewForge's nested JSON + multilingual copy ----
  if (/(coder|codellama|starcoder|codestral|devstral|sql)/i.test(id)) {
    jsonReliability -= 15;
    multilingual -= 35;
    notes.push('Code-specialized model — less natural for human customer reviews.');
  }
  if (/(vision|vl|llava|pixtral|moondream|guard|shield|moderate|safeguard)/i.test(id)) {
    jsonReliability -= 28;
    multilingual -= 25;
    notes.push('Specialized vision/safety model — not ideal for review generation.');
  }
  if (/\b(0\.5b|1b|1\.5b|2b|3b|mini-1b|nano)\b/i.test(id) && !/gpt-4\.1-nano/i.test(id)) {
    jsonReliability -= 25;
    multilingual -= 22;
    speedValue += 15;
    notes.push('Very small parameter count may occasionally drop fields in large multi-language JSON.');
  }

  // ---- Reward top-performing families for ReviewForge ----
  if (/gemini-(3\.8|3\.5|3|2\.5|2\.0)-flash/i.test(id)) {
    jsonReliability = 96;
    multilingual = 96;
    speedValue = 97;
    tags.push('Strict JSON', '16-Lang Native', 'Fast');
    notes.push('Excels at strict nested JSON, multi-page context, and natural Arabic/French/Darija.');
  } else if (/gemini-2\.5-pro|gemini-3-pro|gemini-1\.5-pro/i.test(id)) {
    jsonReliability = 97;
    multilingual = 98;
    speedValue = 78;
    tags.push('Top Quality', '16-Lang Native');
    notes.push('Maximum copy nuance and multilingual accuracy; slightly slower than Flash.');
  } else if (/claude-(3\.5|3\.7|4|sonnet)/i.test(id) && !/haiku/i.test(id)) {
    jsonReliability = 95;
    multilingual = 97;
    speedValue = 80;
    tags.push('Most Human Tone', 'Strict JSON');
    notes.push('Produces the most authentic, non-generic customer review voice across languages.');
  } else if (/claude.*haiku/i.test(id)) {
    jsonReliability = 90;
    multilingual = 89;
    speedValue = 94;
    tags.push('Fast', 'Natural Copy');
    notes.push('Great fast balance of natural phrasing and reliable JSON output.');
  } else if (/gpt-4\.1-mini|gpt-4o-mini/i.test(id)) {
    jsonReliability = 95;
    multilingual = 92;
    speedValue = 95;
    tags.push('Strict JSON', 'Fast & Low Cost');
    notes.push('Highly reliable JSON schema compliance with fast, affordable multilingual output.');
  } else if (/gpt-4\.1(?!-mini|-nano)|gpt-4o(?!-mini)/i.test(id)) {
    jsonReliability = 96;
    multilingual = 95;
    speedValue = 78;
    tags.push('High Accuracy', 'Multilingual');
    notes.push('Strong multilingual fluency and structured output; higher cost than mini.');
  } else if (/deepseek-chat|deepseek-v3/i.test(id)) {
    jsonReliability = 90;
    multilingual = 91;
    speedValue = 92;
    tags.push('Great Value', 'Strong JSON');
    notes.push('Very strong structured JSON and multilingual copy at low/free cost.');
  } else if (/deepseek-r1|o1|o3-mini|qwq/i.test(id)) {
    jsonReliability = 80;
    multilingual = 85;
    speedValue = 62;
    tags.push('Reasoning');
    notes.push('Reasoning model adds extra latency — prefer a standard chat/flash model for faster scans.');
  } else if (/qwen(2\.5|3).*(14b|32b|72b|plus|max)/i.test(id)) {
    jsonReliability = 92;
    multilingual = 93;
    speedValue = 88;
    tags.push('Multilingual Star', 'Reliable JSON');
    notes.push('Excellent multilingual coverage (including Arabic & European languages) and clean JSON.');
  } else if (/llama-3\.3-70b|llama-3\.1-70b|llama3\.3/i.test(id)) {
    jsonReliability = 90;
    multilingual = 88;
    speedValue = 92;
    tags.push('70B Quality', 'Fast');
    notes.push('Strong instruction following and clean JSON for multi-category review packs.');
  } else if (/qwen2\.5|llama3\.1|llama3\.2|mistral|gemma/i.test(id)) {
    jsonReliability = Math.max(jsonReliability, 82);
    multilingual = Math.max(multilingual, 82);
    speedValue = Math.max(speedValue, 86);
    tags.push('Balanced');
  }

  // Context & Free bonuses
  if (model.contextLength && model.contextLength >= 100_000) {
    jsonReliability = Math.min(100, jsonReliability + 2);
    if (!tags.includes('16-Lang Native')) tags.push('Long Context');
  } else if (model.contextLength && model.contextLength < 16_000) {
    jsonReliability = Math.max(30, jsonReliability - 15);
    notes.push('Small context window (<16k) may limit multi-language packs.');
  }

  if (model.isFree) {
    speedValue = Math.min(100, speedValue + 6);
    tags.push('Free');
  }
  if (model.provider === 'ollama') {
    tags.push('Private Local');
  }

  const score = Math.max(
    10,
    Math.min(100, Math.round(jsonReliability * 0.42 + multilingual * 0.36 + speedValue * 0.22))
  );

  let tier: ModelFitTier = 'good';
  let tierLabel = 'Good Fit';
  if (score >= 90) {
    tier = 'best';
    tierLabel = 'Best Fit';
  } else if (score >= 80) {
    tier = 'great';
    tierLabel = 'Great Fit';
  } else if (score < 65) {
    tier = 'caution';
    tierLabel = 'Limited Fit';
  }

  const reason =
    notes[0] ||
    (tier === 'best'
      ? 'Top match for ReviewForge: reliable nested JSON, strong multilingual voice, and fast generation.'
      : tier === 'great'
      ? 'Solid choice for multi-language review packs and website service extraction.'
      : 'Capable general model; verify output quality on multi-language packs.');

  return {
    score,
    tier,
    tierLabel,
    tags: Array.from(new Set(tags)).slice(0, 3),
    reason,
    metrics: {
      jsonReliability: Math.max(0, Math.min(100, jsonReliability)),
      multilingual: Math.max(0, Math.min(100, multilingual)),
      speedValue: Math.max(0, Math.min(100, speedValue)),
    },
  };
}

export function rankModelsForApp(models: DetectedModel[]): RankedModel[] {
  return models
    .map((m) => ({ ...m, fit: evaluateModelFit(m) }))
    .sort((a, b) => b.fit.score - a.fit.score || a.id.localeCompare(b.id));
}
