import 'dotenv/config';
import dns from 'dns/promises';
import express from 'express';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
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
  tryWooCommerce,
  extractJsonLdItems,
  extractSitemapItems,
  itemsFromLinksAndHeadings,
  mergeItems,
  businessNameFrom,
  inferAccurateCategory,
  isValidOfferingName,
  type ScrapedItem,
} from './scraper.ts';
import { buildBusinessProfile } from './business-profile.ts';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json({ limit: '2mb' }));

const ALLOWED_LANGUAGES = new Set([
  'en', 'fr', 'es', 'de', 'it', 'pt', 'nl', 'ar', 'darija_latin',
  'tr', 'ru', 'zh', 'ja', 'ko', 'hi', 'pl',
  'sv', 'no', 'da', 'el', 'ro', 'cs', 'uk', 'id', 'vi', 'th', 'ms', 'he',
]);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const MAX_FETCH_BYTES = 1_200_000; // 1.2 MB cap per fetched page
const FETCH_TIMEOUT_MS = 8_000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check the Settings > Secrets panel.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ---------- Safe Outbound URL Validation & Public-IP Enforcement ----------

function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 / 192.0.2.0/24
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmark
  if (a >= 224) return true; // multicast & reserved
  return false;
}

function isPrivateOrReservedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::' || lower === '::1') return true;
  if (lower.startsWith('fe80:') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
    return true; // link-local fe80::/10
  }
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // ULA fc00::/7
  if (lower.startsWith('ff')) return true; // multicast
  if (lower.startsWith('::ffff:')) {
    const mappedV4 = lower.slice(7);
    if (net.isIPv4(mappedV4)) return isPrivateOrReservedIPv4(mappedV4);
    return true;
  }
  return false;
}

function isPrivateOrReservedIP(ip: string): boolean {
  const ipVersion = net.isIP(ip);
  if (ipVersion === 4) return isPrivateOrReservedIPv4(ip);
  if (ipVersion === 6) return isPrivateOrReservedIPv6(ip);
  return true;
}

async function parseAndValidatePublicUrl(rawInput: string): Promise<URL> {
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.length > 500) {
    throw new Error('Please enter a valid website URL (e.g., https://example.com).');
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('Invalid website URL format. Please check the address and try again.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// website URLs are supported.');
  }

  if (parsed.username || parsed.password) {
    throw new Error('Website URLs cannot contain embedded credentials.');
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !host ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === 'metadata.google.internal' ||
    (!host.includes('.') && !net.isIP(host))
  ) {
    throw new Error('Please enter a public website domain (private or local addresses are not allowed).');
  }

  if (net.isIP(host)) {
    if (isPrivateOrReservedIP(host)) {
      throw new Error('Private or reserved network addresses cannot be scanned.');
    }
    return parsed;
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch {
    throw new Error(`Could not resolve domain "${host}". Check that the website address is spelled correctly.`);
  }

  if (!addresses || addresses.length === 0) {
    throw new Error(`No public DNS record found for "${host}".`);
  }

  for (const entry of addresses) {
    if (isPrivateOrReservedIP(entry.address)) {
      throw new Error('The target domain resolves to a private network address and cannot be scanned.');
    }
  }

  return parsed;
}

async function readResponseTextCapped(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      if (total + value.byteLength > maxBytes) {
        const remaining = maxBytes - total;
        if (remaining > 0) chunks.push(value.subarray(0, remaining));
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(combined);
}

async function safeFetchPublicUrl(
  rawUrl: string,
  acceptHeader = 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
): Promise<{ finalUrl: URL; status: number; contentType: string; text: string }> {
  let currentUrl = await parseAndValidatePublicUrl(rawUrl);

  for (let hop = 0; hop < 4; hop++) {
    const response = await fetch(currentUrl.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: acceptHeader,
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ar;q=0.7',
      },
    });

    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.get('location')
    ) {
      const loc = response.headers.get('location')!;
      const nextUrl = new URL(loc, currentUrl);
      currentUrl = await parseAndValidatePublicUrl(nextUrl.toString());
      continue;
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await readResponseTextCapped(response, MAX_FETCH_BYTES);
    return {
      finalUrl: currentUrl,
      status: response.status,
      contentType,
      text,
    };
  }

  throw new Error('Too many redirects while loading the target website.');
}

// ---------- Website Content & Shopify Extraction ----------

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(Number(dec)))
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, ' '));
}

interface ExtractedPageSignals {
  url: string;
  title: string;
  metaDescription: string;
  ogSiteName: string;
  headings: string[];
  jsonLdSnippets: string[];
  navAndServiceLinks: { text: string; url: string }[];
  bodyExcerpt: string;
}

const HIGH_SIGNAL_PATH_REGEX =
  /\/(services?|solutions?|offerings?|pricing|plans?|packages?|treatments?|menu|products?|collections?|shop|store|catalog|features?|about|programs?|courses?|booking|appointments?)\b/i;

