import { GeneratedReview } from '../types/reviews';

export type IntegrityIssueType =
  | 'inserted_heading'
  | 'repeated_sentence'
  | 'broken_grammar'
  | 'mixed_language_service'
  | 'marketing_phrase'
  | 'incorrect_service'
  | 'repeat_reviewer_date'
  | 'future_date'
  | 'off_domain';

export interface IntegrityIssue {
  reviewId: string;
  type: IntegrityIssueType;
  detail: string;
}

export interface DatasetIntegrityReport {
  totalReviews: number;
  uniqueEmailCount: number;
  duplicateEmailCount: number;
  insertedHeadingCount: number;
  repeatedSentenceCount: number;
  brokenGrammarCount: number;
  mixedLanguageServiceCount: number;
  marketingPhraseCount: number;
  incorrectServiceCount: number;
  repeatReviewerCount: number;
  repeatDateIssues: number;
  futureDateCount: number;
  offDomainCount: number;
  flaggedReviewIds: string[];
  issuesByReviewId: Record<string, IntegrityIssue[]>;
}

const HEADING_OR_JUNK_ITEM =
  /^(services?|our services|service areas?|solutions?|about .+|your .+|clear .+|advice .+|why .+|how .+|brussel|brussels|gent|ghent|antwerp|antwerpen|paris|london|contact|faq|reviews?|customer reviews?)$/i;

const MARKETING_EXPRESSIONS =
  /\b(worth every penny|exceeded expectations|game[- ]changer|top[- ]tier|stress[- ]free experience|genuine peace of mind|real sense of service|un vrai sens du détail|absolute aanrader|five stars easily|beyond expectations|second to none|world[- ]class|unmatched quality|highly recommended to everyone|best in the business|100% satisfied)\b/i;

const ECOM_WORDS_ON_SERVICE =
  /\b(shipping|packaging|arrived in the mail|box arrived|listing photos|emballage|colis|cet article|dit artikel|een cadeau|swap variant|ordered a second one|unboxing|tracking updates)\b/i;

const SERVICE_HINT =
  /\b(repair|plumb|plombier|loodgieter|boiler|heating|leak|emergency|install|maintenance|clinic|dental|salon|agency|clean|electric|service)\b/i;

const ENGLISH_SERVICE_WORDS =
  /\b(boiler repair|water leak|plumbing installation|emergency service|our services|service areas|gas boilers|heat pumps|water heaters|hot water)\b/i;

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
    .filter((s) => s.length >= 24);
}

/**
 * Strict deterministic audit against genuine customer feedback standards:
 * - Automatically inserted website headings / slogans / city names
 * - Repeated sentence templates (even across different services)
 * - Broken grammar / unreplaced placeholders / duplicated words
 * - Mixed-language service names pasted into non-English reviews
 * - Promotional / marketing wording
 * - Incorrect service-to-text assignments & off-domain e-commerce wording
 * - Duplicate reviewer emails, same-service repeats & intervention date spacing
 */
