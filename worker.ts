// Cloudflare Worker entry: serves the built SPA (static assets) and the /api routes.
import {
  detectReviewsWithAI,
  generateJsonWithAI,
  getFallbackInfo,
  isFallbackSecretValid,
  listProviderModels,
  resolveAIConfig,
  rewriteReviewsWithAI,
  SCAN_WEBSITE_JSON_HINT,
  VOICE_PACK_JSON_HINT,
  type AIConfigPayload,
  type AIUsageMetrics,
  type ReviewAuditInput,
  type ServerAIEnv,
  type ValidOfferingOption,
} from './ai-core.ts';
import {
  extractHtmlSignals,
  parseAndValidatePublicUrlSync,
  safeFetchPublicUrl,
  tryFetchShopifyProducts,
  type ExtractedPageSignals,
} from './scan-core.ts';
import {
  businessNameFrom,
  canonicalizeOfferingSlug,
  extractJsonLdItems,
  extractSitemapItems,
  inferAccurateCategory,
  isValidOfferingName,
  itemsFromLinksAndHeadings,
  mergeItems,
  tryWooCommerce,
  type ScrapedItem,
} from './scraper.ts';
import { buildBusinessProfile, normalizeCountryCode } from './business-profile.ts';

interface Env extends ServerAIEnv {
  ASSETS: { fetch(req: Request): Promise<Response> };
}

