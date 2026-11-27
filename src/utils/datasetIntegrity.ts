import {
  BusinessVoicePack,
  CatalogProduct,
  GeneratedReview,
  ReviewLanguage,
} from '../types/reviews';
import { classifyServiceArchetype } from './humanizer';

export type IntegrityIssueType =
  | 'exact_duplicate'
  | 'near_duplicate'
  | 'repeated_title'
  | 'repeated_opening'
  | 'repeated_closing'
  | 'repeated_sentence'
  | 'similar_narrative'
  | 'company_name_stuffing'
  | 'inserted_heading'
  | 'slug_typo'
  | 'mechanical_service_insertion'
  | 'incorrect_service'
  | 'implausible_claim'
  | 'uncertain_service'
  | 'off_domain'
  | 'mixed_language_service'
  | 'language_mismatch'
  | 'regional_mismatch'
  | 'broken_grammar'
  | 'artificial_typo'
  | 'marketing_phrase'
  | 'rating_sentiment_mismatch'
  | 'duplicate_identity'
  | 'repeat_reviewer_date'
  | 'future_date'
  | 'unverified_source';

export type IssueSeverity = 'critical' | 'warning';

export interface IntegrityIssue {
  reviewId: string;
  type: IntegrityIssueType;
  severity: IssueSeverity;
  detail: string;
  suggestedSlug?: string;
}

export interface MandatoryGatesStatus {
  zeroExactDuplicates: boolean;
  zeroHeadingServices: boolean;
  zeroMixedLanguageLabels: boolean;
  zeroFabricatedOrOffDomain: boolean;
  allServicesVerifiedOrFlagged: boolean;
  allUnsupportedExcludedAndVerified: boolean;
  allPassed: boolean;
}

export interface QualityScorecard {
  /** Weighted 0–100 score (30% Source, 20% Originality, 15% Natural Lang, 15% Service Relevance, 10% Consistency, 10% Multilingual) */
  weightedTotal100: number;
  /** Content & data readiness 0–100 (evaluates quality independent of manual source sign-off) */
  contentReadiness100: number;
  /** Individual 0–100 dimension scores */
  sourceAuthenticity100: number;
  originality100: number;
  naturalLanguage100: number;
  serviceRelevance100: number;
  dataConsistency100: number;
  multilingual100: number;
  /** 0–10 rubric criteria matching the 5 target benchmarks */
  rubric10: {
    naturalLanguage: number;
    originality: number;
    technicalRelevance: number;
    serviceCategorization: number;
    overallQuality: number;
  };
  mandatoryGates: MandatoryGatesStatus;
  publicationApproved: boolean;
  blockingReasons: string[];
}

export interface DatasetIntegrityReport {
  totalReviews: number;
  uniqueEmailCount: number;
  duplicateEmailCount: number;
  exactDuplicateCount: number;
  nearDuplicateCount: number;
  repeatedOpeningCount: number;
  repeatedClosingCount: number;
  insertedHeadingCount: number;
  mechanicalInsertionCount: number;
  repeatedSentenceCount: number;
  companyStuffingCount: number;
  brokenGrammarCount: number;
  artificialTypoCount: number;
  mixedLanguageServiceCount: number;
  languageMismatchCount: number;
  regionalMismatchCount: number;
  marketingPhraseCount: number;
  incorrectServiceCount: number;
  ratingMismatchCount: number;
  repeatReviewerCount: number;
  repeatDateIssues: number;
  futureDateCount: number;
  offDomainCount: number;
  unverifiedSourceCount: number;
  criticalReviewIds: string[];
  flaggedReviewIds: string[];
  issuesByReviewId: Record<string, IntegrityIssue[]>;
  scorecard: QualityScorecard;
}

export interface IntegrityAuditOptions {
  verifiedIds?: string[];
  validOfferings?: CatalogProduct[];
  adaptedPack?: BusinessVoicePack | null;
  companyName?: string;
  detectedCountryCode?: string;
}

const HEADING_OR_CTA_ITEM =
  /(\b(you|your|yours|we|our|us|my|me|tell|discuss|choose|suits|discover|explore|welcome|relax|step \d|how it works|why choose|how can we|customer feedback|customer reviews?|service areas?|werkgebied|onze diensten|nos services|bulex solutions|our solutions|book now|book a |request a |get a quote|cookie|privacy|contact|about us|over ons)\b|^(brussel|brussels|bruxelles|antwerpen|antwerp|gent|ghent|brugge|leuven|mechelen|hasselt|namur|liège|liege|charleroi|paris|london|amsterdam|rotterdam)$)/i;

export function isHeadingOrJunkOffering(name: string): boolean {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  return (
    trimmed.length < 3 ||
    words.length > 6 ||
    /[?!:]/.test(trimmed) ||
    HEADING_OR_CTA_ITEM.test(trimmed)
  );
}

const MARKETING_EXPRESSIONS =
  /\b(worth every penny|exceeded( all)? expectations|surpassé nos attentes|game[- ]changer|top[- ]tier|stress[- ]free experience|genuine peace of mind|real peace of mind|un vrai sens du détail|absolute aanrader|five stars (easily|well deserved)|cinq étoiles amplement méritées|dikke vijf sterren waard|beyond expectations|second to none|world[- ]class|unmatched quality|highly recommended to everyone|best in the business|100% satisfied|formidable du début à la fin|fantastisch van begin tot eind|fantastic from start to finish)\b/i;

const ARTIFICIAL_TYPOS =
  /\b(reccomend|definately|realy|afsprak|vrmt|bcp|thx|tho)\b/i;

const ECOM_WORDS_ON_SERVICE =
  /\b(shipping|packaging|arrived in the mail|box arrived|listing photos|emballage|colis|cet article|dit artikel|een cadeau|swap variant|ordered a second one|unboxing|tracking updates)\b/i;

const SERVICE_HINT =
  /\b(repair|plumb|plombier|loodgieter|boiler|heating|leak|emergency|install|maintenance|onderhoud|entretien|herstelling|dépannage|spoed|clinic|dental|salon|agency|clean|electric|service|heat pump|warmtepomp|waterlek|sanitair)\b/i;

const GLOWING_PRAISE_PATTERNS =
  /\b(très content|très satisfait|heel tevreden|zeer tevreden|great experience|fantastic|formidable|parfait|impeccable|irréprochable|uitstekend|schitterend|top service|five stars|5 stars|cinq étoiles|vijf sterren|huge relief|foutloos zonder één storing|sans le moindre souci|zero issues|echte aanrader|je recommande vivement)\b/i;

