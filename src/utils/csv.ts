import {
  CatalogFormat,
  CatalogProduct,
  ExportFormat,
  GeneratedReview,
  ReviewLanguage,
} from '../types/reviews';
import {
  DatasetIntegrityReport,
  detectTextLanguageHeuristic,
  QualityScorecard,
} from './datasetIntegrity';

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function slugifyProductName(value: string, fallbackIndex: number): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `product-${fallbackIndex}`;
}

const BRAND_AND_MODEL_REPLACEMENTS: [RegExp, string][] = [
  [/\bhuawei\b/gi, 'HUAWEI'],
  [/\bmatepad\b/gi, 'MatePad'],
  [/\bfreebuds\b/gi, 'FreeBuds'],
  [/\bfreeclip\b/gi, 'FreeClip'],
  [/\bm-pencil\b/gi, 'M-Pencil'],
  [/\bipad\b/gi, 'iPad'],
  [/\biphone\b/gi, 'iPhone'],
  [/\bairpods\b/gi, 'AirPods'],
  [/\bmacbook\b/gi, 'MacBook'],
  [/\busb-c\b/gi, 'USB-C'],
  [/\busb\b/gi, 'USB'],
  [/\bgt(\d+)\b/gi, 'GT $1'],
  [/\bse(\d+)\b/gi, 'SE $1'],
  [/\b(\d+)\s+5\b/g, '$1.5'],
  [/\b(\d+)\s+x\b/gi, '$1 X'],
  [/\b(\d+)i\b/gi, '$1i'],
  [/\b4k\b/gi, '4K'],
  [/\bhdr\b/gi, 'HDR'],
  [/\banc\b/gi, 'ANC'],
  [/\bspf\b/gi, 'SPF'],
  [/\biptv\b/gi, 'IPTV'],
  [/\bm3u\b/gi, 'M3U'],
  [/\bpro\b/gi, 'Pro'],
];

/**
 * Converts a URL handle like "huawei-watch-fit-5-pro-freeclip-2-bundle"
 * into a crisp, human-readable product title like "HUAWEI Watch Fit 5 Pro FreeClip 2 Bundle".
 */
export function humanizeProductHandle(handle: string): string {
  const cleaned = handle
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\?.*$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (!cleaned) return handle;

  // Preserve decimal patterns like "11 5" -> "11.5" when preceded by matepad/tab/ipad/screen
  let titled = cleaned
    .split(' ')
    .map((word) => {
      if (/^[a-z]{1,2}\d+$/i.test(word)) return word.toUpperCase();
      if (/^\d+[a-z]$/i.test(word)) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  // Restore M-Pencil hyphenation before regex pass
  titled = titled.replace(/\bM Pencil\b/gi, 'M-Pencil');
  titled = titled.replace(/\bUsb C\b/gi, 'USB-C');

  for (const [pattern, replacement] of BRAND_AND_MODEL_REPLACEMENTS) {
    titled = titled.replace(pattern, replacement);
  }

  return titled.trim();
}

/**
 * Infers a clean category from product title/handle when the CSV has no category column
 * (e.g., Judge.me blank review templates).
 */
export function inferCategoryFromHandleOrName(name: string, slug: string): string {
  const hay = `${name} ${slug}`.toLowerCase();

  if (/\b(bundle|combo|pack|kit|duo)\b/.test(hay)) return 'Bundles';
  if (/\b(watch|smartwatch|gt\s*\d|watch-fit)\b/.test(hay)) return 'Smartwatches';
  if (/\b(band|tracker|bracelet)\b/.test(hay)) return 'Fitness Bands';
  if (/\b(freebuds|freeclip|earbud|headphone|airpod|earphone|speaker|audio|mic)\b/.test(hay)) {
    return 'Audio & Earbuds';
  }
  if (/\b(matepad|ipad|tablet|tab\b)\b/.test(hay)) return 'Tablets';
  if (/\b(pencil|stylus|charger|cable|hub|dock|keyboard|mouse|case|strap|cover)\b/.test(hay)) {
    return 'Accessories';
  }
  if (/\b(phone|iphone|smartphone|nova|pura|mate\s*\d|galaxy|pixel)\b/.test(hay)) {
    return 'Smartphones';
  }
  if (/\b(serum|cream|cleanser|spf|mask|oil|lotion|moisturizer|balm|toner)\b/.test(hay)) {
    return 'Skincare';
  }
  if (/\b(sneaker|shoe|runner|trainer|boot|sandal|loafer)\b/.test(hay)) {
    return 'Footwear';
  }
  if (/\b(hoodie|tee|shirt|jacket|coat|jean|trouser|pant|dress|sweater)\b/.test(hay)) {
    return 'Apparel';
  }
  if (/\b(coffee|espresso|roast|bean|kettle|grinder|dripper|decaf)\b/.test(hay)) {
    return 'Coffee & Gear';
  }
  if (/\b(iptv|m3u|xtream|smarters|ibo\s*player|atlas\s*pro)\b/.test(hay)) {
    return 'IPTV Subscriptions';
  }

  return 'General';
}

function extractHandleFromUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  } catch {
    const cleaned = url.split('?')[0].replace(/\/+$/, '');
    const parts = cleaned.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }
}

function extractStoreBaseUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const idx = parsed.pathname.lastIndexOf('/');
    const basePath = idx > 0 ? parsed.pathname.slice(0, idx) : '/products';
    return `${parsed.origin}${basePath}`;
  } catch {
    return '';
  }
}

function extractBusinessHintFromFilename(filename?: string): string {
  if (!filename) return '';
  const base = filename
    .replace(/\.csv$/i, '')
    .replace(/_[0-9a-f]{6,}$/i, '')
    .replace(/judge[-_.\s]*me/gi, '')
    .replace(/reviews?|products?|export|catalog|template|shopify/gi, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return base;
}

export interface ParsedCatalogResult {
  products: CatalogProduct[];
  importedReviews: GeneratedReview[];
  detectedFormat: CatalogFormat;
  detectedStoreBaseUrl: string;
  detectedBusinessHint: string;
  errors: string[];
}

const ID_HEADERS = new Set(['item_id', 'id', 'product_id', 'sku', 'variant_sku', 'code']);
const SLUG_HEADERS = new Set([
  'item_slug',
  'slug',
  'handle',
  'product_handle',
  'url_handle',
  'permalink',
]);
const NAME_HEADERS = new Set([
  'item_name',
  'name',
  'title',
  'product_name',
  'product',
  'product_title',
  'item',
  'service_name',
]);
const CATEGORY_HEADERS = new Set([
  'category',
  'categories',
  'product_category',
  'type',
  'product_type',
  'collection',
  'department',
  'group',
]);
const URL_HEADERS = new Set(['product_url', 'url', 'link', 'product_link']);
const PICTURE_HEADERS = new Set(['picture_urls', 'image_src', 'image_url']);

export function parseCatalogCSV(rawText: string, filename?: string): ParsedCatalogResult {
  const cleanText = rawText.replace(/^\uFEFF/, '').trim();
  const detectedBusinessHint = extractBusinessHintFromFilename(filename);

  if (!cleanText) {
    return {
      products: [],
      importedReviews: [],
      detectedFormat: 'standard',
      detectedStoreBaseUrl: '',
      detectedBusinessHint,
      errors: ['CSV content is empty.'],
    };
  }

  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      products: [],
      importedReviews: [],
      detectedFormat: 'standard',
      detectedStoreBaseUrl: '',
      detectedBusinessHint,
      errors: ['CSV content is empty.'],
    };
  }

  const firstRowCols = parseCSVLine(lines[0]);
  const normalizedHeaders = firstRowCols.map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  );
  const headerSet = new Set(normalizedHeaders);

  const isJudgeMe =
    headerSet.has('product_handle') ||
    (headerSet.has('product_url') &&
      (headerSet.has('reviewer_email') ||
        headerSet.has('rating') ||
        headerSet.has('review_date')));

  const isShopifyExport =
    !isJudgeMe &&
    headerSet.has('handle') &&
    headerSet.has('title') &&
    (headerSet.has('vendor') ||
      headerSet.has('variant_sku') ||
      headerSet.has('variant_price') ||
      headerSet.has('product_category') ||
      headerSet.has('type'));

  const detectedFormat: CatalogFormat = isJudgeMe
    ? 'judge_me'
    : isShopifyExport
      ? 'shopify'
      : 'standard';

  const idIdx = normalizedHeaders.findIndex((h) => ID_HEADERS.has(h));
  const slugIdx = normalizedHeaders.findIndex((h) => SLUG_HEADERS.has(h));
  // CRITICAL: In Judge.me review CSVs, "title" is the REVIEW title (empty on template rows), NOT product name
  const nameIdx = isJudgeMe
    ? normalizedHeaders.findIndex((h) => h === 'product_name' || h === 'item_name')
    : normalizedHeaders.findIndex((h) => NAME_HEADERS.has(h));
  const catIdx = normalizedHeaders.findIndex((h) => CATEGORY_HEADERS.has(h));
  const urlIdx = normalizedHeaders.findIndex((h) => URL_HEADERS.has(h));
  const picIdx = normalizedHeaders.findIndex((h) => PICTURE_HEADERS.has(h));

  // Optional existing-review columns (so uploading an existing review CSV preserves ALL reviews for audit & AI remediation!)
  const reviewBodyIdx = normalizedHeaders.findIndex((h) =>
    ['body', 'review_body', 'review', 'comment', 'content', 'feedback', 'text'].includes(h)
  );
  const reviewSubjectIdx = normalizedHeaders.findIndex((h) =>
    isJudgeMe
      ? h === 'title' || h === 'subject' || h === 'review_title'
      : ['subject', 'review_title', 'headline'].includes(h)
  );
  const reviewStarsIdx = normalizedHeaders.findIndex((h) =>
    ['stars', 'rating', 'score', 'star_rating'].includes(h)
  );
  const reviewerEmailIdx = normalizedHeaders.findIndex((h) =>
    ['reviewer_email', 'email', 'customer_email', 'author_email'].includes(h)
  );
  const reviewerNameIdx = normalizedHeaders.findIndex((h) =>
    ['reviewer_name', 'customer_name', 'author', 'reviewer'].includes(h)
  );
  const reviewDateIdx = normalizedHeaders.findIndex((h) =>
    ['review_date', 'date', 'created_at', 'submitted_at', 'timestamp'].includes(h)
  );
  const reviewLangIdx = normalizedHeaders.findIndex((h) =>
    ['language', 'lang', 'locale'].includes(h)
  );

  const hasRecognizedHeader =
    isJudgeMe ||
    isShopifyExport ||
    idIdx !== -1 ||
    slugIdx !== -1 ||
    nameIdx !== -1 ||
    catIdx !== -1 ||
    urlIdx !== -1;

  const startRow = hasRecognizedHeader ? 1 : 0;

  let resolvedIdIdx = idIdx;
  let resolvedSlugIdx = slugIdx;
  let resolvedNameIdx = nameIdx;
  let resolvedCatIdx = catIdx;

  if (!hasRecognizedHeader) {
    const colCount = firstRowCols.length;
    if (colCount >= 4) {
      resolvedIdIdx = 0;
      resolvedSlugIdx = 1;
      resolvedNameIdx = 2;
      resolvedCatIdx = 3;
    } else if (colCount === 3) {
      resolvedIdIdx = 0;
      resolvedNameIdx = 1;
      resolvedCatIdx = 2;
    } else if (colCount === 2) {
      resolvedNameIdx = 0;
      resolvedCatIdx = 1;
    } else {
      resolvedNameIdx = 0;
    }
  } else if (resolvedNameIdx === -1 && !isJudgeMe) {
    if (resolvedSlugIdx !== -1) {
      resolvedNameIdx = resolvedSlugIdx;
    } else {
      const used = new Set([resolvedIdIdx, resolvedCatIdx, urlIdx, picIdx]);
      const unusedIdx = normalizedHeaders.findIndex((_, idx) => !used.has(idx));
      resolvedNameIdx = unusedIdx !== -1 ? unusedIdx : 0;
    }
  }

  const products: CatalogProduct[] = [];
  const importedReviews: GeneratedReview[] = [];
  const seen = new Set<string>();
  const errors: string[] = [];
  let detectedStoreBaseUrl = '';

  for (let i = startRow; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.every((c) => c === '')) continue;

    const rawUrl = (urlIdx !== -1 ? cols[urlIdx] : '') || '';
    const rawPic = (picIdx !== -1 ? cols[picIdx] : '') || '';
    const rawSlug =
      (resolvedSlugIdx !== -1 ? cols[resolvedSlugIdx] : '') ||
      extractHandleFromUrl(rawUrl);
    const rawId = (resolvedIdIdx !== -1 ? cols[resolvedIdIdx] : '') || '';
    const rawName = (resolvedNameIdx !== -1 ? cols[resolvedNameIdx] : '') || '';
    const rawCat = (resolvedCatIdx !== -1 ? cols[resolvedCatIdx] : '') || '';

    if (!detectedStoreBaseUrl && rawUrl) {
      detectedStoreBaseUrl = extractStoreBaseUrl(rawUrl);
    }

    const item_name = rawName.trim()
      ? rawName.trim()
      : rawSlug.trim()
        ? humanizeProductHandle(rawSlug.trim())
        : '';

    if (!item_name) continue;

    const cleanCat = rawCat
      .split(',')[0]
      .split('>')[0]
      .trim();
    const fallbackNumber = products.length + 1;
    const item_id = rawId.trim() || String(fallbackNumber);
    const item_slug = rawSlug.trim() || slugifyProductName(item_name, fallbackNumber);
    const category = cleanCat || inferCategoryFromHandleOrName(item_name, item_slug);

    // Check if this CSV row also carries an existing customer review
    const rawBody = reviewBodyIdx !== -1 ? (cols[reviewBodyIdx] || '').trim() : '';
    const rawStarsStr = reviewStarsIdx !== -1 ? (cols[reviewStarsIdx] || '').trim() : '';
    if (rawBody.length > 0) {
      const parsedStars = Math.max(1, Math.min(5, Math.round(Number(rawStarsStr) || 5)));
      const rawSubj = reviewSubjectIdx !== -1 ? (cols[reviewSubjectIdx] || '').trim() : '';
      const rawEmail = reviewerEmailIdx !== -1 ? (cols[reviewerEmailIdx] || '').trim() : '';
      const rawReviewerName =
        reviewerNameIdx !== -1 && cols[reviewerNameIdx]?.trim()
          ? cols[reviewerNameIdx].trim()
          : rawEmail.includes('@')
            ? rawEmail
                .split('@')[0]
                .replace(/[._0-9]+/g, ' ')
                .trim()
                .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Customer'
            : 'Customer';
      const rawDateField = reviewDateIdx !== -1 ? (cols[reviewDateIdx] || '').trim() : '';
      const isoDateMatch = rawDateField.match(/^\d{4}-\d{2}-\d{2}/);
      const reviewDate = isoDateMatch
        ? isoDateMatch[0]
        : new Date().toISOString().split('T')[0];
      const explicitLang = reviewLangIdx !== -1 ? (cols[reviewLangIdx] || '').trim().toLowerCase() : '';
      const guessedLang: ReviewLanguage =
        (['en', 'fr', 'nl', 'de', 'es', 'it', 'pt', 'ar', 'darija_latin'].includes(explicitLang)
          ? (explicitLang as ReviewLanguage)
          : detectTextLanguageHeuristic(`${rawSubj} ${rawBody}`)) || 'en';

      importedReviews.push({
        id: `imported-row-${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
        item_id,
        item_slug,
        item_name,
        category,
        reviewer_name: rawReviewerName,
        reviewer_email: rawEmail || `reviewer.row${i + 1}@example.com`,
        stars: parsedStars,
        subject: rawSubj,
        body: rawBody,
        review_date: reviewDate,
        review_timestamp: rawDateField.includes('UTC') ? rawDateField : `${reviewDate} 12:00:00 UTC`,
        product_url: rawUrl.trim(),
        picture_urls: rawPic.trim(),
        voice: rawBody.split(/\s+/).length <= 12 ? 'minimalist' : 'casual',
        language: guessedLang,
        isReturningCustomer: false,
        sourceOrigin: 'imported_unverified',
        sourceVerified: false,
        originalRowNumber: i + 1,
        originalSnapshot: {
          item_id,
          item_slug,
          item_name,
          category,
          reviewer_name: rawReviewerName,
          reviewer_email: rawEmail,
          stars: parsedStars,
          subject: rawSubj,
          body: rawBody,
          review_date: reviewDate,
        },
        modificationLog: [],
      });
    }

    // Deduplicate Shopify variant rows (same handle) and repeated Judge.me / review product rows
    const dedupeKey = item_slug.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    products.push({
      item_id,
      item_slug,
      item_name,
      category,
      product_url: rawUrl.trim() || undefined,
      picture_urls: rawPic.trim() || undefined,
    });
  }

  // Mark returning customer flag accurately on imported review sets
  if (importedReviews.length > 0) {
    const emailFreq = new Map<string, number>();
    for (const r of importedReviews) {
      const k = r.reviewer_email.trim().toLowerCase();
      emailFreq.set(k, (emailFreq.get(k) || 0) + 1);
    }
    for (const r of importedReviews) {
      r.isReturningCustomer = (emailFreq.get(r.reviewer_email.trim().toLowerCase()) || 0) > 1;
    }
  }

  if (products.length === 0) {
    errors.push(
      'No valid product or review rows found. Upload a Judge.me CSV, Shopify CSV, or review dataset CSV.'
    );
  }

  return {
    products,
    importedReviews,
    detectedFormat,
    detectedStoreBaseUrl,
    detectedBusinessHint,
    errors,
  };
}

function escapeCSVField(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function resolveProductUrl(
  review: Pick<GeneratedReview, 'product_url' | 'item_slug'>,
  storeBaseUrl?: string
): string {
  if (review.product_url && review.product_url.trim()) {
    return review.product_url.trim();
  }
  const base = (storeBaseUrl || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  if (base.endsWith('/products')) {
    return `${base}/${review.item_slug}`;
  }
  return `${base}/products/${review.item_slug}`;
}

export function serializeReviewsToCSV(reviews: GeneratedReview[]): string {
  const header = 'item_id,item_slug,item_name,category,reviewer_email,stars,subject,body,review_date';
  const rows = reviews.map((r) =>
    [
      escapeCSVField(r.item_id),
      escapeCSVField(r.item_slug),
      escapeCSVField(r.item_name),
      escapeCSVField(r.category),
      escapeCSVField(r.reviewer_email),
      r.stars,
      escapeCSVField(r.subject),
      escapeCSVField(r.body),
      escapeCSVField(r.review_date),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Exact 10-column Judge.me Shopify CSV import schema:
 * title,body,rating,review_date,reviewer_name,reviewer_email,product_url,picture_urls,product_id,product_handle
 */
export function serializeReviewsToJudgeMeCSV(
  reviews: GeneratedReview[],
  storeBaseUrl?: string
): string {
  const header =
    'title,body,rating,review_date,reviewer_name,reviewer_email,product_url,picture_urls,product_id,product_handle';
  const rows = reviews.map((r) =>
    [
      escapeCSVField(r.subject),
      escapeCSVField(r.body),
      r.stars,
      escapeCSVField(r.review_timestamp || `${r.review_date} 12:00:00 UTC`),
      escapeCSVField(r.reviewer_name),
      escapeCSVField(r.reviewer_email),
      escapeCSVField(resolveProductUrl(r, storeBaseUrl)),
      escapeCSVField(r.picture_urls || ''),
      escapeCSVField(r.item_id),
      escapeCSVField(r.item_slug),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}

function escapeHTML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatStarGlyphs(stars: number): string {
  const clamped = Math.max(1, Math.min(5, Math.round(stars)));
  return '★'.repeat(clamped) + '☆'.repeat(5 - clamped);
}

export function serializeReviewsToMarkdown(
  reviews: GeneratedReview[],
  businessLabel = 'Customer Reviews'
): string {
  const avg =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(2)
      : '0.00';

  const grouped = new Map<string, GeneratedReview[]>();
  for (const r of reviews) {
    const key = `${r.item_name} (${r.category})`;
    const list = grouped.get(key) || [];
    list.push(r);
    grouped.set(key, list);
  }

  const lines: string[] = [
    `# ${businessLabel} — Customer Reviews`,
    '',
    `- **Total Reviews:** ${reviews.length}`,
    `- **Average Rating:** ${avg} / 5.0`,
    `- **Offerings Covered:** ${grouped.size}`,
    '',
    '---',
    '',
  ];

  for (const [groupTitle, items] of grouped.entries()) {
    const groupAvg = (
      items.reduce((s, r) => s + r.stars, 0) / items.length
    ).toFixed(2);
    lines.push(`## ${groupTitle}`);
    lines.push(`*${items.length} review${items.length === 1 ? '' : 's'} · ${groupAvg}★ average*`);
    lines.push('');

    for (const r of items) {
      lines.push(`### ${formatStarGlyphs(r.stars)} (${r.stars}/5) — ${r.subject}`);
      lines.push(`> ${r.body}`);
      lines.push('');
      const meta = [
        `**${r.reviewer_name}** (\`${r.reviewer_email}\`)`,
        r.review_date,
        `Lang: \`${r.language}\``,
        r.isReturningCustomer ? 'Returning customer' : null,
      ]
        .filter(Boolean)
        .join(' · ');
      lines.push(meta);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

export function serializeReviewsToJSON(
  reviews: GeneratedReview[],
  storeBaseUrl?: string
): string {
  const payload = reviews.map((r) => ({
    id: r.id,
    product_id: r.item_id,
    product_handle: r.item_slug,
    product_name: r.item_name,
    category: r.category,
    rating: r.stars,
    title: r.subject,
    body: r.body,
    language: r.language,
    voice: r.voice,
    reviewer_name: r.reviewer_name,
    reviewer_email: r.reviewer_email,
    review_date: r.review_date,
    review_timestamp: r.review_timestamp,
    product_url: resolveProductUrl(r, storeBaseUrl),
    picture_urls: r.picture_urls || '',
    is_returning_customer: r.isReturningCustomer,
  }));
  return JSON.stringify(payload, null, 2);
}

export function serializeReviewsToHTML(
  reviews: GeneratedReview[],
  businessLabel = 'Customer Reviews'
): string {
  const cards = reviews
    .map(
      (r) => `  <article class="rf-review" data-rating="${r.stars}" data-lang="${escapeHTML(r.language)}">
    <header>
      <strong>${escapeHTML(formatStarGlyphs(r.stars))} (${r.stars}/5)</strong>
      <span>${escapeHTML(r.item_name)}</span>
      <time datetime="${escapeHTML(r.review_date)}">${escapeHTML(r.review_date)}</time>
    </header>
    <h3>${escapeHTML(r.subject)}</h3>
    <p>${escapeHTML(r.body)}</p>
    <footer>
      <span>${escapeHTML(r.reviewer_name)}</span> &middot;
      <span>${escapeHTML(r.category)}</span>
    </footer>
  </article>`
    )
    .join('\n');

  return `<section class="rf-reviews" aria-label="${escapeHTML(businessLabel)} Reviews">
  <h2>${escapeHTML(businessLabel)} (${reviews.length} Reviews)</h2>
${cards}
</section>\n`;
}

export function serializeReviewsToPlainText(reviews: GeneratedReview[]): string {
  return reviews
    .map((r) =>
      [
        `[${r.stars}/5 ${formatStarGlyphs(r.stars)}] ${r.subject}`,
        `Offering: ${r.item_name} (${r.category})`,
        `Reviewer: ${r.reviewer_name} <${r.reviewer_email}> | Date: ${r.review_date} | Lang: ${r.language}`,
        r.body,
      ].join('\n')
    )
    .join('\n\n----------------------------------------\n\n');
}

export function serializeReviewsByFormat(
  reviews: GeneratedReview[],
  format: ExportFormat,
  storeBaseUrl?: string,
  businessLabel?: string
): string {
  switch (format) {
    case 'judge_me':
      return serializeReviewsToJudgeMeCSV(reviews, storeBaseUrl);
    case 'standard':
      return serializeReviewsToCSV(reviews);
    case 'markdown':
      return serializeReviewsToMarkdown(reviews, businessLabel);
    case 'json':
      return serializeReviewsToJSON(reviews, storeBaseUrl);
    case 'html':
      return serializeReviewsToHTML(reviews, businessLabel);
    case 'txt':
      return serializeReviewsToPlainText(reviews);
    default:
      return serializeReviewsToCSV(reviews);
  }
}

export function downloadExportFile(
  content: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8;'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function maskCustomerEmail(email: string): string {
  const trimmed = email.trim();
  const atIdx = trimmed.indexOf('@');
  if (atIdx <= 0) return 'redacted@privacy.local';
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1);
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function applyPrivacyMaskIfEnabled(
  reviews: GeneratedReview[],
  maskEmails: boolean
): GeneratedReview[] {
  if (!maskEmails) return reviews;
  return reviews.map((r) => ({
    ...r,
    reviewer_email: maskCustomerEmail(r.reviewer_email),
  }));
}

export function serializeRejectedReviewsToCSV(
  rejectedReviews: GeneratedReview[],
  format: ExportFormat,
  storeBaseUrl?: string,
  maskEmails = false
): string {
  const prepared = applyPrivacyMaskIfEnabled(rejectedReviews, maskEmails);
  if (format === 'judge_me') {
    const header =
      'title,body,rating,review_date,reviewer_name,reviewer_email,product_url,picture_urls,product_id,product_handle,qc_status,qc_reason';
    const rows = prepared.map((r) =>
      [
        escapeCSVField(r.subject),
        escapeCSVField(r.body),
        r.stars,
        escapeCSVField(r.review_timestamp || `${r.review_date} 12:00:00 UTC`),
        escapeCSVField(r.reviewer_name),
        escapeCSVField(r.reviewer_email),
        escapeCSVField(resolveProductUrl(r, storeBaseUrl)),
        escapeCSVField(r.picture_urls || ''),
        escapeCSVField(r.item_id),
        escapeCSVField(r.item_slug),
        escapeCSVField(r.needsManualVerification ? 'flagged_manual_review' : 'rejected'),
        escapeCSVField(r.rejectionReason || r.manualVerificationNote || 'Failed mandatory QC checks'),
      ].join(',')
    );
    return [header, ...rows].join('\n');
  }

  const header =
    'item_id,item_slug,item_name,category,reviewer_email,stars,subject,body,review_date,qc_status,qc_reason';
  const rows = prepared.map((r) =>
    [
      escapeCSVField(r.item_id),
      escapeCSVField(r.item_slug),
      escapeCSVField(r.item_name),
      escapeCSVField(r.category),
      escapeCSVField(r.reviewer_email),
      r.stars,
      escapeCSVField(r.subject),
      escapeCSVField(r.body),
      escapeCSVField(r.review_date),
      escapeCSVField(r.needsManualVerification ? 'flagged_manual_review' : 'rejected'),
      escapeCSVField(r.rejectionReason || r.manualVerificationNote || 'Failed mandatory QC checks'),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export function generateQualityControlReportMarkdown(opts: {
  businessLabel: string;
  scannedUrl?: string;
  activeReviews: GeneratedReview[];
  rejectedReviews: GeneratedReview[];
  integrity: DatasetIntegrityReport;
  baselineScorecard?: QualityScorecard | null;
}): string {
  const { businessLabel, scannedUrl, activeReviews, rejectedReviews, integrity, baselineScorecard } = opts;
  const sc = integrity.scorecard;
  const before = baselineScorecard;
  const gates = sc.mandatoryGates;
  const nowIso = new Date().toISOString().split('T')[0];

  const fmt10 = (v: number) => `${v.toFixed(1)}/10`;
  const fmt100 = (v: number) => `${v}/100`;

  const modRows: string[] = [];
  for (const r of activeReviews) {
    for (const m of r.modificationLog || []) {
      modRows.push(
        `| ${r.originalRowNumber ?? r.id.slice(0, 8)} | \`${m.field}\` | ${m.before.slice(0, 48).replace(/\|/g, '/')} | ${m.after.slice(0, 48).replace(/\|/g, '/')} | ${m.reason.replace(/\|/g, '/')} |`
      );
    }
  }

  const affectedRows: string[] = [];
  activeReviews.forEach((r, idx) => {
    const issues = integrity.issuesByReviewId[r.id] || [];
    if (issues.length > 0) {
      affectedRows.push(
        `- **Row #${r.originalRowNumber ?? idx + 1}** (\`${r.item_slug}\`, ${r.stars}★, \`${r.language}\`): ${issues
          .map((i) => `[${i.severity.toUpperCase()}] ${i.detail}`)
          .join(' — ')}`
      );
    }
  });

  const manualVerificationItems = [
    ...activeReviews
      .filter((r) => !r.sourceVerified || r.needsManualVerification)
      .map(
        (r, i) =>
          `- **Active Row #${r.originalRowNumber ?? i + 1}** (\`${r.item_name}\`, ${r.stars}★): ${
            r.manualVerificationNote ||
            'Verify customer review date and identity against internal intervention/order records before publishing.'
          }`
      ),
    ...rejectedReviews.map(
      (r, i) =>
        `- **Excluded/Flagged Row #${r.originalRowNumber ?? i + 1}** (\`${r.item_name}\`, ${r.stars}★): ${
          r.rejectionReason || 'Excluded from publication dataset pending manual source verification.'
        }`
    ),
  ];

  return [
    `# Customer Review Quality & Authenticity Audit Report`,
    ``,
    `- **Business:** ${businessLabel}${scannedUrl ? ` (${scannedUrl})` : ''}`,
    `- **Audit Date:** ${nowIso}`,
    `- **Publication Status:** ${sc.publicationApproved ? 'APPROVED FOR PUBLICATION' : 'HOLD — MANUAL VERIFICATION / REMEDIATION REQUIRED'}`,
    `- **Publication-Ready Reviews:** ${activeReviews.filter((r) => r.sourceVerified).length} verified (${activeReviews.length} active in workbench)`,
    `- **Rejected / Flagged Reviews:** ${rejectedReviews.length}`,
    ``,
    `## 1. Weighted Quality-Control Scorecard (Target: >= 90/100)`,
    ``,
    `| Dimension | Weight | ${before ? 'Before' : 'Baseline'} | Current Score | Status |`,
    `| :--- | :---: | :---: | :---: | :---: |`,
    `| Source Authenticity & Verification | 30% | ${before ? fmt100(before.sourceAuthenticity100) : '—'} | **${fmt100(sc.sourceAuthenticity100)}** | ${sc.sourceAuthenticity100 >= 90 ? 'PASS' : 'NEEDS VERIFICATION'} |`,
    `| Content Originality | 20% | ${before ? fmt100(before.originality100) : '—'} | **${fmt100(sc.originality100)}** | ${sc.originality100 >= 90 ? 'PASS' : 'REVIEW'} |`,
    `| Natural Language Quality | 15% | ${before ? fmt100(before.naturalLanguage100) : '—'} | **${fmt100(sc.naturalLanguage100)}** | ${sc.naturalLanguage100 >= 90 ? 'PASS' : 'REVIEW'} |`,
    `| Service Relevance & Accuracy | 15% | ${before ? fmt100(before.serviceRelevance100) : '—'} | **${fmt100(sc.serviceRelevance100)}** | ${sc.serviceRelevance100 >= 90 ? 'PASS' : 'REVIEW'} |`,
    `| Data Consistency | 10% | ${before ? fmt100(before.dataConsistency100) : '—'} | **${fmt100(sc.dataConsistency100)}** | ${sc.dataConsistency100 >= 90 ? 'PASS' : 'REVIEW'} |`,
    `| Multilingual Quality | 10% | ${before ? fmt100(before.multilingual100) : '—'} | **${fmt100(sc.multilingual100)}** | ${sc.multilingual100 >= 90 ? 'PASS' : 'REVIEW'} |`,
    `| **Weighted Total Score** | **100%** | **${before ? fmt100(before.weightedTotal100) : '—'}** | **${fmt100(sc.weightedTotal100)}** | **${sc.publicationApproved ? 'APPROVED' : 'GATED'}** |`,
    ``,
    `## 2. Benchmark Criteria Comparison (0–10 Scale)`,
    ``,
    `| Criteria | ${before ? 'Before Score' : 'Baseline'} | After Score | Target |`,
    `| :--- | :---: | :---: | :---: |`,
    `| Natural language | ${before ? fmt10(before.rubric10.naturalLanguage) : '—'} | **${fmt10(sc.rubric10.naturalLanguage)}** | 9.0/10 |`,
    `| Originality | ${before ? fmt10(before.rubric10.originality) : '—'} | **${fmt10(sc.rubric10.originality)}** | 9.0/10 |`,
    `| Technical relevance | ${before ? fmt10(before.rubric10.technicalRelevance) : '—'} | **${fmt10(sc.rubric10.technicalRelevance)}** | 9.5/10 |`,
    `| Service categorization | ${before ? fmt10(before.rubric10.serviceCategorization) : '—'} | **${fmt10(sc.rubric10.serviceCategorization)}** | 10.0/10 |`,
    `| Overall quality | ${before ? fmt10(before.rubric10.overallQuality) : '—'} | **${fmt10(sc.rubric10.overallQuality)}** | 9.0+/10 |`,
    ``,
    `## 3. Mandatory Publication Conditions`,
    ``,
    `- [${gates.zeroExactDuplicates ? 'x' : ' '}] Zero unresolved exact duplicate reviews (${integrity.exactDuplicateCount} found)`,
    `- [${gates.zeroHeadingServices ? 'x' : ' '}] Zero incorrect website headings/CTAs used as services (${integrity.insertedHeadingCount} found)`,
    `- [${gates.zeroMixedLanguageLabels ? 'x' : ' '}] Zero automatically inserted mixed-language service labels (${integrity.mixedLanguageServiceCount} found)`,
    `- [${gates.zeroFabricatedOrOffDomain ? 'x' : ' '}] Zero off-domain or broken-grammar template splices (${integrity.offDomainCount + integrity.brokenGrammarCount} found)`,
    `- [${gates.allServicesVerifiedOrFlagged ? 'x' : ' '}] All service assignments verified or flagged (${integrity.incorrectServiceCount} mismatched)`,
    `- [${gates.allUnsupportedExcludedAndVerified ? 'x' : ' '}] All unsupported reviews excluded & source records verified (${integrity.unverifiedSourceCount} unverified, ${integrity.ratingMismatchCount} rating-sentiment flags)`,
    ``,
    `## 4. Affected Rows & Diagnostic Findings`,
    ``,
    affectedRows.length > 0 ? affectedRows.slice(0, 80).join('\n') : '_Zero unresolved content or mapping issues on active rows._',
    ``,
    `## 5. Modification Audit Trail`,
    ``,
    modRows.length > 0
      ? [
          `| Row | Field | Before | After | Reason |`,
          `| :--- | :--- | :--- | :--- | :--- |`,
          ...modRows.slice(0, 120),
        ].join('\n')
      : '_No automated field modifications recorded yet._',
    ``,
    `## 6. Summary of Remaining Issues Requiring Manual Verification`,
    ``,
    manualVerificationItems.length > 0
      ? manualVerificationItems.slice(0, 60).join('\n')
      : '_All active rows have passed validation checks and been verified against source records._',
    ``,
  ].join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
  downloadExportFile(csvContent, filename, 'text/csv;charset=utf-8;');
}
