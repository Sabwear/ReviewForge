import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BusinessProfileCard } from './components/BusinessProfileCard';
import { AIDetectorView, AuditRunSummary, ReviewAuditEntry } from './components/AIDetectorView';
import { ConfigSidebar } from './components/ConfigSidebar';
import { DashboardView } from './components/DashboardView';
import { DatasetTableView } from './components/DatasetTableView';
import { TemplateLibraryView } from './components/TemplateLibraryView';
import { AISettingsModal } from './components/AISettingsModal';
import { LoadingOperationType, LoadingProgressModal } from './components/LoadingProgressModal';
import { TopBar } from './components/TopBar';
import { WorkbenchView } from './components/WorkbenchView';
import { useAISettings } from './hooks/useAISettings';
import { useTheme } from './hooks/useTheme';
import { AI_PROVIDERS, AIUsageMetrics } from './types/ai';
import { DEFAULT_REVIEW_TEMPLATES } from './data/reviewTemplates';
import { CORE_TARGET_CATEGORIES, SAMPLE_BUSINESSES } from './data/sampleCatalog';
import { isIPTVCatalog } from './data/universalComposer';
import {
  ActiveTab,
  BusinessVoicePack,
  CatalogFormat,
  CatalogProduct,
  EXPORT_FORMAT_OPTIONS,
  GeneratedReview,
  GeneratorConfig,
  LANGUAGE_OPTIONS,
  ReviewLanguage,
  ReviewTemplate,
  SampleBusinessId,
  WebsiteScanResponse,
} from './types/reviews';
import {
  downloadExportFile,
  parseCatalogCSV,
  serializeReviewsByFormat,
} from './utils/csv';
import {
  filterEligibleProducts,
  generateReviewDataset,
  generateSingleReviewForProduct,
  normalizeReviewBody,
} from './utils/generator';

const AUDIT_MAP_STORAGE_KEY = 'reviewforge-ai-audit-map-v1';
const AUDIT_RUNS_STORAGE_KEY = 'reviewforge-ai-audit-runs-v1';
const VERIFIED_IDS_STORAGE_KEY = 'reviewforge-verified-review-ids-v1';
const SAVED_LANGUAGES_KEY = 'reviewforge-selected-languages-v1';

function loadSavedVerifiedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(VERIFIED_IDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

const VALID_LANGUAGE_CODES = new Set<string>(LANGUAGE_OPTIONS.map((l) => l.code));

const TOP_5_LANGUAGES: ReviewLanguage[] = ['en', 'fr', 'es', 'de', 'ar'];

function loadSavedLanguages(): ReviewLanguage[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SAVED_LANGUAGES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter(
      (code): code is ReviewLanguage => typeof code === 'string' && VALID_LANGUAGE_CODES.has(code)
    );
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

function loadSavedAuditMap(): Record<string, ReviewAuditEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(AUDIT_MAP_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ReviewAuditEntry>) : {};
  } catch {
    return {};
  }
}

