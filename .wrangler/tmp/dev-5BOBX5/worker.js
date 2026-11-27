var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// scan-core.ts
var MAX_FETCH_BYTES = 12e5;
var FETCH_TIMEOUT_MS = 8e3;
var IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
function isPrivateIPv4(ip) {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 || a === 192 && b === 0 || a === 198 && (b === 18 || b === 19) || a >= 224;
}
__name(isPrivateIPv4, "isPrivateIPv4");
function parseAndValidatePublicUrlSync(rawInput) {
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.length > 500) throw new Error("Please enter a valid website URL (e.g., https://example.com).");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Invalid website URL format. Please check the address and try again.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Only http:// and https:// website URLs are supported.");
  if (parsed.username || parsed.password) throw new Error("Website URLs cannot contain embedded credentials.");
  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  const isV6 = host.startsWith("[") || host.includes(":");
  const isV4 = IPV4.test(host);
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || isV6 || !host.includes(".") && !isV4) {
    throw new Error("Please enter a public website domain (private or local addresses are not allowed).");
  }
  if (isV4 && isPrivateIPv4(host)) throw new Error("Private or reserved network addresses cannot be scanned.");
  return parsed;
}
__name(parseAndValidatePublicUrlSync, "parseAndValidatePublicUrlSync");
async function readResponseTextCapped(response, maxBytes) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      if (total + value.byteLength > maxBytes) {
        const remaining = maxBytes - total;
        if (remaining > 0) {
          chunks.push(value.subarray(0, remaining));
          total += remaining;
        }
        await reader.cancel().catch(() => {
        });
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
    }
  }
  const combined = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    combined.set(c, off);
    off += c.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(combined);
}
__name(readResponseTextCapped, "readResponseTextCapped");
async function safeFetchPublicUrl(rawUrl, acceptHeader = "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8") {
  let currentUrl = parseAndValidatePublicUrlSync(rawUrl);
  for (let hop = 0; hop < 4; hop++) {
    const response = await fetch(currentUrl.toString(), {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: acceptHeader,
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8,ar;q=0.7"
      }
    });
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      currentUrl = parseAndValidatePublicUrlSync(new URL(response.headers.get("location"), currentUrl).toString());
      continue;
    }
    const text = await readResponseTextCapped(response, MAX_FETCH_BYTES);
    return { finalUrl: currentUrl, status: response.status, contentType: response.headers.get("content-type") || "", text };
  }
  throw new Error("Too many redirects while loading the target website.");
}
__name(safeFetchPublicUrl, "safeFetchPublicUrl");
function decodeHtmlEntities(str) {
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(Number(dec))).replace(/\s+/g, " ").trim();
}
__name(decodeHtmlEntities, "decodeHtmlEntities");
function stripTags(html) {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " "));
}
__name(stripTags, "stripTags");
var HIGH_SIGNAL_PATH_REGEX = /\/(services?|solutions?|offerings?|pricing|plans?|packages?|treatments?|menu|products?|collections?|shop|store|catalog|features?|about|programs?|courses?|booking|appointments?)\b/i;
function extractHtmlSignals(html, pageUrl) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).slice(0, 180) : "";
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) || html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const metaDescription = descMatch ? decodeHtmlEntities(descMatch[1]).slice(0, 320) : "";
  const ogSiteMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
  const ogSiteName = ogSiteMatch ? decodeHtmlEntities(ogSiteMatch[1]).slice(0, 120) : "";
  const jsonLdSnippets = [];
  const ldRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ldMatch;
  while ((ldMatch = ldRegex.exec(html)) !== null && jsonLdSnippets.length < 6) {
    const raw = ldMatch[1].trim();
    if (raw.length > 20 && raw.length < 6e3) {
      jsonLdSnippets.push(raw.slice(0, 1800));
    }
  }
  const navAndServiceLinks = [];
  const seenLinks = /* @__PURE__ */ new Set();
  const linkRegex = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let aMatch;
  while ((aMatch = linkRegex.exec(html)) !== null && navAndServiceLinks.length < 30) {
    const rawHref = aMatch[1].trim();
    const linkText = stripTags(aMatch[2]).slice(0, 90);
    if (!rawHref || /^(mailto:|tel:|javascript:|data:)/i.test(rawHref)) continue;
    try {
      const resolved = new URL(rawHref, pageUrl);
      if (resolved.hostname !== pageUrl.hostname) continue;
      const cleanUrl = `${resolved.origin}${resolved.pathname}`;
      if (seenLinks.has(cleanUrl) || resolved.pathname === "/" || resolved.pathname === pageUrl.pathname) {
        continue;
      }
      if (HIGH_SIGNAL_PATH_REGEX.test(resolved.pathname) || /\b(service|pricing|plan|product|shop|collection|menu|treatment|solution|package|course|prestation|tarif|produit|خدمة|خدمات)\b/i.test(
        linkText
      )) {
        seenLinks.add(cleanUrl);
        navAndServiceLinks.push({ text: linkText || resolved.pathname, url: cleanUrl });
      }
    } catch {
    }
  }
  const cleanedHtml = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<svg[\s\S]*?<\/svg>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const headings = [];
  const seenHeadings = /* @__PURE__ */ new Set();
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let hMatch;
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
    bodyExcerpt
  };
}
__name(extractHtmlSignals, "extractHtmlSignals");
async function tryFetchShopifyProducts(baseUrl) {
  try {
    const endpoint = `${baseUrl.origin}/products.json?limit=50`;
    const res = await safeFetchPublicUrl(endpoint, "application/json");
    if (res.status !== 200 || !res.text.trim().startsWith("{")) return [];
    const data = JSON.parse(res.text);
    if (!Array.isArray(data?.products) || data.products.length === 0) return [];
    const localePrefixMatch = baseUrl.pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(?:\/|$)/i);
    const productsPrefix = localePrefixMatch ? `${baseUrl.origin}/${localePrefixMatch[1]}/products` : `${baseUrl.origin}/products`;
    return data.products.filter((p) => p && (p.title || p.handle)).slice(0, 50).map((p, idx) => {
      const handle = String(p.handle || `item-${idx + 1}`).trim();
      return {
        item_id: String(p.id || idx + 1),
        item_slug: handle,
        item_name: String(p.title || handle).trim(),
        category: String(p.product_type || "").trim() || "General",
        product_url: `${productsPrefix}/${handle}`
      };
    });
  } catch {
    return [];
  }
}
__name(tryFetchShopifyProducts, "tryFetchShopifyProducts");

