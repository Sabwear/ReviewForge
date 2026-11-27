// Runtime-agnostic (Node + Cloudflare Workers). Pulls business facts that the
// website itself publishes. Nothing here is inferred or invented: a field that
// the site does not state stays empty.
import type { BusinessProfile } from './src/types/reviews.ts';

const SOCIAL_HOSTS: Array<[RegExp, string]> = [
  [/(^|\.)facebook\.com$/, 'Facebook'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)linkedin\.com$/, 'LinkedIn'],
  [/(^|\.)(twitter|x)\.com$/, 'X'],
  [/(^|\.)youtube\.com$/, 'YouTube'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)(wa\.me|whatsapp\.com)$/, 'WhatsApp'],
];

const BUSINESS_TYPES =
  /(Organization|LocalBusiness|Business|Store|Restaurant|Dentist|Clinic|Plumber|Electrician|Contractor|Salon|Spa|Agency|Hotel|Repair|Service)$/;

function clean(v: unknown, max = 200): string {
  return String(v ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function httpUrl(value: unknown, base: string): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const u = new URL(value.trim().replace(/&amp;/g, '&'), base);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : '';
  } catch {
    return '';
  }
}

/** Top-level business nodes only, so a reviewer's or manufacturer's details are never picked up. */
function businessNodes(html: string): Record<string, any>[] {
  const out: Record<string, any>[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const root = JSON.parse(m[1].trim());
      const queue: any[] = Array.isArray(root) ? [...root] : [root];
      for (let i = 0; i < queue.length && i < 60; i++) {
        const node = queue[i];
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node['@graph'])) queue.push(...node['@graph']);
        const types = ([] as string[]).concat(node['@type'] || []).map(String);
        if (types.some((t) => BUSINESS_TYPES.test(t) && t !== 'Service')) out.push(node);
      }
    } catch {
      /* invalid JSON-LD */
    }
  }
  return out;
}

function formatAddress(a: unknown): string {
  if (!a) return '';
  if (Array.isArray(a)) return formatAddress(a[0]);
  if (typeof a === 'string') return clean(a);
  const o = a as Record<string, any>;
  const country = typeof o.addressCountry === 'string' ? o.addressCountry : o.addressCountry?.name;
  return clean(
    [o.streetAddress, [o.postalCode, o.addressLocality].filter(Boolean).join(' '), o.addressRegion, country]
      .filter(Boolean)
      .join(', ')
  );
}

function formatHours(node: Record<string, any>): string[] {
  const out: string[] = [];
  for (const h of ([] as unknown[]).concat(node.openingHours || [])) {
    if (typeof h === 'string') out.push(clean(h, 80));
  }
  for (const spec of ([] as any[]).concat(node.openingHoursSpecification || [])) {
    if (!spec?.opens || !spec?.closes) continue;
    const days = ([] as unknown[])
      .concat(spec.dayOfWeek || [])
      .map((d) => String(d).split('/').pop()!.slice(0, 3))
      .join(', ');
    out.push(clean(`${days} ${spec.opens}–${spec.closes}`, 80));
  }
  return out;
}

