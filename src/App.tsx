import { useCallback, useMemo, useRef, useState } from 'react';
import { ConfigSidebar } from './components/ConfigSidebar';
import { DatasetTableView } from './components/DatasetTableView';
import { TemplateLibraryView } from './components/TemplateLibraryView';
import { TopBar } from './components/TopBar';
import { WorkbenchView } from './components/WorkbenchView';
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

function getDefaultDateWindow(): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - 180 * 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function App() {
  const defaultDates = useMemo(() => getDefaultDateWindow(), []);

  const initialConfig: GeneratorConfig = useMemo(
    () => ({
      selectedCategories: [],
      selectedLanguages: ['en', 'fr', 'darija_latin', 'ar'],
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

  const [businessContext, setBusinessContext] = useState<string>('');
  const [adaptedPack, setAdaptedPack] = useState<BusinessVoicePack | null>(null);
  const [isAdapting, setIsAdapting] = useState<boolean>(false);
  const [adaptError, setAdaptError] = useState<string | null>(null);
  const requestIdRef = useRef<number>(0);

  const [reviews, setReviews] = useState<GeneratedReview[]>([]);

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

      try {
        const response = await fetch('/api/scan-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: trimmed,
            languages: config.selectedLanguages,
            businessContext: activeSampleId ? '' : businessContext,
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as Partial<WebsiteScanResponse> & {
          error?: string;
        };

        if (reqId !== requestIdRef.current) return;

        if (!response.ok || !payload.products || !payload.pack) {
          throw new Error(
            payload.error || `Website scan failed (HTTP ${response.status}).`
          );
        }

        const scannedProducts = payload.products;
        const scannedPack = payload.pack;
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

        setActiveSampleId(null);
        setProducts(scannedProducts);
        setDetectedFormat(nextFormat);
        setSourceLabel(payload.hostname || trimmed);
        setBusinessContext(scannedPack.businessSummary || '');
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
    [config, templates, businessContext, activeSampleId]
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
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          pack?: BusinessVoicePack;
          error?: string;
        };

        if (reqId !== requestIdRef.current) return;

        if (!response.ok || !payload.pack) {
          throw new Error(
            payload.error || `Auto-scan request failed (HTTP ${response.status}).`
          );
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

  const handleDeleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        reviewCount={reviews.length}
        exportFormat={config.exportFormat}
        onExportCSV={handleExportCSV}
      />

      <div className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row">
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
        />

        <main className="flex-1 min-w-0 flex flex-col">
          {activeTab === 'workbench' && (
            <WorkbenchView
              totalProductsCount={products.length}
              eligibleProducts={eligible}
              excludedCount={excluded.length}
              reviews={reviews}
              exportFormat={config.exportFormat}
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
              onRegenerateReview={handleRegenerateReview}
              onDeleteReview={handleDeleteReview}
              onExportCSV={handleExportCSV}
              onCopyCSV={handleCopyCSV}
              onOpenDatasetTab={() => setActiveTab('dataset')}
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
    </div>
  );
}
