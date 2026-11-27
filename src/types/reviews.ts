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

export interface WebsiteScanResponse {
  scannedUrl: string;
  hostname: string;
  scannedPagesCount: number;
  businessType: 'ecommerce' | 'service';
  detectedFormat: CatalogFormat;
  detectedStoreBaseUrl: string;
  products: CatalogProduct[];
  pack: BusinessVoicePack;
}

export type ReviewerVoice = 'minimalist' | 'casual' | 'sports' | 'family' | 'technical';

export type ReviewLanguage =
  | 'en'
  | 'fr'
  | 'es'
  | 'de'
  | 'it'
  | 'pt'
  | 'nl'
  | 'ar'
  | 'darija_latin'
  | 'tr'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'hi'
  | 'pl';

export interface LanguageOption {
  code: ReviewLanguage;
  flag: string;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', flag: '🇺🇸', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  { code: 'fr', flag: '🇫🇷', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
  { code: 'es', flag: '🇪🇸', label: 'Spanish', nativeLabel: 'Español', dir: 'ltr' },
  { code: 'de', flag: '🇩🇪', label: 'German', nativeLabel: 'Deutsch', dir: 'ltr' },
  { code: 'it', flag: '🇮🇹', label: 'Italian', nativeLabel: 'Italiano', dir: 'ltr' },
  { code: 'pt', flag: '🇧🇷', label: 'Portuguese', nativeLabel: 'Português', dir: 'ltr' },
  { code: 'nl', flag: '🇳🇱', label: 'Dutch', nativeLabel: 'Nederlands', dir: 'ltr' },
  { code: 'ar', flag: '🇸🇦', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
  { code: 'darija_latin', flag: '🇲🇦', label: 'Darija (Latin)', nativeLabel: 'Darija Arabizi', dir: 'ltr' },
  { code: 'tr', flag: '🇹🇷', label: 'Turkish', nativeLabel: 'Türkçe', dir: 'ltr' },
  { code: 'ru', flag: '🇷🇺', label: 'Russian', nativeLabel: 'Русский', dir: 'ltr' },
  { code: 'zh', flag: '🇨🇳', label: 'Chinese', nativeLabel: '中文', dir: 'ltr' },
  { code: 'ja', flag: '🇯🇵', label: 'Japanese', nativeLabel: '日本語', dir: 'ltr' },
  { code: 'ko', flag: '🇰🇷', label: 'Korean', nativeLabel: '한국어', dir: 'ltr' },
  { code: 'hi', flag: '🇮🇳', label: 'Hindi', nativeLabel: 'हिन्दी', dir: 'ltr' },
  { code: 'pl', flag: '🇵🇱', label: 'Polish', nativeLabel: 'Polski', dir: 'ltr' },
];

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

export interface BusinessVoicePack {
  detectedBusinessName: string;
  businessSummary: string;
  productClassifications?: ProductClassification[];
  categoryContext?: CategoryVoiceContext[];
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

export type ActiveTab = 'workbench' | 'dashboard' | 'dataset' | 'library';
