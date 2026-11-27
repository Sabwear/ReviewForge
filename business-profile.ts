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

  return {
    name: extra.name,
    summary: clean(extra.summary, 400) || description,
    summarySource: clean(extra.summary) ? 'ai' : 'website',
    logoUrl,
    phones: [...phones.values()].slice(0, 3),
    emails: [...emails].slice(0, 3),
    address,
    openingHours: [...hours].slice(0, 7),
    priceRange,
    areasServed: [...areas].slice(0, 8),
    socialLinks: [...socials].map(([label, url]) => ({ label, url })),
    siteLanguage,
    publishedRating,
  };
}
