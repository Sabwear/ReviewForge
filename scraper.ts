// Keyless website scraper: extracts services/products from a site without any AI API.
// Sources (in priority order): WooCommerce Store API, JSON-LD structured data,
// sitemap.xml URLs, high-signal internal links, and subpage headings.

export interface ScrapedItem {
  item_id: string;
  item_slug: string;
  item_name: string;
  category: string;
  product_url: string;
}

type Fetcher = (
  url: string,
  accept?: string
) => Promise<{ finalUrl: URL; status: number; contentType: string; text: string }>;

const SIGNAL_PATH =
  /\/(services?|solutions?|offerings?|pricing|plans?|packages?|treatments?|menu|products?|collections?|shop|store|catalog|features?|programs?|courses?|prestations?|produits?|tarifs?|soins?|diensten|interventions?|depannage|reparations?)\//i;

const JUNK_PATH =
  /\/(legal|customers?|glossary|terms|privacy|careers?|jobs|press|blog|news|support|help|docs|contact|about|over-ons|a-propos|login|signin|signup|cart|account|service-areas?|areas?|locations?|cities|werkgebied|zones?|regio|steden|faq|reviews?|testimonials?|partners?|author|tag|category)(\/|$)/i;

const JUNK_NAME =
  /^(home|about( us)?|contact( us)?|blog|news|faq|login|log in|sign ?up|register|cart|checkout|privacy|terms|policy|search|menu|skip to content|read more|learn more|get started|book now|view all|shop all|services?|our services|all services|service areas?|areas? we serve|locations?|solutions?|our solutions|products?|our products|pricing|plans?|about .+|why choose us|how it works|testimonials?|reviews?|contact|get a quote|request a quote|free quote|call now|whatsapp)$/i;

const MARKETING_SLOGAN_START =
  /^(your |about |why |how |what |who |where |clear |advice |trusted |authorized |certified |welcome |discover |meet |get |find |need |looking for |serving |available )/i;

function slugify(v: string, i: number): string {
  const s = v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || `item-${i}`;
}

function titleFromSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function cleanText(v: unknown): string {
  return String(v ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function goodName(n: string): boolean {
  const words = n.split(/\s+/).filter(Boolean);
  if (n.length < 3 || n.length > 58 || words.length > 6) return false;
  if (JUNK_NAME.test(n)) return false;
  if (MARKETING_SLOGAN_START.test(n)) return false;
  if (/[?!]/.test(n)) return false;
  return true;
}

function categoryFromUrl(u: URL): string {
  const seg = u.pathname.split('/').filter(Boolean);
  const first = seg.find((s) => !/^[a-z]{2}(-[a-z]{2})?$/i.test(s));
  return first && seg.length > 1 ? titleFromSlug(first) : '';
}

function inferAccurateCategory(name: string, slug: string, rawCategory: string): string {
  const text = `${name} ${slug}`.toLowerCase();
  if (/emergenc|urgent|spoed|dépannage|depannage|24\/7|notdienst/i.test(text)) {
    return 'Emergency Repairs';
  }
  if (/boiler|heat pump|heating|chauffage|verwarming|ketel|hot water|water heater|radiator|thermostat|hvac/i.test(text)) {
    return 'Heating & Boilers';
  }
  if (/leak|lek|fuite|plumb|plombier|loodgieter|pipe|drain|sink|toilet|tap|faucet/i.test(text)) {
    return 'Plumbing & Leaks';
  }
  if (/install|setup|montage|plaatsing|pose/i.test(text)) {
    return 'Installations';
  }
  if (/maintenance|entretien|onderhoud|inspection|checkup|service plan/i.test(text)) {
    return 'Maintenance';
  }
  if (/electr|wiring|panel|breaker|outlet|lighting/i.test(text)) {
    return 'Electrical';
  }
  if (/clean|nettoyage|schoonmaak|maid|carpet|window/i.test(text)) {
    return 'Cleaning';
  }
  if (/dental|dentist|implant|whitening|orthodont|clinic|physio|therapy/i.test(text)) {
    return 'Clinical Care';
  }
  if (/seo|web|design|marketing|branding|ads|social|audit|consult/i.test(text)) {
    return 'Digital & Consulting';
  }
  const cleanRaw = rawCategory.trim();
  if (cleanRaw && !/^(services?|solutions?|general|pages?|en|fr|nl|de)$/i.test(cleanRaw)) {
    return cleanRaw;
  }
  return 'General Services';
}

// ---- WooCommerce ----
export async function tryWooCommerce(origin: string, fetcher: Fetcher): Promise<ScrapedItem[]> {
  try {
    const r = await fetcher(`${origin}/wp-json/wc/store/v1/products?per_page=50`, 'application/json');
    if (r.status !== 200 || !r.text.trim().startsWith('[')) return [];
    const arr = JSON.parse(r.text) as Array<{
      id?: number;
      name?: string;
      slug?: string;
      permalink?: string;
      categories?: { name?: string }[];
    }>;
    return arr
      .filter((p) => p?.name)
      .slice(0, 50)
      .map((p, i) => ({
        item_id: String(p.id ?? i + 1),
        item_slug: p.slug || slugify(p.name!, i + 1),
        item_name: cleanText(p.name),
        category: cleanText(p.categories?.[0]?.name) || 'General',
        product_url: p.permalink || `${origin}/product/${p.slug}`,
      }));
  } catch {
    return [];
  }
}

// ---- JSON-LD ----
const ITEM_TYPES =
  /^(Product|Service|Course|MenuItem|Offer|IndividualProduct|ProductModel|SoftwareApplication|Event|Physician|MedicalProcedure)$/i;

function walkLd(node: unknown, out: { name: string; url?: string; category?: string }[], depth = 0) {
  if (!node || depth > 7 || out.length > 80) return;
  if (Array.isArray(node)) {
    node.forEach((n) => walkLd(n, out, depth + 1));
    return;
  }
  if (typeof node !== 'object') return;
  const o = node as Record<string, any>;
  const types = ([] as string[]).concat(o['@type'] || []);
  if (types.some((t) => ITEM_TYPES.test(String(t))) && typeof o.name === 'string') {
    out.push({
      name: cleanText(o.name),
      url: typeof o.url === 'string' ? o.url : undefined,
      category: typeof o.category === 'string' ? cleanText(o.category) : undefined,
    });
  }
  if (types.includes('OfferCatalog') && Array.isArray(o.itemListElement)) {
    const catName = cleanText(o.name);
    for (const el of o.itemListElement) {
      const inner: { name: string; url?: string; category?: string }[] = [];
      walkLd(el, inner, depth + 1);
      inner.forEach((i) => out.push({ ...i, category: i.category || catName }));
    }
    return;
  }
  for (const k of Object.keys(o)) {
    if (k === '@context') continue;
    walkLd(o[k], out, depth + 1);
  }
}

export function extractJsonLdItems(html: string, pageUrl: URL): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const found: { name: string; url?: string; category?: string }[] = [];
      walkLd(JSON.parse(m[1].trim()), found);
      for (const f of found) {
        if (!goodName(f.name)) continue;
        let url = pageUrl.toString();
        try {
          if (f.url) url = new URL(f.url, pageUrl).toString();
        } catch {
          /* keep page url */
        }
        items.push({
          item_id: '',
          item_slug: slugify(f.name, items.length + 1),
          item_name: f.name,
          category: f.category || '',
          product_url: url,
        });
      }
    } catch {
      /* invalid JSON-LD */
    }
  }
  return items;
}

