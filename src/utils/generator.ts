import {
  COMPOSER_TOKENS,
  EXTRA_CONTEXT_TAILS,
  SENTENCE_BANKS,
  mapCategoryToDomain,
  pickVoiceStyleForLength,
} from '../data/reviewComposer';
import { NAMES_BY_LANGUAGE } from '../data/reviewTemplates';
import {
  getServiceFallbackReference,
  isServiceCatalog,
  SERVICE_EXTRA_TAILS,
  SERVICE_SENTENCE_BANKS,
  SERVICE_TOKENS,
} from '../data/serviceComposer';
import {
  BUILTIN_CATEGORY_CONTEXTS,
  UNIVERSAL_COMPOSER_TOKENS,
  UNIVERSAL_EXTRA_TAILS,
  UNIVERSAL_SENTENCE_BANKS,
  isIPTVCatalog,
} from '../data/universalComposer';
import {
  GLOBAL_EXTRA_FALLBACK_REF,
  GLOBAL_EXTRA_SURNAMES,
} from '../data/globalLanguages';
import {
  BusinessLanguagePack,
  BusinessLanguageTokens,
  BusinessStarPool,
  BusinessVoicePack,
  CatalogProduct,
  CategoryVoiceContext,
  GeneratedReview,
  GeneratorConfig,
  ReviewLanguage,
  ReviewTemplate,
  ReviewerVoice,
  StoreVolumePreset,
} from '../types/reviews';
import {
  applyHumanImperfections,
  buildUltraShortReview,
  EXTRA_DIVERSE_SUBJECTS,
  getServiceSpecificSentence,
} from './humanizer';
import { resolveProductUrl } from './csv';

export function parseExclusionKeywords(raw: string): string[] {
  return raw
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);
}

export function isExcludedByKeywords(
  product: CatalogProduct,
  keywords: string[]
): boolean {
  if (keywords.length === 0) return false;
  const haystack = `${product.category} ${product.item_slug} ${product.item_name}`.toLowerCase();
  return keywords.some((kw) => haystack.includes(kw));
}

