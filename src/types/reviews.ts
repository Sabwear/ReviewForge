export interface CatalogProduct {
  item_id: string;
  item_slug: string;
  item_name: string;
  category: string;
  product_url?: string;
  picture_urls?: string;
}

export type CatalogFormat = 'judge_me' | 'shopify' | 'website' | 'standard';

export type ExportFormat =
  | 'judge_me'
  | 'standard'
  | 'markdown'
  | 'json'
  | 'html'
  | 'txt';

export interface ExportFormatOption {
  id: ExportFormat;
  label: string;
  shortLabel: string;
  extension: string;
  mimeType: string;
  description: string;
}

export const EXPORT_FORMAT_OPTIONS: ExportFormatOption[] = [
  {
    id: 'judge_me',
    label: 'Judge.me CSV',
    shortLabel: 'Judge.me',
    extension: 'csv',
    mimeType: 'text/csv;charset=utf-8;',
    description: '10-column Shopify Judge.me import CSV',
  },
  {
    id: 'standard',
    label: 'Standard CSV',
    shortLabel: 'CSV',
    extension: 'csv',
    mimeType: 'text/csv;charset=utf-8;',
    description: '9-column universal spreadsheet CSV',
  },
  {
    id: 'markdown',
    label: 'Markdown (.md)',
    shortLabel: 'MD',
    extension: 'md',
    mimeType: 'text/markdown;charset=utf-8;',
    description: 'Formatted Markdown grouped by offering',
  },
  {
    id: 'json',
    label: 'JSON (.json)',
    shortLabel: 'JSON',
    extension: 'json',
    mimeType: 'application/json;charset=utf-8;',
    description: 'Structured JSON array for APIs & seeding',
  },
  {
    id: 'html',
    label: 'HTML (.html)',
    shortLabel: 'HTML',
    extension: 'html',
    mimeType: 'text/html;charset=utf-8;',
    description: 'Ready-to-embed semantic HTML review cards',
  },
  {
    id: 'txt',
    label: 'Plain Text (.txt)',
    shortLabel: 'TXT',
    extension: 'txt',
    mimeType: 'text/plain;charset=utf-8;',
    description: 'Clean plain-text review digest',
  },
];

export interface BusinessProfile {
  name: string;
  summary: string;
  summarySource: 'ai' | 'website';
  logoUrl: string;
  phones: string[];
  emails: string[];
  address: string;
  openingHours: string[];
  priceRange: string;
  areasServed: string[];
  socialLinks: { label: string; url: string }[];
  siteLanguage: string;
  detectedCountryCode?: string;
  publishedRating: { value: number; count: number | null; best: number } | null;
}

export interface WebsiteScanResponse {
  businessProfile?: BusinessProfile;
  scannedUrl: string;
  hostname: string;
  scannedPagesCount: number;
  businessType: 'ecommerce' | 'service';
  detectedFormat: CatalogFormat;
  detectedStoreBaseUrl: string;
  detectedBusinessName?: string;
  detectedBusinessSummary?: string;
  detectedCountryCode?: string;
  products: CatalogProduct[];
  pack: BusinessVoicePack | null;
}

export type ReviewerVoice = 'minimalist' | 'casual' | 'sports' | 'family' | 'technical';

export type ReviewLanguage =
  | 'en'
  | 'fr'
  | 'es'
  | 'ar'
  | 'darija_latin'
  | 'de'
  | 'it'
  | 'pt'
  | 'nl'
  | 'tr'
  | 'pl'
  | 'sv'
  | 'no'
  | 'da'
  | 'el'
  | 'ro'
  | 'cs'
  | 'uk'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'hi'
  | 'id'
  | 'vi'
  | 'th'
  | 'ms'
  | 'he';

export type LanguageRegion = 'Global' | 'MENA' | 'Europe' | 'Asia';

