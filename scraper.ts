// Keyless website scraper: extracts ONLY real services/products from any website without AI.
// Strict anti-heading & anti-CTA guards ensure website slogans, process steps, navigation hubs,
// calls to action, and city/service-area pages are NEVER treated as offerings.

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
  /\/(services?|solutions?|offerings?|pricing|plans?|packages?|treatments?|menu|products?|collections?|shop|store|catalog|programs?|courses?|prestations?|produits?|tarifs?|soins?|diensten|oplossingen|interventions?|depannage|reparations?)\//i;

const JUNK_PATH =
  /\/(legal|customers?|glossary|terms|privacy|cookies?|careers?|jobs|press|blog|advice|conseils?|advies|news|articles?|support|help|docs|contact|about|over-ons|a-propos|qui-sommes-nous|login|signin|signup|cart|checkout|account|service-areas?|areas?|locations?|cities|werkgebied|zones?|regio|steden|communes?|gemeenten|faq|faqs|reviews?|testimonials?|avis|klantenservice|partners?|author|tag|category|videos?|downloads?|financing|brochures?|manuals?|gallery|resources?|book|booking|appointment|quote|offerte|demande-offerte|devis|book-a-technician)(\/|$)/i;

// Hub index paths like /services, /en/services, /solutions, /diensten (depth 1 after optional locale)
const HUB_INDEX_SLUG =
  /^(services?|our-services|all-services|solutions?|our-solutions|offerings?|products?|our-products|shop|store|catalog|collections?|pricing|plans?|packages?|treatments?|menu|programs?|courses?|prestations?|produits?|tarifs?|soins?|diensten|oplossingen|interventions?)$/i;

const JUNK_NAME =
  /^(home|accueil|startpagina|about( us)?|over ons|à propos|a propos|contact( us|eer ons|ez-nous)?|blog( & advice)?|advice|news|faq|faqs|login|log in|sign ?up|register|cart|checkout|privacy( policy)?|cookie(s| preferences| policy)?|terms( & conditions| of service)?|policy|search|menu|skip to content|read more|learn more|get started|book now|book a .+|view all|shop all|see all|explore .+|services?|our services|all services|onze diensten|nos services|service areas?|our service areas|areas? we serve|werkgebied|zones? d'intervention|locations?|solutions?|our solutions|nos solutions|onze oplossingen|products?|our products|pricing|plans?|why choose us|pourquoi nous choisir|waarom voor ons kiezen|how it works|how can we help( you)?|comment ça marche|hoe werkt het|testimonials?|reviews?|customer reviews?|customer feedback|client reviews?|avis clients?|klantenreviews?|videos?|downloads?|brochures?|manuals?|financing.*|payment plans?|get a quote|request a quote|free quote|vraag een offerte|demander un devis|call now|whatsapp|gallery|resources?)$/i;

// Conversational / slogan / CTA / step-heading patterns that are NEVER genuine service names
const HEADING_OR_CTA_PATTERN =
  /(\b(you|your|yours|we|our|us|my|me|yourself|wij|onze|ons|jouw|uw|vous|votre|vos|nous|notre|nos)\b|^(tell |discuss |let'?s |relax\b|welcome\b|discover\b|explore\b|meet\b|find\b|need\b|looking for\b|ready to\b|talk to\b|speak with\b|step \d|phase \d|why |how |what |who |where |when |trusted |authorized |certified |expert care|care that|the right |for your ))/i;

// Common European/global city names often linked under /loodgieter/<city> or /plumber/<city>
const CITY_ONLY_NAME =
  /^(brussel|brussels|bruxelles|antwerpen|antwerp|anvers|gent|ghent|gand|brugge|bruges|leuven|louvain|mechelen|malines|hasselt|genk|kortrijk|oostende|aalst|sint-niklaas|roeselare|turnhout|namur|namen|liège|liege|luik|charleroi|mons|bergen|wavre|waterloo|paris|lyon|marseille|lille|toulouse|bordeaux|nantes|amsterdam|rotterdam|utrecht|den haag|eindhoven|london|manchester|birmingham|berlin|munich|hamburg|cologne|frankfurt|casablanca|rabat|marrakech|tanger)$/i;

export function slugify(v: string, i: number): string {
  const s = v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || `item-${i}`;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const temp = dp[i];
      dp[i] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[i], dp[i - 1]);
      prev = temp;
    }
  }
  return dp[m];
}