export function filterEligibleProducts(
  products: CatalogProduct[],
  config: GeneratorConfig
): { eligible: CatalogProduct[]; excluded: CatalogProduct[] } {
  const selectedSet = new Set(config.selectedCategories);
  const keywords = config.excludeByKeywords
    ? parseExclusionKeywords(config.excludeKeywords)
    : [];
  const eligible: CatalogProduct[] = [];
  const excluded: CatalogProduct[] = [];

  for (const product of products) {
    const inSelectedCategory = selectedSet.has(product.category);
    const blockedByKeyword = isExcludedByKeywords(product, keywords);

    if (inSelectedCategory && !blockedByKeyword) {
      eligible.push(product);
    } else {
      excluded.push(product);
    }
  }

  return { eligible, excluded };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Normalizes text for strict deduplication comparison across the entire catalog.
 */
export function normalizeReviewBody(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"’”“\-–—()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Organic e-commerce star curve (~4.45★ average, benign 1-2★ tail only):
 * 5★ ~60%, 4★ ~23%, 3★ ~10%, 2★ ~5%, 1★ ~2%
 */
function pickOrganicStar(): 1 | 2 | 3 | 4 | 5 {
  const r = Math.random() * 100;
  if (r < 60) return 5;
  if (r < 83) return 4;
  if (r < 93) return 3;
  if (r < 98) return 2;
  return 1;
}

function pickLanguage(selectedLanguages: ReviewLanguage[]): ReviewLanguage {
  if (selectedLanguages.length === 0) return 'en';
  if (selectedLanguages.length === 1) return selectedLanguages[0];
  return pickRandom(selectedLanguages);
}

export const VOLUME_PRESET_CURVES: Record<
  StoreVolumePreset,
  { label: string; maxCount: number; skewExponent: number }
> = {
  quiet: { label: 'Quiet', maxCount: 9, skewExponent: 2.35 },
  realistic: { label: 'Organic', maxCount: 15, skewExponent: 2.25 },
  busy: { label: 'High Volume', maxCount: 24, skewExponent: 2.05 },
};

/**
 * Draws a truly random, right-skewed organic review count for a product with equal
 * probability across all eligible items, respecting user-configured per-item min/max limits.
 */
function pickOrganicCountForProduct(
  preset: StoreVolumePreset,
  zeroReviewRatio: number,
  minPerItem?: number,
  maxPerItem?: number
): number {
  const curve = VOLUME_PRESET_CURVES[preset] ?? VOLUME_PRESET_CURVES.realistic;
  const safeMin = Math.max(0, Math.min(50, Math.floor(minPerItem ?? 0)));
  const resolvedMax = Math.max(
    safeMin,
    Math.min(100, Math.floor(maxPerItem ?? curve.maxCount))
  );

  if (resolvedMax === 0) return 0;

  if (safeMin === 0) {
    const clampedZeroPct = Math.max(0, Math.min(100, zeroReviewRatio));
    if (Math.random() * 100 < clampedZeroPct) {
      return 0;
    }
    const skewed = Math.pow(Math.random(), curve.skewExponent);
    return Math.min(resolvedMax, 1 + Math.floor(skewed * resolvedMax));
  }

  if (safeMin === resolvedMax) {
    return safeMin;
  }

  const span = resolvedMax - safeMin + 1;
  const skewed = Math.pow(Math.random(), curve.skewExponent);
  return Math.min(resolvedMax, safeMin + Math.floor(skewed * span));
}

function cleanProductLabel(itemName: string, iptvMode: boolean): string {
  if (!iptvMode) return itemName.trim();
  return (
    itemName
      .replace(/\b(CODE|M3U|12 Months|6 Months|3 Months)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || itemName
  );
}

function getFallbackProductReference(
  category: string,
  language: ReviewLanguage,
  iptvMode: boolean,
  serviceMode = false
): string {
  if (serviceMode && !iptvMode) {
    return getServiceFallbackReference(language);
  }
  if (iptvMode) {
    if (language === 'fr') {
      if (category === 'Player Activation') return 'cette appli';
      if (category === 'M3U Playlists') return 'cette playlist';
      return 'ce serveur';
    }
    if (language === 'darija_latin') {
      if (category === 'Player Activation') return "had l'app";
      if (category === 'M3U Playlists') return 'had lplaylist';
      return 'had serveur';
    }
    if (language === 'ar') {
      if (category === 'Player Activation') return 'هذا التطبيق';
      if (category === 'M3U Playlists') return 'هذه القائمة';
      return 'هذا الاشتراك';
    }
    if (language === 'es') {
      if (category === 'Player Activation') return 'esta app';
      if (category === 'M3U Playlists') return 'esta lista';
      return 'este servidor';
    }
    if (category === 'Player Activation') return 'this app';
    if (category === 'M3U Playlists') return 'this playlist';
    return 'this service';
  }

  if (language === 'fr') return 'cet article';
  if (language === 'darija_latin') return 'had l-produit';
  if (language === 'ar') return 'هذا المنتج';
  if (language === 'es') return 'este artículo';
  if (language in GLOBAL_EXTRA_FALLBACK_REF) {
    return GLOBAL_EXTRA_FALLBACK_REF[language as keyof typeof GLOBAL_EXTRA_FALLBACK_REF];
  }
  return 'this item';
}

function hydrateIPTVTokens(
  raw: string,
  product: CatalogProduct,
  language: ReviewLanguage,
  forceLiteralProduct = false
): string {
  const tokens = COMPOSER_TOKENS[language] || COMPOSER_TOKENS.en!;
  const useLiteralName = forceLiteralProduct || Math.random() < 0.52;
  const productRef = useLiteralName
    ? cleanProductLabel(product.item_name, true)
    : getFallbackProductReference(product.category, language, true);

  return raw
    .replace(/\{product\}/g, productRef)
    .replace(/\{device\}/g, () => pickRandom(tokens.device))
    .replace(/\{smartTv\}/g, () => pickRandom(tokens.smartTv))
    .replace(/\{match\}/g, () => pickRandom(tokens.match))
    .replace(/\{speed\}/g, () => pickRandom(tokens.speed))
    .replace(/\{duration\}/g, () => pickRandom(tokens.duration))
    .replace(/\{minutes\}/g, () => pickRandom(tokens.minutes))
    .replace(/\{channels\}/g, () => pickRandom(tokens.channels))
    .replace(/\{bouquet\}/g, () => pickRandom(tokens.bouquet));
}

function hydrateUniversalTokens(
  raw: string,
  product: CatalogProduct,
  language: ReviewLanguage,
  tokens: BusinessLanguageTokens,
  forceLiteralProduct = false,
  serviceMode = false
): string {
  const fallbackTokens =
    (serviceMode ? SERVICE_TOKENS[language] : undefined) ||
    UNIVERSAL_COMPOSER_TOKENS[language] ||
    UNIVERSAL_COMPOSER_TOKENS.en;
  const useLiteralName = forceLiteralProduct || Math.random() < 0.62;
  const productRef = useLiteralName
    ? cleanProductLabel(product.item_name, false)
    : getFallbackProductReference(product.category, language, false, serviceMode);

  const pickSafe = (arr: string[] | undefined, fallback: string[]) =>
    arr && arr.length > 0 ? pickRandom(arr) : pickRandom(fallback);

  return raw
    .replace(/\{product\}/g, productRef)
    .replace(/\{contextA\}/g, () => pickSafe(tokens.contextA, fallbackTokens.contextA))
    .replace(/\{contextB\}/g, () => pickSafe(tokens.contextB, fallbackTokens.contextB))
    .replace(/\{duration\}/g, () => pickSafe(tokens.duration, fallbackTokens.duration))
    .replace(/\{timeframe\}/g, () => pickSafe(tokens.timeframe, fallbackTokens.timeframe))
    .replace(/\{device\}/g, () => pickSafe(tokens.contextA, fallbackTokens.contextA))
    .replace(/\{match\}/g, () => pickSafe(tokens.contextB, fallbackTokens.contextB));
}

function findAdaptedLanguagePack(
  adaptedPack: BusinessVoicePack | null | undefined,
  language: ReviewLanguage
): BusinessLanguagePack | null {
  if (!adaptedPack || !Array.isArray(adaptedPack.languagePacks)) return null;
  const exact = adaptedPack.languagePacks.find(
    (p) => p.language === language && Array.isArray(p.stars) && p.stars.length > 0
  );
  return exact ?? null;
}

function findCategoryVoiceContext(
  adaptedPack: BusinessVoicePack | null | undefined,
  category: string,
  language: ReviewLanguage
): CategoryVoiceContext | null {
  const catLower = category.trim().toLowerCase();

  // 1. Prefer AI-adapted category context for this exact category + language
  if (adaptedPack && Array.isArray(adaptedPack.categoryContext)) {
    const match = adaptedPack.categoryContext.find(
      (c) =>
        c.language === language &&
        c.category.trim().toLowerCase() === catLower
    );
    if (match) return match;
  }

  // 2. Built-in category context for common consumer tech / wearable categories
  const builtin = BUILTIN_CATEGORY_CONTEXTS.find(
    (c) =>
      c.language === language &&
      c.category.trim().toLowerCase() === catLower
  );
  return builtin ?? null;
}

function findStarPoolInPack(
  pack: BusinessLanguagePack,
  stars: 1 | 2 | 3 | 4 | 5
): BusinessStarPool | null {
  const exact = pack.stars.find(
    (s) => s.star === stars && s.openers.length > 0 && s.subjects.length > 0
  );
  if (exact) return exact;
  return pack.stars.find((s) => s.openers.length > 0 && s.subjects.length > 0) ?? null;
}

function pickLeastUsed(arr: string[], usageMap?: Map<string, number>): string {
  if (!usageMap || arr.length <= 1) return pickRandom(arr);
  let minCount = Infinity;
  for (const item of arr) {
    const c = usageMap.get(item) || 0;
    if (c < minCount) minCount = c;
  }
  const leastUsed = arr.filter((item) => (usageMap.get(item) || 0) === minCount);
  const chosen = pickRandom(leastUsed);
  usageMap.set(chosen, (usageMap.get(chosen) || 0) + 1);
  return chosen;
}

function composeCandidateCopy(
  product: CatalogProduct,
  language: ReviewLanguage,
  stars: 1 | 2 | 3 | 4 | 5,
  customTemplates: ReviewTemplate[],
  adaptedPack: BusinessVoicePack | null,
  iptvMode: boolean,
  forceExtraTail: boolean,
  forceLiteralProduct: boolean,
  serviceMode = false,
  globalSubjectCounts?: Map<string, number>,
  globalOpenerCounts?: Map<string, number>
): { subject: string; body: string; voice: ReviewerVoice } {
  const adaptedLangPack = findAdaptedLanguagePack(adaptedPack, language);
  const catContext = !iptvMode
    ? findCategoryVoiceContext(adaptedPack, product.category, language)
    : null;

  const baseTokens =
    adaptedLangPack?.tokens ||
    (serviceMode ? SERVICE_TOKENS[language] || SERVICE_TOKENS.en : undefined) ||
    UNIVERSAL_COMPOSER_TOKENS[language] ||
    UNIVERSAL_COMPOSER_TOKENS.en;

  // Merge category-specific contextA/contextB so smartwatches never borrow tablet vocabulary!
  const effectiveTokens: BusinessLanguageTokens = catContext
    ? {
        contextA: catContext.contextA?.length ? catContext.contextA : baseTokens.contextA,
        contextB: catContext.contextB?.length ? catContext.contextB : baseTokens.contextB,
        duration: baseTokens.duration,
        timeframe: baseTokens.timeframe,
      }
    : baseTokens;

  const hasNativeIPTVBank = Boolean(SENTENCE_BANKS[language]);
  const useIPTVBank = iptvMode && !adaptedLangPack && hasNativeIPTVBank;

  const hydrate = (text: string) =>
    useIPTVBank
      ? hydrateIPTVTokens(text, product, language, forceLiteralProduct)
      : hydrateUniversalTokens(text, product, language, effectiveTokens, forceLiteralProduct, serviceMode);

  // 25% chance to pull from user-created custom templates if matching category/language/stars exist
  const matchingCustom = customTemplates.filter(
    (t) =>
      t.isCustom &&
      t.language === language &&
      (t.category === product.category || t.category === 'All Categories') &&
      t.stars === stars
  );
  if (matchingCustom.length > 0 && !forceExtraTail && Math.random() < 0.25) {
    const picked = pickRandom(matchingCustom);
    return {
      subject: hydrate(picked.subject),
      body: hydrate(picked.body),
      voice: picked.voice,
    };
  }

  let subjects: string[];
  let openers: string[];
  let middles: string[];
  let closers: string[];
  let extraTails: string[];

  if (adaptedLangPack) {
    const starPool = findStarPoolInPack(adaptedLangPack, stars);
    const fallbackPool =
      (UNIVERSAL_SENTENCE_BANKS[language] || UNIVERSAL_SENTENCE_BANKS.en)[stars];
    subjects = starPool?.subjects?.length ? starPool.subjects : fallbackPool.subjects;
    openers = starPool?.openers?.length ? starPool.openers : fallbackPool.openers;
    middles = starPool?.middles?.length ? starPool.middles : fallbackPool.middles;
    closers = starPool?.closers?.length ? starPool.closers : fallbackPool.closers;
    extraTails = adaptedLangPack.extraTails?.length
      ? adaptedLangPack.extraTails
      : UNIVERSAL_EXTRA_TAILS[language] || UNIVERSAL_EXTRA_TAILS.en;
  } else if (useIPTVBank) {
    const domain = mapCategoryToDomain(product.category);
    const langBank = SENTENCE_BANKS[language]!;
    const domainBank = langBank[domain] || langBank.iptv;
    const pool = domainBank[stars] || domainBank[5];
    subjects = pool.subjects;
    openers = pool.openers;
    middles = pool.middles;
    closers = pool.closers;
    extraTails = EXTRA_CONTEXT_TAILS[language] || EXTRA_CONTEXT_TAILS.en!;
  } else if (serviceMode && SERVICE_SENTENCE_BANKS[language]) {
    const langBank = SERVICE_SENTENCE_BANKS[language]!;
    const pool = langBank[stars] || langBank[5];
    subjects = pool.subjects;
    openers = pool.openers;
    middles = pool.middles;
    closers = pool.closers;
    extraTails = SERVICE_EXTRA_TAILS[language] || SERVICE_EXTRA_TAILS.en || [];
  } else {
    const langBank = serviceMode
      ? SERVICE_SENTENCE_BANKS.en!
      : UNIVERSAL_SENTENCE_BANKS[language] || UNIVERSAL_SENTENCE_BANKS.en;
    const pool = langBank[stars] || langBank[5];
    subjects = pool.subjects;
    openers = pool.openers;
    middles = pool.middles;
    closers = pool.closers;
    extraTails = serviceMode
      ? SERVICE_EXTRA_TAILS[language] || SERVICE_EXTRA_TAILS.en || []
      : UNIVERSAL_EXTRA_TAILS[language] || UNIVERSAL_EXTRA_TAILS.en;
  }

  // Blend in category-specific openers & middles for 4★ and 5★ reviews
  if (catContext && stars >= 4) {
    if (catContext.openers?.length && Math.random() < 0.72) {
      openers = [...catContext.openers, ...openers.slice(0, 2)];
    }
    if (catContext.middles?.length && Math.random() < 0.72) {
      middles = [...catContext.middles, ...middles.slice(0, 2)];
    }
  }

  // ~16% chance of an ultra-short, punchy mobile-typed human review (when not forcing extra tail)
  if (!forceExtraTail && !iptvMode && Math.random() < 0.16) {
    const ultraShort = buildUltraShortReview(product, language, stars, serviceMode);
    if (ultraShort) {
      const humanized = applyHumanImperfections(ultraShort.subject, ultraShort.body, language);
      return { subject: humanized.subject, body: humanized.body, voice: 'minimalist' };
    }
  }

  // Merge extra diverse subjects so titles stay varied across large datasets
  const extraSubs = EXTRA_DIVERSE_SUBJECTS[language]?.[stars] || [];
  const mergedSubjects = extraSubs.length > 0 ? [...subjects, ...extraSubs] : subjects;
  const rawSubject = hydrate(pickLeastUsed(mergedSubjects, globalSubjectCounts));

  // Vary structure naturally: 1-sentence short note (~26%), 2-sentence casual (~48%), 3-sentence detailed (~26%)
  const structureRoll = Math.random();
  const sentences: string[] = [];
  const chosenOpener = pickLeastUsed(openers, globalOpenerCounts);

  // For service businesses, inject a concrete service-matched detail (boiler/leak/emergency/install) ~55% of the time
  const serviceDetail =
    serviceMode && !iptvMode && Math.random() < 0.55
      ? getServiceSpecificSentence(product, language, stars)
      : null;

  if (structureRoll < 0.26 && !forceExtraTail) {
    sentences.push(serviceDetail && Math.random() < 0.45 ? serviceDetail : chosenOpener);
  } else if (structureRoll < 0.56) {
    sentences.push(chosenOpener);
    if (serviceDetail) sentences.push(serviceDetail);
    else if (middles.length > 0) sentences.push(pickRandom(middles));
  } else if (structureRoll < 0.74) {
    sentences.push(chosenOpener);
    if (closers.length > 0) sentences.push(pickRandom(closers));
  } else {
    sentences.push(chosenOpener);
    if (serviceDetail) sentences.push(serviceDetail);
    else if (middles.length > 0) sentences.push(pickRandom(middles));
    if (closers.length > 0) sentences.push(pickRandom(closers));
  }

  if (forceExtraTail && extraTails.length > 0) {
    sentences.push(pickRandom(extraTails));
  }

  const rawBody = sentences.map((s) => hydrate(s)).join(' ');
  const { subject, body } = applyHumanImperfections(rawSubject, rawBody, language);

  const hasDetailHint =
    /50fps|epg|xtream|m3u|bitrate|1080p|amoled|gps|anc|bluetooth|battery|batterie|matepad|pencil|usb-c|spf|cotton|leather|roast|espresso|boiler|pressure|radiator|leak|pipe|ketel|chaudière/i.test(
      body
    );
  const voice = pickVoiceStyleForLength(sentences.length, hasDetailHint);

  return { subject, body, voice };
}

/**
 * Generates a guaranteed globally-unique review body (zero duplicates across entire dataset).
 */
function composeUniqueReviewCopy(
  product: CatalogProduct,
  language: ReviewLanguage,
  stars: 1 | 2 | 3 | 4 | 5,
  customTemplates: ReviewTemplate[],
  adaptedPack: BusinessVoicePack | null,
  iptvMode: boolean,
  globalUsedBodies: Set<string>,
  productUsedSubjects: Set<string>,
  serviceMode = false,
  globalSubjectCounts?: Map<string, number>,
  globalOpenerCounts?: Map<string, number>
): { subject: string; body: string; voice: ReviewerVoice } {
  // Phase 1: Up to 30 organic compositions with unique body + unique per-product subject
  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = composeCandidateCopy(
      product,
      language,
      stars,
      customTemplates,
      adaptedPack,
      iptvMode,
      attempt >= 16,
      attempt >= 10,
      serviceMode,
      globalSubjectCounts,
      globalOpenerCounts
    );
    const normBody = normalizeReviewBody(candidate.body);
    const normSubj = normalizeReviewBody(candidate.subject);

    if (!globalUsedBodies.has(normBody) && !productUsedSubjects.has(normSubj)) {
      globalUsedBodies.add(normBody);
      productUsedSubjects.add(normSubj);
      return candidate;
    }
  }

  // Phase 2: Relax same-product subject constraint while keeping STRICT global body uniqueness
  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = composeCandidateCopy(
      product,
      language,
      stars,
      customTemplates,
      adaptedPack,
      iptvMode,
      true,
      true,
      serviceMode
    );
    const normBody = normalizeReviewBody(candidate.body);
    if (!globalUsedBodies.has(normBody)) {
      globalUsedBodies.add(normBody);
      return candidate;
    }
  }

  // Phase 3: Contextual extra tail guaranteeing 0% collisions even on 5,000+ single-language rows
  const fallback = composeCandidateCopy(
    product,
    language,
    stars,
    customTemplates,
    adaptedPack,
    iptvMode,
    true,
    true,
    serviceMode
  );
  const adaptedLangPack = findAdaptedLanguagePack(adaptedPack, language);
  const useIPTVTails = iptvMode && !adaptedLangPack && Boolean(EXTRA_CONTEXT_TAILS[language]);
  const tails = adaptedLangPack?.extraTails?.length
    ? adaptedLangPack.extraTails
    : useIPTVTails
      ? EXTRA_CONTEXT_TAILS[language]!
      : serviceMode
        ? SERVICE_EXTRA_TAILS[language] || SERVICE_EXTRA_TAILS.en || []
        : UNIVERSAL_EXTRA_TAILS[language] || UNIVERSAL_EXTRA_TAILS.en;
  const universalTokens =
    adaptedLangPack?.tokens ||
    (serviceMode ? SERVICE_TOKENS[language] || SERVICE_TOKENS.en : undefined) ||
    UNIVERSAL_COMPOSER_TOKENS[language] ||
    UNIVERSAL_COMPOSER_TOKENS.en;

  for (let extra = 0; extra < 20; extra++) {
    const rawTail = pickRandom(tails);
    const extraSentence =
      useIPTVTails
        ? hydrateIPTVTokens(rawTail, product, language, true)
        : hydrateUniversalTokens(rawTail, product, language, universalTokens, true, serviceMode);
    const merged = `${fallback.body} ${extraSentence}`.trim();
    const norm = normalizeReviewBody(merged);
    if (!globalUsedBodies.has(norm)) {
      globalUsedBodies.add(norm);
      return { ...fallback, body: merged };
    }
  }

  const productTag = cleanProductLabel(product.item_name, iptvMode);
  const finalBody = `${fallback.body} (${productTag})`.trim();
  globalUsedBodies.add(normalizeReviewBody(finalBody));
  return { ...fallback, body: finalBody };
}

const ARABIC_DISPLAY_NAMES = {
  first: [
    'يوسف', 'سلمى', 'كريم', 'نادية', 'أمين', 'هدى', 'مهدي', 'سارة', 'عمر', 'مريم',
    'أنس', 'إيمان', 'حمزة', 'خديجة', 'طارق', 'لبنى', 'رشيد', 'زينب', 'بلال', 'وفاء',
  ],
  last: [
    'بنعلي', 'العمراني', 'المنصوري', 'الإدريسي', 'التازي', 'العلوي', 'الشرقاوي',
    'الفاسي', 'المرابط', 'الزهراني', 'الخطابي', 'برادة', 'بناني', 'الناصري',
  ],
};

function capitalizeWord(word: string): string {
  if (!word) return '';
  return word
    .split(/\s+/)
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : ''))
    .join(' ');
}

