import {
  CatalogFormat,
  CatalogProduct,
  ExportFormat,
  GeneratedReview,
} from '../types/reviews';

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

    const rowNumber = products.length + 1;
    const item_id = rawId.trim() || String(rowNumber);
    const item_slug = rawSlug.trim() || slugifyProductName(item_name, rowNumber);

    // Deduplicate Shopify variant rows (same handle) and repeated Judge.me product rows
    const dedupeKey =
      detectedFormat === 'shopify' || detectedFormat === 'judge_me'
        ? item_slug.toLowerCase()
        : `${item_id}::${item_slug.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const cleanCat = rawCat
      .split(',')[0]
      .split('>')[0]
      .trim();
    const category = cleanCat || inferCategoryFromHandleOrName(item_name, item_slug);

    products.push({
      item_id,
      item_slug,
      item_name,
      category,
      product_url: rawUrl.trim() || undefined,
      picture_urls: rawPic.trim() || undefined,
    });
  }

  if (products.length === 0) {
    errors.push(
      'No valid product rows found. Upload a Judge.me CSV, Shopify Products CSV, or any CSV with product names/handles.'
    );
  }

  return {
    products,
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

export function downloadCSV(csvContent: string, filename: string): void {
  downloadExportFile(csvContent, filename, 'text/csv;charset=utf-8;');
}