// scraper.ts
var SIGNAL_PATH = /\/(services?|solutions?|offerings?|pricing|plans?|packages?|treatments?|menu|products?|collections?|shop|store|catalog|features?|programs?|courses?|prestations?|produits?|tarifs?|soins?|categor(?:y|ies))\//i;
var JUNK_NAME = /^(home|about( us)?|contact( us)?|blog|news|faq|login|log in|sign ?up|register|cart|checkout|privacy|terms|policy|search|menu|skip to content|read more|learn more|get started|book now|view all|shop all)$/i;
function slugify(v, i) {
  const s = v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || `item-${i}`;
}
__name(slugify, "slugify");
function titleFromSlug(slug) {
  return decodeURIComponent(slug).replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
__name(titleFromSlug, "titleFromSlug");
function cleanText(v) {
  return String(v ?? "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
__name(cleanText, "cleanText");
function goodName(n) {
  return n.length >= 3 && n.length <= 70 && n.split(" ").length <= 9 && !JUNK_NAME.test(n);
}
__name(goodName, "goodName");
var JUNK_PATH = /\/(legal|customers?|glossary|terms|privacy|careers?|jobs|press|blog|news|support|help|docs|contact|about|login|signin|signup|cart|account)(\/|$)/i;
function categoryFromUrl(u) {
  const seg = u.pathname.split("/").filter(Boolean);
  const first = seg.find((s) => !/^[a-z]{2}(-[a-z]{2})?$/i.test(s));
  return first && seg.length > 1 ? titleFromSlug(first) : "";
}
__name(categoryFromUrl, "categoryFromUrl");
async function tryWooCommerce(origin, fetcher) {
  try {
    const r = await fetcher(`${origin}/wp-json/wc/store/v1/products?per_page=50`, "application/json");
    if (r.status !== 200 || !r.text.trim().startsWith("[")) return [];
    const arr = JSON.parse(r.text);
    return arr.filter((p) => p?.name).slice(0, 50).map((p, i) => ({
      item_id: String(p.id ?? i + 1),
      item_slug: p.slug || slugify(p.name, i + 1),
      item_name: cleanText(p.name),
      category: cleanText(p.categories?.[0]?.name) || "General",
      product_url: p.permalink || `${origin}/product/${p.slug}`
    }));
  } catch {
    return [];
  }
}
__name(tryWooCommerce, "tryWooCommerce");
var ITEM_TYPES = /^(Product|Service|Course|MenuItem|Offer|IndividualProduct|ProductModel|SoftwareApplication|Event|Physician|MedicalProcedure)$/i;
function walkLd(node, out, depth = 0) {
  if (!node || depth > 7 || out.length > 80) return;
  if (Array.isArray(node)) {
    node.forEach((n) => walkLd(n, out, depth + 1));
    return;
  }
  if (typeof node !== "object") return;
  const o = node;
  const types = [].concat(o["@type"] || []);
  if (types.some((t) => ITEM_TYPES.test(String(t))) && typeof o.name === "string") {
    out.push({
      name: cleanText(o.name),
      url: typeof o.url === "string" ? o.url : void 0,
      category: typeof o.category === "string" ? cleanText(o.category) : void 0
    });
  }
  if (types.includes("OfferCatalog") && Array.isArray(o.itemListElement)) {
    const catName = cleanText(o.name);
    for (const el of o.itemListElement) {
      const inner = [];
      walkLd(el, inner, depth + 1);
      inner.forEach((i) => out.push({ ...i, category: i.category || catName }));
    }
    return;
  }
  for (const k of Object.keys(o)) {
    if (k === "@context") continue;
    walkLd(o[k], out, depth + 1);
  }
}
__name(walkLd, "walkLd");
function extractJsonLdItems(html, pageUrl) {
  const items = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const found = [];
      walkLd(JSON.parse(m[1].trim()), found);
      for (const f of found) {
        if (!goodName(f.name)) continue;
        let url = pageUrl.toString();
        try {
          if (f.url) url = new URL(f.url, pageUrl).toString();
        } catch {
        }
        items.push({
          item_id: "",
          item_slug: slugify(f.name, items.length + 1),
          item_name: f.name,
          category: f.category || "",
          product_url: url
        });
      }
    } catch {
    }
  }
  return items;
}
__name(extractJsonLdItems, "extractJsonLdItems");
async function extractSitemapItems(origin, fetcher) {
  const locs = [];
  const grab = /* @__PURE__ */ __name((xml) => {
    const re = /<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi;
    const found = [];
    let m;
    while ((m = re.exec(xml)) !== null) found.push(m[1]);
    return found;
  }, "grab");
  try {
    const root = await fetcher(`${origin}/sitemap.xml`, "application/xml,text/xml,*/*");
    if (root.status !== 200 || !/<(urlset|sitemapindex)/i.test(root.text)) return [];
    let urls = grab(root.text);
    if (/<sitemapindex/i.test(root.text)) {
      const children = urls.filter((u) => !/(post|blog|news|page|author|tag)/i.test(u) || /(product|service)/i.test(u)).slice(0, 4);
      const results = await Promise.allSettled(children.map((c) => fetcher(c, "application/xml,text/xml,*/*")));
      urls = [];
      for (const r of results) if (r.status === "fulfilled" && r.value.status === 200) urls.push(...grab(r.value.text));
    }
    locs.push(...urls);
  } catch {
    return [];
  }
  const items = [];
  for (const raw of locs) {
    try {
      const u = new URL(raw);
      if (u.origin !== origin || !SIGNAL_PATH.test(u.pathname.endsWith("/") ? u.pathname : u.pathname + "/")) continue;
      const segs = u.pathname.split("/").filter(Boolean);
      if (segs.length < 2) continue;
      const last = segs[segs.length - 1];
      const name = titleFromSlug(last);
      if (!goodName(name)) continue;
      items.push({
        item_id: "",
        item_slug: slugify(last, items.length + 1),
        item_name: name,
        category: categoryFromUrl(u),
        product_url: `${u.origin}${u.pathname}`
      });
      if (items.length >= 60) break;
    } catch {
    }
  }
  return items;
}
__name(extractSitemapItems, "extractSitemapItems");
function itemsFromLinksAndHeadings(pages) {
  const items = [];
  pages.forEach((p, idx) => {
    for (const l of p.navAndServiceLinks) {
      const name = cleanText(l.text);
      if (!goodName(name) || /^see all|^explore |^view all/i.test(name)) continue;
      try {
        if (JUNK_PATH.test(new URL(l.url).pathname)) continue;
      } catch {
        continue;
      }
      let cat = "";
      try {
        cat = categoryFromUrl(new URL(l.url));
      } catch {
      }
      items.push({ item_id: "", item_slug: slugify(name, items.length + 1), item_name: name, category: cat, product_url: l.url });
    }
    if (idx > 0) {
      for (const h of p.headings.slice(0, 12)) {
        const name = cleanText(h);
        if (!goodName(name) || name.split(" ").length > 9) continue;
        items.push({ item_id: "", item_slug: slugify(name, items.length + 1), item_name: name, category: "", product_url: p.url });
      }
    }
  });
  if (items.length === 0 && pages[0]) {
    for (const h of pages[0].headings.slice(0, 15)) {
      const name = cleanText(h);
      if (!goodName(name)) continue;
      items.push({ item_id: "", item_slug: slugify(name, items.length + 1), item_name: name, category: "", product_url: pages[0].url });
    }
  }
  return items;
}
__name(itemsFromLinksAndHeadings, "itemsFromLinksAndHeadings");
function mergeItems(groups, max = 30) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const g of groups) {
    for (const it of g) {
      const key = it.item_slug || slugify(it.item_name, out.length);
      const nameKey = it.item_name.toLowerCase();
      if (seen.has(key) || seen.has(nameKey)) continue;
      seen.add(key);
      seen.add(nameKey);
      out.push({ ...it, item_id: String(out.length + 1), category: it.category || "Services" });
      if (out.length >= max) return out;
    }
  }
  return out;
}
__name(mergeItems, "mergeItems");
function businessNameFrom(page, hostname) {
  const raw = page.ogSiteName || page.title.split(/[|\u2013\u2014-]/).pop() || hostname;
  const n = cleanText(raw).slice(0, 60);
  return n || hostname.replace(/^www\./, "");
}
__name(businessNameFrom, "businessNameFrom");