function formatReviewerName(first: string, last: string, language: ReviewLanguage): string {
  if (language === 'ar' && Math.random() < 0.7) {
    const arFirst = pickRandom(ARABIC_DISPLAY_NAMES.first);
    const arLast = pickRandom(ARABIC_DISPLAY_NAMES.last);
    return Math.random() < 0.72 ? `${arFirst} ${arLast}` : arFirst;
  }

  const f = capitalizeWord(first);
  const l = capitalizeWord(last);
  const styleRoll = Math.random();
  if (styleRoll < 0.48) return `${f} ${l}`;
  if (styleRoll < 0.88) return `${f} ${l.charAt(0)}.`;
  return f;
}

const REAL_SURNAMES_BY_LANGUAGE: Record<ReviewLanguage, string[]> = {
  en: [
    'Miller', 'Bennett', 'Carter', 'Brooks', 'Turner', 'Parker', 'Collins', 'Stewart',
    'Morris', 'Murphy', 'Cooper', 'Morgan', 'Bailey', 'Reed', 'Howard', 'Ward',
    'Watson', 'Hughes', 'Foster', 'Sanders', 'Price', 'Ross', 'Powell', 'Jenkins',
  ],
  fr: [
    'Laurent', 'Moreau', 'Lefevre', 'Roux', 'Girard', 'Mercier', 'Dupont', 'Lambert',
    'Bonnet', 'Fontaine', 'Rousseau', 'Chevalier', 'Gauthier', 'Perrin', 'Marchand', 'Robin',
    'Benali', 'Mansouri', 'Bennani', 'El Amrani',
  ],
  darija_latin: [
    'Benali', 'Bennani', 'El Amrani', 'Idrissi', 'Tazi', 'Alami', 'Mansouri', 'Berrada',
    'Chraibi', 'Fassi', 'Kettani', 'Lahlou', 'Naciri', 'Ouazzani', 'Rahmani', 'Senhaji',
    'Ziani', 'Bouchra', 'Kabbaj', 'Malki',
  ],
  ar: [
    'Benali', 'El Amrani', 'Mansouri', 'Idrissi', 'Tazi', 'Alami', 'Chraibi', 'Fassi',
    'Berrada', 'Bennani', 'Naciri', 'Khattabi', 'Zahrani', 'Hariri', 'Qasimi', 'Sharif',
  ],
  es: [
    'Garcia', 'Martinez', 'Lopez', 'Sanchez', 'Perez', 'Gomez', 'Martin', 'Jimenez',
    'Ruiz', 'Hernandez', 'Diaz', 'Moreno', 'Alvarez', 'Romero', 'Navarro', 'Torres',
  ],
  ...GLOBAL_EXTRA_SURNAMES,
};