const STRONG_NEGATIVE_PATTERNS =
  /\b(terrible|awful|horrible|worst|catastrophe|inacceptable|onacceptabel|waardeloos|never showed up|jamais venu|niet opgedaagd|broken again|toujours en panne|nog steeds kapot)\b/i;

const ENGLISH_LABEL_WORDS =
  /\b(boiler|repair|maintenance|installation|heating|systems|water|heaters?|hot water|emergency|service|leak|plumbing|gas|heat pumps?|solutions?|tell us|we discuss|care that)\b/i;

const DUTCH_LABEL_WORDS =
  /\b(herstelling|onderhoudscontract|onderhoud|vervangen|nieuwe verwarming|spoeddienst|waterlek|herstellen|sanitair|installatie|belgi[eë]|warmtepomp)\b/i;

const FRENCH_TEXT_MARKERS = /\b(nous|notre|avec|pour|dans|très|Intervention|chaudière|plombier|équipe|depuis|rendez-vous|problème|réglé)\b/i;
const DUTCH_TEXT_MARKERS = /\b(onze|voor|met|zeer|heel|technieker|ketel|verwarming|afspraak|opgelost|netjes|vriendelijke|geholpen|woning)\b/i;
const ENGLISH_TEXT_MARKERS = /\b(the|with|our|they|technician|arrived|fixed|working|appointment|quickly|before|everything)\b/i;

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

function getShingles(words: string[], k = 3): Set<string> {
  const out = new Set<string>();
  if (words.length < k) {
    if (words.length > 0) out.add(words.join(' '));
    return out;
  }
  for (let i = 0; i <= words.length - k; i++) {
    out.add(words.slice(i, i + k).join(' '));
  }
  return out;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  const smaller = a.size <= b.size ? a : b;
  const larger = a.size <= b.size ? b : a;
  for (const x of smaller) {
    if (larger.has(x)) inter += 1;
  }
  return inter / (a.size + b.size - inter);
}

function normalizeTemplateSentence(sentence: string, itemName: string): string {
  let norm = sentence.trim().toLowerCase().replace(/\s+/g, ' ');
  if (itemName.trim().length >= 3) {
    const escaped = itemName.trim().toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    norm = norm.replace(new RegExp(escaped, 'gi'), '[item]');
  }
  return norm;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15);
}

function slugifyCheck(v: string): string {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function levenshteinDist(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[i], dp[i - 1]);
      prev = tmp;
    }
  }
  return dp[m];
}

export function detectTitleLanguageHeuristic(title: string): ReviewLanguage | null {
  const s = title.trim();
  if (!s) return null;
  const fr = (s.match(/\b(fuite|réparée|intervention|rapide|pour|une|très|réglé|ponctuel|méthodique|explications|sur|soignée|dépannage|tranquillité|travail|équipe|créneau)\b|[éèêàùç]/gi) || []).length;
  const nl = (s.match(/\b(werk|orde|kon|vlotter|tevreden|vakwerk|uitgevoerd|prima|voor|de|het|waterlek|snel|opgelost|uitleg|ketel|aanpak|redelijke|ervaring|zodra|ingepland|goed|wachten|nette|eerlijke|prijs)\b/gi) || []).length;
  const en = (s.match(/\b(reliable|technician|overall|honest|advice|fair|quote|solved|first|visit|clear|work|quick|fix|hot|diagnosis|tidy|resolution|issue|fine|once|booked|good|slight|delay)\b/gi) || []).length;
  const max = Math.max(fr, nl, en);
  if (max < 1) return null;
  if (fr === max && fr > nl && fr > en) return 'fr';
  if (nl === max && nl > fr && nl > en) return 'nl';
  if (en === max && en > fr && en > nl) return 'en';
  return null;
}

export function detectTextLanguageHeuristic(text: string): ReviewLanguage | null {
  const sample = text.trim();
  if (!sample) return null;
  if (/[\u0600-\u06FF]/.test(sample)) return 'ar';
  if (/[\u0590-\u05FF]/.test(sample)) return 'he';
  const frHits = (sample.match(/\b(nous|notre|avec|pour|dans|très|chaudière|plombier|équipe|depuis|rendez-vous|problème|réglé|intervention|était|même)\b/gi) || []).length;
  const nlHits = (sample.match(/\b(onze|voor|met|zeer|heel|technieker|ketel|verwarming|afspraak|opgelost|netjes|geholpen|woning|bedankt|binnen|maar)\b/gi) || []).length;
  const enHits = (sample.match(/\b(the|with|our|they|technician|arrived|fixed|working|appointment|quickly|before|everything|overall|would)\b/gi) || []).length;
  const max = Math.max(frHits, nlHits, enHits);
  if (max < 2) return null;
  if (frHits === max && frHits > nlHits && frHits > enHits) return 'fr';
  if (nlHits === max && nlHits > frHits && nlHits > enHits) return 'nl';
  if (enHits === max && enHits > frHits && enHits > nlHits) return 'en';
  return null;
}

/**
 * Infers which valid offering on the website best matches a review's actual written intervention
 * when the current service assignment is mismatched. Works universally using offering keywords + archetypes!
 */
export function inferBestMatchingOfferingSlug(
  bodyAndSubject: string,
  validOfferings: CatalogProduct[],
  adaptedPack?: BusinessVoicePack | null
): string | undefined {
  if (!validOfferings || validOfferings.length === 0) return undefined;
  const lower = bodyAndSubject.toLowerCase();

  // 1. Check AI-generated per-offering distinctive keywords first (works for ANY industry!)
  if (adaptedPack?.offeringContexts?.length) {
    let bestSlug = '';
    let bestHits = 0;
    for (const ctx of adaptedPack.offeringContexts) {
      const kws = ctx.distinctiveKeywords || [];
      let hits = 0;
      for (const kw of kws) {
        if (kw.length >= 3 && lower.includes(kw.toLowerCase())) hits += 1;
      }
      if (hits > bestHits) {
        bestHits = hits;
        bestSlug = ctx.item_slug;
      }
    }
    if (bestHits >= 2 && validOfferings.some((o) => o.item_slug === bestSlug)) {
      return bestSlug;
    }
  }

  // 2. Universal sub-service text signal matching against available offerings
  const findByArch = (targetArch: ReturnType<typeof classifyServiceArchetype>) =>
    validOfferings.find((o) => classifyServiceArchetype(o) === targetArch)?.item_slug;

  if (/\b(heat pump|warmtepomp|pompe à chaleur|buitenunit|unité extérieure)\b/i.test(lower)) {
    return findByArch('heat_pump');
  }
  if (/\b(leak|lek|fuite|drip|goutt|druppel|under the sink|sous l’évier|onder de gootsteen|shutoff)\b/i.test(lower)) {
    return findByArch('leak_repair') || findByArch('plumbing_install');
  }
  if (/\b(annual|entretien annuel|onderhoud|attestation|reinigingsattest|keuring|tune-up|brûleur nettoyé)\b/i.test(lower) && !/\b(error code|foutcode|code d’erreur|cut out|viel plots uit|s’est coupé)\b/i.test(lower)) {
    return findByArch('boiler_maintenance');
  }
  if (/\b(new condensing|replace our old|vervanging van|nieuwe gascondensatieketel|nouvelle chaudière|upgrade to a modern)\b/i.test(lower) && !/\b(worn valve|versleten klep|vanne usée|faulty pressure sensor)\b/i.test(lower)) {
    return findByArch('boiler_install');
  }
  if (/\b(error code|foutcode|code d’erreur|losing pressure|perdait de la pression|verloor elke nacht druk|worn valve|versleten klep|vanne usée|pressure sensor|capteur défectueux|expansievat|expansion vessel|vase d’expansion)\b/i.test(lower)) {
    return findByArch('boiler_repair') || findByArch('heating_system');
  }
  if (/\b(water heater|chauffe-eau|warmwaterboiler|storage tank|ballon d’eau chaude)\b/i.test(lower)) {
    return findByArch('water_heater');
  }
  return undefined;
}