function extractHtmlSignals(html: string, pageUrl: URL): ExtractedPageSignals {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).slice(0, 180) : '';

  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const metaDescription = descMatch ? decodeHtmlEntities(descMatch[1]).slice(0, 320) : '';

  const ogSiteMatch =
    html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
  const ogSiteName = ogSiteMatch ? decodeHtmlEntities(ogSiteMatch[1]).slice(0, 120) : '';

  // Extract JSON-LD blocks (rich Service, Product, LocalBusiness, Offer schema)
  const jsonLdSnippets: string[] = [];
  const ldRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch: RegExpExecArray | null;
  while ((ldMatch = ldRegex.exec(html)) !== null && jsonLdSnippets.length < 6) {
    const raw = ldMatch[1].trim();
    if (raw.length > 20 && raw.length < 6000) {
      jsonLdSnippets.push(raw.slice(0, 1800));
    }
  }

  // Extract internal links pointing to services, pricing, collections, products, etc.
  const navAndServiceLinks: { text: string; url: string }[] = [];
  const seenLinks = new Set<string>();
  const linkRegex = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let aMatch: RegExpExecArray | null;
  while ((aMatch = linkRegex.exec(html)) !== null && navAndServiceLinks.length < 30) {
    const rawHref = aMatch[1].trim();
    const linkText = stripTags(aMatch[2]).slice(0, 90);
    if (!rawHref || /^(mailto:|tel:|javascript:|data:)/i.test(rawHref)) continue;
    try {
      const resolved = new URL(rawHref, pageUrl);
      if (resolved.hostname !== pageUrl.hostname) continue;
      const cleanUrl = `${resolved.origin}${resolved.pathname}`;
      if (seenLinks.has(cleanUrl) || resolved.pathname === '/' || resolved.pathname === pageUrl.pathname) {
        continue;
      }
      if (
        HIGH_SIGNAL_PATH_REGEX.test(resolved.pathname) ||
        /\b(service|pricing|plan|product|shop|collection|menu|treatment|solution|package|course|prestation|tarif|produit|خدمة|خدمات)\b/i.test(
          linkText
        )
      ) {
        seenLinks.add(cleanUrl);
        navAndServiceLinks.push({ text: linkText || resolved.pathname, url: cleanUrl });
      }
    } catch {
      // ignore malformed href
    }
  }

  // Strip scripts, styles, SVGs, noscript before pulling headings & visible text
  const cleanedHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  const headings: string[] = [];
  const seenHeadings = new Set<string>();
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let hMatch: RegExpExecArray | null;
  while ((hMatch = headingRegex.exec(cleanedHtml)) !== null && headings.length < 40) {
    const hText = stripTags(hMatch[1]);
    if (hText.length >= 3 && hText.length <= 140) {
      const key = hText.toLowerCase();
      if (!seenHeadings.has(key)) {
        seenHeadings.add(key);
        headings.push(hText);
      }
    }
  }

  const bodyMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodySource = bodyMatch ? bodyMatch[1] : cleanedHtml;
  const bodyExcerpt = stripTags(bodySource).slice(0, 5500);

  return {
    url: pageUrl.toString(),
    title,
    metaDescription,
    ogSiteName,
    headings,
    jsonLdSnippets,
    navAndServiceLinks,
    bodyExcerpt,
  };
}

interface ShopifyProductItem {
  item_id: string;
  item_slug: string;
  item_name: string;
  category: string;
  product_url: string;
}

async function tryFetchShopifyProducts(baseUrl: URL): Promise<ShopifyProductItem[]> {
  try {
    const endpoint = `${baseUrl.origin}/products.json?limit=50`;
    const res = await safeFetchPublicUrl(endpoint, 'application/json');
    if (res.status !== 200 || !res.text.trim().startsWith('{')) return [];
    const data = JSON.parse(res.text) as {
      products?: Array<{
        id?: number | string;
        handle?: string;
        title?: string;
        product_type?: string;
      }>;
    };
    if (!Array.isArray(data?.products) || data.products.length === 0) return [];

    // Preserve locale prefix like /en if present on the user's URL
    const localePrefixMatch = baseUrl.pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(?:\/|$)/i);
    const productsPrefix = localePrefixMatch
      ? `${baseUrl.origin}/${localePrefixMatch[1]}/products`
      : `${baseUrl.origin}/products`;

    return data.products
      .filter((p) => p && (p.title || p.handle))
      .slice(0, 50)
      .map((p, idx) => {
        const handle = String(p.handle || `item-${idx + 1}`).trim();
        return {
          item_id: String(p.id || idx + 1),
          item_slug: handle,
          item_name: String(p.title || handle).trim(),
          category: String(p.product_type || '').trim() || 'General',
          product_url: `${productsPrefix}/${handle}`,
        };
      });
  } catch {
    return [];
  }
}