function createUniqueIdentity(
  existing: Set<string>,
  language: ReviewLanguage
): { email: string; name: string } {
  const pool = NAMES_BY_LANGUAGE[language] || NAMES_BY_LANGUAGE.en;
  const surnames = REAL_SURNAMES_BY_LANGUAGE[language] || REAL_SURNAMES_BY_LANGUAGE.en;

  for (let attempt = 0; attempt < 25; attempt++) {
    const first = pickRandom(pool.first);
    const displayLast = pickRandom(surnames);
    const emailLast = displayLast.toLowerCase().replace(/\s+/g, '');
    const domain = pickRandom(pool.domains);
    const pattern = Math.random();

    let local: string;
    if (pattern < 0.3) {
      local = `${first}.${emailLast}${randomInt(1, 99)}`;
    } else if (pattern < 0.55) {
      local = `${first}_${emailLast}`;
    } else if (pattern < 0.78) {
      local = `${first}${emailLast.slice(0, 3)}${randomInt(78, 99)}`;
    } else {
      local = `${first.charAt(0)}.${emailLast}${randomInt(10, 999)}`;
    }

    const email = `${local}@${domain}`;
    if (!existing.has(email)) {
      existing.add(email);
      return {
        email,
        name: formatReviewerName(first, displayLast, language),
      };
    }
  }
  const fallbackFirst = pickRandom(pool.first);
  const fallbackLast = pickRandom(surnames);
  const fallback = `${fallbackFirst}.${randomInt(10000, 99999)}@gmail.com`;
  existing.add(fallback);
  return {
    email: fallback,
    name: formatReviewerName(fallbackFirst, fallbackLast, language),
  };
}

