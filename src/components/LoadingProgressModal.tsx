import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Globe,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';

export type LoadingOperationType = 'scan' | 'adapt' | 'detect' | 'rewrite';

interface LoadingProgressModalProps {
  operation: LoadingOperationType | null;
  detailText?: string;
  aiLabel?: string;
}

const OPERATION_CONFIG: Record<
  LoadingOperationType,
  {
    title: string;
    subtitle: string;
    steps: string[];
    tip: string;
  }
> = {
  scan: {
    title: 'Scanning Website & Extracting Offerings',
    subtitle: 'Reading public pages, filtering out junk navigation, and mapping real services/products.',
    steps: [
      'Validating public domain & fetching pages',
      'Extracting real services, JSON-LD & sitemap offerings',
      'Detecting service vs e-commerce voice & adapting copy',
      'Generating globally unique multilingual reviews',
    ],
    tip: 'Service businesses (plumbers, clinics, agencies) automatically use appointment & workmanship voice.',
  },
  adapt: {
    title: 'Adapting Review Copy to Your Business',
    subtitle: 'Tailoring vocabulary, categories, and star-level phrasing across your selected languages.',
    steps: [
      'Grouping catalog items into clean categories',
      'Generating category-specific customer scenarios',
      'Writing natural 1★–5★ review building blocks',
    ],
    tip: 'All 1★ and 2★ reviews stay realistic and benign — never accusing your business of scams.',
  },
  detect: {
    title: 'Running AI Review Authenticity Detector',
    subtitle: 'Auditing tone, domain accuracy, generic phrasing, and AI clichés across your batch.',
    steps: [
      'Sending review batch & business context to AI',
      'Scoring Natural Tone, Domain Fit & Specificity',
      'Highlighting flagged phrases & saving audit report',
    ],
    tip: 'Results are auto-saved locally so you can rewrite or filter flagged rows anytime.',
  },
  rewrite: {
    title: 'AI Rewriting Flagged Reviews',
    subtitle: 'Replacing generic or off-domain wording with natural, authentic human-sounding copy.',
    steps: [
      'Inspecting flagged phrases & business domain',
      'Rewriting each review in its exact language & star rating',
      'Verifying & updating your dataset',
    ],
    tip: 'Rewritten rows keep the same reviewer, date, language, and star rating while sounding human.',
  },
};

export function LoadingProgressModal({
  operation,
  detailText,
  aiLabel,
}: LoadingProgressModalProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!operation) {
      setElapsedMs(0);
      return;
    }
    const started = Date.now();
    setElapsedMs(0);
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - started);
    }, 150);
    return () => window.clearInterval(id);
  }, [operation]);

  if (!operation) return null;

  const cfg = OPERATION_CONFIG[operation];
  const elapsedSec = elapsedMs / 1000;
  // Asymptotic progress curve: fast start, smoothly approaches 94% until real response finishes
  const progress = Math.min(94, Math.round(12 + 82 * (1 - Math.exp(-elapsedSec / 4.2))));
  const activeStepIndex = Math.min(
    cfg.steps.length - 1,
    Math.floor((progress / 95) * cfg.steps.length)
  );

  const Icon =
    operation === 'scan'
      ? Globe
      : operation === 'detect'
      ? ShieldCheck
      : operation === 'rewrite'
      ? Wand2
      : Sparkles;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-150"
      role="status"
      aria-live="polite"
      aria-label={cfg.title}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1C2029] border border-slate-200 dark:border-white/[0.12] shadow-2xl overflow-hidden">
        {/* Top animated progress bar */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-[#161920] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-600/20 shrink-0">
              <Icon className="w-5 h-5" />
              <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-white dark:bg-[#1C2029] flex items-center justify-center shadow">
                <Loader2 className="w-3 h-3 text-sky-600 dark:text-[#68AEE0] animate-spin" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-[#E4E6EB] leading-snug">
                {cfg.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#E4E6EB]/65 mt-1 leading-relaxed">
                {detailText || cfg.subtitle}
              </p>
            </div>
          </div>

          {/* Percentage + Elapsed + Active Model */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-sky-600 dark:text-[#68AEE0] tabular-nums">
                {progress}%
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#E4E6EB]/60 font-mono tabular-nums">
                {aiLabel && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#232834] text-slate-700 dark:text-[#E4E6EB]/80">
                    <Cpu className="w-3 h-3 text-sky-500" />
                    <span className="max-w-[140px] truncate">{aiLabel}</span>
                  </span>
                )}
                <span>{elapsedSec.toFixed(1)}s</span>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-[#161920] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step-by-step checklist */}
          <div className="space-y-2 rounded-xl bg-slate-50/80 dark:bg-[#161920] border border-slate-200/70 dark:border-white/[0.07] p-3.5">
            {cfg.steps.map((step, idx) => {
              const isDone = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              return (
                <div key={step} className="flex items-center gap-2.5 text-xs">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-sky-500 animate-spin shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/15 shrink-0" />
                  )}
                  <span
                    className={
                      isDone
                        ? 'text-slate-500 dark:text-[#E4E6EB]/55 line-through decoration-slate-400/50'
                        : isCurrent
                        ? 'font-semibold text-slate-900 dark:text-[#E4E6EB]'
                        : 'text-slate-400 dark:text-[#E4E6EB]/40'
                    }
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Info Tip */}
          <p className="text-[11px] text-slate-500 dark:text-[#E4E6EB]/60 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
            <span>{cfg.tip}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