function metaContent(html: string, key: string): string {
  const tag = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]*>`, 'i'))?.[0];
  return clean(tag?.match(/content=(?:"([^"]*)"|'([^']*)')/i)?.slice(1).find(Boolean), 320);
}

const COUNTRY_TLD_MAP: Record<string, string> = {
  be: 'BE', nl: 'NL', fr: 'FR', de: 'DE', ch: 'CH', at: 'AT', lu: 'LU',
  uk: 'GB', ie: 'IE', es: 'ES', it: 'IT', pt: 'PT', ma: 'MA', dz: 'DZ',
  tn: 'TN', ae: 'AE', sa: 'SA', qa: 'QA', tr: 'TR', pl: 'PL', se: 'SE',
  no: 'NO', dk: 'DK', ro: 'RO', cz: 'CZ', ca: 'CA', au: 'AU', nz: 'NZ',
};

const PHONE_PREFIX_COUNTRY: Array<[RegExp, string]> = [
  [/^\+|00/, ''],
  [/^(\+|00)32\b/, 'BE'],
  [/^(\+|00)31\b/, 'NL'],
  [/^(\+|00)33\b/, 'FR'],
  [/^(\+|00)49\b/, 'DE'],
  [/^(\+|00)41\b/, 'CH'],
  [/^(\+|00)352\b/, 'LU'],
  [/^(\+|00)44\b/, 'GB'],
  [/^(\+|00)212\b/, 'MA'],
  [/^(\+|00)34\b/, 'ES'],
  [/^(\+|00)39\b/, 'IT'],
  [/^(\+|00)351\b/, 'PT'],
  [/^(\+|00)971\b/, 'AE'],
  [/^(\+|00)966\b/, 'SA'],
];

const COUNTRY_NAME_HINTS: Array<[RegExp, string]> = [
  [/\b(belgium|belgi[eë]|belgique|brussel|brussels|bruxelles|antwerpen|vlaanderen|wallonie)\b/i, 'BE'],
  [/\b(netherlands|nederland|amsterdam|rotterdam|utrecht)\b/i, 'NL'],
  [/\b(morocco|maroc|casablanca|rabat|marrakech|tanger)\b/i, 'MA'],
  [/\b(switzerland|suisse|schweiz|zurich|geneva|genève)\b/i, 'CH'],
  [/\b(france|paris|lyon|marseille|toulouse|bordeaux)\b/i, 'FR'],
  [/\b(germany|deutschland|berlin|münchen|hamburg|köln)\b/i, 'DE'],
  [/\b(united kingdom|england|scotland|london|manchester)\b/i, 'GB'],
  [/\b(canada|toronto|montreal|montréal|vancouver)\b/i, 'CA'],
];

const ISO_NAME_TO_CODE: Array<[RegExp, string]> = [
  [/^(be|bel|belgium|belgi[eë]|belgique)$/i, 'BE'],
  [/^(nl|nld|netherlands|the netherlands|nederland)$/i, 'NL'],
  [/^(fr|fra|france)$/i, 'FR'],
  [/^(de|deu|germany|deutschland)$/i, 'DE'],
  [/^(ch|che|switzerland|suisse|schweiz)$/i, 'CH'],
  [/^(gb|uk|gbr|united kingdom|great britain|england)$/i, 'GB'],
  [/^(ma|mar|morocco|maroc)$/i, 'MA'],
  [/^(es|esp|spain|espa[nñ]a)$/i, 'ES'],
  [/^(it|ita|italy|italia)$/i, 'IT'],
  [/^(pt|prt|portugal)$/i, 'PT'],
  [/^(lu|lux|luxembourg)$/i, 'LU'],
  [/^(at|aut|austria|österreich)$/i, 'AT'],
  [/^(ca|can|canada)$/i, 'CA'],
  [/^(us|usa|united states)$/i, 'US'],
  [/^(ae|are|uae|united arab emirates)$/i, 'AE'],
  [/^(sa|sau|saudi arabia)$/i, 'SA'],
];

export function normalizeCountryCode(raw?: string): string {
  const s = (raw || '').trim();
  if (!s) return '';
  if (/^[A-Za-z]{2}$/.test(s)) {
    const up = s.toUpperCase();
    return up === 'UK' ? 'GB' : up;
  }
  const localeMatch = s.match(/^[a-z]{2,3}[-_]([A-Za-z]{2})$/);
  if (localeMatch) {
    const up = localeMatch[1].toUpperCase();
    return up === 'UK' ? 'GB' : up;
  }
  for (const [rx, code] of ISO_NAME_TO_CODE) {
    if (rx.test(s)) return code;
  }
  for (const [rx, code] of COUNTRY_NAME_HINTS) {
    if (rx.test(s)) return code;
  }
  return '';
}

export function inferCountryCodeFromSignals(opts: {
  hostname?: string;
  siteLanguage?: string;
  address?: string;
  phones?: string[];
  areas?: string[];
  titleAndMeta?: string;
}): string {
  // 1. Explicit locale region tag like en-BE, nl-BE, fr-BE, fr-CA, de-CH
  const langMatch = (opts.siteLanguage || '').match(/^[a-z]{2,3}-([A-Z]{2})\b/i);
  if (langMatch) return langMatch[1].toUpperCase();

  // 2. Phone international dialing prefix (+32, +31, +33, +212, etc.)
  for (const ph of opts.phones || []) {
    const compact = ph.replace(/[\s().-]/g, '');
    for (const [rx, code] of PHONE_PREFIX_COUNTRY) {
      if (code && rx.test(compact)) return code;
    }
  }

  // 3. Country-code TLD (.be, .nl, .fr, .ma, .co.uk, etc.)
  const host = (opts.hostname || '').toLowerCase().replace(/\.$/, '');
  const parts = host.split('.');
  const tld = parts[parts.length - 1] || '';
  if (tld && COUNTRY_TLD_MAP[tld]) return COUNTRY_TLD_MAP[tld];

  // 4. Address, areas served, or meta/title country mention
  const text = `${opts.address || ''} ${(opts.areas || []).join(' ')} ${opts.titleAndMeta || ''}`;
  for (const [rx, code] of COUNTRY_NAME_HINTS) {
    if (rx.test(text)) return code;
  }
  return '';
}

export function buildBusinessProfile(
  pages: { url: string; html: string }[],
  extra: { name: string; summary?: string }
): BusinessProfile {
  const phones = new Map<string, string>();
  const emails = new Set<string>();
  const hours = new Set<string>();
  const areas = new Set<string>();
  const socials = new Map<string, string>();
  let logoUrl = '';
  let address = '';
  let priceRange = '';
  let description = '';
  let siteLanguage = '';
  let publishedRating: BusinessProfile['publishedRating'] = null;

  const addPhone = (raw: unknown) => {
    const text = clean(raw, 30);
    const digits = text.replace(/\D/g, '');
    const key = digits.slice(-9);
    if (digits.length >= 6 && !phones.has(key)) phones.set(key, text);
  };
  const addEmail = (raw: unknown) => {
    const text = clean(raw, 120).replace(/^mailto:/i, '').toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(text)) emails.add(text);
  };
  const addSocial = (raw: string, base: string) => {
    const url = httpUrl(raw, base);
    if (!url) return;
    const u = new URL(url);
    // Share buttons and bare platform homepages are not the business's profile.
    if (/\/(sharer?|intent|share)(\.php)?(\/|$)/i.test(u.pathname) || u.pathname === '/') return;
    const label = SOCIAL_HOSTS.find(([rx]) => rx.test(u.hostname.toLowerCase()))?.[1];
    if (label && !socials.has(label)) socials.set(label, url);
  };

  for (const page of pages) {
    const { html, url } = page;
    if (!siteLanguage) siteLanguage = clean(html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1], 12);
    if (!description) description = metaContent(html, 'description') || metaContent(html, 'og:description');

    for (const node of businessNodes(html)) {
      if (!logoUrl) logoUrl = httpUrl(typeof node.logo === 'object' ? node.logo?.url : node.logo, url);
      addPhone(node.telephone);
      addEmail(node.email);
      for (const cp of ([] as any[]).concat(node.contactPoint || [])) {
        addPhone(cp?.telephone);
        addEmail(cp?.email);
      }
      if (!address) address = formatAddress(node.address);
      if (!priceRange) priceRange = clean(node.priceRange, 40);
      formatHours(node).forEach((h) => hours.add(h));
      for (const a of ([] as any[]).concat(node.areaServed || [])) {
        const label = clean(typeof a === 'string' ? a : a?.name, 60);
        if (label) areas.add(label);
      }
      for (const s of ([] as unknown[]).concat(node.sameAs || [])) {
        if (typeof s === 'string') addSocial(s, url);
      }
      const rating = node.aggregateRating;
      if (!publishedRating && rating) {
        const value = Number(rating.ratingValue);
        const count = Number(rating.reviewCount ?? rating.ratingCount);
        if (value > 0) {
          publishedRating = {
            value,
            count: count > 0 ? count : null,
            best: Number(rating.bestRating) || 5,
          };
        }
      }
    }

    const hrefRe = /<a\b[^>]*href=["']([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = hrefRe.exec(html)) !== null) {
      const href = m[1].trim();
      try {
        if (/^tel:/i.test(href)) addPhone(decodeURIComponent(href.slice(4)));
        else if (/^mailto:/i.test(href)) addEmail(decodeURIComponent(href.slice(7).split('?')[0]));
        else if (/^https?:/i.test(href)) addSocial(href, url);
      } catch {
        /* malformed percent-encoding */
      }
    }
  }

  const home = pages[0];
  if (!logoUrl && home) {
    const icon = home.html.match(/<link[^>]+rel=["']apple-touch-icon[^"']*["'][^>]*>/i)?.[0];
    logoUrl = httpUrl(icon?.match(/href=["']([^"']+)["']/i)?.[1], home.url);
  }

  let homeHost = '';
  let homeTitle = '';
  if (home) {
    try {
      homeHost = new URL(home.url).hostname;
    } catch {
      /* ignore */
    }
    homeTitle = clean(home.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1], 180);
  }

  const phoneList = [...phones.values()].slice(0, 3);
  const areaList = [...areas].slice(0, 8);
  const detectedCountryCode = inferCountryCodeFromSignals({
    hostname: homeHost,
    siteLanguage,
    address,
    phones: phoneList,
    areas: areaList,
    titleAndMeta: `${homeTitle} ${description} ${extra.name} ${extra.summary || ''}`,
  });

  return {
    name: extra.name,
    summary: clean(extra.summary, 400) || description,
    summarySource: clean(extra.summary) ? 'ai' : 'website',
    logoUrl,
    phones: phoneList,
    emails: [...emails].slice(0, 3),
    address,
    openingHours: [...hours].slice(0, 7),
    priceRange,
    areasServed: areaList,
    socialLinks: [...socials].map(([label, url]) => ({ label, url })),
    siteLanguage,
    detectedCountryCode: detectedCountryCode || undefined,
    publishedRating,
  };
}
