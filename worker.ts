// Cloudflare Worker entry: serves the built SPA (static assets) and the /api routes.
import {
  parseAndValidatePublicUrlSync,
  safeFetchPublicUrl,
  extractHtmlSignals,
  tryFetchShopifyProducts,
  type ExtractedPageSignals,
} from './scan-core.ts';
import {
  tryWooCommerce,
  extractJsonLdItems,
  extractSitemapItems,
  itemsFromLinksAndHeadings,
  mergeItems,
  businessNameFrom,
  type ScrapedItem,
} from './scraper.ts';

interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

async function scanWebsite(req: Request): Promise<Response> {
  let body: { url?: string };
  try {
    body = (await req.json()) as { url?: string };
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  let validated: URL;
  try {
    validated = parseAndValidatePublicUrlSync(typeof body?.url === 'string' ? body.url : '');
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Invalid URL.' }, 400);
  }

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

    if (home.status >= 200 && home.status < 400 && home.text) {
      const sig = extractHtmlSignals(home.text, home.finalUrl);
      pages.push(sig);
      ld.push(...extractJsonLdItems(home.text, home.finalUrl));
      if (shopify.length === 0) {
        const subs = await Promise.allSettled(sig.navAndServiceLinks.slice(0, 5).map((l) => safeFetchPublicUrl(l.url)));
        for (const r of subs) {
          if (r.status === 'fulfilled' && r.value.status >= 200 && r.value.status < 400 && r.value.text) {
            pages.push(extractHtmlSignals(r.value.text, r.value.finalUrl));
            ld.push(...extractJsonLdItems(r.value.text, r.value.finalUrl));
          }
        }
      }
    }

    const [woo, sitemap] =
      shopify.length > 0
        ? [[], []]
        : await Promise.all([tryWooCommerce(origin, safeFetchPublicUrl), extractSitemapItems(origin, safeFetchPublicUrl)]);

    const products =
      shopify.length > 0
        ? shopify.map((p) => ({ ...p }))
        : mergeItems([woo, ld, sitemap, itemsFromLinksAndHeadings(pages)]);

    if (products.length === 0) {
      return json(
        {
          error:
            'Could not identify specific services or products on that website. Try pasting a subpage URL (like /services or /shop).',
        },
        502
      );
    }

    const isEcommerce = shopify.length > 0 || woo.length > 0;
    return json({
      scannedUrl: home.finalUrl.toString(),
      hostname: home.finalUrl.hostname,
      scannedPagesCount: Math.max(1, pages.length),
      businessType: isEcommerce ? 'ecommerce' : 'service',
      detectedFormat: shopify.length > 0 ? 'shopify' : 'website',
      detectedStoreBaseUrl: shopify.length > 0 ? `${origin}/products` : origin,
      aiUsed: false,
      detectedBusinessName: businessNameFrom(pages[0] || { ogSiteName: '', title: '' }, home.finalUrl.hostname),
      products,
      pack: null,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Failed to scan the website.' }, 500);
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname === '/api/scan-website') {
      return req.method === 'POST' ? scanWebsite(req) : json({ error: 'Method not allowed. Use POST.' }, 405);
    }
    if (pathname === '/api/adapt-business') {
      return json({ error: 'AI adaptation is not available on the Cloudflare deployment. Scanning works without it.' }, 501);
    }
    if (pathname.startsWith('/api/')) return json({ error: 'Not found.' }, 404);
    return env.ASSETS.fetch(req);
  },
};