/**
 * Prevents LLM slug typos (e.g. "heat-pouns" when item_name is "Heat pumps" or URL ends in "/heat-pumps"):
 * 1) Prefers verified leaf slug from an existing subpage URL on the domain when available.
 * 2) If candidateSlug is a near-miss typo (edit distance 1–3) of slugify(itemName), snaps to slugify(itemName).
 */
export function canonicalizeOfferingSlug(
  candidateSlug: string | undefined,
  itemName: string,
  productUrl: string | undefined,
  fallbackIndex: number
): string {
  const nameSlug = slugify(itemName, fallbackIndex);
  if (productUrl) {
    try {
      const u = new URL(productUrl);
      const nonLoc = nonLocaleSegments(u);
      if (nonLoc.length >= 2) {
        const leaf = slugify(nonLoc[nonLoc.length - 1], fallbackIndex);
        if (leaf && !HUB_INDEX_SLUG.test(leaf)) {
          // If another offering shares the same URL leaf (e.g. /services/water-heaters vs /solutions/water-heaters),
          // allow candidateSlug ONLY if it isn't a typo of nameSlug
          if (!candidateSlug || levenshtein(slugify(candidateSlug, fallbackIndex), leaf) <= 3) {
            return leaf;
          }
        }
      }
    } catch {
      /* ignore invalid URL */
    }
  }
  if (!candidateSlug || !candidateSlug.trim()) return nameSlug;
  const cleanCandidate = slugify(candidateSlug, fallbackIndex);
  const dist = levenshtein(cleanCandidate, nameSlug);
  if (dist >= 1 && dist <= 3 && Math.abs(cleanCandidate.length - nameSlug.length) <= 2) {
    return nameSlug;
  }
  return cleanCandidate;
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

export function isValidOfferingName(n: string, slugHint = ''): boolean {
  const trimmed = n.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (trimmed.length < 3 || trimmed.length > 54 || words.length > 6) return false;
  if (/[?!:;…]/.test(trimmed)) return false;
  if (/\.\s+[A-Z]/.test(trimmed) || trimmed.endsWith('.')) return false;
  if (JUNK_NAME.test(trimmed)) return false;
  if (HEADING_OR_CTA_PATTERN.test(trimmed)) return false;
  if (CITY_ONLY_NAME.test(trimmed)) return false;
  // Reject "<Brand> solutions" / "<Brand> services" hub labels
  if (words.length === 2 && /\b(solutions?|services?|diensten|oplossingen|areas?|reviews?|feedback|partner)\b$/i.test(trimmed)) {
    const firstLower = words[0].toLowerCase();
    if (!/^(boiler|heating|plumbing|water|emergency|gas|heat|dental|skin|hair|legal|tax|cloud|web|seo|it|cleaning|electrical|roofing|hvac|auto|car)$/i.test(firstLower)) {
      return false;
    }
  }
  if (slugHint && HUB_INDEX_SLUG.test(slugHint)) return false;
  return true;
}

function extractLocaleSegment(u: URL): string {
  const segs = u.pathname.split('/').filter(Boolean);
  if (segs.length > 0 && /^[a-z]{2}(-[a-z]{2})?$/i.test(segs[0])) {
    return segs[0].toLowerCase().split('-')[0];
  }
  return '';
}

function nonLocaleSegments(u: URL): string[] {
  const segs = u.pathname.split('/').filter(Boolean);
  if (segs.length > 0 && /^[a-z]{2}(-[a-z]{2})?$/i.test(segs[0])) {
    return segs.slice(1);
  }
  return segs;
}

function categoryFromUrl(u: URL): string {
  const seg = nonLocaleSegments(u);
  return seg.length >= 2 ? titleFromSlug(seg[0]) : '';
}

/**
 * Granular, universal category inference across any industry (home services, HVAC, plumbing,
 * healthcare/clinics, beauty/wellness, automotive, digital/software, hospitality, e-commerce).
 * Distinguishes Maintenance, Installations, Repairs, Emergency, Plumbing, Water Heaters, and Heat Pumps
 * instead of collapsing everything into one vague bucket.
 */
export function inferAccurateCategory(name: string, slug: string, rawCategory: string): string {
  const text = `${name} ${slug}`.toLowerCase();

  // Home / Technical / HVAC / Plumbing sub-disciplines (checked in most-specific order)
  if (/\b(heat[- ]?pumps?|warmtepomp\w*|pompes?[- ]a[- ]chaleur|pompe[- ]à[- ]chaleur|geotherm\w*|hybrid[- ]heat\w*|solar|zonnepane\w*|panneaux?[- ]solaires?)\b/i.test(text)) {
    return 'Heat Pumps & Renewables';
  }
  if (/\b(emergenc\w*|urgent\w*|spoed\w*|d[eé]pannage|24\/7|notdienst)\b/i.test(text)) {
    return 'Emergency Service';
  }
  if (/\b(leak\w*|waterlek\w*|lekdetect\w*|fuites?|unblock\w*|drain\w*|ontstop\w*|d[eé]bouch\w*|sewer|riool\w*)\b/i.test(text)) {
    return 'Leak & Drain Repair';
  }
  if (/\b(water[- ]?heaters?|hot[- ]?water|warm[- ]?water|chauffe[- ]?eau|sanitair[- ]?warm\w*|boiler[- ]?tank)\b/i.test(text)) {
    return 'Water Heaters & Hot Water';
  }
  if (/\b(plumb\w*|plomb\w*|loodgieter\w*|sanitair\w*|sanitary|tap|faucet|toilet|sink|bathroom|badkamer|salle[- ]de[- ]bain|pipe\w*|tuyau\w*|leiding\w*)\b/i.test(text)) {
    return 'Plumbing & Sanitary';
  }
  if (/\b(maintenance|entretien|onderhoud\w*|service[- ]?plan|inspection|check[- ]?up|tune[- ]?up|keuring\w*|attest\w*)\b/i.test(text)) {
    return /\b(boiler|ketel|chaudi[eè]re|heat\w*|chauffage|verwarming|hvac)\b/i.test(text)
      ? 'Boiler & Heating Maintenance'
      : 'Maintenance & Inspections';
  }
  if (/\b(install\w*|replace\w*|vervang\w*|plaatsing|nieuwe[- ]verwarming|montage|pose|gas[- ]?boilers?|condens\w*)\b/i.test(text)) {
    return /\b(boiler|ketel|chaudi[eè]re|heat\w*|chauffage|verwarming|gas)\b/i.test(text)
      ? 'Boiler & Heating Installation'
      : 'Installations';
  }
  if (/\b(boiler[- ]?repair|ketel[- ]?herstel\w*|herstelling|r[eé]paration|fault|breakdown|storing)\b/i.test(text)) {
    return /\b(boiler|ketel|chaudi[eè]re|heat\w*|chauffage|verwarming|bulex|vaillant|viessmann)\b/i.test(text)
      ? 'Boiler & Heating Repair'
      : 'Repairs & Diagnostics';
  }
  if (/\b(heating[- ]?systems?|central[- ]?heating|radiator\w*|thermostat\w*|underfloor|vloerverwarming|chauffage|verwarming|hvac|airco|air[- ]?conditioning)\b/i.test(text)) {
    return 'Heating Systems';
  }
  if (/\b(electr\w*|wiring|panel|breaker|outlet|lighting|ev[- ]?charger|laadpaal)\b/i.test(text)) {
    return 'Electrical Services';
  }
  if (/\b(clean\w*|nettoyage|schoonmaak|carpet|window|maid|housekeep\w*)\b/i.test(text)) {
    return 'Cleaning Services';
  }
  if (/\b(dental|dentist|implant\w*|whitening|orthodont\w*|aligner\w*|root[- ]?canal|hygiene)\b/i.test(text)) {
    return 'Dental Care';
  }
  if (/\b(clinic|medical|physio\w*|osteopath\w*|therapy|dermatol\w*|chiropract\w*|checkup)\b/i.test(text)) {
    return 'Clinical & Wellness Care';
  }
  if (/\b(hair\w*|salon|barber|facial|massage|manicure|pedicure|lash\w*|brow\w*|spa|waxing)\b/i.test(text)) {
    return 'Beauty & Salon';
  }
  if (/\b(seo|web[- ]?design|website|ppc|google[- ]?ads|branding|social[- ]?media|copywriting|devops|cloud|saas|software)\b/i.test(text)) {
    return 'Digital & Software Services';
  }
  if (/\b(legal|lawyer|attorney|notary|tax|accounting|bookkeep\w*|payroll|incorporation)\b/i.test(text)) {
    return 'Legal & Advisory';
  }

  const cleanRaw = rawCategory.trim();
  if (
    cleanRaw &&
    !/^(services?|solutions?|diensten|oplossingen|prestations?|general|pages?|items?|en|fr|nl|de|es|it|pt|ar)$/i.test(
      cleanRaw
    )
  ) {
    return cleanRaw;
  }
  return 'Core Offerings';
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
        category: cleanText(p.categories?.[0]?.name) || 'Products',
        product_url: p.permalink || `${origin}/product/${p.slug}`,
      }));
  } catch {
    return [];
  }
}