const ALLOWED_LANGUAGES = new Set([
  'en', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'ar', 'darija_latin',
  'tr', 'ru', 'zh', 'ja', 'ko', 'hi', 'pl',
  'sv', 'no', 'da', 'el', 'ro', 'cs', 'uk', 'id', 'vi', 'th', 'ms', 'he',
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

function slugifySafe(value: string, fallbackIndex: number): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `service-${fallbackIndex}`;
}

function sanitizeHttpUrl(candidate: string | undefined, fallbackOrigin: string, slug: string): string {
  if (candidate && candidate.trim()) {
    try {
      const parsed = new URL(candidate.trim(), fallbackOrigin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.toString();
    } catch {
      // fall through
    }
  }
  return `${fallbackOrigin.replace(/\/+$/, '')}/${slug}`;
}

async function handleModels(req: Request, env: Env): Promise<Response> {
  let body: { aiConfig?: AIConfigPayload };
  try {
    body = (await req.json()) as { aiConfig?: AIConfigPayload };
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  try {
    const result = await listProviderModels(body?.aiConfig, env);
    return json(result);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Failed to list models.' }, 400);
  }
}

async function handleVerifySecret(req: Request, env: Env): Promise<Response> {
  let body: { secretCode?: string };
  try {
    body = (await req.json()) as { secretCode?: string };
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const fb = getFallbackInfo(env);
  if (!fb.configured) {
    return json(
      {
        valid: false,
        configured: false,
        error:
          'No server API key found. Note: Cloudflare Workers does not read local .env files — add GEMINI_API_KEY (or FALLBACK_AI_API_KEY) and FALLBACK_SECRET_CODE in Cloudflare Dashboard → Workers → Settings → Variables and Secrets.',
      },
      404
    );
  }
  if (!fb.requiresSecret) {
    return json({ valid: true, configured: true, provider: fb.provider, defaultModel: fb.defaultModel });
  }
  const valid = isFallbackSecretValid(body?.secretCode, env);
  if (!valid) {
    return json({ valid: false, configured: true, error: 'Incorrect secret access code.' }, 403);
  }
  return json({ valid: true, configured: true, provider: fb.provider, defaultModel: fb.defaultModel });
}

async function handleAdaptBusiness(req: Request, env: Env): Promise<Response> {
  let body: {
    products?: { item_slug?: string; item_name: string; category: string }[];
    categories?: string[];
    languages?: string[];
    businessContext?: string;
    filename?: string;
    storeUrl?: string;
    aiConfig?: AIConfigPayload;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const products = Array.isArray(body?.products) ? body.products.slice(0, 50) : [];
  const categories = Array.isArray(body?.categories) ? body.categories.slice(0, 12) : [];
  const reqLangs = Array.isArray(body?.languages) ? body.languages.filter((l) => ALLOWED_LANGUAGES.has(l)) : ['en'];
  const languages = reqLangs.length > 0 ? reqLangs : ['en'];
  const businessContext = typeof body?.businessContext === 'string' ? body.businessContext.trim().slice(0, 400) : '';
  const filename = typeof body?.filename === 'string' ? body.filename.trim().slice(0, 140) : '';
  const storeUrl = typeof body?.storeUrl === 'string' ? body.storeUrl.trim().slice(0, 180) : '';

  if (products.length === 0 && !businessContext) {
    return json({ error: 'Please upload products or describe your business before adapting copy.' }, 400);
  }

  if (!resolveAIConfig(body?.aiConfig, env)) {
    return json(
      { error: 'No AI provider configured. Click AI Settings in the top bar to add your API key (Gemini, OpenRouter, OpenAI, Groq, Ollama) or enter the secret access code.' },
      403
    );
  }

  const sampleList = products
    .map((p) => `- slug="${p.item_slug || ''}" | name="${p.item_name}" | current_category="${p.category}"`)
    .join('\n');

  const prompt = `Auto-scan this uploaded store product catalog and build a category-aware, multi-language customer review sentence bank.

Uploaded file name: ${filename || '(none)'}
Store URL / domain: ${storeUrl || '(none)'}
User business notes: ${businessContext || '(Auto-detect brand, region, and niche)'}
Current categories: ${categories.join(', ') || 'General'}
Products in uploaded file:
${sampleList || '(None provided — use business description)'}

Target languages to generate packs for: ${languages.join(', ')}

CRITICAL INSTRUCTIONS:
1. Product Classification: For every product slug listed above, output a clean product name and group items into 2–6 clean categories.
2. Category-Specific Context: For EACH category and EACH target language (${languages.join(', ')}), generate a categoryContext entry with realistic contextA, contextB, openers, and middles.
3. Store-Level Language Packs: For EACH target language, generate a full languagePack covering stars 5, 4, 3, 2, and 1.
4. Grammar & Composability: Every sentence must be grammatically self-contained.
5. For "darija_latin", write genuine Moroccan Darija in Latin script (NO Arabic characters). For "ar", write natural Modern Arabic.
6. STRICT LOW-STAR SAFETY GUARDRAIL (1-star & 2-star): NEVER allege scams, fraud, or fakes; only benign friction.
7. Placeholders: Use ONLY {product}, {contextA}, {contextB}, {duration}, {timeframe}.`;

  try {
    const { data, usage } = await generateJsonWithAI(body?.aiConfig, env, {
      systemInstruction:
        'You are a multilingual e-commerce and service-business localization specialist who crafts authentic, category-accurate customer review building blocks in any requested language.',
      prompt,
      jsonShapeHint: VOICE_PACK_JSON_HINT,
    });
    return json({ pack: data, aiUsage: usage });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Failed to adapt review copy.' }, 500);
  }
}

async function scanWebsite(req: Request, env: Env): Promise<Response> {
  let body: {
    url?: string;
    languages?: string[];
    businessContext?: string;
    aiConfig?: AIConfigPayload;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  let validated: URL;
  try {
    validated = parseAndValidatePublicUrlSync(typeof body?.url === 'string' ? body.url : '');
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Invalid URL.' }, 400);
  }

  const reqLangs = Array.isArray(body?.languages) ? body.languages.filter((l) => ALLOWED_LANGUAGES.has(l)) : ['en'];
  const languages = reqLangs.length > 0 ? reqLangs : ['en'];
  const businessContext = typeof body?.businessContext === 'string' ? body.businessContext.trim().slice(0, 400) : '';

  try {
    const [home, shopify] = await Promise.all([
      safeFetchPublicUrl(validated.toString()).catch(() => null),
      tryFetchShopifyProducts(validated),
    ]);
    if (!home) {
      return json({ error: 'Could not load that website (it may be down or block automated requests).' }, 502);
    }

    const origin = home.finalUrl.origin;
    const pages: ExtractedPageSignals[] = [];
    const ld: ScrapedItem[] = [];
    const rawPages: { url: string; html: string }[] = [];

    if (home.status >= 200 && home.status < 400 && home.text) {
      const sig = extractHtmlSignals(home.text, home.finalUrl);
      pages.push(sig);
      rawPages.push({ url: home.finalUrl.toString(), html: home.text });
      ld.push(...extractJsonLdItems(home.text, home.finalUrl));
      if (shopify.length === 0) {
        const subs = await Promise.allSettled(sig.navAndServiceLinks.slice(0, 5).map((l) => safeFetchPublicUrl(l.url)));
        for (const r of subs) {
          if (r.status === 'fulfilled' && r.value.status >= 200 && r.value.status < 400 && r.value.text) {
            pages.push(extractHtmlSignals(r.value.text, r.value.finalUrl));
            rawPages.push({ url: r.value.finalUrl.toString(), html: r.value.text });
            ld.push(...extractJsonLdItems(r.value.text, r.value.finalUrl));
          }
        }
      }
    }

    const [woo, sitemap] =
      shopify.length > 0
        ? [[], []]
        : await Promise.all([
            tryWooCommerce(origin, safeFetchPublicUrl),
            extractSitemapItems(origin, safeFetchPublicUrl, home.finalUrl),
          ]);

    const heuristicItems = mergeItems([woo, ld, sitemap, itemsFromLinksAndHeadings(pages, home.finalUrl)]);

    // Optional AI enrichment if user configured an API key or unlocked fallback AI
    interface WorkerParsedScan {
      businessType?: string;
      detectedCountryCode?: string;
      discoveredItems?: Array<{ item_name: string; item_slug: string; category: string; product_url?: string }>;
      detectedBusinessName?: string;
      businessSummary?: string;
      productClassifications?: Array<{ item_slug: string; cleanName: string; category: string }>;
      offeringContexts?: unknown[];
      categoryContext?: unknown[];
      languagePacks?: unknown[];
    }
    let parsed: WorkerParsedScan | null = null;
    let aiUsage: AIUsageMetrics | null = null;

    if (resolveAIConfig(body?.aiConfig, env)) {
      try {
        const shopifySection =
          shopify.length > 0
            ? `SHOPIFY CATALOG (${shopify.length} products):\n${shopify
                .map((p) => `- slug="${p.item_slug}" | name="${p.item_name}" | type="${p.category}" | url="${p.product_url}"`)
                .join('\n')}`
            : '';
        const pagesSection = pages
          .map((p, idx) =>
            [
              `--- PAGE ${idx + 1}: ${p.url} ---`,
              p.ogSiteName ? `Site Name: ${p.ogSiteName}` : '',
              p.title ? `Title: ${p.title}` : '',
              p.metaDescription ? `Meta: ${p.metaDescription}` : '',
              p.headings.length ? `Headings: ${p.headings.slice(0, 18).join(' | ')}` : '',
              p.navAndServiceLinks.length
                ? `Links: ${p.navAndServiceLinks.slice(0, 15).map((l) => `${l.text} (${l.url})`).join('; ')}`
                : '',
              p.bodyExcerpt ? `Excerpt: ${p.bodyExcerpt.slice(0, 2600)}` : '',
            ]
              .filter(Boolean)
              .join('\n')
          )
          .join('\n\n');

        const prompt = `Scan this website's public information, identify ONLY its real services or products, and build a tailored multi-language customer review pack.
Target URL: ${validated.toString()}
User notes: ${businessContext || '(Auto-detect)'}
${shopifySection}
${pagesSection}
Target languages: ${languages.join(', ')}
CRITICAL RULES:
1. Determine accurately if this is a "service" business or an "ecommerce" store, and infer "detectedCountryCode" (ISO-2 like BE, NL, FR, DE, GB, MA, CH, US).
2. Extract 6–14 CONCRETE, REAL services or products actually offered. NEVER include website headings, process steps ("Tell us what you need", "How it works"), slogans ("Care that suits your home"), navigation hubs ("Our services", "Solutions", "Service areas", "About us", "Contact"), CTAs ("Book now"), or city pages! Assign specific categories distinguishing Maintenance, Repair, Installation, Plumbing/Leaks, Emergency, and Heat Pumps/Equipment.
3. Generate "offeringContexts" per slug and language with a natural "localizedName" in THAT exact language (zero untranslated English labels in FR/NL/DE/ES/AR!), "distinctiveKeywords", and 3–4 offering-accurate "scenarios", "actions", and "outcomes" (never mix maintenance with emergency repair or installation!).
4. Plain customer voice: ZERO artificial spelling mistakes, ZERO marketing clichés ("exceeded expectations", "worth every penny", "game-changer"), ZERO e-commerce shipping/box words on service businesses, and keep 3★ neutral/mixed and 1–2★ honest scheduling/communication friction. Ensure tokens.contextA/contextB are lowercase noun phrases.`;

        const aiResult = await generateJsonWithAI<WorkerParsedScan>(body?.aiConfig, env, {
          systemInstruction:
            'You are a multilingual business research and customer-experience specialist who extracts only genuine services/products and writes natural, domain-accurate review building blocks.',
          prompt,
          jsonShapeHint: SCAN_WEBSITE_JSON_HINT,
        });
        parsed = aiResult.data;
        aiUsage = aiResult.usage;
      } catch (aiErr) {
        console.warn('[worker/scan-website] AI step failed, falling back to keyless scraper:', aiErr);
      }
    }

    const classMap = new Map(
      (parsed?.productClassifications || []).map((c) => [c.item_slug.toLowerCase(), c])
    );

    const filteredAiItems = (parsed?.discoveredItems || []).filter((it) =>
      isValidOfferingName(String(it.item_name || ''), String(it.item_slug || ''))
    );
    const rawChosenItems = filteredAiItems.length > 0 ? filteredAiItems : heuristicItems;
    const seenSlugs = new Set<string>();

    const products =
      shopify.length > 0
        ? shopify.map((p) => {
            const cls = classMap.get(p.item_slug.toLowerCase());
            return {
              ...p,
              item_name: cls?.cleanName?.trim() || p.item_name,
              category: cls?.category?.trim() || p.category,
            };
          })
        : rawChosenItems
            .map((item, idx) => {
              const cleanName = String(item.item_name || item.item_slug || '').trim();
              const slug = canonicalizeOfferingSlug(item.item_slug, cleanName, item.product_url, idx + 1);
              return { ...item, cleanName, slug };
            })
            .filter((item) => {
              if (seenSlugs.has(item.slug)) return false;
              seenSlugs.add(item.slug);
              return true;
            })
            .slice(0, 24)
            .map((item, idx) => {
              return {
                item_id: String(idx + 1),
                item_slug: item.slug,
                item_name: item.cleanName,
                category: inferAccurateCategory(item.cleanName, item.slug, String(item.category || '').trim()),
                product_url: sanitizeHttpUrl(item.product_url, origin, item.slug),
              };
            });

    if (products.length === 0) {
      return json(
        {
          error:
            'Could not identify specific services or products on that website. Try pasting a subpage URL (like /services or /shop).',
        },
        502
      );
    }

    const isEcommerce = shopify.length > 0 || woo.length > 0 || parsed?.businessType?.toLowerCase() === 'ecommerce';
    const detectedName =
      parsed?.detectedBusinessName || businessNameFrom(pages[0] || { ogSiteName: '', title: '' }, home.finalUrl.hostname);
    const metaDesc = pages[0]?.metaDescription?.trim() || '';
    const uniqueCats = Array.from(new Set(products.map((p) => p.category))).slice(0, 4);
    const sampleOfferings = products.slice(0, 4).map((p) => p.item_name);
    const detectedSummary =
      parsed?.businessSummary?.trim() ||
      (metaDesc
        ? `${detectedName} (${isEcommerce ? 'E-commerce' : 'Service business'}) — ${metaDesc.slice(0, 220)}`
        : `${detectedName} — ${isEcommerce ? 'Online store' : 'Service business'} offering ${uniqueCats.join(', ')} (${sampleOfferings.join(', ')}).`);

    const builtProfile = buildBusinessProfile(rawPages, {
      name: detectedName,
      summary: parsed?.businessSummary,
    });
    const resolvedCountry =
      normalizeCountryCode(parsed?.detectedCountryCode) ||
      builtProfile.detectedCountryCode ||
      undefined;

    return json({
      businessProfile: { ...builtProfile, detectedCountryCode: resolvedCountry },
      scannedUrl: home.finalUrl.toString(),
      hostname: home.finalUrl.hostname,
      scannedPagesCount: Math.max(1, pages.length),
      businessType: isEcommerce ? 'ecommerce' : 'service',
      detectedFormat: shopify.length > 0 ? 'shopify' : 'website',
      detectedStoreBaseUrl: shopify.length > 0 ? `${origin}/products` : origin,
      aiUsed: Boolean(parsed),
      aiUsage,
      detectedBusinessName: detectedName,
      detectedBusinessSummary: detectedSummary,
      detectedCountryCode: resolvedCountry,
      products,
      pack: parsed?.languagePacks
        ? {
            detectedBusinessName: parsed.detectedBusinessName || home.finalUrl.hostname,
            businessSummary: parsed.businessSummary || '',
            detectedCountryCode: resolvedCountry,
            productClassifications: parsed.productClassifications || [],
            offeringContexts: parsed.offeringContexts || [],
            categoryContext: parsed.categoryContext || [],
            languagePacks: parsed.languagePacks,
          }
        : resolvedCountry
        ? {
            detectedBusinessName: detectedName,
            businessSummary: detectedSummary,
            detectedCountryCode: resolvedCountry,
            languagePacks: [],
          }
        : null,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Failed to scan the website.' }, 500);
  }
}

async function handleDetectReviews(req: Request, env: Env): Promise<Response> {
  let body: {
    reviews?: ReviewAuditInput[];
    businessContext?: string;
    validOfferings?: ValidOfferingOption[];
    aiConfig?: AIConfigPayload;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const reviews = Array.isArray(body?.reviews) ? body.reviews : [];
  if (reviews.length === 0) return json({ error: 'No reviews to audit.' }, 400);
  if (!resolveAIConfig(body?.aiConfig, env)) {
    return json({ error: 'Connect an AI provider (or unlock Fallback AI) to run the AI Authenticity Detector.' }, 403);
  }
  try {
    const { results, usage } = await detectReviewsWithAI(
      body?.aiConfig,
      env,
      reviews,
      typeof body?.businessContext === 'string' ? body.businessContext.slice(0, 500) : '',
      Array.isArray(body?.validOfferings) ? body.validOfferings.slice(0, 40) : undefined
    );
    return json({ results, aiUsage: usage });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'AI detection failed.' }, 500);
  }
}

async function handleRewriteReviews(req: Request, env: Env): Promise<Response> {
  let body: {
    reviews?: ReviewAuditInput[];
    businessContext?: string;
    validOfferings?: ValidOfferingOption[];
    avoidOpenings?: string[];
    detectedCountryCode?: string;
    aiConfig?: AIConfigPayload;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }
  const reviews = Array.isArray(body?.reviews) ? body.reviews : [];
  if (reviews.length === 0) return json({ error: 'No flagged reviews to rewrite.' }, 400);
  if (!resolveAIConfig(body?.aiConfig, env)) {
    return json({ error: 'Connect an AI provider (or unlock Fallback AI) to rewrite flagged reviews.' }, 403);
  }
  try {
    const { rewrites, usage } = await rewriteReviewsWithAI(
      body?.aiConfig,
      env,
      reviews,
      typeof body?.businessContext === 'string' ? body.businessContext.slice(0, 500) : '',
      {
        validOfferings: Array.isArray(body?.validOfferings) ? body.validOfferings.slice(0, 40) : undefined,
        avoidOpenings: Array.isArray(body?.avoidOpenings) ? body.avoidOpenings.slice(0, 30) : undefined,
        detectedCountryCode: typeof body?.detectedCountryCode === 'string' ? body.detectedCountryCode.slice(0, 6) : undefined,
      }
    );
    return json({ rewrites, aiUsage: usage });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'AI rewrite failed.' }, 500);
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname === '/api/ai/status') {
      const fb = getFallbackInfo(env);
      return json({
        fallbackConfigured: fb.configured,
        fallbackRequiresSecret: fb.requiresSecret,
        fallbackProvider: fb.configured ? fb.provider : null,
      });
    }
    if (pathname === '/api/ai/models') {
      return req.method === 'POST' ? handleModels(req, env) : json({ error: 'Method not allowed. Use POST.' }, 405);
    }
    if (pathname === '/api/ai/verify-secret') {
      return req.method === 'POST' ? handleVerifySecret(req, env) : json({ error: 'Method not allowed. Use POST.' }, 405);
    }
    if (pathname === '/api/ai/detect-reviews') {
      return req.method === 'POST' ? handleDetectReviews(req, env) : json({ error: 'Method not allowed. Use POST.' }, 405);
    }
    if (pathname === '/api/ai/rewrite-reviews') {
      return req.method === 'POST' ? handleRewriteReviews(req, env) : json({ error: 'Method not allowed. Use POST.' }, 405);
    }
    if (pathname === '/api/scan-website') {
      return req.method === 'POST' ? scanWebsite(req, env) : json({ error: 'Method not allowed. Use POST.' }, 405);
    }
    if (pathname === '/api/adapt-business') {
      return req.method === 'POST' ? handleAdaptBusiness(req, env) : json({ error: 'Method not allowed. Use POST.' }, 405);
    }
    if (pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
    return env.ASSETS.fetch(req);
  },
};