// ---- Sitemap ----
export async function extractSitemapItems(origin: string, fetcher: Fetcher): Promise<ScrapedItem[]> {
  const locs: string[] = [];
  const grab = (xml: string) => {
    const re = /<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi;
    const found: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) found.push(m[1]);
    return found;
  };
  try {
    const root = await fetcher(`${origin}/sitemap.xml`, 'application/xml,text/xml,*/*');
    if (root.status !== 200 || !/<(urlset|sitemapindex)/i.test(root.text)) return [];
    let urls = grab(root.text);
    if (/<sitemapindex/i.test(root.text)) {
      const children = urls
        .filter((u) => !/(post|blog|news|page|author|tag|city|location|area)/i.test(u) || /(product|service)/i.test(u))
        .slice(0, 4);
      const results = await Promise.allSettled(children.map((c) => fetcher(c, 'application/xml,text/xml,*/*')));
      urls = [];
      for (const r of results) if (r.status === 'fulfilled' && r.value.status === 200) urls.push(...grab(r.value.text));
    }
    locs.push(...urls);
  } catch {
    return [];
  }

  const items: ScrapedItem[] = [];
  for (const raw of locs) {
    try {
      const u = new URL(raw);
      if (u.origin !== origin) continue;
      if (JUNK_PATH.test(u.pathname)) continue;
      if (!SIGNAL_PATH.test(u.pathname.endsWith('/') ? u.pathname : u.pathname + '/')) continue;
      const segs = u.pathname.split('/').filter(Boolean);
      if (segs.length < 2) continue;
      const last = segs[segs.length - 1];
      const name = titleFromSlug(last);
      if (!goodName(name)) continue;
      items.push({
        item_id: '',
        item_slug: slugify(last, items.length + 1),
        item_name: name,
        category: categoryFromUrl(u),
        product_url: `${u.origin}${u.pathname}`,
      });
      if (items.length >= 40) break;
    } catch {
      /* skip */
    }
  }
  return items;
}

// ---- Links & headings from scanned pages ----
export function itemsFromLinksAndHeadings(
  pages: { url: string; headings: string[]; navAndServiceLinks: { text: string; url: string }[] }[]
): ScrapedItem[] {
  const items: ScrapedItem[] = [];
  pages.forEach((p, idx) => {
    for (const l of p.navAndServiceLinks) {
      const name = cleanText(l.text);
      if (!goodName(name) || /^see all|^explore |^view all/i.test(name)) continue;
      let cat = '';
      try {
        const parsed = new URL(l.url);
        if (JUNK_PATH.test(parsed.pathname)) continue;
        cat = categoryFromUrl(parsed);
      } catch {
        continue;
      }
      items.push({
        item_id: '',
        item_slug: slugify(name, items.length + 1),
        item_name: name,
        category: cat,
        product_url: l.url,
      });
    }
    if (idx > 0) {
      for (const h of p.headings.slice(0, 10)) {
        const name = cleanText(h);
        if (!goodName(name)) continue;
        items.push({
          item_id: '',
          item_slug: slugify(name, items.length + 1),
          item_name: name,
          category: '',
          product_url: p.url,
        });
      }
    }
  });
  if (items.length === 0 && pages[0]) {
    for (const h of pages[0].headings.slice(0, 12)) {
      const name = cleanText(h);
      if (!goodName(name)) continue;
      items.push({
        item_id: '',
        item_slug: slugify(name, items.length + 1),
        item_name: name,
        category: '',
        product_url: pages[0].url,
      });
    }
  }
  return items;
}

// ---- Merge ----
export function mergeItems(groups: ScrapedItem[][], max = 24): ScrapedItem[] {
  const seen = new Set<string>();
  const out: ScrapedItem[] = [];
  for (const g of groups) {
    for (const it of g) {
      if (!goodName(it.item_name)) continue;
      const key = it.item_slug || slugify(it.item_name, out.length);
      const nameKey = it.item_name.toLowerCase();
      if (seen.has(key) || seen.has(nameKey)) continue;
      seen.add(key);
      seen.add(nameKey);
      out.push({
        ...it,
        item_id: String(out.length + 1),
        category: inferAccurateCategory(it.item_name, it.item_slug, it.category),
      });
      if (out.length >= max) return out;
    }
  }
  return out;
}

export function businessNameFrom(page: { ogSiteName: string; title: string }, hostname: string): string {
  const raw = page.ogSiteName || page.title.split(/[|\u2013\u2014-]/).pop() || hostname;
  const n = cleanText(raw).slice(0, 60);
  return n || hostname.replace(/^www\./, '');
}