// ---- JSON-LD ----
const ITEM_TYPES =
  /^(Product|Service|Course|MenuItem|Offer|IndividualProduct|ProductModel|SoftwareApplication|MedicalProcedure)$/i;

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
        const candidateSlug = slugify(f.name, items.length + 1);
        if (!isValidOfferingName(f.name, candidateSlug)) continue;
        let url = pageUrl.toString();
        try {
          if (f.url) url = new URL(f.url, pageUrl).toString();
        } catch {
          /* keep page url */
        }
        items.push({
          item_id: '',
          item_slug: candidateSlug,
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

// ---- Sitemap (Locale-Aware) ----
export async function extractSitemapItems(
  origin: string,
  fetcher: Fetcher,
  scannedUrl?: URL
): Promise<ScrapedItem[]> {
  const locs: string[] = [];
  const grab = (xml: string) => {
    // Also pick up hreflang alternates matching scanned locale when present!
    const found: string[] = [];
    const locRe = /<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)\s*(?:\]\]>)?\s*<\/loc>/gi;
    let m: RegExpExecArray | null;
    while ((m = locRe.exec(xml)) !== null) found.push(m[1]);
    const altRe = /<xhtml:link[^>]+href=["']([^"']+)["'][^>]*>/gi;
    while ((m = altRe.exec(xml)) !== null) found.push(m[1]);
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

  const targetLocale = scannedUrl ? extractLocaleSegment(scannedUrl) : '';
  const parsedCandidates: URL[] = [];
  const seenUrls = new Set<string>();

  for (const raw of locs) {
    try {
      const u = new URL(raw);
      if (u.origin !== origin) continue;
      const key = `${u.origin}${u.pathname.replace(/\/+$/, '')}`;
      if (seenUrls.has(key)) continue;
      seenUrls.add(key);
      if (JUNK_PATH.test(u.pathname)) continue;
      if (!SIGNAL_PATH.test(u.pathname.endsWith('/') ? u.pathname : u.pathname + '/')) continue;
      const nonLoc = nonLocaleSegments(u);
      if (nonLoc.length < 2) continue; // Skip hub index pages like /services or /en/services
      parsedCandidates.push(u);
    } catch {
      /* skip */
    }
  }

  // If user scanned a specific locale (e.g. /en) and the site has offering URLs in that locale,
  // strictly prefer that locale so we never mix duplicate bilingual URLs (/diensten/* + /en/services/*)!
  const localeFiltered = targetLocale
    ? parsedCandidates.filter((u) => extractLocaleSegment(u) === targetLocale)
    : parsedCandidates.filter((u) => extractLocaleSegment(u) === '');
  const effectiveUrls = localeFiltered.length >= 3 ? localeFiltered : parsedCandidates;

  const items: ScrapedItem[] = [];
  for (const u of effectiveUrls) {
    const nonLoc = nonLocaleSegments(u);
    const last = nonLoc[nonLoc.length - 1];
    if (HUB_INDEX_SLUG.test(last)) continue;
    const name = titleFromSlug(last);
    if (!isValidOfferingName(name, last)) continue;
    items.push({
      item_id: '',
      item_slug: slugify(last, items.length + 1),
      item_name: name,
      category: categoryFromUrl(u),
      product_url: `${u.origin}${u.pathname}`,
    });
    if (items.length >= 40) break;
  }
  return items;
}