// worker.ts
var json = /* @__PURE__ */ __name((body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
}), "json");
async function scanWebsite(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }
  let validated;
  try {
    validated = parseAndValidatePublicUrlSync(typeof body?.url === "string" ? body.url : "");
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Invalid URL." }, 400);
  }
  try {
    const [home, shopify] = await Promise.all([
      safeFetchPublicUrl(validated.toString()).catch(() => null),
      tryFetchShopifyProducts(validated)
    ]);
    if (!home) {
      return json({ error: "Could not load that website (it may be down or block automated requests)." }, 502);
    }
    const origin = home.finalUrl.origin;
    const pages = [];
    const ld = [];
    if (home.status >= 200 && home.status < 400 && home.text) {
      const sig = extractHtmlSignals(home.text, home.finalUrl);
      pages.push(sig);
      ld.push(...extractJsonLdItems(home.text, home.finalUrl));
      if (shopify.length === 0) {
        const subs = await Promise.allSettled(sig.navAndServiceLinks.slice(0, 5).map((l) => safeFetchPublicUrl(l.url)));
        for (const r of subs) {
          if (r.status === "fulfilled" && r.value.status >= 200 && r.value.status < 400 && r.value.text) {
            pages.push(extractHtmlSignals(r.value.text, r.value.finalUrl));
            ld.push(...extractJsonLdItems(r.value.text, r.value.finalUrl));
          }
        }
      }
    }
    const [woo, sitemap] = shopify.length > 0 ? [[], []] : await Promise.all([tryWooCommerce(origin, safeFetchPublicUrl), extractSitemapItems(origin, safeFetchPublicUrl)]);
    const products = shopify.length > 0 ? shopify.map((p) => ({ ...p })) : mergeItems([woo, ld, sitemap, itemsFromLinksAndHeadings(pages)]);
    if (products.length === 0) {
      return json(
        {
          error: "Could not identify specific services or products on that website. Try pasting a subpage URL (like /services or /shop)."
        },
        502
      );
    }
    const isEcommerce = shopify.length > 0 || woo.length > 0;
    return json({
      scannedUrl: home.finalUrl.toString(),
      hostname: home.finalUrl.hostname,
      scannedPagesCount: Math.max(1, pages.length),
      businessType: isEcommerce ? "ecommerce" : "service",
      detectedFormat: shopify.length > 0 ? "shopify" : "website",
      detectedStoreBaseUrl: shopify.length > 0 ? `${origin}/products` : origin,
      aiUsed: false,
      detectedBusinessName: businessNameFrom(pages[0] || { ogSiteName: "", title: "" }, home.finalUrl.hostname),
      products,
      pack: null
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Failed to scan the website." }, 500);
  }
}
__name(scanWebsite, "scanWebsite");
var worker_default = {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (pathname === "/api/scan-website") {
      return req.method === "POST" ? scanWebsite(req) : json({ error: "Method not allowed. Use POST." }, 405);
    }
    if (pathname === "/api/adapt-business") {
      return json({ error: "AI adaptation is not available on the Cloudflare deployment. Scanning works without it." }, 501);
    }
    if (pathname.startsWith("/api/")) return json({ error: "Not found." }, 404);
    return env.ASSETS.fetch(req);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-t7C61T/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-t7C61T/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
