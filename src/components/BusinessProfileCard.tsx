import React, { useState } from 'react';
import { Building2, ChevronDown, Clock, ExternalLink, Mail, MapPin, Phone, Star, Tag, X } from 'lucide-react';
import { CatalogProduct, WebsiteScanResponse } from '../types/reviews';

interface BusinessProfileCardProps {
  scan: WebsiteScanResponse;
  onDismiss: () => void;
}

function safeHttpHref(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : '';
  } catch {
    return '';
  }
}

export function BusinessProfileCard({ scan, onDismiss }: BusinessProfileCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const profile = scan.businessProfile;
  if (!profile) return null;
  const safeScannedUrl = safeHttpHref(scan.scannedUrl);

  const byCategory = new Map<string, CatalogProduct[]>();
  for (const p of scan.products) {
    byCategory.set(p.category, [...(byCategory.get(p.category) || []), p]);
  }
  const offeringLabel = scan.businessType === 'ecommerce' ? 'Products' : 'Services';
  const hasContact =
    profile.phones.length > 0 ||
    profile.emails.length > 0 ||
    Boolean(profile.address) ||
    profile.openingHours.length > 0;

  return (
    <section
      aria-label="Business information"
      className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200"
    >
      <div className="p-5 flex items-start gap-4">
        <div className="w-12 h-12 shrink-0 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative">
          <Building2 className="w-5 h-5 text-slate-400" aria-hidden="true" />
          {profile.logoUrl && (
            <img
              key={profile.logoUrl}
              src={profile.logoUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-contain bg-white"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 break-words">{profile.name}</h2>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
              {scan.businessType === 'ecommerce' ? 'Online store' : 'Service business'}
            </span>
          </div>
          {safeScannedUrl ? (
            <a
              href={safeScannedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-900 break-all"
            >
              {scan.hostname}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          ) : (
            <span className="text-xs font-medium text-slate-500 break-all">{scan.hostname}</span>
          )}
          {isOpen && profile.summary && (
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              {profile.summary}
              {profile.summarySource === 'ai' && (
                <span className="text-xs text-slate-500"> (AI summary, please check)</span>
              )}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Collapse business information' : 'Expand business information'}
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Hide business information"
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <>
      <div className="p-5 grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
        {profile.phones.length > 0 && (
          <InfoRow icon={Phone} label="Phone">
            {profile.phones.join(' · ')}
          </InfoRow>
        )}
        {profile.emails.length > 0 && (
          <InfoRow icon={Mail} label="Email">
            {profile.emails.join(' · ')}
          </InfoRow>
        )}
        {profile.address && (
          <InfoRow icon={MapPin} label="Address">
            {profile.address}
          </InfoRow>
        )}
        {profile.openingHours.length > 0 && (
          <InfoRow icon={Clock} label="Opening hours">
            {profile.openingHours.join(' · ')}
          </InfoRow>
        )}
        {profile.areasServed.length > 0 && (
          <InfoRow icon={MapPin} label="Areas served">
            {profile.areasServed.join(', ')}
          </InfoRow>
        )}
        {profile.priceRange && (
          <InfoRow icon={Tag} label="Price range">
            {profile.priceRange}
          </InfoRow>
        )}
        {profile.publishedRating && (
          <InfoRow icon={Star} label="Rating stated by the website (not verified)">
            {profile.publishedRating.value} / {profile.publishedRating.best}
            {profile.publishedRating.count ? ` from ${profile.publishedRating.count} reviews` : ''}
          </InfoRow>
        )}
        {!hasContact && (
          <p className="text-xs text-slate-500 sm:col-span-2">
            No contact details, address or opening hours were found on the scanned pages.
          </p>
        )}
        {profile.socialLinks.length > 0 && (
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {profile.socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          {offeringLabel} found ({scan.products.length})
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 max-h-72 overflow-y-auto">
          {[...byCategory].map(([category, items]) => (
            <div key={category} className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">
                {category} ({items.length})
              </div>
              <ul className="mt-1 space-y-0.5">
                {items.map((item) => {
                  const safeItemUrl = safeHttpHref(item.product_url);
                  return (
                    <li key={`${item.item_id}-${item.item_slug}`} className="text-sm text-slate-700 break-words">
                      {safeItemUrl ? (
                        <a
                          href={safeItemUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-sky-700 hover:underline"
                        >
                          {item.item_name}
                        </a>
                      ) : (
                        item.item_name
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Read from {scan.scannedPagesCount} page{scan.scannedPagesCount === 1 ? '' : 's'}
          {profile.siteLanguage ? ` · site language: ${profile.siteLanguage}` : ''}. The service list is extracted
          automatically, so check it against the website.
        </p>
      </div>
        </>
      )}
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="break-words">{children}</div>
      </div>
    </div>
  );
}