// ---- Leaf Offering Links ONLY (Never scrape conversational page headings as services!) ----
export function itemsFromLinksAndHeadings(
  pages: { url: string; headings: string[]; navAndServiceLinks: { text: string; url: string }[] }[],
  scannedUrl?: URL
): ScrapedItem[] {
  const targetLocale = scannedUrl ? extractLocaleSegment(scannedUrl) : '';
  const items: ScrapedItem[] = [];

  for (const p of pages) {
    for (const l of p.navAndServiceLinks) {
      const name = cleanText(l.text);
      let parsed: URL;
      try {
        parsed = new URL(l.url);
      } catch {
        continue;
      }
      if (JUNK_PATH.test(parsed.pathname)) continue;
      const linkLocale = extractLocaleSegment(parsed);
      if (targetLocale && linkLocale && linkLocale !== targetLocale) continue;

      const nonLoc = nonLocaleSegments(parsed);
      // Require leaf offering URLs (e.g. /services/boiler-repair, /treatments/root-canal, /products/x),
      // NEVER top-level navigation hubs (/services, /solutions, /about, /pricing)!
      if (nonLoc.length < 2) continue;
      const leafSlug = nonLoc[nonLoc.length - 1];
      if (HUB_INDEX_SLUG.test(leafSlug)) continue;
      if (!isValidOfferingName(name, leafSlug)) continue;

      items.push({
        item_id: '',
        item_slug: slugify(leafSlug || name, items.length + 1),
        item_name: name,
        category: categoryFromUrl(parsed),
        product_url: `${parsed.origin}${parsed.pathname}`,
      });
    }
  }

  return items;
}

