import { CatalogProduct, ExportFormat, SampleBusinessId } from '../types/reviews';

export const CORE_TARGET_CATEGORIES = [
  'IPTV Subscriptions',
  'M3U Playlists',
  'Player Activation',
];

export interface SampleBusinessPreset {
  id: SampleBusinessId;
  label: string;
  shortLabel: string;
  sourceLabel: string;
  defaultContext: string;
  defaultExcludeKeywords: string;
  defaultExportFormat: ExportFormat;
  defaultStoreBaseUrl: string;
  products: CatalogProduct[];
  defaultCategories?: string[];
}

export const SERVICES_SAMPLE_CATALOG: CatalogProduct[] = [
  { item_id: '501', item_slug: 'brand-identity-design', item_name: 'Brand Identity & Logo System', category: 'Design & Branding' },
  { item_id: '502', item_slug: 'custom-website-design', item_name: 'Custom Website Design & Build', category: 'Web Development' },
  { item_id: '503', item_slug: 'shopify-store-setup', item_name: 'E-Commerce Store Setup & Migration', category: 'Web Development' },
  { item_id: '504', item_slug: 'landing-page-optimization', item_name: 'Conversion Landing Page Sprint', category: 'Web Development' },
  { item_id: '505', item_slug: 'technical-seo-audit', item_name: 'Technical SEO & Site Speed Audit', category: 'Growth & Marketing' },
  { item_id: '506', item_slug: 'paid-search-management', item_name: 'Monthly Search & Social Ads Management', category: 'Growth & Marketing' },
  { item_id: '507', item_slug: 'email-lifecycle-flows', item_name: 'Email Automation & Lifecycle Flows', category: 'Growth & Marketing' },
  { item_id: '508', item_slug: 'product-photography-pack', item_name: 'Studio Product Photography Pack', category: 'Design & Branding' },
  { item_id: '509', item_slug: 'monthly-site-care-plan', item_name: 'Monthly Website Care & Support Plan', category: 'Maintenance & Support' },
  { item_id: '510', item_slug: 'strategy-workshop-session', item_name: '1-on-1 Digital Strategy Workshop', category: 'Consulting' },
  { item_id: '511', item_slug: 'free-discovery-call', item_name: 'Free 15-Min Discovery Call', category: 'Consulting' },
];

export const SKINCARE_SAMPLE_CATALOG: CatalogProduct[] = [
  { item_id: '101', item_slug: 'vitamin-c-radiance-serum', item_name: 'Vitamin C 15% Radiance Serum', category: 'Serums' },
  { item_id: '102', item_slug: 'hyaluronic-b5-plumping-drops', item_name: 'Hyaluronic B5 Plumping Drops', category: 'Serums' },
  { item_id: '103', item_slug: 'niacinamide-pore-refining-serum', item_name: 'Niacinamide 10% Pore Serum', category: 'Serums' },
  { item_id: '104', item_slug: 'retinol-night-renewal-oil', item_name: 'Retinol 0.5% Night Renewal Oil', category: 'Serums' },
  { item_id: '105', item_slug: 'ceramide-barrier-cream', item_name: 'Ceramide Barrier Repair Cream', category: 'Moisturizers' },
  { item_id: '106', item_slug: 'argan-rose-hydra-gel', item_name: 'Argan & Rose Water Hydra-Gel', category: 'Moisturizers' },
  { item_id: '107', item_slug: 'squalane-cloud-whip', item_name: 'Squalane Cloud Night Cream', category: 'Moisturizers' },
  { item_id: '108', item_slug: 'oat-milk-gentle-cleanser', item_name: 'Oat Milk Gentle Gel Cleanser', category: 'Cleansers' },
  { item_id: '109', item_slug: 'chamomile-cleansing-balm', item_name: 'Chamomile Melting Cleansing Balm', category: 'Cleansers' },
  { item_id: '110', item_slug: 'salicylic-daily-foam', item_name: 'Salicylic 2% Clarifying Foam', category: 'Cleansers' },
  { item_id: '111', item_slug: 'invisible-mineral-spf50', item_name: 'Invisible Mineral Fluid SPF 50', category: 'Sun Care' },
  { item_id: '112', item_slug: 'tinted-sheer-sun-drops', item_name: 'Tinted Sheer Sun Drops SPF 40', category: 'Sun Care' },
  { item_id: '113', item_slug: 'caffeine-peptide-eye-gel', item_name: 'Caffeine Peptide Eye Gel', category: 'Eye Care' },
  { item_id: '114', item_slug: 'prickly-pear-lip-mask', item_name: 'Prickly Pear Overnight Lip Mask', category: 'Lip Care' },
  { item_id: '115', item_slug: 'discovery-mini-trial-kit', item_name: 'Discovery Mini Trial Kit', category: 'Trial Minis' },
];