/**
 * Comprehensive, universal Customer Review Quality & Authenticity Audit:
 * Implements the mandatory 6-dimension weighted scoring system (100 points)
 * and all 6 mandatory publication hard-gates for ANY website or review CSV.
 */
export function runDatasetIntegrityAudit(
  reviews: GeneratedReview[],
  options: IntegrityAuditOptions = {}
): DatasetIntegrityReport {
  const issuesByReviewId: Record<string, IntegrityIssue[]> = {};
  const addIssue = (issue: IntegrityIssue) => {
    if (!issuesByReviewId[issue.reviewId]) issuesByReviewId[issue.reviewId] = [];
    // Prevent duplicate issue types on the same row
    if (issuesByReviewId[issue.reviewId].some((x) => x.type === issue.type)) return;
    issuesByReviewId[issue.reviewId].push(issue);
  };

  const verifiedSet = new Set(options.verifiedIds || []);
  const validOfferings = options.validOfferings || [];
  const countryCode = (
    options.detectedCountryCode ||
    options.adaptedPack?.detectedCountryCode ||
    ''
  )
    .trim()
    .toUpperCase();

  const rawCompany = (
    options.companyName ||
    options.adaptedPack?.detectedBusinessName ||
    ''
  )
    .replace(/\(built-in\)|custom business catalog/gi, '')
    .trim();

  // 1. Exact duplicates, repeated titles, 3-gram Jaccard near-duplicates, 6-word cross-service skeleton clones, identical openings & endings, repeated sentences
  const exactSeen = new Map<string, string>();
  const titleSeen = new Map<string, string[]>();
  const openingSeen = new Map<string, string[]>();
  const closingSeen = new Map<string, string[]>();
  const templateSeen = new Map<string, string[]>();
  const sixGramSeen = new Map<string, Array<{ id: string; slug: string; sample: string }>>();
  const wordSets: Array<{ id: string; lang: string; shingles: Set<string>; words: string[] }> = [];

  let exactDuplicateCount = 0;
  for (const r of reviews) {
    const words = normalizeWords(r.body);
    const normExact = words.join(' ');
    if (normExact.length > 0) {
      const prevId = exactSeen.get(normExact);
      if (prevId) {
        exactDuplicateCount += 1;
        addIssue({
          reviewId: r.id,
          type: 'exact_duplicate',
          severity: 'critical',
          detail: 'Exact duplicate review body found in dataset.',
        });
      } else {
        exactSeen.set(normExact, r.id);
      }
    }

    const titleWords = normalizeWords(r.subject);
    if (titleWords.length > 0) {
      const tKey = titleWords.join(' ');
      const tList = titleSeen.get(tKey) || [];
      tList.push(r.id);
      titleSeen.set(tKey, tList);
    }

    // Sliding 6-word fragments to catch reusable sentence templates across different services
    // (e.g. "Technisch prima uitgevoerd voor [X], alleen duurde het vrij lang voor de afspraak vastlag")
    if (words.length >= 6) {
      const rowSeen6 = new Set<string>();
      for (let idx = 0; idx <= words.length - 6; idx++) {
        const gram = words.slice(idx, idx + 6).join(' ');
        if (rowSeen6.has(gram)) continue;
        rowSeen6.add(gram);
        const list = sixGramSeen.get(gram) || [];
        list.push({ id: r.id, slug: r.item_slug, sample: gram });
        sixGramSeen.set(gram, list);
      }
    }

    if (words.length >= 5) {
      const openKey = `${r.language}::${words.slice(0, 4).join(' ')}`;
      const openList = openingSeen.get(openKey) || [];
      openList.push(r.id);
      openingSeen.set(openKey, openList);

      const closeKey = `${r.language}::${words.slice(-5).join(' ')}`;
      const closeList = closingSeen.get(closeKey) || [];
      closeList.push(r.id);
      closingSeen.set(closeKey, closeList);
    }

    if (words.length >= 7) {
      wordSets.push({ id: r.id, lang: r.language, shingles: getShingles(words, 3), words });
    }

    for (const s of splitSentences(r.body)) {
      const key = normalizeTemplateSentence(s, r.item_name);
      const list = templateSeen.get(key) || [];
      list.push(r.id);
      templateSeen.set(key, list);
    }
  }

  for (const [tKey, ids] of titleSeen.entries()) {
    if (ids.length > 1) {
      for (const id of ids.slice(1)) {
        addIssue({
          reviewId: id,
          type: 'repeated_title',
          severity: 'warning',
          detail: `Recurring review title (${ids.length}× across dataset): "${tKey}".`,
        });
      }
    }
  }

  let nearDuplicateCount = 0;
  const nearDupFlagged = new Set<string>();
  for (let i = 0; i < wordSets.length; i++) {
    for (let j = i + 1; j < wordSets.length; j++) {
      if (wordSets[i].lang !== wordSets[j].lang) continue;
      const sim = jaccardSimilarity(wordSets[i].shingles, wordSets[j].shingles);
      if (sim >= 0.48 && !nearDupFlagged.has(wordSets[j].id)) {
        nearDupFlagged.add(wordSets[j].id);
        nearDuplicateCount += 1;
        addIssue({
          reviewId: wordSets[j].id,
          type: 'near_duplicate',
          severity: sim >= 0.68 ? 'critical' : 'warning',
          detail: `High text similarity (${Math.round(sim * 100)}% 3-gram overlap) with another review.`,
        });
      }
    }
  }

  let repeatedOpeningCount = 0;
  for (const [key, ids] of openingSeen.entries()) {
    if (ids.length > 1) {
      const phrase = key.split('::')[1];
      for (const id of ids.slice(1)) {
        repeatedOpeningCount += 1;
        addIssue({
          reviewId: id,
          type: 'repeated_opening',
          severity: 'warning',
          detail: `Identical review opening (${ids.length}×): "${phrase}…"`,
        });
      }
    }
  }

  let repeatedClosingCount = 0;
  for (const [key, ids] of closingSeen.entries()) {
    if (ids.length > 1) {
      const phrase = key.split('::')[1];
      for (const id of ids.slice(1)) {
        repeatedClosingCount += 1;
        addIssue({
          reviewId: id,
          type: 'repeated_closing',
          severity: 'warning',
          detail: `Identical review ending (${ids.length}×): "…${phrase}"`,
        });
      }
    }
  }

  const repeatedIds = new Set<string>();
  for (const [tpl, ids] of templateSeen.entries()) {
    if (ids.length > 1) {
      for (const id of ids.slice(1)) {
        repeatedIds.add(id);
        addIssue({
          reviewId: id,
          type: 'repeated_sentence',
          severity: 'critical',
          detail: `Identical reusable sentence (${ids.length}×): "${tpl.slice(0, 56)}…"`,
        });
      }
    }
  }

  // Flag reusable sentence fragments: >= 6 consecutive words across DIFFERENT services, or >= 8 consecutive words on same service
  for (const [gram, entries] of sixGramSeen.entries()) {
    const distinctIds = Array.from(new Set(entries.map((e) => e.id)));
    const distinctSlugs = new Set(entries.map((e) => e.slug));
    if (distinctIds.length > 1 && distinctSlugs.size > 1) {
      for (const id of distinctIds.slice(1)) {
        if (!repeatedIds.has(id)) {
          repeatedIds.add(id);
          addIssue({
            reviewId: id,
            type: 'repeated_sentence',
            severity: 'critical',
            detail: `Reusable sentence fragment shared across different services: "…${gram}…"`,
          });
        }
      }
    }
  }

  // Detect cross-language narrative clones (e.g. multiple rows mentioning insurance reports or under-sink dishwasher puddles)
  const narrativeMotifs: Array<[string, RegExp]> = [
    ['insurance report leak claim', /\b(insurer|insurance|verzekering|assurance)\b/i],
    ['under-sink dishwasher/cabinet puddle', /\b(kitchen sink cabinet|onder het aanrecht|sous le meuble d’évier|under the sink)\b/i],
  ];
  for (const [motifLabel, rx] of narrativeMotifs) {
    const matchingIds = reviews.filter((r) => rx.test(r.body)).map((r) => r.id);
    if (matchingIds.length > 2) {
      for (const id of matchingIds.slice(2)) {
        addIssue({
          reviewId: id,
          type: 'similar_narrative',
          severity: 'warning',
          detail: `Repeated technical narrative motif (${matchingIds.length}× across languages): ${motifLabel}.`,
        });
      }
    }
  }

  // 2. Duplicate reviewer emails, duplicate reviewer names & intervention dates
  const byEmail = new Map<string, GeneratedReview[]>();
  const byName = new Map<string, GeneratedReview[]>();
  const todayIso = new Date().toISOString().split('T')[0];
  let futureDateCount = 0;

  for (const r of reviews) {
    if (r.review_date > todayIso) {
      futureDateCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'future_date',
        severity: 'critical',
        detail: `Review date ${r.review_date} is in the future.`,
      });
    }
    const emailKey = r.reviewer_email.trim().toLowerCase();
    if (emailKey) {
      const list = byEmail.get(emailKey) || [];
      list.push(r);
      byEmail.set(emailKey, list);
    }
    const nameKey = r.reviewer_name.trim().toLowerCase();
    if (nameKey && nameKey.length >= 4) {
      const nList = byName.get(nameKey) || [];
      nList.push(r);
      byName.set(nameKey, nList);
    }
  }

  let repeatReviewerCount = 0;
  let repeatDateIssues = 0;
  for (const [, list] of byEmail.entries()) {
    if (list.length <= 1) continue;
    repeatReviewerCount += 1;
    const sorted = [...list].sort((a, b) => a.review_date.localeCompare(b.review_date));
    const seenSlugs = new Set<string>();
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      if (i > 0) {
        addIssue({
          reviewId: cur.id,
          type: 'duplicate_identity',
          severity: 'warning',
          detail: `Duplicate reviewer email (${cur.reviewer_email}) appears ${list.length}× in dataset.`,
        });
      }
      if (seenSlugs.has(cur.item_slug)) {
        repeatDateIssues += 1;
        addIssue({
          reviewId: cur.id,
          type: 'repeat_reviewer_date',
          severity: 'critical',
          detail: `Same reviewer (${cur.reviewer_email}) reviewed "${cur.item_name}" twice.`,
        });
      }
      seenSlugs.add(cur.item_slug);
      if (i > 0) {
        const prevMs = Date.parse(sorted[i - 1].review_date);
        const curMs = Date.parse(sorted[i].review_date);
        const gapDays = Math.round((curMs - prevMs) / 86400000);
        if (!Number.isNaN(gapDays) && gapDays < 21) {
          repeatDateIssues += 1;
          addIssue({
            reviewId: cur.id,
            type: 'repeat_reviewer_date',
            severity: 'critical',
            detail: `Repeat reviewer dates too close (${gapDays}d: ${sorted[i - 1].review_date} → ${cur.review_date}).`,
          });
        }
      }
    }
  }

  for (const [, nList] of byName.entries()) {
    if (nList.length <= 1) continue;
    const distinctEmails = new Set(nList.map((x) => x.reviewer_email.trim().toLowerCase()));
    if (distinctEmails.size > 1) {
      for (const cur of nList.slice(1)) {
        addIssue({
          reviewId: cur.id,
          type: 'duplicate_identity',
          severity: 'warning',
          detail: `Duplicate reviewer name "${cur.reviewer_name}" used across different email addresses.`,
        });
      }
    }
  }

  // 3. Company-name stuffing check across dataset
  let companyMentionRows = 0;
  let companyStuffingCount = 0;
  const companyEscaped =
    rawCompany.length >= 3 ? rawCompany.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  const companyRx = companyEscaped ? new RegExp(companyEscaped, 'i') : null;
  if (companyRx) {
    for (const r of reviews) {
      if (companyRx.test(`${r.subject} ${r.body}`)) companyMentionRows += 1;
    }
  }
  const maxAllowedCompanyRows = Math.max(2, Math.floor(reviews.length * 0.2));
  let seenCompanyMentions = 0;

  // 4. Per-review deep forensic checks
  let insertedHeadingCount = 0;
  let mechanicalInsertionCount = 0;
  let brokenGrammarCount = 0;
  let artificialTypoCount = 0;
  let mixedLanguageServiceCount = 0;
  let languageMismatchCount = 0;
  let regionalMismatchCount = 0;
  let marketingPhraseCount = 0;
  let incorrectServiceCount = 0;
  let ratingMismatchCount = 0;
  let offDomainCount = 0;
  let unverifiedSourceCount = 0;

  const isLikelyService =
    reviews.filter((r) => SERVICE_HINT.test(`${r.item_name} ${r.category}`)).length >=
    Math.max(1, reviews.length * 0.25);

  for (const r of reviews) {
    const combined = `${r.subject} ${r.body}`;
    const itemTrimmed = r.item_name.trim();
    const itemWords = itemTrimmed.split(/\s+/).filter(Boolean);
    const isRowVerified = Boolean(r.sourceVerified || verifiedSet.has(r.id));

    if (!isRowVerified) {
      unverifiedSourceCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'unverified_source',
        severity: 'warning',
        detail: 'Missing verified customer source record — requires manual verification before publishing.',
      });
    }

    // 4a. Website heading / slogan / CTA / city name used as service
    if (
      HEADING_OR_CTA_ITEM.test(itemTrimmed) ||
      itemWords.length > 6 ||
      /[?!:]/.test(itemTrimmed)
    ) {
      insertedHeadingCount += 1;
      const suggestedSlug = inferBestMatchingOfferingSlug(combined, validOfferings, options.adaptedPack);
      addIssue({
        reviewId: r.id,
        type: 'inserted_heading',
        severity: 'critical',
        detail: `Website heading, CTA, or navigation label used as service: "${itemTrimmed}".`,
        suggestedSlug,
      });
    }

    // 4a-bis. Service slug typo check (e.g., "heat-pouns" when item_name is "Heat pumps")
    const expectedSlug = slugifyCheck(itemTrimmed);
    const actualSlug = r.item_slug.trim().toLowerCase();
    if (expectedSlug && actualSlug && expectedSlug !== actualSlug) {
      const dist = levenshteinDist(actualSlug, expectedSlug);
      if (dist >= 1 && dist <= 3 && Math.abs(actualSlug.length - expectedSlug.length) <= 2) {
        insertedHeadingCount += 1;
        addIssue({
          reviewId: r.id,
          type: 'slug_typo',
          severity: 'critical',
          detail: `Service slug typo "${r.item_slug}" does not match "${itemTrimmed}" (expected "${expectedSlug}").`,
          suggestedSlug: expectedSlug,
        });
      }
    }

    // 4a-ter. Implausible technical / duration claim (e.g., replacing an entire boiler in < 1 hour)
    if (
      /\b(replac\w+\s+(our|my|the|an)\s+(old\s+)?(boiler|heating|heat pump)|remplac\w+\s+(notre|l['’])\s*(ancienne\s+)?chaudière|vervang\w+\s+van\s+(onze|een)\s+\w*ketel)\b/i.test(
        combined
      ) &&
      /\b(less than an hour|under an hour|in 30 min|en moins d['’]une heure|binnen het uur|in een halfuur)\b/i.test(
        combined
      )
    ) {
      incorrectServiceCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'implausible_claim',
        severity: 'critical',
        detail: 'Implausible technical/duration claim: full boiler/system replacement cannot be completed in under an hour.',
      });
    }

    // 4b. Company-name repetition / promotional title stuffing
    if (companyRx && companyRx.test(combined)) {
      seenCompanyMentions += 1;
      const inTitle = companyRx.test(r.subject);
      if (inTitle || seenCompanyMentions > maxAllowedCompanyRows) {
        companyStuffingCount += 1;
        addIssue({
          reviewId: r.id,
          type: 'company_name_stuffing',
          severity: 'warning',
          detail: inTitle
            ? `Promotional company name in review title ("${r.subject}").`
            : `Excessive company-name repetition across dataset (${companyMentionRows}/${reviews.length} rows).`,
        });
      }
    }

    // 4c. Broken grammar / unreplaced placeholders / mid-sentence capital splices / incomplete stubs
    const hasPlaceholder = /\{[a-zA-Z0-9_]+\}/.test(combined);
    const hasDupWord = /\b([a-zA-Z]{2,})\s+\1\b/i.test(combined);
    const hasBadPunct = /\s[,.!?]|[.!?][A-Za-zÀ-ÿ]|\.\./.test(r.body);
    // Mid-sentence capital splice like "fixed the issue Transparent communication" or "hired this service When the hot water"
    const hasCapitalSplice =
      /\b(issue|problem|service|intervention|problème|werk|daadwerkelijk)\s+[A-ZÀ-Ý][a-zà-ÿ]{3,}\s+[a-zà-ÿ]+/.test(
        r.body
      );
    const bodyWordCount = r.body.trim().split(/\s+/).filter(Boolean).length;
    const isIncompleteStub =
      bodyWordCount < 5 ||
      /\b(had dringend hulp nodig bij vragen over|required an immediate intervention\.|une fuite d'eau importante est apparue sous notre évier\.|required professional product insights\.|nous avons fait confiance à [^.]+\.)$/i.test(
        r.body.trim()
      );
    const hasGrammarSlip =
      /\b(a annual|de juiste materiaal|onze centrale verwarming laten uitvoeren)\b/i.test(r.body);

    if (hasPlaceholder || hasDupWord || hasBadPunct || hasCapitalSplice || isIncompleteStub || hasGrammarSlip) {
      brokenGrammarCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'broken_grammar',
        severity: isIncompleteStub || hasPlaceholder || hasCapitalSplice ? 'critical' : 'warning',
        detail: hasPlaceholder
          ? 'Unreplaced template placeholder found in review text.'
          : hasCapitalSplice
          ? 'Broken mid-sentence capital splice from mechanical template assembly.'
          : isIncompleteStub
          ? 'Incomplete or generic setup fragment — states an intent/problem without concrete intervention details.'
          : hasGrammarSlip
          ? 'Grammatical agreement or awkward phrasing error detected.'
          : hasDupWord
          ? 'Repeated consecutive word (broken grammar).'
          : 'Malformed punctuation or spacing splice.',
      });
    }

    // 4d. Artificial typos / chat slang
    const typoMatch = combined.match(ARTIFICIAL_TYPOS);
    if (typoMatch) {
      artificialTypoCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'artificial_typo',
        severity: 'warning',
        detail: `Artificial spelling mistake or chat shorthand ("${typoMatch[0]}") — keep natural, clean prose.`,
      });
    }

    // 4e. Mechanical service-label insertion & Mixed-language service labels
    if (itemTrimmed.length >= 4 && combined.toLowerCase().includes(itemTrimmed.toLowerCase())) {
      const escapedItem = itemTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hasParenInsert = new RegExp(`\\(${escapedItem}\\)`, 'i').test(combined);
      const hasFixedNounClash =
        new RegExp(`\\b(fixed|repaired|struggling with|audited our setup for)\\s+${escapedItem}\\b`, 'i').test(
          combined
        ) && /\b(installation|maintenance|service|systems|solutions|pumps|boilers|heaters)\b/i.test(itemTrimmed);

      if (hasParenInsert || hasFixedNounClash) {
        mechanicalInsertionCount += 1;
        addIssue({
          reviewId: r.id,
          type: 'mechanical_service_insertion',
          severity: 'critical',
          detail: `Service label "${itemTrimmed}" was mechanically inserted into sentence structure.`,
        });
      }

      // Mixed-language label check: English label inside non-EN review, or Dutch label inside EN/FR review
      const itemLooksEnglish = ENGLISH_LABEL_WORDS.test(itemTrimmed) && !DUTCH_LABEL_WORDS.test(itemTrimmed);
      const itemLooksDutch = DUTCH_LABEL_WORDS.test(itemTrimmed);

      if (
        (r.language !== 'en' && itemLooksEnglish) ||
        ((r.language === 'en' || r.language === 'fr') && itemLooksDutch)
      ) {
        mixedLanguageServiceCount += 1;
        addIssue({
          reviewId: r.id,
          type: 'mixed_language_service',
          severity: 'critical',
          detail: `Mixed-language service label "${itemTrimmed}" inserted into ${r.language.toUpperCase()} review.`,
        });
      }
    }

    // 4f. Written text language vs declared language tag AND Subject-vs-Body cross-language mismatch!
    const detectedBodyLang = detectTextLanguageHeuristic(r.body);
    const detectedTitleLang = detectTitleLanguageHeuristic(r.subject);
    if (detectedBodyLang && detectedTitleLang && detectedBodyLang !== detectedTitleLang) {
      languageMismatchCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'language_mismatch',
        severity: 'critical',
        detail: `Mixed-language review: ${detectedTitleLang.toUpperCase()} title ("${r.subject}") paired with ${detectedBodyLang.toUpperCase()} body.`,
      });
    } else if (detectedBodyLang && ['en', 'fr', 'nl'].includes(r.language) && detectedBodyLang !== r.language) {
      languageMismatchCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'language_mismatch',
        severity: 'critical',
        detail: `Review is tagged as ${r.language.toUpperCase()} but written in ${detectedBodyLang.toUpperCase()}.`,
      });
    } else if (r.language === 'nl' && FRENCH_TEXT_MARKERS.test(r.body) && !DUTCH_TEXT_MARKERS.test(r.body)) {
      languageMismatchCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'language_mismatch',
        severity: 'critical',
        detail: 'Language tag NL does not match French text.',
      });
    } else if (r.language === 'fr' && ENGLISH_TEXT_MARKERS.test(r.body) && !FRENCH_TEXT_MARKERS.test(r.body)) {
      languageMismatchCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'language_mismatch',
        severity: 'critical',
        detail: 'Language tag FR does not match English text.',
      });
    }

    // 4g. Regional ISP email mismatch (e.g., NL-only @ziggo.nl/@kpnmail.nl or UK @btinternet.com on BE business)
    const emailDomain = r.reviewer_email.split('@')[1]?.toLowerCase() || '';
    if (countryCode === 'BE' && /^(ziggo\.nl|kpnmail\.nl|btinternet\.com)$/i.test(emailDomain)) {
      regionalMismatchCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'regional_mismatch',
        severity: 'warning',
        detail: `Foreign country ISP domain "@${emailDomain}" used on a Belgian (BE) review.`,
      });
    }

    // 4h. Promotional / marketing clichés
    const mkt = combined.match(MARKETING_EXPRESSIONS);
    if (mkt) {
      marketingPhraseCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'marketing_phrase',
        severity: 'warning',
        detail: `Promotional cliché "${mkt[0]}" — prefer plain, grounded customer phrasing.`,
      });
    }

    // 4i. Rating vs. written sentiment inconsistency (flagged WITHOUT changing stars!)
    if (r.stars <= 3 && GLOWING_PRAISE_PATTERNS.test(combined) && !/\b(mais|maar|but|however|though|malgré|ondanks|delay|attente|wachten|late|retard)\b/i.test(combined)) {
      ratingMismatchCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'rating_sentiment_mismatch',
        severity: 'critical',
        detail: `Inconsistency: ${r.stars}★ rating paired with glowing 5★ praise ("${r.subject}") without any criticism.`,
      });
    } else if (r.stars <= 2 && GLOWING_PRAISE_PATTERNS.test(r.subject)) {
      ratingMismatchCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'rating_sentiment_mismatch',
        severity: 'critical',
        detail: `Inconsistency: low ${r.stars}★ rating contradicts positive review title "${r.subject}".`,
      });
    } else if (r.stars >= 4 && STRONG_NEGATIVE_PATTERNS.test(combined)) {
      ratingMismatchCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'rating_sentiment_mismatch',
        severity: 'critical',
        detail: `Inconsistency: high ${r.stars}★ rating contradicts strongly negative complaint in text.`,
      });
    }

    // 4j. Off-domain wording & Strict Sub-Service Relevance Check
    if (isLikelyService) {
      const ecom = combined.match(ECOM_WORDS_ON_SERVICE);
      if (ecom) {
        offDomainCount += 1;
        addIssue({
          reviewId: r.id,
          type: 'off_domain',
          severity: 'critical',
          detail: `Off-domain e-commerce wording "${ecom[0]}" used on a service intervention.`,
        });
      }

      const arch = classifyServiceArchetype({
        item_id: r.item_id,
        item_slug: r.item_slug,
        item_name: r.item_name,
        category: r.category,
      });
      const bodyLower = combined.toLowerCase();

      // Detect digital/agency template leakage onto non-digital services
      if (
        arch !== 'digital' &&
        /\b(audited our setup|shipped the improvements|laid out clear priorities|proposé un plan concret et livré)\b/i.test(
          bodyLower
        )
      ) {
        offDomainCount += 1;
        addIssue({
          reviewId: r.id,
          type: 'off_domain',
          severity: 'critical',
          detail: `B2B consulting/agency template wording leaked onto "${r.item_name}".`,
        });
      }

      // Detect cross-subservice mismatches (Maintenance vs Repair vs Installation vs Leak vs Plumbing vs Heat Pump)
      const mentionsAcuteBreakdown =
        /\b(losing pressure|perdait de la pression|verloor elke nacht druk|cut out|s’est coupé|viel plots uit|error code|code d’erreur|foutcode|worn valve|vanne usée|versleten klep|faulty pressure sensor|capteur défectueux)\b/i.test(
          bodyLower
        );
      const mentionsPipeOrSinkLeak =
        /\b(under the sink|sous l’évier|onder de gootsteen|pipe leak|fuite d'eau|waterlek|cracked fitting|joint fissuré|lekkende koppeling|near the main shutoff|behind the toilet|derrière les toilettes)\b/i.test(
          bodyLower
        );
      const mentionsGasBoiler =
        /\b(gas boiler|gascondensatieketel|chaudière gaz|boiler pressure|pression de la chaudière|keteldruk|brûleur|expansievat|vase d’expansion|expansion vessel)\b/i.test(
          bodyLower
        );
      const mentionsAnnualMaintenanceOnly =
        /\b(entretien annuel|contrat d'entretien|ketelonderhoud|annual boiler maintenance)\b/i.test(
          bodyLower
        ) && !mentionsAcuteBreakdown;

      let mismatchDetail = '';
      if (arch === 'boiler_maintenance' && (mentionsAcuteBreakdown || mentionsPipeOrSinkLeak)) {
        mismatchDetail = `Assigned to "${r.item_name}" (preventive maintenance) but describes an emergency repair/breakdown.`;
      } else if (arch === 'boiler_install' && (mentionsAcuteBreakdown || mentionsAnnualMaintenanceOnly || mentionsPipeOrSinkLeak)) {
        mismatchDetail = `Assigned to "${r.item_name}" (new equipment installation) but describes a repair fault or routine maintenance.`;
      } else if (arch === 'heat_pump' && (mentionsAcuteBreakdown || mentionsGasBoiler || /\b(hot water storage tanks)\b/i.test(bodyLower))) {
        mismatchDetail = `Assigned to "${r.item_name}" (heat pump) but describes gas boiler repair or hot-water tank work.`;
      } else if (arch === 'plumbing_install' && (mentionsAcuteBreakdown || mentionsGasBoiler || mentionsPipeOrSinkLeak)) {
        mismatchDetail = `Assigned to "${r.item_name}" (plumbing installation) but describes a leak repair or boiler fault.`;
      } else if (arch === 'leak_repair' && (mentionsGasBoiler || /\b(nouveau chauffe-eau|warmwaterboiler|new boiler)\b/i.test(bodyLower)) && !mentionsPipeOrSinkLeak) {
        mismatchDetail = `Assigned to "${r.item_name}" (water leak repair) but describes boiler/heating equipment.`;
      } else if (arch === 'water_heater' && (mentionsAcuteBreakdown || mentionsPipeOrSinkLeak) && !/\b(hot water|eau chaude|warm water|chauffe-eau|water heater|warmwater)\b/i.test(bodyLower)) {
        mismatchDetail = `Assigned to "${r.item_name}" (water heaters) but describes unrelated central heating or sink leak repair.`;
      } else if (arch === 'heating_system' && /\b(annual safety check|annual central heating maintenance|entretien complet pour notre chaudière|onderhoud van onze bulex gaswandketel)\b/i.test(bodyLower) && !/\b(radiator\w*|thermostat\w*)\b/i.test(bodyLower)) {
        mismatchDetail = `Assigned to "${r.item_name}" but specifically describes routine boiler maintenance.`;
      } else if (arch === 'boiler_install' && /\b(water heater|chauffe-eau|warmwaterboiler)\b/i.test(bodyLower) && !/\b(boiler|chaudière|ketel)\b/i.test(bodyLower)) {
        mismatchDetail = `Assigned to "${r.item_name}" (boiler/gas equipment) but describes water heater selection.`;
      } else if (arch === 'boiler_repair' && /\b(replacing an outdated gas boiler|remplacement de notre ancienne chaudière|contrat d'entretien)\b/i.test(bodyLower) && !mentionsAcuteBreakdown) {
        mismatchDetail = `Assigned to "${r.item_name}" (boiler repair) but describes full boiler replacement or maintenance contract.`;
      }

      if (mismatchDetail) {
        incorrectServiceCount += 1;
        const suggestedSlug = inferBestMatchingOfferingSlug(combined, validOfferings, options.adaptedPack);
        addIssue({
          reviewId: r.id,
          type: 'incorrect_service',
          severity: 'critical',
          detail: mismatchDetail,
          suggestedSlug,
        });
      }
    }
  }

  const uniqueEmailCount = byEmail.size;
  const duplicateEmailCount = Math.max(0, reviews.length - uniqueEmailCount);

  // ---------- Mandatory 100-Point Weighted Quality-Control Scoring ----------
  const n = Math.max(1, reviews.length);
  const clamp100 = (val: number) => Math.max(0, Math.min(100, Math.round(val)));
  const to10 = (val100: number) => Math.round((val100 / 10) * 10) / 10;

  const verifiedCount = reviews.length - unverifiedSourceCount;
  const verifiedRatio = reviews.length > 0 ? verifiedCount / reviews.length : 0;

  // 1. Source Authenticity & Verification (30%):
  // Missing source verification MUST prevent high score & publication approval!
  const fabricationPenalties = (offDomainCount + artificialTypoCount * 0.5) / n;
  const sourceAuthenticity100 =
    reviews.length === 0
      ? 0
      : clamp100(verifiedRatio * 100 - fabricationPenalties * 60);

  // 2. Content Originality (20%):
  const origPenaltyRatio =
    (exactDuplicateCount * 2.2 +
      nearDuplicateCount * 1.4 +
      repeatedIds.size * 1.5 +
      repeatedOpeningCount * 0.75 +
      repeatedClosingCount * 0.65 +
      companyStuffingCount * 0.8) /
    n;
  const originality100 = reviews.length === 0 ? 0 : clamp100(100 - origPenaltyRatio * 68);

  // 3. Natural Language Quality (15%):
  const langQualPenaltyRatio =
    (brokenGrammarCount * 1.8 + marketingPhraseCount * 1.1 + artificialTypoCount * 1.2) / n;
  const naturalLanguage100 = reviews.length === 0 ? 0 : clamp100(100 - langQualPenaltyRatio * 72);

  // 4. Service Relevance & Accuracy (15%):
  const servicePenaltyRatio =
    (insertedHeadingCount * 2.5 +
      incorrectServiceCount * 2.0 +
      mechanicalInsertionCount * 1.6 +
      offDomainCount * 2.0) /
    n;
  const serviceRelevance100 = reviews.length === 0 ? 0 : clamp100(100 - servicePenaltyRatio * 75);

  // 5. Data Consistency (10%):
  const consistencyPenaltyRatio =
    (duplicateEmailCount * 1.3 +
      repeatDateIssues * 1.8 +
      futureDateCount * 2.0 +
      ratingMismatchCount * 2.0) /
    n;
  const dataConsistency100 = reviews.length === 0 ? 0 : clamp100(100 - consistencyPenaltyRatio * 75);

  // 6. Multilingual Quality (10%):
  const multiPenaltyRatio =
    (mixedLanguageServiceCount * 2.2 +
      languageMismatchCount * 2.2 +
      regionalMismatchCount * 0.7) /
    n;
  const multilingual100 = reviews.length === 0 ? 0 : clamp100(100 - multiPenaltyRatio * 75);

  const weightedTotal100 = clamp100(
    sourceAuthenticity100 * 0.3 +
      originality100 * 0.2 +
      naturalLanguage100 * 0.15 +
      serviceRelevance100 * 0.15 +
      dataConsistency100 * 0.1 +
      multilingual100 * 0.1
  );

  // Content Readiness evaluates text/service/consistency quality (the 70% non-manual portion normalized to 100)
  const contentReadiness100 = clamp100(
    (originality100 * 0.2 +
      naturalLanguage100 * 0.15 +
      serviceRelevance100 * 0.15 +
      dataConsistency100 * 0.1 +
      multilingual100 * 0.1) /
      0.7
  );

  const mandatoryGates: MandatoryGatesStatus = {
    zeroExactDuplicates: exactDuplicateCount === 0,
    zeroHeadingServices: insertedHeadingCount === 0,
    zeroMixedLanguageLabels: mixedLanguageServiceCount === 0 && languageMismatchCount === 0,
    zeroFabricatedOrOffDomain: offDomainCount === 0 && brokenGrammarCount === 0,
    allServicesVerifiedOrFlagged: incorrectServiceCount === 0 && mechanicalInsertionCount === 0,
    allUnsupportedExcludedAndVerified: reviews.length > 0 && unverifiedSourceCount === 0 && ratingMismatchCount === 0,
    allPassed: false,
  };
  mandatoryGates.allPassed =
    mandatoryGates.zeroExactDuplicates &&
    mandatoryGates.zeroHeadingServices &&
    mandatoryGates.zeroMixedLanguageLabels &&
    mandatoryGates.zeroFabricatedOrOffDomain &&
    mandatoryGates.allServicesVerifiedOrFlagged &&
    mandatoryGates.allUnsupportedExcludedAndVerified;

  const blockingReasons: string[] = [];
  if (reviews.length === 0) blockingReasons.push('Dataset is empty.');
  if (!mandatoryGates.zeroExactDuplicates)
    blockingReasons.push(`${exactDuplicateCount} exact duplicate review(s) must be removed.`);
  if (!mandatoryGates.zeroHeadingServices)
    blockingReasons.push(`${insertedHeadingCount} row(s) use website headings/CTAs instead of real services.`);
  if (!mandatoryGates.zeroMixedLanguageLabels)
    blockingReasons.push(`${mixedLanguageServiceCount + languageMismatchCount} row(s) contain mixed-language service labels or language mismatches.`);
  if (!mandatoryGates.zeroFabricatedOrOffDomain)
    blockingReasons.push(`${offDomainCount + brokenGrammarCount} row(s) have off-domain wording or broken template grammar.`);
  if (!mandatoryGates.allServicesVerifiedOrFlagged)
    blockingReasons.push(`${incorrectServiceCount + mechanicalInsertionCount} row(s) have mismatched or mechanically inserted service assignments.`);
  if (ratingMismatchCount > 0)
    blockingReasons.push(`${ratingMismatchCount} row(s) have rating-vs-text inconsistencies requiring review.`);
  if (unverifiedSourceCount > 0)
    blockingReasons.push(`${unverifiedSourceCount} row(s) lack source verification (verify against customer records or exclude unverified rows).`);
  if (weightedTotal100 < 90 && blockingReasons.length === 0)
    blockingReasons.push(`Overall QC score (${weightedTotal100}/100) is below the mandatory 90/100 threshold.`);

  const publicationApproved =
    reviews.length > 0 && mandatoryGates.allPassed && weightedTotal100 >= 90;

  const serviceCat100 = clamp100(
    100 - ((insertedHeadingCount * 3 + incorrectServiceCount * 2.2) / n) * 80
  );
  const techRelevance100 = clamp100((serviceRelevance100 * 0.65 + multilingual100 * 0.35));

  const criticalReviewIds: string[] = [];
  for (const [id, list] of Object.entries(issuesByReviewId)) {
    if (list.some((iss) => iss.severity === 'critical' && iss.type !== 'unverified_source')) {
      criticalReviewIds.push(id);
    }
  }

  // Flagged review IDs (excluding pure `unverified_source` so content-clean rows can be distinguished from content-broken rows!)
  const contentFlaggedReviewIds = Object.keys(issuesByReviewId).filter((id) =>
    issuesByReviewId[id].some((iss) => iss.type !== 'unverified_source')
  );

  return {
    totalReviews: reviews.length,
    uniqueEmailCount,
    duplicateEmailCount,
    exactDuplicateCount,
    nearDuplicateCount,
    repeatedOpeningCount,
    repeatedClosingCount,
    insertedHeadingCount,
    mechanicalInsertionCount,
    repeatedSentenceCount: repeatedIds.size,
    companyStuffingCount,
    brokenGrammarCount,
    artificialTypoCount,
    mixedLanguageServiceCount,
    languageMismatchCount,
    regionalMismatchCount,
    marketingPhraseCount,
    incorrectServiceCount,
    ratingMismatchCount,
    repeatReviewerCount,
    repeatDateIssues,
    futureDateCount,
    offDomainCount,
    unverifiedSourceCount,
    criticalReviewIds,
    flaggedReviewIds: contentFlaggedReviewIds,
    issuesByReviewId,
    scorecard: {
      weightedTotal100,
      contentReadiness100,
      sourceAuthenticity100,
      originality100,
      naturalLanguage100,
      serviceRelevance100,
      dataConsistency100,
      multilingual100,
      rubric10: {
        naturalLanguage: to10(naturalLanguage100),
        originality: to10(originality100),
        technicalRelevance: to10(techRelevance100),
        serviceCategorization: to10(serviceCat100),
        overallQuality: to10(verifiedCount > 0 ? weightedTotal100 : contentReadiness100),
      },
      mandatoryGates,
      publicationApproved,
      blockingReasons,
    },
  };
}