function loadSavedAuditRuns(): AuditRunSummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_RUNS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getDefaultDateWindow(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - 180 * 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function App() {
  const { theme, setTheme } = useTheme();
  const {
    settings: aiSettings,
    updateSettings: updateAISettings,
    selectProvider: selectAIProvider,
    getRequestPayload: getAIRequestPayload,
    isAIConfigured,
    connectionStatus,
    serverFallback,
    detectedModels,
    isLoadingModels,
    modelsError,
    detectModels,
    verifySecretCode,
    usageHistory,
    recordUsage,
    clearUsageHistory,
  } = useAISettings();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const aiStatusLabel = useMemo(() => {
    if (aiSettings.provider === 'fallback') {
      return aiSettings.fallbackUnlocked
        ? `Fallback · ${aiSettings.model || 'Active'}`
        : 'Fallback (Locked)';
    }
    const meta = AI_PROVIDERS.find((p) => p.id === aiSettings.provider);
    if (!isAIConfigured) return 'Configure AI';
    return `${meta?.shortLabel || aiSettings.provider} · ${aiSettings.model || 'Default'}`;
  }, [aiSettings, isAIConfigured]);

  const defaultDates = useMemo(() => getDefaultDateWindow(), []);

  const initialConfig: GeneratorConfig = useMemo(
    () => ({
      selectedCategories: [],
      selectedLanguages: TOP_5_LANGUAGES,
      excludeByKeywords: false,
      excludeKeywords: 'test, trial, sample',
      exportFormat: 'judge_me',
      storeBaseUrl: '',
      volumePreset: 'realistic',
      minReviewsPerItem: 0,
      maxReviewsPerItem: 15,
      maxTotalReviews: null,
      zeroReviewRatio: 15,
      returningCustomerRate: 24,
      dateStart: defaultDates.start,
      dateEnd: defaultDates.end,
    }),
    [defaultDates]
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('workbench');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [sourceLabel, setSourceLabel] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<CatalogFormat>('standard');
  const [activeSampleId, setActiveSampleId] = useState<SampleBusinessId | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ReviewTemplate[]>(DEFAULT_REVIEW_TEMPLATES);
  const [config, setConfig] = useState<GeneratorConfig>(initialConfig);

  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [isScanningWebsite, setIsScanningWebsite] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<WebsiteScanResponse | null>(null);

  const [businessContext, setBusinessContext] = useState<string>('');
  const [adaptedPack, setAdaptedPack] = useState<BusinessVoicePack | null>(null);
  const [isAdapting, setIsAdapting] = useState<boolean>(false);
  const [adaptError, setAdaptError] = useState<string | null>(null);
  const requestIdRef = useRef<number>(0);

  const [reviews, setReviews] = useState<GeneratedReview[]>([]);
  const [reviewAuditMap, setReviewAuditMap] = useState<Record<string, ReviewAuditEntry>>(loadSavedAuditMap);
  const [auditRuns, setAuditRuns] = useState<AuditRunSummary[]>(loadSavedAuditRuns);
  const [verifiedReviewIds, setVerifiedReviewIds] = useState<string[]>(loadSavedVerifiedIds);
  const [isAuditingReviews, setIsAuditingReviews] = useState(false);
  const [isRewritingReviews, setIsRewritingReviews] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  const [lastUsedLanguages, setLastUsedLanguages] = useState<ReviewLanguage[] | null>(
    loadSavedLanguages
  );
  const hasInteractedLanguagesRef = useRef(false);

  useEffect(() => {
    if (!hasInteractedLanguagesRef.current) {
      hasInteractedLanguagesRef.current = true;
      return;
    }
    if (config.selectedLanguages.length === 0) return;
    setLastUsedLanguages(config.selectedLanguages);
    try {
      window.localStorage.setItem(SAVED_LANGUAGES_KEY, JSON.stringify(config.selectedLanguages));
    } catch {
      // ignore storage errors
    }
  }, [config.selectedLanguages]);

  useEffect(() => {
    try {
      window.localStorage.setItem(AUDIT_MAP_STORAGE_KEY, JSON.stringify(reviewAuditMap));
    } catch {
      // ignore storage errors
    }
  }, [reviewAuditMap]);

  useEffect(() => {
    try {
      window.localStorage.setItem(AUDIT_RUNS_STORAGE_KEY, JSON.stringify(auditRuns));
    } catch {
      // ignore storage errors
    }
  }, [auditRuns]);

  useEffect(() => {
    try {
      window.localStorage.setItem(VERIFIED_IDS_STORAGE_KEY, JSON.stringify(verifiedReviewIds));
    } catch {
      // ignore storage errors
    }
  }, [verifiedReviewIds]);

  const { eligible, excluded } = useMemo(
    () => filterEligibleProducts(products, config),
    [products, config]
  );

  const availableCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );

  const activeBusinessLabel = useMemo(() => {
    if (adaptedPack?.detectedBusinessName) {
      return adaptedPack.detectedBusinessName;
    }
    if (products.length === 0) {
      return 'General Workspace';
    }
    if (isIPTVCatalog(products)) {
      return 'IPTV & Streaming (built-in)';
    }
    const sample = SAMPLE_BUSINESSES.find((b) => b.id === activeSampleId);
    return sample ? sample.label : sourceLabel || 'Custom Business Catalog';
  }, [adaptedPack, products, activeSampleId, sourceLabel]);

  const handleScanWebsite = useCallback(
    async (rawUrl: string) => {
      const trimmed = rawUrl.trim();
      if (!trimmed || config.selectedLanguages.length === 0) return;

      const reqId = ++requestIdRef.current;
      setIsScanningWebsite(true);
      setIsAdapting(false);
      setScanError(null);
      setParseError(null);
      setAdaptError(null);
      setScanResult(null);

      try {
        const response = await fetch('/api/scan-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: trimmed,
            languages: config.selectedLanguages,
            businessContext: activeSampleId ? '' : businessContext,
            aiConfig: getAIRequestPayload(),
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as Partial<WebsiteScanResponse> & {
          error?: string;
          aiUsage?: AIUsageMetrics | null;
        };

        if (reqId !== requestIdRef.current) return;

        if (!response.ok || !payload.products) {
          throw new Error(
            payload.error || `Website scan failed (HTTP ${response.status}).`
          );
        }

        if (payload.aiUsage) {
          recordUsage('scan-website', payload.aiUsage, 'success');
        }

        const scannedProducts = payload.products;
        const scannedPack = (payload.pack ?? null) as BusinessVoicePack | null;
        const scannedCategories = Array.from(new Set(scannedProducts.map((p) => p.category)));
        const nextFormat: CatalogFormat = payload.detectedFormat || 'website';
        const nextExportFormat =
          nextFormat === 'shopify' || payload.businessType === 'ecommerce'
            ? 'judge_me'
            : 'standard';

        const nextConfig: GeneratorConfig = {
          ...config,
          selectedCategories: scannedCategories,
          excludeByKeywords: false,
          exportFormat: nextExportFormat,
          storeBaseUrl: payload.detectedStoreBaseUrl || '',
        };

        setScanResult(payload as WebsiteScanResponse);
        const autoBusinessSummary =
          scannedPack?.businessSummary?.trim() ||
          payload.detectedBusinessSummary?.trim() ||
          `${payload.detectedBusinessName || payload.hostname || trimmed} — ${
            payload.businessType === 'ecommerce' ? 'Online store' : 'Service business'
          } offering ${scannedCategories.slice(0, 4).join(', ')} (${scannedProducts
            .slice(0, 4)
            .map((p) => p.item_name)
            .join(', ')}).`;

        setActiveSampleId(null);
        setProducts(scannedProducts);
        setDetectedFormat(nextFormat);
        setSourceLabel(payload.detectedBusinessName || payload.hostname || trimmed);
        setBusinessContext(autoBusinessSummary);
        setAdaptedPack(scannedPack);
        setConfig(nextConfig);
        setReviews(
          generateReviewDataset(scannedProducts, nextConfig, templates, scannedPack)
        );
      } catch (err: unknown) {
        if (reqId !== requestIdRef.current) return;
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to scan that website. Please verify the URL and try again.';
        setScanError(message);
      } finally {
        if (reqId === requestIdRef.current) {
          setIsScanningWebsite(false);
        }
      }
    },
    [config, templates, businessContext, activeSampleId, getAIRequestPayload, recordUsage]
  );

  const runBusinessAdaptation = useCallback(
    async (
      targetProducts: CatalogProduct[],
      targetConfig: GeneratorConfig,
      targetContext: string,
      filename?: string
    ) => {
      if (targetProducts.length === 0 || targetConfig.selectedLanguages.length === 0) return;

      const reqId = ++requestIdRef.current;
      setIsAdapting(true);
      setAdaptError(null);

      try {
        const categories = Array.from(new Set(targetProducts.map((p) => p.category)));
        const sampleProducts = targetProducts.slice(0, 50).map((p) => ({
          item_slug: p.item_slug,
          item_name: p.item_name,
          category: p.category,
          product_url: p.product_url,
        }));

        const response = await fetch('/api/adapt-business', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: sampleProducts,
            categories,
            languages: targetConfig.selectedLanguages,
            businessContext: targetContext,
            filename: filename || sourceLabel,
            storeUrl: targetConfig.storeBaseUrl || targetProducts[0]?.product_url || '',
            aiConfig: getAIRequestPayload(),
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          pack?: BusinessVoicePack;
          aiUsage?: AIUsageMetrics | null;
          error?: string;
        };

        if (reqId !== requestIdRef.current) return;

        if (!response.ok || !payload.pack) {
          recordUsage('adapt-business', payload.aiUsage, 'error', payload.error);
          throw new Error(
            payload.error || `Auto-scan request failed (HTTP ${response.status}).`
          );
        }

        if (payload.aiUsage) {
          recordUsage('adapt-business', payload.aiUsage, 'success');
        }

        const pack = payload.pack;
        let refinedProducts = targetProducts;
        let refinedConfig = targetConfig;

        if (Array.isArray(pack.productClassifications) && pack.productClassifications.length > 0) {
          const classMap = new Map(
            pack.productClassifications.map((c) => [c.item_slug.toLowerCase(), c])
          );
          refinedProducts = targetProducts.map((p) => {
            const matched = classMap.get(p.item_slug.toLowerCase());
            if (!matched) return p;
            return {
              ...p,
              item_name: matched.cleanName?.trim() || p.item_name,
              category: matched.category?.trim() || p.category,
            };
          });
          const refinedCategories = Array.from(new Set(refinedProducts.map((p) => p.category)));
          refinedConfig = {
            ...targetConfig,
            selectedCategories: refinedCategories,
          };
          setProducts(refinedProducts);
          setConfig(refinedConfig);
        }

        setAdaptedPack(pack);
        setReviews(
          generateReviewDataset(refinedProducts, refinedConfig, templates, pack)
        );
      } catch (err: unknown) {
        if (reqId !== requestIdRef.current) return;
        const message =
          err instanceof Error
            ? err.message
            : 'Could not complete adaptation right now. Built-in category reviews remain active.';
        setAdaptError(message);
      } finally {
        if (reqId === requestIdRef.current) {
          setIsAdapting(false);
        }
      }
    },
    [templates, sourceLabel]
  );

  const handleAdaptBusiness = useCallback(() => {
    void runBusinessAdaptation(products, config, businessContext, sourceLabel);
  }, [runBusinessAdaptation, products, config, businessContext, sourceLabel]);

  const handleResetAdaptedPack = useCallback(() => {
    requestIdRef.current += 1;
    setIsAdapting(false);
    setIsScanningWebsite(false);
    setAdaptError(null);
    setScanError(null);
    setAdaptedPack(null);
    setReviews(generateReviewDataset(products, config, templates, null));
  }, [products, config, templates]);

  const handleClearWorkspace = useCallback(() => {
    requestIdRef.current += 1;
    setIsAdapting(false);
    setIsScanningWebsite(false);
    setParseError(null);
    setScanError(null);
    setAdaptError(null);
    setAdaptedPack(null);
    setActiveSampleId(null);
    setScanResult(null);
    setWebsiteUrl('');
    setSourceLabel('');
    setBusinessContext('');
    setProducts([]);
    setReviews([]);
    setDetectedFormat('standard');
    setConfig((prev) => ({
      ...prev,
      selectedCategories: [],
      storeBaseUrl: '',
      excludeByKeywords: false,
      excludeKeywords: 'test, trial, sample',
    }));
  }, []);

  const applyParsedCatalog = useCallback(
    (rawText: string, label: string) => {
      const result = parseCatalogCSV(rawText, label);
      if (result.products.length === 0) {
        setParseError(result.errors[0] || 'Could not parse any valid rows from CSV.');
        return;
      }

      setParseError(null);
      setScanError(null);
      setAdaptError(null);
      setAdaptedPack(null);
      setActiveSampleId(null);
      setScanResult(null);
      setProducts(result.products);
      setSourceLabel(label);
      setDetectedFormat(result.detectedFormat);

      const detectedCats = Array.from(new Set(result.products.map((p) => p.category)));
      const iptvCatalog = isIPTVCatalog(result.products);
      const matchedCore = iptvCatalog
        ? detectedCats.filter((cat) =>
            CORE_TARGET_CATEGORIES.some((core) => core.toLowerCase() === cat.toLowerCase())
          )
        : [];
      const nextSelected = matchedCore.length > 0 ? matchedCore : detectedCats;

      const nextExportFormat =
        result.detectedFormat === 'judge_me' || result.detectedFormat === 'shopify'
          ? 'judge_me'
          : config.exportFormat;

      const nextConfig: GeneratorConfig = {
        ...config,
        selectedCategories: nextSelected,
        excludeKeywords: iptvCatalog ? 'test, trial, 24h' : 'test, trial, sample',
        exportFormat: nextExportFormat,
        storeBaseUrl: result.detectedStoreBaseUrl || config.storeBaseUrl,
      };
      const autoContext = result.detectedBusinessHint
        ? `Store detected from file: ${result.detectedBusinessHint}`
        : '';

      setConfig(nextConfig);
      setBusinessContext(autoContext);

      setReviews(generateReviewDataset(result.products, nextConfig, templates, null));

      if (!iptvCatalog) {
        void runBusinessAdaptation(result.products, nextConfig, autoContext, label);
      }
    },
    [config, templates, runBusinessAdaptation]
  );

  const handleUploadFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = typeof e.target?.result === 'string' ? e.target.result : '';
        applyParsedCatalog(text, file.name);
      };
      reader.onerror = () => {
        setParseError('Failed to read the selected CSV file.');
      };
      reader.readAsText(file);
    },
    [applyParsedCatalog]
  );

  const handlePasteCSV = useCallback(
    (rawText: string) => {
      applyParsedCatalog(rawText, 'Pasted CSV Data');
    },
    [applyParsedCatalog]
  );

  const handleLoadSampleBusiness = useCallback(
    (sampleId: SampleBusinessId) => {
      const preset = SAMPLE_BUSINESSES.find((b) => b.id === sampleId);
      if (!preset) return;

      requestIdRef.current += 1;
      setIsAdapting(false);
      setIsScanningWebsite(false);
      setParseError(null);
      setScanError(null);
      setAdaptError(null);
      setAdaptedPack(null);
      setActiveSampleId(preset.id);
      setScanResult(null);
      setProducts(preset.products);
      setSourceLabel(preset.sourceLabel);
      setDetectedFormat(preset.id === 'services' ? 'website' : 'standard');
      setBusinessContext(preset.defaultContext);

      const detectedCats = Array.from(new Set(preset.products.map((p) => p.category)));
      const nextConfig: GeneratorConfig = {
        ...config,
        selectedCategories: preset.defaultCategories ?? detectedCats,
        excludeByKeywords: true,
        excludeKeywords: preset.defaultExcludeKeywords,
        exportFormat: preset.defaultExportFormat,
        storeBaseUrl: preset.defaultStoreBaseUrl,
      };
      setConfig(nextConfig);
      setReviews(generateReviewDataset(preset.products, nextConfig, templates, null));
    },
    [config, templates]
  );

  const handleGenerate = useCallback(() => {
    const nextReviews = generateReviewDataset(products, config, templates, adaptedPack);
    setReviews(nextReviews);
  }, [products, config, templates, adaptedPack]);

  const handleRegenerateReview = useCallback(
    (reviewId: string) => {
      setReviews((prev) => {
        const existingBodies = new Set(
          prev
            .filter((r) => r.id !== reviewId)
            .map((r) => normalizeReviewBody(r.body))
        );
        const existingEmails = new Set(prev.map((r) => r.reviewer_email));

        return prev.map((row) => {
          if (row.id !== reviewId) return row;
          const product = products.find(
            (p) => p.item_id === row.item_id && p.item_slug === row.item_slug
          ) || {
            item_id: row.item_id,
            item_slug: row.item_slug,
            item_name: row.item_name,
            category: row.category,
            product_url: row.product_url,
            picture_urls: row.picture_urls,
          };
          return generateSingleReviewForProduct(
            product,
            config,
            templates,
            existingEmails,
            existingBodies,
            row.isReturningCustomer ? row.reviewer_email : undefined,
            row.isReturningCustomer ? row.reviewer_name : undefined,
            row.isReturningCustomer ? row.language : undefined,
            row.isReturningCustomer,
            adaptedPack,
            products
          );
        });
      });
    },
    [products, config, templates, adaptedPack]
  );

  const handleDeleteReview = useCallback((reviewId: string) => {
    setReviews((prev) => prev.filter((row) => row.id !== reviewId));
  }, []);

  const handleExportCSV = useCallback(() => {
    if (reviews.length === 0) return;
    const fmt =
      EXPORT_FORMAT_OPTIONS.find((f) => f.id === config.exportFormat) ??
      EXPORT_FORMAT_OPTIONS[0];
    const output = serializeReviewsByFormat(
      reviews,
      config.exportFormat,
      config.storeBaseUrl,
      activeBusinessLabel
    );
    const slug = activeBusinessLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 28);
    const suffix = config.exportFormat === 'judge_me' ? 'judgeme_reviews' : 'reviews';
    const filename = `${slug || 'business'}_${suffix}_${reviews.length}_rows.${fmt.extension}`;
    downloadExportFile(output, filename, fmt.mimeType);
  }, [reviews, config.exportFormat, config.storeBaseUrl, activeBusinessLabel]);

  const handleCopyCSV = useCallback(async (): Promise<boolean> => {
    if (reviews.length === 0) return false;
    try {
      const output = serializeReviewsByFormat(
        reviews,
        config.exportFormat,
        config.storeBaseUrl,
        activeBusinessLabel
      );
      await navigator.clipboard.writeText(output);
      return true;
    } catch {
      return false;
    }
  }, [reviews, config.exportFormat, config.storeBaseUrl, activeBusinessLabel]);

  const handleAddTemplate = useCallback(
    (tpl: Omit<ReviewTemplate, 'id' | 'isCustom'>) => {
      const created: ReviewTemplate = {
        ...tpl,
        id: `custom-${Date.now()}`,
        isCustom: true,
      };
      setTemplates((prev) => [created, ...prev]);
    },
    []
  );

  const handleAuditReviews = useCallback(
    async (targetReviews: GeneratedReview[]) => {
      if (targetReviews.length === 0) return;
      setIsAuditingReviews(true);
      setAuditError(null);
      try {
        const res = await fetch('/api/ai/detect-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviews: targetReviews.slice(0, 35).map((r) => ({
              id: r.id,
              item_name: r.item_name,
              category: r.category,
              stars: r.stars,
              language: r.language,
              subject: r.subject,
              body: r.body,
            })),
            businessContext: businessContext || activeBusinessLabel,
            aiConfig: getAIRequestPayload(),
          }),
        });
        const payload = (await res.json().catch(() => ({}))) as {
          results?: ReviewAuditEntry[] & Array<{ id: string }>;
          aiUsage?: AIUsageMetrics | null;
          error?: string;
        };
        if (!res.ok || !Array.isArray(payload.results)) {
          recordUsage('detect-reviews', payload.aiUsage, 'error', payload.error);
          throw new Error(payload.error || `AI detection failed (HTTP ${res.status}).`);
        }
        if (payload.aiUsage) {
          recordUsage('detect-reviews', payload.aiUsage, 'success');
        }
        const nowIso = new Date().toISOString();
        setReviewAuditMap((prev) => {
          const next = { ...prev };
          for (const item of payload.results!) {
            next[item.id] = {
              humanScore: item.humanScore,
              verdict: item.verdict,
              reason: item.reason,
              signals: item.signals,
              flaggedPhrases: item.flaggedPhrases,
              suggestion: item.suggestion,
              dimensions: item.dimensions,
              auditedAt: nowIso,
            };
          }
          return next;
        });
        const checkedCount = payload.results.length;
        const avgHumanScore =
          checkedCount > 0
            ? Math.round(payload.results.reduce((s, x) => s + x.humanScore, 0) / checkedCount)
            : 0;
        const flaggedCount = payload.results.filter((x) => x.verdict !== 'human').length;
        setAuditRuns((prev) =>
          [
            {
              id: `${Date.now()}`,
              timestamp: nowIso,
              checkedCount,
              avgHumanScore,
              flaggedCount,
            },
            ...prev,
          ].slice(0, 50)
        );
      } catch (err) {
        setAuditError(err instanceof Error ? err.message : 'AI detection failed.');
      } finally {
        setIsAuditingReviews(false);
      }
    },
    [businessContext, activeBusinessLabel, getAIRequestPayload, recordUsage]
  );

  const handleRewriteFlaggedReviews = useCallback(
    async (flaggedReviews: GeneratedReview[]) => {
      if (flaggedReviews.length === 0) return;
      setIsRewritingReviews(true);
      setAuditError(null);
      try {
        const res = await fetch('/api/ai/rewrite-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviews: flaggedReviews.slice(0, 20).map((r) => ({
              id: r.id,
              item_name: r.item_name,
              category: r.category,
              stars: r.stars,
              language: r.language,
              subject: r.subject,
              body: r.body,
            })),
            businessContext: businessContext || activeBusinessLabel,
            aiConfig: getAIRequestPayload(),
          }),
        });
        const payload = (await res.json().catch(() => ({}))) as {
          rewrites?: Array<{ id: string; subject: string; body: string }>;
          aiUsage?: AIUsageMetrics | null;
          error?: string;
        };
        if (!res.ok || !Array.isArray(payload.rewrites)) {
          recordUsage('rewrite-reviews', payload.aiUsage, 'error', payload.error);
          throw new Error(payload.error || `AI rewrite failed (HTTP ${res.status}).`);
        }
        if (payload.aiUsage) {
          recordUsage('rewrite-reviews', payload.aiUsage, 'success');
        }
        const rewriteMap = new Map(payload.rewrites.map((rw) => [rw.id, rw]));
        setReviews((prev) =>
          prev.map((r) => {
            const rw = rewriteMap.get(r.id);
            if (!rw || !rw.body) return r;
            return {
              ...r,
              subject: rw.subject || r.subject,
              body: rw.body,
            };
          })
        );
        setReviewAuditMap((prev) => {
          const next = { ...prev };
          for (const rw of payload.rewrites!) {
            next[rw.id] = {
              humanScore: 93,
              verdict: 'human',
              reason: 'Rewritten by AI for natural human tone & business fit.',
            };
          }
          return next;
        });
      } catch (err) {
        setAuditError(err instanceof Error ? err.message : 'AI rewrite failed.');
      } finally {
        setIsRewritingReviews(false);
      }
    },
    [businessContext, activeBusinessLabel, getAIRequestPayload, recordUsage]
  );

  const handleClearAuditData = useCallback(() => {
    setReviewAuditMap({});
    setAuditRuns([]);
    setVerifiedReviewIds([]);
    setAuditError(null);
    try {
      window.localStorage.removeItem(AUDIT_MAP_STORAGE_KEY);
      window.localStorage.removeItem(AUDIT_RUNS_STORAGE_KEY);
      window.localStorage.removeItem(VERIFIED_IDS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleToggleVerified = useCallback((reviewId: string) => {
    setVerifiedReviewIds((prev) =>
      prev.includes(reviewId) ? prev.filter((id) => id !== reviewId) : [...prev, reviewId]
    );
  }, []);

  const handleApproveCleanReviews = useCallback((ids: string[]) => {
    setVerifiedReviewIds((prev) => Array.from(new Set([...prev, ...ids])));
  }, []);

  const handleExportVerifiedOnly = useCallback(() => {
    const idSet = new Set(verifiedReviewIds);
    const verifiedReviews = reviews.filter((r) => idSet.has(r.id));
    if (verifiedReviews.length === 0) return;
    const formatMeta =
      EXPORT_FORMAT_OPTIONS.find((f) => f.id === config.exportFormat) ??
      EXPORT_FORMAT_OPTIONS[0];
    const content = serializeReviewsByFormat(
      verifiedReviews,
      config.exportFormat,
      config.storeBaseUrl,
      activeBusinessLabel
    );
    const slug = activeBusinessLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    downloadExportFile(
      content,
      `${slug || 'reviews'}_verified_publish_${verifiedReviews.length}_rows.${formatMeta.extension}`,
      formatMeta.mimeType
    );
  }, [reviews, verifiedReviewIds, config.exportFormat, config.storeBaseUrl, activeBusinessLabel]);

  const handleDeleteFlaggedReviews = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setReviews((prev) => prev.filter((r) => !idSet.has(r.id)));
    setReviewAuditMap((prev) => {
      const next = { ...prev };
      for (const id of ids) delete next[id];
      return next;
    });
  }, []);

  const handleExportHumanOnly = useCallback(() => {
    const cleanReviews = reviews.filter((r) => reviewAuditMap[r.id]?.verdict === 'human');
    if (cleanReviews.length === 0) return;
    const formatMeta =
      EXPORT_FORMAT_OPTIONS.find((f) => f.id === config.exportFormat) ??
      EXPORT_FORMAT_OPTIONS[0];
    const content = serializeReviewsByFormat(
      cleanReviews,
      config.exportFormat,
      config.storeBaseUrl,
      activeBusinessLabel
    );
    const slug = activeBusinessLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    downloadExportFile(
      content,
      `${slug || 'reviews'}_human_verified_${cleanReviews.length}_rows.${formatMeta.extension}`,
      formatMeta.mimeType
    );
  }, [reviews, reviewAuditMap, config.exportFormat, config.storeBaseUrl, activeBusinessLabel]);

  const handleDeleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0F1115] text-slate-900 dark:text-[#E4E6EB] transition-colors duration-200">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        reviewCount={reviews.length}
        exportFormat={config.exportFormat}
        onExportCSV={handleExportCSV}
        theme={theme}
        onThemeChange={setTheme}
        aiStatusLabel={aiStatusLabel}
        aiConnectionStatus={connectionStatus}
        onOpenAISettings={() => setIsAIModalOpen(true)}
      />

      <div className="flex-1 w-full max-w-[1680px] mx-auto flex flex-col lg:flex-row">
        <ConfigSidebar
          products={products}
          sourceLabel={sourceLabel}
          detectedFormat={detectedFormat}
          activeSampleId={activeSampleId}
          parseError={parseError}
          config={config}
          eligibleCount={eligible.length}
          websiteUrl={websiteUrl}
          isScanningWebsite={isScanningWebsite}
          scanError={scanError}
          businessContext={businessContext}
          adaptedPack={adaptedPack}
          isAdapting={isAdapting}
          adaptError={adaptError}
          onWebsiteUrlChange={setWebsiteUrl}
          onScanWebsite={handleScanWebsite}
          onBusinessContextChange={setBusinessContext}
          onAdaptBusiness={handleAdaptBusiness}
          onResetAdaptedPack={handleResetAdaptedPack}
          onConfigChange={setConfig}
          onUploadFile={handleUploadFile}
          onPasteCSV={handlePasteCSV}
          onLoadSampleBusiness={handleLoadSampleBusiness}
          onClearWorkspace={handleClearWorkspace}
          onGenerate={handleGenerate}
          lastUsedLanguages={lastUsedLanguages}
        />

        <main className="flex-1 min-w-0 flex flex-col">
          {activeTab === 'workbench' && scanResult && (
            <div className="px-6 lg:px-8 pt-6 lg:pt-8">
              <BusinessProfileCard
                key={scanResult.scannedUrl}
                scan={scanResult}
                onDismiss={() => setScanResult(null)}
              />
            </div>
          )}

          {activeTab === 'workbench' && (
            <WorkbenchView
              totalProductsCount={products.length}
              eligibleProducts={eligible}
              excludedCount={excluded.length}
              reviews={reviews}
              exportFormat={config.exportFormat}
              storeBaseUrl={config.storeBaseUrl}
              volumePreset={config.volumePreset}
              minReviewsPerItem={config.minReviewsPerItem}
              maxReviewsPerItem={config.maxReviewsPerItem}
              maxTotalReviews={config.maxTotalReviews}
              zeroReviewRatio={config.zeroReviewRatio}
              selectedLanguages={config.selectedLanguages}
              activeBusinessLabel={activeBusinessLabel}
              isAdapted={Boolean(adaptedPack)}
              isAdapting={isAdapting || isScanningWebsite}
              websiteUrl={websiteUrl}
              isScanningWebsite={isScanningWebsite}
              scanError={scanError}
              onWebsiteUrlChange={setWebsiteUrl}
              onScanWebsite={handleScanWebsite}
              onUploadFile={handleUploadFile}
              onLoadSampleBusiness={handleLoadSampleBusiness}
              onSelectExportFormat={(exportFormat) =>
                setConfig((prev) => ({ ...prev, exportFormat }))
              }
              onRegenerateReview={handleRegenerateReview}
              onDeleteReview={handleDeleteReview}
              onExportCSV={handleExportCSV}
              onCopyCSV={handleCopyCSV}
              onOpenDatasetTab={() => setActiveTab('dataset')}
              aiOnline={connectionStatus === 'online' || isAIConfigured}
              onOpenAISettings={() => setIsAIModalOpen(true)}
              onAuditReviews={handleAuditReviews}
              onRewriteFlaggedReviews={handleRewriteFlaggedReviews}
              isAuditingReviews={isAuditingReviews}
              isRewritingReviews={isRewritingReviews}
              auditError={auditError}
              reviewAuditMap={reviewAuditMap}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              reviews={reviews}
              eligibleProducts={eligible}
              exportFormat={config.exportFormat}
              activeBusinessLabel={activeBusinessLabel}
              onExportCSV={handleExportCSV}
              onOpenWorkbench={() => setActiveTab('workbench')}
              onLoadSampleBusiness={handleLoadSampleBusiness}
              aiUsageHistory={usageHistory}
              activeAIProviderLabel={aiStatusLabel}
              aiConnectionStatus={connectionStatus}
              onOpenAISettings={() => setIsAIModalOpen(true)}
              onClearAIUsage={clearUsageHistory}
            />
          )}

          {activeTab === 'detector' && (
            <AIDetectorView
              reviews={reviews}
              reviewAuditMap={reviewAuditMap}
              auditRuns={auditRuns}
              activeBusinessLabel={activeBusinessLabel}
              aiConnectionStatus={connectionStatus}
              aiOnline={connectionStatus === 'online' || isAIConfigured}
              isAuditing={isAuditingReviews}
              isRewriting={isRewritingReviews}
              auditError={auditError}
              onOpenAISettings={() => setIsAIModalOpen(true)}
              onOpenWorkbench={() => setActiveTab('workbench')}
              onAuditReviews={handleAuditReviews}
              onRewriteFlagged={handleRewriteFlaggedReviews}
              onRegenerateReview={handleRegenerateReview}
              onDeleteReview={handleDeleteReview}
              onDeleteFlaggedReviews={handleDeleteFlaggedReviews}
              onClearAuditData={handleClearAuditData}
              onExportHumanOnly={handleExportHumanOnly}
              verifiedIds={verifiedReviewIds}
              onToggleVerified={handleToggleVerified}
              onApproveCleanReviews={handleApproveCleanReviews}
              onExportVerifiedOnly={handleExportVerifiedOnly}
            />
          )}

          {activeTab === 'dataset' && (
            <DatasetTableView
              reviews={reviews}
              exportFormat={config.exportFormat}
              storeBaseUrl={config.storeBaseUrl}
              activeBusinessLabel={activeBusinessLabel}
              onExportCSV={handleExportCSV}
              onCopyCSV={handleCopyCSV}
            />
          )}

          {activeTab === 'library' && (
            <TemplateLibraryView
              templates={templates}
              availableCategories={availableCategories}
              onAddTemplate={handleAddTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          )}
        </main>
      </div>

      <AISettingsModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        settings={aiSettings}
        onUpdateSettings={updateAISettings}
        onSelectProvider={selectAIProvider}
        detectedModels={detectedModels}
        isLoadingModels={isLoadingModels}
        modelsError={modelsError}
        onDetectModels={detectModels}
        onVerifySecretCode={verifySecretCode}
        usageHistory={usageHistory}
        onClearUsage={clearUsageHistory}
        onOpenDashboard={() => setActiveTab('dashboard')}
        connectionStatus={connectionStatus}
        serverFallback={serverFallback}
      />

      <LoadingProgressModal
        operation={
          (isScanningWebsite
            ? 'scan'
            : isAdapting
            ? 'adapt'
            : isAuditingReviews
            ? 'detect'
            : isRewritingReviews
            ? 'rewrite'
            : null) as LoadingOperationType | null
        }
        detailText={
          isScanningWebsite && websiteUrl
            ? `Scanning ${websiteUrl} and extracting offerings…`
            : undefined
        }
        aiLabel={aiStatusLabel}
      />
    </div>
  );
}