export function runDatasetIntegrityAudit(reviews: GeneratedReview[]): DatasetIntegrityReport {
  const issuesByReviewId: Record<string, IntegrityIssue[]> = {};
  const addIssue = (issue: IntegrityIssue) => {
    if (!issuesByReviewId[issue.reviewId]) issuesByReviewId[issue.reviewId] = [];
    issuesByReviewId[issue.reviewId].push(issue);
  };

  // 1. Repeated sentence templates (normalized by replacing item_name with [item])
  const templateSeen = new Map<string, string[]>();
  for (const r of reviews) {
    for (const s of splitSentences(r.body)) {
      const key = normalizeTemplateSentence(s, r.item_name);
      const list = templateSeen.get(key) || [];
      list.push(r.id);
      templateSeen.set(key, list);
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
          detail: `Repeated sentence template (${ids.length}×): "${tpl.slice(0, 50)}…"`,
        });
      }
    }
  }

  // 2. Duplicate reviewers & intervention dates
  const byEmail = new Map<string, GeneratedReview[]>();
  const todayIso = new Date().toISOString().split('T')[0];
  let futureDateCount = 0;

  for (const r of reviews) {
    if (r.review_date > todayIso) {
      futureDateCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'future_date',
        detail: `Intervention date ${r.review_date} is in the future.`,
      });
    }
    const key = r.reviewer_email.trim().toLowerCase();
    const list = byEmail.get(key) || [];
    list.push(r);
    byEmail.set(key, list);
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
      if (seenSlugs.has(cur.item_slug)) {
        repeatDateIssues += 1;
        addIssue({
          reviewId: cur.id,
          type: 'repeat_reviewer_date',
          detail: `Duplicate reviewer (${cur.reviewer_email}) assigned to "${cur.item_name}" twice.`,
        });
      }
      seenSlugs.add(cur.item_slug);
      if (i > 0) {
        const prevMs = Date.parse(sorted[i - 1].review_date);
        const curMs = Date.parse(cur.review_date);
        const gapDays = Math.round((curMs - prevMs) / 86400000);
        if (!Number.isNaN(gapDays) && gapDays < 14) {
          repeatDateIssues += 1;
          addIssue({
            reviewId: cur.id,
            type: 'repeat_reviewer_date',
            detail: `Repeat reviewer dates too close (${gapDays}d: ${sorted[i - 1].review_date} → ${cur.review_date}).`,
          });
        }
      }
    }
  }

  // 3. Per-review content, heading, grammar, language-mixing, marketing & service-assignment checks
  let insertedHeadingCount = 0;
  let brokenGrammarCount = 0;
  let mixedLanguageServiceCount = 0;
  let marketingPhraseCount = 0;
  let incorrectServiceCount = 0;
  let offDomainCount = 0;

  const isLikelyService =
    reviews.filter((r) => SERVICE_HINT.test(`${r.item_name} ${r.category}`)).length >=
    Math.max(1, reviews.length * 0.25);

  for (const r of reviews) {
    const combined = `${r.subject} ${r.body}`;
    const itemWords = r.item_name.trim().split(/\s+/).filter(Boolean);

    // Automatically inserted website heading / city / nav label
    if (HEADING_OR_JUNK_ITEM.test(r.item_name.trim()) || itemWords.length > 6 || r.item_name.includes(':')) {
      insertedHeadingCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'inserted_heading',
        detail: `Auto-inserted website heading/nav label used as service: "${r.item_name}".`,
      });
    }

    // Broken grammar / unreplaced template tokens / duplicated consecutive words
    const hasPlaceholder = /\{[a-zA-Z0-9_]+\}/.test(combined);
    const hasDupWord = /\b([a-zA-Z]{2,})\s+\1\b/i.test(combined);
    const hasBadPunct = /\s[,.!?]|[.!?][A-Za-zÀ-ÿ]/.test(r.body);
    if (hasPlaceholder || hasDupWord || hasBadPunct) {
      brokenGrammarCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'broken_grammar',
        detail: hasPlaceholder
          ? 'Unreplaced template placeholder found in review text.'
          : hasDupWord
          ? 'Repeated consecutive word (broken grammar).'
          : 'Malformed spacing or punctuation splice.',
      });
    }

    // Mixed-language service name inside non-English review
    if (r.language !== 'en' && ENGLISH_SERVICE_WORDS.test(r.item_name) && combined.toLowerCase().includes(r.item_name.toLowerCase())) {
      mixedLanguageServiceCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'mixed_language_service',
        detail: `Untranslated English service name "${r.item_name}" mixed into ${r.language.toUpperCase()} review.`,
      });
    }

    // Promotional / marketing wording
    const mkt = combined.match(MARKETING_EXPRESSIONS);
    if (mkt) {
      marketingPhraseCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'marketing_phrase',
        detail: `Promotional wording "${mkt[0]}" — prefer plain original customer language.`,
      });
    }

    // Off-domain e-commerce wording on service business
    if (isLikelyService) {
      const ecom = combined.match(ECOM_WORDS_ON_SERVICE);
      if (ecom) {
        offDomainCount += 1;
        addIssue({
          reviewId: r.id,
          type: 'off_domain',
          detail: `Off-domain e-commerce wording "${ecom[0]}" on a service review.`,
        });
      }

      // Cross-trade service assignment mismatch (e.g., boiler text on a leak-only service or vice versa)
      const itemLower = `${r.item_name} ${r.item_slug}`.toLowerCase();
      const bodyLower = r.body.toLowerCase();
      const itemIsLeakOnly = /leak|lek|fuite|drain|toilet|sink/.test(itemLower) && !/boiler|heat|ketel|chaudière/.test(itemLower);
      const itemIsBoilerOnly = /boiler|ketel|chaudière|heat pump/.test(itemLower) && !/leak|lek|fuite|toilet|sink/.test(itemLower);
      if (
        (itemIsLeakOnly && /\b(boiler|chaudière|ketel|radiator|expansievat)\b/.test(bodyLower)) ||
        (itemIsBoilerOnly && /\b(toilet|gootsteen|kitchen sink|évier)\b/.test(bodyLower))
      ) {
        incorrectServiceCount += 1;
        addIssue({
          reviewId: r.id,
          type: 'incorrect_service',
          detail: `Review mentions a different trade/problem than assigned service "${r.item_name}".`,
        });
      }
    }
  }

  const uniqueEmailCount = byEmail.size;
  const duplicateEmailCount = Math.max(0, reviews.length - uniqueEmailCount);

  return {
    totalReviews: reviews.length,
    uniqueEmailCount,
    duplicateEmailCount,
    insertedHeadingCount,
    repeatedSentenceCount: repeatedIds.size,
    brokenGrammarCount,
    mixedLanguageServiceCount,
    marketingPhraseCount,
    incorrectServiceCount,
    repeatReviewerCount,
    repeatDateIssues,
    futureDateCount,
    offDomainCount,
    flaggedReviewIds: Object.keys(issuesByReviewId),
    issuesByReviewId,
  };
}
