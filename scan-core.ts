// Runtime-agnostic scan core (Cloudflare Workers / Node). No node: imports.
export const MAX_FETCH_BYTES = 1_200_000;
export const FETCH_TIMEOUT_MS = 8_000;

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) || a >= 224
  );
}

export function parseAndValidatePublicUrlSync(rawInput: string): URL {
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.length > 500) throw new Error('Please enter a valid website URL (e.g., https://example.com).');
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('Invalid website URL format. Please check the address and try again.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Only http:// and https:// website URLs are supported.');
  if (parsed.username || parsed.password) throw new Error('Website URLs cannot contain embedded credentials.');
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  const isV6 = host.startsWith('[') || host.includes(':');
  const isV4 = IPV4.test(host);
  if (
    !host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
    host.endsWith('.internal') || isV6 || (!host.includes('.') && !isV4)
  ) {
    throw new Error('Please enter a public website domain (private or local addresses are not allowed).');
  }
  if (isV4 && isPrivateIPv4(host)) throw new Error('Private or reserved network addresses cannot be scanned.');
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
        if (remaining > 0) { chunks.push(value.subarray(0, remaining)); total += remaining; }
        await reader.cancel().catch(() => {});
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    try { reader.releaseLock(); } catch { /* ignore */ }
  }
  const combined = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { combined.set(c, off); off += c.byteLength; }
  return new TextDecoder('utf-8', { fatal: false }).decode(combined);
}

export async function safeFetchPublicUrl(
  rawUrl: string,
  acceptHeader = 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
): Promise<{ finalUrl: URL; status: number; contentType: string; text: string }> {
  let currentUrl = parseAndValidatePublicUrlSync(rawUrl);
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetch(currentUrl.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: acceptHeader,
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ar;q=0.7',
      },
    });
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      currentUrl = parseAndValidatePublicUrlSync(new URL(response.headers.get('location')!, currentUrl).toString());
      continue;
    }
    const text = await readResponseTextCapped(response, MAX_FETCH_BYTES);
    return { finalUrl: currentUrl, status: response.status, contentType: response.headers.get('content-type') || '', text };
  }
  throw new Error('Too many redirects while loading the target website.');
}
export function decodeHtmlEntities(str: string): string {
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

export interface ExtractedPageSignals {
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

export function extractHtmlSignals(html: string, pageUrl: URL): ExtractedPageSignals {
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

export interface ShopifyProductItem {
  item_id: string;
  item_slug: string;
  item_name: string;
  category: string;
  product_url: string;
}

export async function tryFetchShopifyProducts(baseUrl: URL): Promise<ShopifyProductItem[]> {
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