export const FASHION_SAMPLE_CATALOG: CatalogProduct[] = [
  { item_id: '201', item_slug: 'cloudstep-leather-runner', item_name: 'CloudStep Leather Low-Top Runner', category: 'Sneakers' },
  { item_id: '202', item_slug: 'suede-court-classic-white', item_name: 'Suede Court Classic — Chalk White', category: 'Sneakers' },
  { item_id: '203', item_slug: 'trailflex-knit-trainer', item_name: 'TrailFlex Knit Everyday Trainer', category: 'Sneakers' },
  { item_id: '204', item_slug: 'heavyweight-organic-hoodie', item_name: 'Heavyweight 420gsm Organic Hoodie', category: 'Tops & Knitwear' },
  { item_id: '205', item_slug: 'boxy-pima-cotton-tee', item_name: 'Boxy Pima Cotton Crew Tee', category: 'Tops & Knitwear' },
  { item_id: '206', item_slug: 'merino-rib-half-zip', item_name: 'Merino Wool Ribbed Half-Zip', category: 'Tops & Knitwear' },
  { item_id: '207', item_slug: 'relaxed-selvedge-denim', item_name: 'Relaxed Tapered Selvedge Jeans', category: 'Bottoms' },
  { item_id: '208', item_slug: 'pleated-linen-trouser', item_name: 'Pleated Tailored Linen Trouser', category: 'Bottoms' },
  { item_id: '209', item_slug: 'water-repellent-overshirt', item_name: 'Water-Repellent Twill Overshirt', category: 'Outerwear' },
  { item_id: '210', item_slug: 'quilted-recycled-puffer', item_name: 'Quilted Recycled Down Jacket', category: 'Outerwear' },
  { item_id: '211', item_slug: 'crossbody-nylon-sling', item_name: 'Everyday Nylon Crossbody Sling', category: 'Accessories' },
  { item_id: '212', item_slug: 'structured-canvas-tote', item_name: 'Structured 18oz Canvas Work Tote', category: 'Accessories' },
  { item_id: '213', item_slug: 'fabric-swatch-sample-pack', item_name: 'Fabric Swatch Sample Pack', category: 'Samples' },
];