// ---- Merge & Deduplicate Synonym / Duplicate URL Slugs ----
export function mergeItems(groups: ScrapedItem[][], max = 24): ScrapedItem[] {
  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();
  const seenPaths = new Set<string>();
  const out: ScrapedItem[] = [];

  for (const g of groups) {
    for (const it of g) {
      const cleanName = cleanText(it.item_name);
      const rawSlug = it.item_slug || slugify(cleanName, out.length + 1);
      if (!isValidOfferingName(cleanName, rawSlug)) continue;

      let pathKey = '';
      try {
        const u = new URL(it.product_url);
        const nonLoc = nonLocaleSegments(u);
        pathKey = nonLoc[nonLoc.length - 1]?.toLowerCase() || '';
      } catch {
        pathKey = rawSlug.toLowerCase();
      }

      const slugKey = (pathKey || rawSlug).toLowerCase();
      const nameKey = cleanName.toLowerCase();
      if (seenSlugs.has(slugKey) || seenNames.has(nameKey) || (pathKey && seenPaths.has(pathKey))) {
        continue;
      }
      seenSlugs.add(slugKey);
      seenNames.add(nameKey);
      if (pathKey) seenPaths.add(pathKey);

      out.push({
        ...it,
        item_id: String(out.length + 1),
        item_slug: slugify(pathKey || rawSlug, out.length + 1),
        item_name: cleanName,
        category: inferAccurateCategory(cleanName, slugKey, it.category),
      });
      if (out.length >= max) return out;
    }
  }
  return out;
}

export function businessNameFrom(page: { ogSiteName: string; title: string }, hostname: string): string {
  const raw = page.ogSiteName || page.title.split(/[|\u2013\u2014]/).pop() || hostname;
  const n = cleanText(raw).slice(0, 60);
  return n || hostname.replace(/^www\./, '');
}