function generateRandomDateMs(startMs: number, endMs: number): number {
  return startMs + Math.random() * Math.max(86400000, endMs - startMs);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(ms: number): string {
  return new Date(ms).toISOString().split('T')[0];
}

function formatJudgeMeTimestamp(ms: number): string {
  const datePart = formatDate(ms);
  const hour = pad2(randomInt(8, 23));
  const minute = pad2(randomInt(0, 59));
  const second = pad2(randomInt(0, 59));
  return `${datePart} ${hour}:${minute}:${second} UTC`;
}

interface ReturningCustomerProfile {
  name: string;
  email: string;
  language: ReviewLanguage;
  reviewedProductKeys: Set<string>;
  lastReviewDateMs: number;
}

export function generateSingleReviewForProduct(
  product: CatalogProduct,
  config: GeneratorConfig,
  templates: ReviewTemplate[],
  existingEmails: Set<string> = new Set(),
  globalUsedBodies: Set<string> = new Set(),
  forcedEmail?: string,
  forcedName?: string,
  forcedLanguage?: ReviewLanguage,
  isReturningCustomer = false,
  adaptedPack: BusinessVoicePack | null = null,
  allProductsForDetection: CatalogProduct[] = [product]
): GeneratedReview {
  const startMs = Date.parse(config.dateStart) || Date.now() - 180 * 86400000;
  const endMs = Math.max(startMs + 86400000, Date.parse(config.dateEnd) || Date.now());
  const iptvMode = !adaptedPack && isIPTVCatalog(allProductsForDetection);
  const serviceMode = !iptvMode && isServiceCatalog(allProductsForDetection);

  const language = forcedLanguage ?? pickLanguage(config.selectedLanguages);
  const stars = pickOrganicStar();
  const { subject, body, voice } = composeUniqueReviewCopy(
    product,
    language,
    stars,
    templates,
    adaptedPack,
    iptvMode,
    globalUsedBodies,
    new Set(),
    serviceMode
  );

  const identity =
    forcedEmail && forcedName
      ? { email: forcedEmail, name: forcedName }
      : createUniqueIdentity(existingEmails, language);

  const dateMs = generateRandomDateMs(startMs, endMs);

  return {
    id: `${product.item_id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    item_id: product.item_id,
    item_slug: product.item_slug,
    item_name: product.item_name,
    category: product.category,
    reviewer_name: identity.name,
    reviewer_email: identity.email,
    stars,
    subject,
    body,
    review_date: formatDate(dateMs),
    review_timestamp: formatJudgeMeTimestamp(dateMs),
    product_url: resolveProductUrl(
      { product_url: product.product_url || '', item_slug: product.item_slug },
      config.storeBaseUrl
    ),
    picture_urls: product.picture_urls || '',
    voice,
    language,
    isReturningCustomer,
  };
}

export function generateReviewDataset(
  products: CatalogProduct[],
  config: GeneratorConfig,
  templates: ReviewTemplate[],
  adaptedPack: BusinessVoicePack | null = null
): GeneratedReview[] {
  const { eligible } = filterEligibleProducts(products, config);
  if (eligible.length === 0 || config.selectedLanguages.length === 0) return [];

  const iptvMode = !adaptedPack && isIPTVCatalog(products);
  const serviceMode = !iptvMode && isServiceCatalog(products);
  const startMs = Date.parse(config.dateStart) || Date.now() - 180 * 86400000;
  const endMs = Math.max(startMs + 86400000, Date.parse(config.dateEnd) || Date.now());

  const curve =
    VOLUME_PRESET_CURVES[config.volumePreset] ?? VOLUME_PRESET_CURVES.realistic;
  const effectiveMin = Math.max(0, Math.floor(config.minReviewsPerItem ?? 0));
  const effectiveMax = Math.max(
    effectiveMin,
    Math.min(100, Math.floor(config.maxReviewsPerItem ?? curve.maxCount))
  );

  const productPlans = eligible.map((product) => ({
    product,
    count: pickOrganicCountForProduct(
      config.volumePreset,
      config.zeroReviewRatio,
      effectiveMin,
      effectiveMax
    ),
  }));

  let totalPlanned = productPlans.reduce((sum, p) => sum + p.count, 0);
  if (totalPlanned === 0 && productPlans.length > 0 && effectiveMax > 0) {
    const randomIdx = randomInt(0, productPlans.length - 1);
    const fallbackCount = randomInt(1, Math.min(4, effectiveMax));
    productPlans[randomIdx].count = fallbackCount;
    totalPlanned = fallbackCount;
  }

  // Enforce optional global total reviews cap while keeping random organic variance
  const totalLimit =
    typeof config.maxTotalReviews === 'number' && config.maxTotalReviews > 0
      ? Math.floor(config.maxTotalReviews)
      : null;

  if (totalLimit !== null && totalPlanned > totalLimit) {
    const scale = totalLimit / totalPlanned;
    for (const plan of productPlans) {
      plan.count = Math.floor(plan.count * scale);
    }
    let currentSum = productPlans.reduce((sum, p) => sum + p.count, 0);

    // Distribute remaining slots up to totalLimit across random eligible products below effectiveMax
    const indices = productPlans.map((_, idx) => idx);
    while (currentSum < totalLimit) {
      const candidates = indices.filter((idx) => productPlans[idx].count < effectiveMax);
      if (candidates.length === 0) break;
      const pick = pickRandom(candidates);
      productPlans[pick].count += 1;
      currentSum += 1;
    }
    totalPlanned = currentSum;
  }

  // Returning customer cohort — each repeat customer maintains consistent name, email, and language
  const allEmails = new Set<string>();
  const targetReturningReviews = Math.round(
    (totalPlanned * Math.max(0, Math.min(60, config.returningCustomerRate))) / 100
  );
  const returningPoolSize = Math.max(
    targetReturningReviews > 0 ? 3 : 0,
    Math.round(targetReturningReviews / 2.6)
  );

  const returningPool: ReturningCustomerProfile[] = [];
  for (let i = 0; i < returningPoolSize; i++) {
    const lang = pickLanguage(config.selectedLanguages);
    const identity = createUniqueIdentity(allEmails, lang);
    returningPool.push({
      name: identity.name,
      email: identity.email,
      language: lang,
      reviewedProductKeys: new Set<string>(),
      lastReviewDateMs: startMs + Math.random() * ((endMs - startMs) * 0.4),
    });
  }

  // Global uniqueness & anti-repetition guards
  const globalUsedBodies = new Set<string>();
  const globalSubjectCounts = new Map<string, number>();
  const globalOpenerCounts = new Map<string, number>();
  const emailFrequency = new Map<string, number>();
  const output: GeneratedReview[] = [];

  for (const plan of productPlans) {
    if (plan.count === 0) continue;

    const productKey = `${plan.product.item_id}::${plan.product.item_slug}`;
    const productUsedSubjects = new Set<string>();
    const productReviews: GeneratedReview[] = [];

    for (let i = 0; i < plan.count; i++) {
      let chosenEmail: string | undefined;
      let chosenName: string | undefined;
      let chosenLang: ReviewLanguage | undefined;
      let dateMs = generateRandomDateMs(startMs, endMs);

      const tryReturning =
        returningPool.length > 0 &&
        Math.random() * 100 < config.returningCustomerRate;

      if (tryReturning) {
        // Cap each returning customer to at most 3 reviews total so emails never look spammy/repeated
        const candidates = returningPool.filter(
          (c) => !c.reviewedProductKeys.has(productKey) && c.reviewedProductKeys.size < 3
        );
        if (candidates.length > 0) {
          const customer = pickRandom(candidates);
          customer.reviewedProductKeys.add(productKey);
          chosenEmail = customer.email;
          chosenName = customer.name;
          chosenLang = customer.language;

          const nextMs = Math.min(
            endMs,
            customer.lastReviewDateMs + randomInt(10, 55) * 86400000
          );
          dateMs = nextMs;
          customer.lastReviewDateMs = nextMs;
        }
      }

      const language = chosenLang ?? pickLanguage(config.selectedLanguages);
      if (!chosenEmail || !chosenName) {
        const identity = createUniqueIdentity(allEmails, language);
        chosenEmail = identity.email;
        chosenName = identity.name;
      }

      const stars = pickOrganicStar();
      const { subject, body, voice } = composeUniqueReviewCopy(
        plan.product,
        language,
        stars,
        templates,
        adaptedPack,
        iptvMode,
        globalUsedBodies,
        productUsedSubjects,
        serviceMode,
        globalSubjectCounts,
        globalOpenerCounts
      );

      emailFrequency.set(chosenEmail, (emailFrequency.get(chosenEmail) || 0) + 1);

      productReviews.push({
        id: `${plan.product.item_id}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        item_id: plan.product.item_id,
        item_slug: plan.product.item_slug,
        item_name: plan.product.item_name,
        category: plan.product.category,
        reviewer_name: chosenName,
        reviewer_email: chosenEmail,
        stars,
        subject,
        body,
        review_date: formatDate(dateMs),
        review_timestamp: formatJudgeMeTimestamp(dateMs),
        product_url: resolveProductUrl(
          { product_url: plan.product.product_url || '', item_slug: plan.product.item_slug },
          config.storeBaseUrl
        ),
        picture_urls: plan.product.picture_urls || '',
        voice,
        language,
        isReturningCustomer: false,
      });
    }

    productReviews.sort((a, b) => a.review_date.localeCompare(b.review_date));
    output.push(...productReviews);
  }

  for (const row of output) {
    row.isReturningCustomer = (emailFrequency.get(row.reviewer_email) || 0) > 1;
  }

  return output;
}