export const ELECTRONICS_SAMPLE_CATALOG: CatalogProduct[] = [
  { item_id: '301', item_slug: 'auralis-anc-pro-headphones', item_name: 'Auralis Studio ANC Wireless Headphones', category: 'Audio' },
  { item_id: '302', item_slug: 'pulse-open-ear-earbuds', item_name: 'Pulse Air Open-Ear Sport Earbuds', category: 'Audio' },
  { item_id: '303', item_slug: 'usb-c-studio-condenser-mic', item_name: 'VoxCore USB-C Podcast Microphone', category: 'Audio' },
  { item_id: '304', item_slug: 'tactile-75-mechanical-keyboard', item_name: 'KeyCraft 75% Wireless Mechanical Keyboard', category: 'Keyboards & Mice' },
  { item_id: '305', item_slug: 'ergo-vertical-quiet-mouse', item_name: 'ErgoGlide Quiet Vertical Mouse', category: 'Keyboards & Mice' },
  { item_id: '306', item_slug: 'gan-100w-4port-charger', item_name: 'VoltCube 100W GaN 4-Port Charger', category: 'Power & Hubs' },
  { item_id: '307', item_slug: 'thunderbolt-11in1-dock', item_name: 'DockPro 11-in-1 Aluminum USB-C Hub', category: 'Power & Hubs' },
  { item_id: '308', item_slug: 'magcharge-20k-powerbank', item_name: 'MagSlim 20,000mAh Qi2 Power Bank', category: 'Power & Hubs' },
  { item_id: '309', item_slug: 'walnut-dual-monitor-shelf', item_name: 'Solid Walnut Dual-Monitor Desk Shelf', category: 'Desk Setup' },
  { item_id: '310', item_slug: 'asymmetric-led-monitor-bar', item_name: 'HaloBar Asymmetric LED Monitor Light', category: 'Desk Setup' },
  { item_id: '311', item_slug: 'braided-240w-usbc-cable-2m', item_name: 'Aramid Braided 240W USB-C Cable (2m)', category: 'Cables' },
  { item_id: '312', item_slug: 'switch-tester-sample-board', item_name: 'Mechanical Switch Tester Sample Board', category: 'Testers' },
];

export const COFFEE_SAMPLE_CATALOG: CatalogProduct[] = [
  { item_id: '401', item_slug: 'ethiopia-yirgacheffe-washed', item_name: 'Ethiopia Yirgacheffe Washed (250g)', category: 'Single Origin' },
  { item_id: '402', item_slug: 'colombia-huila-pink-bourbon', item_name: 'Colombia Huila Pink Bourbon (250g)', category: 'Single Origin' },
  { item_id: '403', item_slug: 'guatemala-antigua-honey', item_name: 'Guatemala Antigua Honey Process (250g)', category: 'Single Origin' },
  { item_id: '404', item_slug: 'velvet-crema-house-espresso', item_name: 'Velvet Crema House Espresso (1kg)', category: 'Espresso Blends' },
  { item_id: '405', item_slug: 'dark-cocoa-morning-roast', item_name: 'Dark Cocoa Morning Blend (500g)', category: 'Espresso Blends' },
  { item_id: '406', item_slug: 'swiss-water-decaf-colombia', item_name: 'Swiss Water Decaf Colombia (250g)', category: 'Decaf' },
  { item_id: '407', item_slug: 'precision-gooseneck-kettle', item_name: 'Variable Temp Gooseneck Kettle (0.9L)', category: 'Brewing Gear' },
  { item_id: '408', item_slug: 'ceramic-v60-dripper-02', item_name: 'Ribbed Ceramic Pour-Over Dripper 02', category: 'Brewing Gear' },
  { item_id: '409', item_slug: 'steel-burr-hand-grinder', item_name: '38mm Steel Burr Manual Coffee Grinder', category: 'Brewing Gear' },
  { item_id: '410', item_slug: 'digital-brew-scale-timer', item_name: '0.1g Espresso & Pour-Over Scale', category: 'Brewing Gear' },
  { item_id: '411', item_slug: 'roaster-tasting-sample-box', item_name: 'Roaster 3x50g Tasting Sample Box', category: 'Tasting Samples' },
];

