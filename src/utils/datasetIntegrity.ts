import { GeneratedReview } from '../types/reviews';

export interface IntegrityIssue {
  reviewId: string;
  type: 'repeated_sentence' | 'repeat_reviewer_date' | 'marketing_phrase' | 'off_domain' | 'future_date';
  detail: string;
}

export interface DatasetIntegrityReport {
  totalReviews: number;
  uniqueEmailCount: number;
  duplicateEmailCount: number;
  repeatedSentenceCount: number;
  repeatReviewerCount: number;
  repeatDateIssues: number;
  futureDateCount: number;
  marketingPhraseCount: number;
  offDomainCount: number;
  issuesByReviewId: Record<string, IntegrityIssue[]>;
}

const MARKETING_EXPRESSIONS =
  /\b(worth every penny|exceeded expectations|game[- ]changer|top[- ]tier|stress[- ]free experience|genuine peace of mind|real sense of service|un vrai sens du détail|absolute aanrader|five stars easily|beyond expectations|second to none|world[- ]class|unmatched quality)\b/i;

const ECOM_WORDS_ON_SERVICE =
  /\b(shipping|packaging|arrived in the mail|box arrived|listing photos|emballage|colis|cet article|dit artikel|een cadeau|swap variant|ordered a second one)\b/i;

const SERVICE_HINT =
  /\b(repair|plumb|plombier|loodgieter|boiler|heating|leak|emergency|install|maintenance|clinic|dental|salon|agency|clean|electric|service)\b/i;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter((s) => s.length >= 28);
}

/**
 * Fast, deterministic dataset QA audit covering:
 * - Repeated stories / sentences across reviews
 * - Repeat reviewer emails & intervention date spacing / same-service duplicates
 * - Future intervention dates
 * - Marketing expressions replacing plain customer language
 * - Off-domain e-commerce wording on service businesses
 */
export function runDatasetIntegrityAudit(reviews: GeneratedReview[]): DatasetIntegrityReport {
  const issuesByReviewId: Record<string, IntegrityIssue[]> = {};
  const addIssue = (issue: IntegrityIssue) => {
    if (!issuesByReviewId[issue.reviewId]) issuesByReviewId[issue.reviewId] = [];
    issuesByReviewId[issue.reviewId].push(issue);
  };

  // 1. Repeated sentences across different reviews
  const sentenceSeen = new Map<string, string[]>();
  for (const r of reviews) {
    for (const s of splitSentences(r.body)) {
      const list = sentenceSeen.get(s) || [];
      list.push(r.id);
      sentenceSeen.set(s, list);
    }
  }
  const repeatedReviewIds = new Set<string>();
  for (const [sent, ids] of sentenceSeen.entries()) {
    if (ids.length > 1) {
      for (const id of ids.slice(1)) {
        repeatedReviewIds.add(id);
        addIssue({
          reviewId: id,
          type: 'repeated_sentence',
          detail: `Repeated sentence used ${ids.length}× ("${sent.slice(0, 52)}…")`,
        });
      }
    }
  }

  // 2. Repeat reviewers & intervention dates
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
          detail: `Same reviewer (${cur.reviewer_email}) reviewed "${cur.item_name}" twice.`,
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
            detail: `Repeat reviewer interventions only ${gapDays}d apart (${sorted[i - 1].review_date} → ${cur.review_date}).`,
          });
        }
      }
    }
  }

  // 3. Marketing expressions & off-domain wording
  let marketingPhraseCount = 0;
  let offDomainCount = 0;
  const isLikelyService =
    reviews.filter((r) => SERVICE_HINT.test(`${r.item_name} ${r.category}`)).length >=
    Math.max(1, reviews.length * 0.25);

  for (const r of reviews) {
    const combined = `${r.subject} ${r.body}`;
    const mkt = combined.match(MARKETING_EXPRESSIONS);
    if (mkt) {
      marketingPhraseCount += 1;
      addIssue({
        reviewId: r.id,
        type: 'marketing_phrase',
        detail: `Contains marketing expression "${mkt[0]}" — prefer plain customer language.`,
      });
    }
    if (isLikelyService) {
      const ecom = combined.match(ECOM_WORDS_ON_SERVICE);
      if (ecom) {
        offDomainCount += 1;
        addIssue({
          reviewId: r.id,
          type: 'off_domain',
          detail: `Uses e-commerce wording "${ecom[0]}" on a service review.`,
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
    repeatedSentenceCount: repeatedReviewIds.size,
    repeatReviewerCount,
    repeatDateIssues,
    futureDateCount,
    marketingPhraseCount,
    offDomainCount,
    issuesByReviewId,
  };
}