export interface LanguageOption {
  code: ReviewLanguage;
  flag: string;
  countryCode: string;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
  region: LanguageRegion;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  // Global & MENA Core
  { code: 'en', flag: '🇺🇸', countryCode: 'us', label: 'English', nativeLabel: 'English', dir: 'ltr', region: 'Global' },
  { code: 'fr', flag: '🇫🇷', countryCode: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr', region: 'Global' },
  { code: 'es', flag: '🇪🇸', countryCode: 'es', label: 'Spanish', nativeLabel: 'Español', dir: 'ltr', region: 'Global' },
  { code: 'ar', flag: '🇸🇦', countryCode: 'sa', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', region: 'MENA' },
  { code: 'darija_latin', flag: '🇲🇦', countryCode: 'ma', label: 'Darija (Latin)', nativeLabel: 'Darija Arabizi', dir: 'ltr', region: 'MENA' },
  { code: 'he', flag: '🇮🇱', countryCode: 'il', label: 'Hebrew', nativeLabel: 'עברית', dir: 'rtl', region: 'MENA' },
  { code: 'tr', flag: '🇹🇷', countryCode: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', dir: 'ltr', region: 'MENA' },

  // Europe
  { code: 'de', flag: '🇩🇪', countryCode: 'de', label: 'German', nativeLabel: 'Deutsch', dir: 'ltr', region: 'Europe' },
  { code: 'it', flag: '🇮🇹', countryCode: 'it', label: 'Italian', nativeLabel: 'Italiano', dir: 'ltr', region: 'Europe' },
  { code: 'pt', flag: '🇧🇷', countryCode: 'br', label: 'Portuguese', nativeLabel: 'Português', dir: 'ltr', region: 'Global' },
  { code: 'nl', flag: '🇳🇱', countryCode: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', dir: 'ltr', region: 'Europe' },
  { code: 'pl', flag: '🇵🇱', countryCode: 'pl', label: 'Polish', nativeLabel: 'Polski', dir: 'ltr', region: 'Europe' },
  { code: 'sv', flag: '🇸🇪', countryCode: 'se', label: 'Swedish', nativeLabel: 'Svenska', dir: 'ltr', region: 'Europe' },
  { code: 'no', flag: '🇳🇴', countryCode: 'no', label: 'Norwegian', nativeLabel: 'Norsk', dir: 'ltr', region: 'Europe' },
  { code: 'da', flag: '🇩🇰', countryCode: 'dk', label: 'Danish', nativeLabel: 'Dansk', dir: 'ltr', region: 'Europe' },
  { code: 'el', flag: '🇬🇷', countryCode: 'gr', label: 'Greek', nativeLabel: 'Ελληνικά', dir: 'ltr', region: 'Europe' },
  { code: 'ro', flag: '🇷🇴', countryCode: 'ro', label: 'Romanian', nativeLabel: 'Română', dir: 'ltr', region: 'Europe' },
  { code: 'cs', flag: '🇨🇿', countryCode: 'cz', label: 'Czech', nativeLabel: 'Čeština', dir: 'ltr', region: 'Europe' },
  { code: 'uk', flag: '🇺🇦', countryCode: 'ua', label: 'Ukrainian', nativeLabel: 'Українська', dir: 'ltr', region: 'Europe' },
  { code: 'ru', flag: '🇷🇺', countryCode: 'ru', label: 'Russian', nativeLabel: 'Русский', dir: 'ltr', region: 'Europe' },

  // Asia
  { code: 'zh', flag: '🇨🇳', countryCode: 'cn', label: 'Chinese', nativeLabel: '中文', dir: 'ltr', region: 'Asia' },
  { code: 'ja', flag: '🇯🇵', countryCode: 'jp', label: 'Japanese', nativeLabel: '日本語', dir: 'ltr', region: 'Asia' },
  { code: 'ko', flag: '🇰🇷', countryCode: 'kr', label: 'Korean', nativeLabel: '한국어', dir: 'ltr', region: 'Asia' },
  { code: 'hi', flag: '🇮🇳', countryCode: 'in', label: 'Hindi', nativeLabel: 'हिन्दी', dir: 'ltr', region: 'Asia' },
  { code: 'id', flag: '🇮🇩', countryCode: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', dir: 'ltr', region: 'Asia' },
  { code: 'vi', flag: '🇻🇳', countryCode: 'vn', label: 'Vietnamese', nativeLabel: 'Tiếng Việt', dir: 'ltr', region: 'Asia' },
  { code: 'th', flag: '🇹🇭', countryCode: 'th', label: 'Thai', nativeLabel: 'ไทย', dir: 'ltr', region: 'Asia' },
  { code: 'ms', flag: '🇲🇾', countryCode: 'my', label: 'Malay', nativeLabel: 'Bahasa Melayu', dir: 'ltr', region: 'Asia' },
];

export type ReviewSourceOrigin =
  | 'imported_verified'
  | 'imported_unverified'
  | 'ai_remediated'
  | 'generated_preview';

export interface ReviewModificationRecord {
  timestamp: string;
  field: 'item_name' | 'category' | 'subject' | 'body' | 'reviewer_email' | 'status';
  before: string;
  after: string;
  reason: string;
}

export interface GeneratedReview {
  id: string;
  item_id: string;
  item_slug: string;
  item_name: string;
  category: string;
  reviewer_name: string;
  reviewer_email: string;
  stars: number;
  subject: string;
  body: string;
  review_date: string;
  review_timestamp: string;
  product_url: string;
  picture_urls: string;
  voice: ReviewerVoice;
  language: ReviewLanguage;
  isReturningCustomer: boolean;
  sourceOrigin?: ReviewSourceOrigin;
  sourceVerified?: boolean;
  needsManualVerification?: boolean;
  manualVerificationNote?: string;
  rejectionReason?: string;
  originalRowNumber?: number;
  originalSnapshot?: {
    item_id: string;
    item_slug: string;
    item_name: string;
    category: string;
    reviewer_name: string;
    reviewer_email: string;
    stars: number;
    subject: string;
    body: string;
    review_date: string;
  };
  modificationLog?: ReviewModificationRecord[];
}

export interface ReviewTemplate {
  id: string;
  category: string;
  language: ReviewLanguage;
  stars: 1 | 2 | 3 | 4 | 5;
  voice: ReviewerVoice;
  subject: string;
  body: string;
  isCustom?: boolean;
}

export interface BusinessStarPool {
  star: 1 | 2 | 3 | 4 | 5;
  subjects: string[];
  openers: string[];
  middles: string[];
  closers: string[];
}

export interface BusinessLanguageTokens {
  contextA: string[];
  contextB: string[];
  duration: string[];
  timeframe: string[];
}

export interface BusinessLanguagePack {
  language: ReviewLanguage;
  tokens: BusinessLanguageTokens;
  stars: BusinessStarPool[];
  extraTails: string[];
}

export interface ProductClassification {
  item_slug: string;
  cleanName: string;
  category: string;
}

export interface CategoryVoiceContext {
  category: string;
  language: ReviewLanguage;
  contextA: string[];
  contextB: string[];
  openers: string[];
  middles: string[];
}

export interface OfferingVoiceContext {
  item_slug: string;
  language: ReviewLanguage;
  localizedName: string;
  distinctiveKeywords?: string[];
  scenarios: string[];
  actions: string[];
  outcomes: string[];
}

export interface BusinessVoicePack {
  detectedBusinessName: string;
  businessSummary: string;
  detectedCountryCode?: string;
  productClassifications?: ProductClassification[];
  categoryContext?: CategoryVoiceContext[];
  offeringContexts?: OfferingVoiceContext[];
  languagePacks: BusinessLanguagePack[];
}

export type SampleBusinessId =
  | 'services'
  | 'skincare'
  | 'fashion'
  | 'electronics'
  | 'coffee'
  | 'iptv';

export type StoreVolumePreset = 'quiet' | 'realistic' | 'busy';

export interface GeneratorConfig {
  selectedCategories: string[];
  selectedLanguages: ReviewLanguage[];
  excludeByKeywords: boolean;
  excludeKeywords: string;
  exportFormat: ExportFormat;
  storeBaseUrl: string;
  volumePreset: StoreVolumePreset;
  minReviewsPerItem: number;
  maxReviewsPerItem: number;
  maxTotalReviews: number | null;
  zeroReviewRatio: number;
  returningCustomerRate: number;
  dateStart: string;
  dateEnd: string;
}

export type ActiveTab = 'workbench' | 'dashboard' | 'detector' | 'dataset' | 'library';