export const SAMPLE_CATALOG: CatalogProduct[] = [
  { item_id: '17', item_slug: 'atlas-pro-code', item_name: 'Atlas PRO Code', category: 'IPTV Subscriptions' },
  { item_id: '51', item_slug: '4k-ottcobrapromax-code', item_name: '4K OTT/Cobra/Promax CODE', category: 'IPTV Subscriptions' },
  { item_id: '14', item_slug: 'crystal-code', item_name: 'Crystal Code', category: 'IPTV Subscriptions' },
  { item_id: '13', item_slug: 'dino-code', item_name: 'Dino Code', category: 'IPTV Subscriptions' },
  { item_id: '50', item_slug: 'trex-code', item_name: 'Trex Code', category: 'IPTV Subscriptions' },
  { item_id: '52', item_slug: 'iron-code', item_name: 'Iron Code', category: 'IPTV Subscriptions' },
  { item_id: '18', item_slug: 'king-pro-code', item_name: 'King PRO Code', category: 'IPTV Subscriptions' },
  { item_id: '847', item_slug: 'prince-pro-code', item_name: 'Prince PRO Code', category: 'IPTV Subscriptions' },
  { item_id: '64', item_slug: 'familly-4k-code', item_name: 'Familly 4K Code', category: 'IPTV Subscriptions' },
  { item_id: '92', item_slug: 'nexon-code', item_name: 'Nexon Code', category: 'IPTV Subscriptions' },
  { item_id: '174', item_slug: 'atlas-pro-m3u', item_name: 'Atlas PRO M3U', category: 'M3U Playlists' },
  { item_id: '171', item_slug: 'crystal-m3u', item_name: 'Crystal M3U', category: 'M3U Playlists' },
  { item_id: '203', item_slug: 'trex-m3u', item_name: 'Trex M3U', category: 'M3U Playlists' },
  { item_id: '214', item_slug: 'strong-4k-m3u', item_name: 'Strong 4K M3U', category: 'M3U Playlists' },
  { item_id: '189', item_slug: 'lion-ott-m3u', item_name: 'Lion OTT M3U', category: 'M3U Playlists' },
  { item_id: '195', item_slug: 'magnum-m3u', item_name: 'Magnum M3U', category: 'M3U Playlists' },
  { item_id: '226', item_slug: 'xplustv-m3u', item_name: 'XplusTV M3U', category: 'M3U Playlists' },
  { item_id: '700', item_slug: 'ibo-player', item_name: 'Ibo Player', category: 'Player Activation' },
  { item_id: '707', item_slug: 'smarters-pro', item_name: 'Smarters PRO', category: 'Player Activation' },
  { item_id: '715', item_slug: 'smartone', item_name: 'Smartone', category: 'Player Activation' },
  { item_id: '705', item_slug: 'set-iptv', item_name: 'Set IPTV', category: 'Player Activation' },
  { item_id: '721', item_slug: 'bobplayer', item_name: 'Bobplayer', category: 'Player Activation' },
  { item_id: '728', item_slug: 'duplecast-player-12-months', item_name: 'Duplecast Player 12 Months', category: 'Player Activation' },
  { item_id: '734', item_slug: 'bay-tv', item_name: 'Bay TV', category: 'Player Activation' },
  { item_id: '413', item_slug: 'atlas-pro-code-test-24h', item_name: 'Atlas PRO Code Test 24H', category: '24h Test Codes' },
  { item_id: '418', item_slug: 'trex-code-test-24h', item_name: 'Trex Code Test 24H', category: '24h Test Codes' },
  { item_id: '422', item_slug: 'crystal-m3u-test-24h', item_name: 'Crystal M3U Test 24H', category: '24h Test Codes' },
  { item_id: '429', item_slug: 'strong-4k-test-24h', item_name: 'Strong 4K Test 24H', category: '24h Test Codes' },
  { item_id: '667', item_slug: 'panel-10-smarters-pro', item_name: 'Panel 10 Smarters PRO', category: 'Reseller Panels & Credits' },
  { item_id: '672', item_slug: 'panel-10-ibo-player', item_name: 'Panel 10 Ibo Player', category: 'Reseller Panels & Credits' },
  { item_id: '681', item_slug: 'panel-atlas-pro-credits', item_name: 'Panel Atlas PRO Credits', category: 'Reseller Panels & Credits' },
  { item_id: '824', item_slug: 'forever-funcam-sp1', item_name: 'Forever Funcam ( SP1 )', category: 'Sharing' },
  { item_id: '829', item_slug: 'forever-pro-server', item_name: 'Forever PRO Server', category: 'Sharing' },
  { item_id: '901', item_slug: 'tod-4k-sports-annual', item_name: 'TOD 4K Sports Annual', category: 'Premium Streaming' },
  { item_id: '905', item_slug: 'shahid-vip-sports', item_name: 'Shahid VIP Sports', category: 'Premium Streaming' },
];