async function lookupWebsiteViaSearch(ai: GoogleGenAI, targetUrl: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Inspect the business at ${targetUrl}. Summarize the business name, location/region, industry, and list the specific services, plans, or products this website offers (8 to 20 concrete offerings if available).`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });
    return (response.text ?? '').trim().slice(0, 5000);
  } catch (err) {
    console.warn('[scan-website] Search fallback failed:', err instanceof Error ? err.message : err);
    return '';
  }
}

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
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      // fall through
    }
  }
  return `${fallbackOrigin.replace(/\/+$/, '')}/${slug}`;
}

// ---------- Gemini Structured Schemas ----------

const VOICE_PACK_PROPERTIES = {
  detectedBusinessName: {
    type: Type.STRING,
    description:
      'Short 2-5 word label describing the detected store or business (e.g., Nordic Home Goods Store, Casablanca Dental Studio, Apex Digital Agency).',
  },
  businessSummary: {
    type: Type.STRING,
    description:
      'One concise sentence summarizing the business, region (if detected), and core services or products.',
  },
  productClassifications: {
    type: Type.ARRAY,
    description:
      'Clean display name and refined category for each scanned product/service slug.',
    items: {
      type: Type.OBJECT,
      properties: {
        item_slug: { type: Type.STRING },
        cleanName: {
          type: Type.STRING,
          description: 'Properly cased, natural service or product display name.',
        },
        category: {
          type: Type.STRING,
          description:
            'Concise category (e.g. Smartwatches, SEO & Growth, Hair Styling, Dental Implants, Espresso Blends). Reuse the same category names across similar items.',
        },
      },
      required: ['item_slug', 'cleanName', 'category'],
    },
  },
  categoryContext: {
    type: Type.ARRAY,
    description:
      'Per-category, per-language service/product-specific vocabulary so every review matches the exact service or product type.',
    items: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING },
        language: {
          type: Type.STRING,
          description: 'One of: en, fr, es, de, it, pt, nl, ar, darija_latin, tr, ru, zh, ja, ko, hi, pl.',
        },
        contextA: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '5-6 real-world customer scenarios or goals specifically for this service/product category in this language.',
        },
        contextB: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '5-6 concrete qualities, results, features, or service details specifically for this category in this language.',
        },
        openers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '4-6 standalone authentic first sentences tailored specifically to this category (may use {product}, {contextA}, {contextB}, {duration}, {timeframe}).',
        },
        middles: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '4-5 standalone detail sentences highlighting real client/buyer experience with this category (may use placeholders).',
        },
      },
      required: ['category', 'language', 'contextA', 'contextB', 'openers', 'middles'],
    },
  },
  languagePacks: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        language: {
          type: Type.STRING,
          description: 'Language code: en, fr, es, de, it, pt, nl, ar, darija_latin, tr, ru, zh, ja, ko, hi, or pl.',
        },
        tokens: {
          type: Type.OBJECT,
          properties: {
            contextA: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '6-8 natural business-wide usage or booking contexts in this language.',
            },
            contextB: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '6-8 natural business-wide quality, communication, delivery, or service details in this language.',
            },
            duration: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '5-7 natural engagement/ownership durations in this language (e.g. 2 weeks, a month, 3 sessions).',
            },
            timeframe: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                '5-6 realistic turnaround/delivery/response timeframes that work naturally after "in"/"en"/"f"/"خلال" (e.g. 24h, 48h, 2 days, 3 days).',
            },
          },
          required: ['contextA', 'contextB', 'duration', 'timeframe'],
        },
        stars: {
          type: Type.ARRAY,
          description: 'Exactly 5 entries, one each for star ratings 5, 4, 3, 2, and 1.',
          items: {
            type: Type.OBJECT,
            properties: {
              star: { type: Type.INTEGER },
              subjects: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '5-8 short natural review titles matching this star level.',
              },
              openers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  '5-7 standalone first sentences tailored to this business and star rating. May use {product}, {contextA}, {contextB}, {duration}, {timeframe}.',
              },
              middles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  '4-6 standalone second sentences with concrete practical details matching this star rating.',
              },
              closers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-5 standalone closing sentences matching this star rating.',
              },
            },
            required: ['star', 'subjects', 'openers', 'middles', 'closers'],
          },
        },
        extraTails: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            '5-6 short standalone contextual follow-up sentences for high-volume deduplication.',
        },
      },
      required: ['language', 'tokens', 'stars', 'extraTails'],
    },
  },
};

const ADAPT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: VOICE_PACK_PROPERTIES,
  required: [
    'detectedBusinessName',
    'businessSummary',
    'productClassifications',
    'categoryContext',
    'languagePacks',
  ],
};

const SCAN_WEBSITE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    businessType: {
      type: Type.STRING,
      description: 'Either "service" (agency, clinic, SaaS, hotel, salon, local service, etc.) or "ecommerce" (online product store).',
    },
    discoveredItems: {
      type: Type.ARRAY,
      description:
        'List of 6 to 24 concrete, real services, plans, packages, or products offered on this website.',
      items: {
        type: Type.OBJECT,
        properties: {
          item_name: {
            type: Type.STRING,
            description: 'Exact, clear service or product name offered by the website.',
          },
          item_slug: {
            type: Type.STRING,
            description: 'Clean lowercase URL-friendly handle/slug.',
          },
          category: {
            type: Type.STRING,
            description: 'Clean grouping category for this service or product (2–6 categories total across the site).',
          },
          product_url: {
            type: Type.STRING,
            description: 'Best matching URL on the website for this service or product (or the main site URL).',
          },
        },
        required: ['item_name', 'item_slug', 'category', 'product_url'],
      },
    },
    ...VOICE_PACK_PROPERTIES,
  },
  required: [
    'businessType',
    'discoveredItems',
    'detectedBusinessName',
    'businessSummary',
    'productClassifications',
    'categoryContext',
    'languagePacks',
  ],
};

// ---------- API Route 0: AI Models & Secret Fallback Verification ----------

function getServerAIEnv(): ServerAIEnv {
  return {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY,
    API_KEY: process.env.API_KEY,
    AI_API_KEY: process.env.AI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    SECRET_CODE: process.env.SECRET_CODE,
    FALLBACK_SECRET_CODE: process.env.FALLBACK_SECRET_CODE,
    FALLBACK_AI_PROVIDER: process.env.FALLBACK_AI_PROVIDER,
    FALLBACK_AI_API_KEY: process.env.FALLBACK_AI_API_KEY,
    FALLBACK_AI_MODEL: process.env.FALLBACK_AI_MODEL,
    FALLBACK_AI_BASE_URL: process.env.FALLBACK_AI_BASE_URL,
  };
}

app.get('/api/ai/status', (_req, res) => {
  const fb = getFallbackInfo(getServerAIEnv());
  res.json({
    fallbackConfigured: fb.configured,
    fallbackRequiresSecret: fb.requiresSecret,
    fallbackProvider: fb.configured ? fb.provider : null,
  });
});

app.post('/api/ai/models', async (req, res) => {
  try {
    const body = req.body as { aiConfig?: AIConfigPayload };
    const result = await listProviderModels(body?.aiConfig, getServerAIEnv());
    res.json(result);
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to list models.' });
  }
});

app.post('/api/ai/verify-secret', (req, res) => {
  const body = req.body as { secretCode?: string };
  const env = getServerAIEnv();
  const fb = getFallbackInfo(env);
  if (!fb.configured) {
    res.status(404).json({
      valid: false,
      configured: false,
      error:
        'No server API key found in .env. Add GEMINI_API_KEY (or FALLBACK_AI_API_KEY / OPENROUTER_API_KEY / OPENAI_API_KEY / GROQ_API_KEY) to your .env file and restart the server.',
    });
    return;
  }
  if (!fb.requiresSecret) {
    res.json({ valid: true, configured: true, provider: fb.provider, defaultModel: fb.defaultModel });
    return;
  }
  if (!isFallbackSecretValid(body?.secretCode, env)) {
    res.status(403).json({ valid: false, configured: true, error: 'Incorrect secret access code.' });
    return;
  }
  res.json({ valid: true, configured: true, provider: fb.provider, defaultModel: fb.defaultModel });
});

app.post('/api/ai/detect-reviews', async (req, res) => {
  try {
    const body = req.body as {
      reviews?: ReviewAuditInput[];
      businessContext?: string;
      validOfferings?: ValidOfferingOption[];
      aiConfig?: AIConfigPayload;
    };
    const reviews = Array.isArray(body?.reviews) ? body.reviews : [];
    if (reviews.length === 0) {
      res.status(400).json({ error: 'No reviews to audit.' });
      return;
    }
    const env = getServerAIEnv();
    if (!resolveAIConfig(body?.aiConfig, env)) {
      res.status(403).json({
        error: 'Connect an AI provider (or unlock Fallback AI) to run the AI Authenticity Detector.',
      });
      return;
    }
    const { results, usage } = await detectReviewsWithAI(
      body?.aiConfig,
      env,
      reviews,
      typeof body?.businessContext === 'string' ? body.businessContext.slice(0, 500) : '',
      Array.isArray(body?.validOfferings) ? body.validOfferings.slice(0, 40) : undefined
    );
    res.json({ results, aiUsage: usage });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'AI detection failed.' });
  }
});

app.post('/api/ai/rewrite-reviews', async (req, res) => {
  try {
    const body = req.body as {
      reviews?: ReviewAuditInput[];
      businessContext?: string;
      validOfferings?: ValidOfferingOption[];
      avoidOpenings?: string[];
      detectedCountryCode?: string;
      aiConfig?: AIConfigPayload;
    };
    const reviews = Array.isArray(body?.reviews) ? body.reviews : [];
    if (reviews.length === 0) {
      res.status(400).json({ error: 'No flagged reviews to rewrite.' });
      return;
    }
    const env = getServerAIEnv();
    if (!resolveAIConfig(body?.aiConfig, env)) {
      res.status(403).json({
        error: 'Connect an AI provider (or unlock Fallback AI) to rewrite flagged reviews.',
      });
      return;
    }
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
    res.json({ rewrites, aiUsage: usage });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'AI rewrite failed.' });
  }
});

// ---------- API Route 1: Adapt Uploaded Product CSV ----------

app.post('/api/adapt-business', async (req, res) => {
  try {
    const body = req.body as {
      products?: {
        item_slug?: string;
        item_name: string;
        category: string;
        product_url?: string;
      }[];
      categories?: string[];
      languages?: string[];
      businessContext?: string;
      filename?: string;
      storeUrl?: string;
      aiConfig?: AIConfigPayload;
    };

    const products = Array.isArray(body?.products) ? body.products.slice(0, 50) : [];
    const categories = Array.isArray(body?.categories) ? body.categories.slice(0, 12) : [];
    const requestedLanguages = Array.isArray(body?.languages)
      ? body.languages.filter((l) => ALLOWED_LANGUAGES.has(l))
      : ['en'];
    const languages = requestedLanguages.length > 0 ? requestedLanguages : ['en'];
    const businessContext =
      typeof body?.businessContext === 'string'
        ? body.businessContext.trim().slice(0, 400)
        : '';
    const filename =
      typeof body?.filename === 'string' ? body.filename.trim().slice(0, 140) : '';
    const storeUrl =
      typeof body?.storeUrl === 'string' ? body.storeUrl.trim().slice(0, 180) : '';

    if (products.length === 0 && !businessContext) {
      res.status(400).json({
        error: 'Please upload products or describe your business before adapting copy.',
      });
      return;
    }

    const env = getServerAIEnv();
    if (!resolveAIConfig(body?.aiConfig, env)) {
      res.status(403).json({
        error:
          'No AI provider configured. Open AI Settings in the top bar to add your API key or enter the secret access code.',
      });
      return;
    }

    const sampleList = products
      .map(
        (p) =>
          `- slug="${p.item_slug || ''}" | name="${p.item_name}" | current_category="${p.category}"`
      )
      .join('\n');

    const prompt = `Auto-scan this uploaded store product catalog and build a category-aware, multi-language customer review sentence bank.

Uploaded file name: ${filename || '(none)'}
Store URL / domain: ${storeUrl || '(none)'}
User business notes: ${businessContext || '(Auto-detect brand, region, and niche from products, filename, and URL)'}
Current categories: ${categories.join(', ') || 'General'}
Products in uploaded file:
${sampleList || '(None provided — use business description)'}

Target languages to generate packs for: ${languages.join(', ')}

CRITICAL INSTRUCTIONS:
1. Product/Service Classification: For every offering slug listed above, output a clean, properly formatted offering name (never a website heading or slogan) and group items into specific, accurate sub-categories (clearly distinguish Maintenance vs. Repair vs. Installation vs. Leak/Plumbing vs. Renewables/Heat Pumps, or distinct product lines — never collapse distinct sub-services into one vague bucket!).
2. Per-Offering Contexts ("offeringContexts"): For EACH offering slug (up to 15 core slugs) and EACH target language (${languages.join(', ')}), generate an offeringContext entry with:
   - "localizedName": natural lowercase/cased noun phrase in THAT exact language (NEVER leave English service labels untranslated in FR/NL/DE/ES/AR!).
   - "distinctiveKeywords": 3–5 domain terms specific to THIS exact offering.
   - "scenarios", "actions", "outcomes": 3–4 distinct, natural, complete sentences strictly matching ONLY this exact offering (NO mechanical "{product}" pasting, NO cross-service mixing!).
3. Category-Specific Context: For EACH category and EACH target language (${languages.join(', ')}), generate a categoryContext entry where contextA and contextB are LOWERCASE noun phrases (never capitalized full sentences ending in periods!) so they embed cleanly inside sentences.
4. Store-Level Language Packs: For EACH target language (${languages.join(', ')}), generate a full languagePack covering stars 5, 4, 3, 2, and 1. Detect regional country code ("detectedCountryCode", e.g. BE, FR, NL, DE, GB, MA, CH) if evident from URL/filename/notes and use authentic regional phrasing. ZERO marketing clichés ("exceeded expectations", "worth every penny", "game-changer", "top-tier") and ZERO artificial spelling mistakes!
5. Grammar & Composability: Every sentence in openers, middles, closers, and extraTails MUST be a complete, grammatically self-contained sentence. Every value in tokens.timeframe must work smoothly after "in" (EN), "en" (FR/ES), "binnen" (NL), "f" (Darija), or "خلال" (AR) (e.g. "24h", "48h", "2 days").
6. Authentic Darija ("darija_latin"): Pure Latin script with natural numerals (3, 7, 9). Authentic Arabic ("ar"): Fluent Modern Arabic.
7. STRICT RATING & LOW-STAR HONESTY: 3-star titles/sentences must be neutral/mixed (never 5-star praise!). 1–2 star reviews must describe benign, realistic friction (scheduling wait, preference mismatch) — NEVER scam/fraud claims.
8. Placeholders: Use ONLY {product}, {contextA}, {contextB}, {duration}, {timeframe}.`;

    const { data, usage } = await generateJsonWithAI(body?.aiConfig, env, {
      systemInstruction:
        'You are a multilingual e-commerce and service-business localization specialist who analyzes uploaded catalogs and crafts authentic, category-accurate, non-generic customer review building blocks in any requested world language (including English, French, Spanish, German, Italian, Portuguese, Dutch, Arabic, Moroccan Darija in Latin script, Turkish, Russian, Chinese, Japanese, Korean, Hindi, and Polish).',
      prompt,
      jsonShapeHint: VOICE_PACK_JSON_HINT,
    });

    res.json({ pack: data, aiUsage: usage });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to adapt review copy to your business.';
    console.error('[/api/adapt-business] error:', message);
    res.status(500).json({ error: message });
  }
});

// ---------- API Route 2: Auto-Scan Website URL & Services ----------

app.post('/api/scan-website', async (req, res) => {
  try {
    const body = req.body as {
      url?: string;
      languages?: string[];
      businessContext?: string;
      aiConfig?: AIConfigPayload;
    };

    const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';
    const requestedLanguages = Array.isArray(body?.languages)
      ? body.languages.filter((l) => ALLOWED_LANGUAGES.has(l))
      : ['en'];
    const languages = requestedLanguages.length > 0 ? requestedLanguages : ['en'];
    const businessContext =
      typeof body?.businessContext === 'string'
        ? body.businessContext.trim().slice(0, 400)
        : '';

    const validatedUrl = await parseAndValidatePublicUrl(rawUrl);
    let ai: GoogleGenAI | null = null;
    try {
      ai = getGeminiClient();
    } catch {
      console.warn('[scan-website] No GEMINI_API_KEY: running keyless scraper mode.');
    }

    // 1. In parallel: fetch homepage HTML + probe Shopify /products.json
    const [homeResult, shopifyProducts] = await Promise.all([
      safeFetchPublicUrl(validatedUrl.toString()).catch((err: unknown) => ({
        error: err instanceof Error ? err.message : 'Fetch failed',
        finalUrl: validatedUrl,
        status: 0,
        contentType: '',
        text: '',
      })),
      tryFetchShopifyProducts(validatedUrl),
    ]);

    const finalOrigin = homeResult.finalUrl.origin;
    const scannedPages: ExtractedPageSignals[] = [];
    const jsonLdItems: ScrapedItem[] = [];
    const rawPages: { url: string; html: string }[] = [];

    if (homeResult.status >= 200 && homeResult.status < 400 && homeResult.text) {
      const homeSignals = extractHtmlSignals(homeResult.text, homeResult.finalUrl);
      scannedPages.push(homeSignals);
      rawPages.push({ url: homeResult.finalUrl.toString(), html: homeResult.text });
      jsonLdItems.push(...extractJsonLdItems(homeResult.text, homeResult.finalUrl));

      // 2. If not already a full Shopify catalog, fetch up to 3 high-signal subpages (services, pricing, menu, shop)
      if (shopifyProducts.length === 0 && homeSignals.navAndServiceLinks.length > 0) {
        const subLinks = homeSignals.navAndServiceLinks.slice(0, ai ? 3 : 6);
        const subResults = await Promise.allSettled(
          subLinks.map((link) => safeFetchPublicUrl(link.url))
        );
        for (const r of subResults) {
          if (
            r.status === 'fulfilled' &&
            r.value.status >= 200 &&
            r.value.status < 400 &&
            r.value.text
          ) {
            scannedPages.push(extractHtmlSignals(r.value.text, r.value.finalUrl));
            rawPages.push({ url: r.value.finalUrl.toString(), html: r.value.text });
            jsonLdItems.push(...extractJsonLdItems(r.value.text, r.value.finalUrl));
          }
        }
      }
    }

    // Keyless extraction (WooCommerce API, JSON-LD, sitemap, leaf offering links)
    const [wooItems, sitemapItems] =
      shopifyProducts.length > 0
        ? [[], []]
        : await Promise.all([
            tryWooCommerce(finalOrigin, safeFetchPublicUrl),
            extractSitemapItems(finalOrigin, safeFetchPublicUrl, homeResult.finalUrl),
          ]);
    const heuristicItems = mergeItems([
      wooItems,
      jsonLdItems,
      sitemapItems,
      itemsFromLinksAndHeadings(scannedPages, homeResult.finalUrl),
    ]);

    // Check how much real content we extracted; if site blocked fetch (Cloudflare/403) or is an empty SPA, run Search Grounding fallback
    const totalExtractedChars = scannedPages.reduce(
      (sum, p) => sum + p.title.length + p.metaDescription.length + p.bodyExcerpt.length,
      0
    );

    let searchFallbackSummary = '';
    if (ai && shopifyProducts.length === 0 && totalExtractedChars < 300 && heuristicItems.length === 0) {
      searchFallbackSummary = await lookupWebsiteViaSearch(ai, validatedUrl.toString());
      if (!searchFallbackSummary && scannedPages.length === 0) {
        res.status(502).json({
          error:
            'Could not read public content from that website (it may block automated requests). Try entering another page URL or paste a short description of your services.',
        });
        return;
      }
    }

    // Build compact, high-signal dossier for Gemini
    const shopifySection =
      shopifyProducts.length > 0
        ? `SHOPIFY CATALOG DETECTED (${shopifyProducts.length} products):\n${shopifyProducts
            .map(
              (p) =>
                `- slug="${p.item_slug}" | name="${p.item_name}" | type="${p.category}" | url="${p.product_url}"`
            )
            .join('\n')}`
        : '';

    const pagesSection = scannedPages
      .map((p, idx) => {
        const parts = [
          `--- PAGE ${idx + 1}: ${p.url} ---`,
          p.ogSiteName ? `Site Name: ${p.ogSiteName}` : '',
          p.title ? `Title: ${p.title}` : '',
          p.metaDescription ? `Meta Description: ${p.metaDescription}` : '',
          p.headings.length ? `Headings: ${p.headings.slice(0, 22).join(' | ')}` : '',
          p.navAndServiceLinks.length
            ? `Service/Product Links: ${p.navAndServiceLinks
                .slice(0, 15)
                .map((l) => `${l.text} (${l.url})`)
                .join('; ')}`
            : '',
          p.jsonLdSnippets.length
            ? `Structured Data (JSON-LD): ${p.jsonLdSnippets.join('\n').slice(0, 2400)}`
            : '',
          p.bodyExcerpt ? `Page Text Excerpt: ${p.bodyExcerpt.slice(0, 3200)}` : '',
        ];
        return parts.filter(Boolean).join('\n');
      })
      .join('\n\n');

    const prompt = `Scan this website's public information, identify the exact services or products they offer, and build a tailored multi-language customer review pack written specifically for their offerings.

Target Website URL: ${validatedUrl.toString()}
Optional user notes: ${businessContext || '(Auto-detect everything from the scanned website data below)'}

${shopifySection}

${pagesSection}

${searchFallbackSummary ? `WEB SEARCH SUMMARY FOR THIS WEBSITE:\n${searchFallbackSummary}` : ''}

Target languages to generate review packs for: ${languages.join(', ')}

CRITICAL INSTRUCTIONS:
1. Business Type & Strict Real Offerings Only:
   - Determine whether this website is a "service" business or an "ecommerce" store, and infer "detectedCountryCode" (ISO-2 like BE, NL, FR, DE, GB, MA, CH, US) from the domain, phone, address, or language tags.
   - ${
     shopifyProducts.length > 0
       ? 'Use the exact Shopify products listed above (keeping their exact item_slug and product_url) and group them into specific, accurate categories.'
       : 'Extract 6 to 14 concrete, REAL services, packages, plans, treatments, or products actually offered by this website. STRICTLY FORBIDDEN as items: website headings, process steps ("Tell us what you need", "We discuss the next step", "How it works"), slogans ("Care that suits your home", "Relax..."), navigation hubs ("Our services", "Solutions", "Service areas", "About us", "Customer feedback"), buttons/CTAs ("Book a technician", "Request a quote"), or city/location pages! Assign specific, distinct categories (clearly separate Maintenance, Repair, Installation, Plumbing/Leaks, Emergency, and Heat Pumps/Equipment — never lump distinct interventions together!).'
   }
2. Per-Offering Contexts ("offeringContexts") — ZERO Cross-Service Mixing & ZERO Mixed-Language Labels:
   - For EACH discovered offering slug and EACH target language (${languages.join(', ')}), generate an "offeringContexts" entry containing:
     * "localizedName": natural noun phrase in THAT exact language (e.g. for "heat-pumps": en="a heat pump", fr="une pompe à chaleur", nl="een warmtepomp" — NEVER paste English labels into FR/NL/DE/ES/AR!).
     * "distinctiveKeywords": 3–5 specific domain words unique to THIS exact offering.
     * "scenarios", "actions", "outcomes": 3–4 distinct, natural, complete sentences strictly describing ONLY this exact offering (e.g. a maintenance review MUST describe preventive inspection/cleaning/tune-up, NEVER an emergency breakdown; an installation review MUST describe fitting/replacing equipment, NEVER repairing an old valve; a leak review MUST describe pipe/joint leak repair, NEVER boiler burner codes!).
3. Authentic Natural Voice (Zero Artificial Typos, Zero Marketing Fluff):
   - Plain, grounded customer phrasing in the regional variety matching detectedCountryCode (e.g. Belgian French & Belgian Dutch if BE).
   - Mention the company name sparingly (at most 1 in 8 sentences) and NEVER in promotional slogan titles.
   - NEVER use e-commerce shipping/box/packaging words on a service business.
   - NEVER introduce spelling errors or chat slang ("reccomend", "thx", "vrmt"), and NEVER use marketing clichés ("exceeded expectations", "worth every penny", "game-changer", "top-tier").
4. Category & Language Packs: Ensure tokens.contextA and tokens.contextB are lowercase noun phrases (no trailing periods!) so placeholders compose cleanly. Keep 3-star content genuinely neutral/mixed and 1–2 star content honest scheduling/communication friction (no scam allegations). Use ONLY {product}, {contextA}, {contextB}, {duration}, {timeframe}.`;

    let parsed: ParsedScan | null = null;
    let aiUsage: AIUsageMetrics | null = null;
    const serverEnv = getServerAIEnv();
    if (resolveAIConfig(body?.aiConfig, serverEnv)) {
      try {
        const aiResult = await generateJsonWithAI<ParsedScan>(body?.aiConfig, serverEnv, {
          systemInstruction:
            'You are a multilingual business research and customer-experience copywriter who scans company websites, maps their real services or products, and writes authentic, non-generic customer review building blocks in any requested world language (including English, French, Spanish, German, Italian, Portuguese, Dutch, Arabic, Moroccan Darija in Latin script, Turkish, Russian, Chinese, Japanese, Korean, Hindi, and Polish).',
          prompt,
          jsonShapeHint: SCAN_WEBSITE_JSON_HINT,
        });
        parsed = aiResult.data;
        aiUsage = aiResult.usage;
      } catch (aiErr) {
        console.warn('[scan-website] AI step failed, using keyless results:', aiErr instanceof Error ? aiErr.message : aiErr);
      }
    }
    type _Unused = {
      businessType?: string;
      discoveredItems?: Array<{
        item_name: string;
        item_slug: string;
        category: string;
        product_url?: string;
      }>;
      detectedBusinessName: string;
      businessSummary: string;
      productClassifications?: Array<{
        item_slug: string;
        cleanName: string;
        category: string;
      }>;
      categoryContext?: unknown[];
      languagePacks: unknown[];
    };
    void (0 as unknown as _Unused);

    // Build final catalog items: prefer exact Shopify IDs/URLs when found, otherwise use AI-discovered real services/products
    const classMap = new Map(
      (parsed?.productClassifications || []).map((c) => [c.item_slug.toLowerCase(), c])
    );

    const filteredAiItems = (parsed?.discoveredItems || []).filter((it) =>
      isValidOfferingName(String(it.item_name || ''), String(it.item_slug || ''))
    );

    const rawChosenItems = filteredAiItems.length > 0 ? filteredAiItems : heuristicItems;
    const seenFinalSlugs = new Set<string>();

    const finalProducts =
      shopifyProducts.length > 0
        ? shopifyProducts.map((sp) => {
            const cls = classMap.get(sp.item_slug.toLowerCase());
            return {
              item_id: sp.item_id,
              item_slug: sp.item_slug,
              item_name: cls?.cleanName?.trim() || sp.item_name,
              category: cls?.category?.trim() || sp.category,
              product_url: sp.product_url,
            };
          })
        : rawChosenItems
            .filter((item) => {
              const slug = slugifySafe(item.item_slug || item.item_name, 1);
              if (seenFinalSlugs.has(slug)) return false;
              seenFinalSlugs.add(slug);
              return true;
            })
            .slice(0, 24)
            .map((item, idx) => {
              const slug = slugifySafe(item.item_slug || item.item_name, idx + 1);
              const cleanName = String(item.item_name || slug).trim();
              const refinedCat = inferAccurateCategory(cleanName, slug, String(item.category || '').trim());
              return {
                item_id: String(idx + 1),
                item_slug: slug,
                item_name: cleanName,
                category: refinedCat,
                product_url: sanitizeHttpUrl(item.product_url, finalOrigin, slug),
              };
            });

    if (finalProducts.length === 0) {
      res.status(502).json({
        error: 'Could not identify specific services or products on that website. Try pasting a subpage URL (like /services or /shop).',
      });
      return;
    }

    const detectedFormat = shopifyProducts.length > 0 ? 'shopify' : 'website';
    const isEcommerce =
      shopifyProducts.length > 0 || wooItems.length > 0 || parsed?.businessType?.toLowerCase() === 'ecommerce';
    const detectedName =
      parsed?.detectedBusinessName || businessNameFrom(scannedPages[0] || { ogSiteName: '', title: '' }, homeResult.finalUrl.hostname);
    const metaDesc = scannedPages[0]?.metaDescription?.trim() || '';
    const uniqueCats = Array.from(new Set(finalProducts.map((p) => p.category))).slice(0, 4);
    const sampleOfferings = finalProducts.slice(0, 4).map((p) => p.item_name);
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
      (parsed?.detectedCountryCode || '').trim().toUpperCase() ||
      builtProfile.detectedCountryCode ||
      undefined;

    res.json({
      businessProfile: { ...builtProfile, detectedCountryCode: resolvedCountry },
      scannedUrl: homeResult.finalUrl.toString(),
      hostname: homeResult.finalUrl.hostname,
      scannedPagesCount: Math.max(1, scannedPages.length),
      businessType: isEcommerce ? 'ecommerce' : 'service',
      detectedFormat,
      detectedStoreBaseUrl:
        shopifyProducts.length > 0
          ? `${finalOrigin}/products`
          : finalOrigin,
      products: finalProducts,
      aiUsed: Boolean(parsed),
      aiUsage,
      detectedBusinessName: detectedName,
      detectedBusinessSummary: detectedSummary,
      detectedCountryCode: resolvedCountry,
      pack: parsed
        ? {
            detectedBusinessName: parsed.detectedBusinessName,
            businessSummary: parsed.businessSummary,
            detectedCountryCode: resolvedCountry,
            productClassifications: parsed.productClassifications,
            offeringContexts: parsed.offeringContexts,
            categoryContext: parsed.categoryContext,
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
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to scan the website.';
    const isValidationError =
      /valid website|protocol|credentials|public website|private|reserved|resolve domain|DNS/i.test(
        message
      );
    console.error('[/api/scan-website] error:', message);
    res.status(isValidationError ? 400 : 500).json({ error: message });
  }
});

interface ParsedScan {
  businessType?: string;
  detectedCountryCode?: string;
  discoveredItems?: Array<{ item_name: string; item_slug: string; category: string; product_url?: string }>;
  detectedBusinessName: string;
  businessSummary: string;
  productClassifications?: Array<{ item_slug: string; cleanName: string; category: string }>;
  offeringContexts?: unknown[];
  categoryContext?: unknown[];
  languagePacks: unknown[];
}

async function startServer() {
  if (!IS_PROD) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReviewForge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