export const SAMPLE_BUSINESSES: SampleBusinessPreset[] = [
  {
    id: 'services',
    label: 'Digital Studio & Services',
    shortLabel: 'Services',
    sourceLabel: 'Sample Service Catalog (11 services)',
    defaultContext:
      'Independent digital studio offering website design, e-commerce setup, technical SEO, brand identity, and monthly maintenance plans.',
    defaultExcludeKeywords: 'free, discovery',
    defaultExportFormat: 'standard',
    defaultStoreBaseUrl: '',
    products: SERVICES_SAMPLE_CATALOG,
  },
  {
    id: 'skincare',
    label: 'Skincare & Beauty Store',
    shortLabel: 'Skincare',
    sourceLabel: 'Sample Skincare Catalog (15 items)',
    defaultContext: 'Clean botanical skincare & daily dermocosmetics store shipping across Europe and North Africa.',
    defaultExcludeKeywords: 'trial, sample, mini',
    defaultExportFormat: 'judge_me',
    defaultStoreBaseUrl: 'https://botanical-glow.myshopify.com/products',
    products: SKINCARE_SAMPLE_CATALOG,
  },
  {
    id: 'fashion',
    label: 'Footwear & Apparel',
    shortLabel: 'Fashion',
    sourceLabel: 'Sample Fashion Catalog (13 items)',
    defaultContext: 'Modern minimalist sneakers, organic cotton basics, and outerwear boutique.',
    defaultExcludeKeywords: 'sample, swatch',
    defaultExportFormat: 'judge_me',
    defaultStoreBaseUrl: 'https://atelier-wear.myshopify.com/products',
    products: FASHION_SAMPLE_CATALOG,
  },
  {
    id: 'electronics',
    label: 'Audio & Desk Tech',
    shortLabel: 'Tech Gear',
    sourceLabel: 'Sample Tech Catalog (12 items)',
    defaultContext: 'Consumer audio, wireless mechanical keyboards, GaN chargers, and home-office accessories.',
    defaultExcludeKeywords: 'tester, sample',
    defaultExportFormat: 'judge_me',
    defaultStoreBaseUrl: 'https://deskcraft-tech.myshopify.com/products',
    products: ELECTRONICS_SAMPLE_CATALOG,
  },
  {
    id: 'coffee',
    label: 'Specialty Coffee Roastery',
    shortLabel: 'Coffee',
    sourceLabel: 'Sample Coffee Catalog (11 items)',
    defaultContext: 'Small-batch specialty coffee roaster selling single-origin beans, espresso blends, and pour-over gear.',
    defaultExcludeKeywords: 'sample, tasting',
    defaultExportFormat: 'judge_me',
    defaultStoreBaseUrl: 'https://atlas-roasters.myshopify.com/products',
    products: COFFEE_SAMPLE_CATALOG,
  },
  {
    id: 'iptv',
    label: 'IPTV & Streaming Store',
    shortLabel: 'IPTV',
    sourceLabel: 'Sample IPTV Catalog (35 items)',
    defaultContext: 'Digital IPTV subscriptions, M3U playlists, and Smart TV player activations.',
    defaultExcludeKeywords: 'test, trial, 24h',
    defaultExportFormat: 'standard',
    defaultStoreBaseUrl: '',
    products: SAMPLE_CATALOG,
    defaultCategories: CORE_TARGET_CATEGORIES,
  },
];
