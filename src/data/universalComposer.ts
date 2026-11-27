import {
  BusinessLanguageTokens,
  BusinessStarPool,
  CatalogProduct,
  CategoryVoiceContext,
  ReviewLanguage,
} from '../types/reviews';
import {
  GLOBAL_EXTRA_SENTENCE_BANKS,
  GLOBAL_EXTRA_TAILS,
  GLOBAL_EXTRA_TOKENS,
} from './globalLanguages';

const IPTV_SIGNAL_REGEX =
  /\b(iptv|m3u|xtream|smarters|ibo\s*player|atlas\s*pro|funcam|forever|smartone|set\s*iptv|bobplayer|duplecast|bay\s*tv|trex|crystal\s*code|dino\s*code|4k\s*ott|shahid|reseller\s*panel)\b/i;

/**
 * Auto-detects whether an uploaded catalog belongs to IPTV / streaming
 * so existing IPTV catalogs keep their domain-specific vocabulary automatically.
 */
export function isIPTVCatalog(products: CatalogProduct[]): boolean {
  if (products.length === 0) return false;
  let hits = 0;
  for (const p of products) {
    if (IPTV_SIGNAL_REGEX.test(`${p.item_name} ${p.category} ${p.item_slug}`)) {
      hits += 1;
    }
  }
  return hits / products.length >= 0.35;
}

/**
 * Built-in category-specific vocabulary for instant accurate generation on consumer tech & wearables
 * (e.g. Smartwatches, Fitness Bands, Audio & Earbuds, Tablets, Bundles, Accessories)
 * even before AI Auto-Scan completes or for offline instant previews.
 */
export const BUILTIN_CATEGORY_CONTEXTS: CategoryVoiceContext[] = [
  // SMARTWATCHES
  {
    category: 'Smartwatches',
    language: 'en',
    contextA: ['morning runs', 'daily workouts', 'office days', 'sleep tracking', 'outdoor cycling'],
    contextB: ['the AMOLED screen brightness', 'the multi-day battery life', 'the strap comfort', 'the GPS lock speed', 'Bluetooth call clarity'],
    openers: [
      'Been wearing {product} for {duration} and {contextB} easily beats my previous smartwatch.',
      'Picked up {product} mainly for {contextA} and pairing with my phone took under two minutes.',
      'Received {product} sealed in {timeframe}, and the watch face looks super crisp even under direct sun.',
    ],
    middles: [
      'Even with always-on display and notifications active, battery easily lasts over a week.',
      'Heart rate and GPS tracking stay consistent during {contextA}, and the strap never irritates my wrist.',
      'Syncing workouts and calls is effortless, and {contextB} makes wearing it all day a pleasure.',
    ],
  },
  {
    category: 'Smartwatches',
    language: 'fr',
    contextA: ['le sport quotidien', 'la course à pied', 'le bureau', 'le suivi du sommeil', 'les appels Bluetooth'],
    contextB: ['l’écran AMOLED très lumineux', 'l’autonomie de la batterie', 'le confort du bracelet', 'la précision du GPS', 'les finitions du boîtier'],
    openers: [
      'Je porte la {product} depuis {duration} et {contextB} est vraiment impressionnant.',
      'Commandée pour {contextA}, la {product} est arrivée scellée en {timeframe}.',
      'Super montre au poignet : {contextB} change vraiment du tout au tout par rapport à mon ancienne montre.',
    ],
    middles: [
      'Je ne la recharge qu’une fois par semaine même avec les notifications et le suivi cardio activés.',
      'Le GPS accroche vite pendant {contextA} et le bracelet reste léger toute la journée.',
      'L’application de suivi se synchronise sans souci sur Android comme sur iPhone.',
    ],
  },
  {
    category: 'Smartwatches',
    language: 'darija_latin',
    contextA: ['sport kol nhar', 'ljri f sba7', 'lkhedma', 'suivi dyal n3as', 'les appels bluetooth'],
    contextB: ['l-ecran AMOLED', 'l-batterie li katched bzaf', 'l-bracelet mri7', 'l-GPS sri3', 'chkel dyal sa3a'],
    openers: [
      'Hadi {duration} wana labes {product}, sara7a {contextB} nadi bzzaf.',
      'Wslatni {product} f {timeframe} mghlfa w originale, jrebtha f {contextA} w 3jebatni.',
      'Sara7a a7san smartwatch jrebt, {contextB} ktr mn li knt mtw9e3.',
    ],
    middles: [
      'L-batterie katched ktr mn simana bla ma t7taj charge kol nhar.',
      'Khfifa f lyed w les notifications kayweslou dghya, ma kat9ta3ch bluetooth.',
      'F {contextA} l-GPS w rythme cardiaque mzyanin w exact.',
    ],
  },
  {
    category: 'Smartwatches',
    language: 'ar',
    contextA: ['التمارين اليومية', 'الجري الصباحي', 'العمل اليومي', 'تتبع النوم', 'المكالمات عبر البلوتوث'],
    contextB: ['سطوع شاشة AMOLED', 'عمر البطارية الطويل', 'راحة السوار', 'دقة الـ GPS', 'أناقة التصميم'],
    openers: [
      'أرتدي {product} منذ {duration} وبصراحة {contextB} ممتاز جداً مقارنة بساعات أخرى.',
      'وصلتني {product} أصلية ومختومة خلال {timeframe} واشتغلت بسلاسة مع هاتفي.',
      'اخترتها من أجل {contextA} وكانت تجربة رائعة منذ اليوم الأول.',
    ],
    middles: [
      'البطارية تصمد لأكثر من أسبوع بسهولة مع تفعيل الإشعارات وقياس نبضات القلب.',
      'خفيفة على المعصم والشاشة واضحة جداً حتى تحت أشعة الشمس المباشرة.',
    ],
  },
  {
    category: 'Smartwatches',
    language: 'es',
    contextA: ['correr por la mañana', 'entrenamientos diarios', 'la oficina', 'seguir el sueño'],
    contextB: ['la pantalla AMOLED', 'la autonomía de la batería', 'la comodidad de la correa', 'la precisión del GPS'],
    openers: [
      'Llevo {duration} usando {product} y {contextB} supera con creces lo que esperaba.',
      'Llegó precintada en {timeframe} y la configuré en dos minutos para {contextA}.',
    ],
    middles: [
      'La batería aguanta más de una semana sin problemas incluso con notificaciones activas.',
      'Muy cómoda en la muñeca todo el día y las llamadas por Bluetooth se escuchan nítidas.',
    ],
  },

  // FITNESS BANDS
  {
    category: 'Fitness Bands',
    language: 'en',
    contextA: ['step tracking', 'sleep monitoring', 'gym sessions', 'everyday notifications'],
    contextB: ['its ultra-light weight', 'the slim AMOLED display', 'the 2-week battery', 'quick charging'],
    openers: [
      'Barely feel {product} on my wrist during {contextA}—{contextB} is a huge plus.',
      'Got {product} in {timeframe} as a lighter alternative to a bulky smartwatch.',
    ],
    middles: [
      'Sleep stages, step count, and WhatsApp alerts sync reliably without draining my phone battery.',
      'Charging takes less than an hour and lasts well over a week of non-stop wear.',
    ],
  },
  {
    category: 'Fitness Bands',
    language: 'fr',
    contextA: ['le suivi des pas', 'le sommeil', 'la salle de sport', 'les notifications'],
    contextB: ['sa légèreté au poignet', 'l’écran fin et lumineux', 'l’autonomie impressionnante'],
    openers: [
      'On oublie presque qu’on porte le {product} pendant {contextA}, {contextB} est top.',
      'Reçu en {timeframe}, parfait pour suivre mes pas et mon sommeil sans montre encombrante.',
    ],
    middles: [
      'La batterie tient facilement plus de dix jours et la synchronisation est instantanée.',
      'Super confortable même la nuit pour le suivi du sommeil.',
    ],
  },
  {
    category: 'Fitness Bands',
    language: 'darija_latin',
    contextA: ['la salle', 'suivi dyal n3as', 'lmachya kol nhar', 'les notifications'],
    contextB: ['khfifa bzzaf f lyed', 'l-batterie katched bzaf', 'l-ecran sghir w wade7'],
    openers: [
      'Khdit {product} l {contextA} w sara7a {contextB}, ma kat7essch biha ga3.',
      'Wslatni f {timeframe} originale, khdama mzyan m3a telephone.',
    ],
    middles: [
      'Kat7seb l-khatwat w n3as b di9a w batterie katched ktr mn 10 yam.',
      'Taman mzyan bzzaf m9aranatan m3a l-qualite.',
    ],
  },
  {
    category: 'Fitness Bands',
    language: 'ar',
    contextA: ['حساب الخطوات', 'تتبع النوم', 'النادي الرياضي', 'إشعارات الهاتف'],
    contextB: ['وزنها الخفيف جداً', 'وضوح الشاشة', 'عمر البطارية الطويل'],
    openers: [
      'أستخدم {product} منذ {duration} من أجل {contextA}، وفعلاً {contextB} رائع.',
      'وصلتني خلال {timeframe} وكانت خفيفة ومريحة جداً حتى أثناء النوم.',
    ],
    middles: [
      'البطارية تدوم لأكثر من عشرة أيام والشحن سريع جداً.',
    ],
  },

  // AUDIO & EARBUDS
  {
    category: 'Audio & Earbuds',
    language: 'en',
    contextA: ['daily commuting', 'work calls', 'gym workouts', 'listening to podcasts'],
    contextB: ['the clear bass and vocals', 'the comfortable ear fit', 'the noise isolation', 'the compact charging case'],
    openers: [
      'Using {product} for {contextA} over the past {duration} and {contextB} genuinely impressed me.',
      'Arrived sealed in {timeframe}—paired instantly and stayed comfortable through a three-hour call.',
      'Picked up {product} mainly for {contextA} and the audio clarity is much better than expected.',
    ],
    middles: [
      'People on the other end of calls hear me clearly even when walking near traffic.',
      'Battery in the pocket case lasts several days and switching between laptop and phone is smooth.',
      'They stay secure without ear fatigue, and {contextB} makes music and podcasts sound clean.',
    ],
  },
  {
    category: 'Audio & Earbuds',
    language: 'fr',
    contextA: ['les trajets quotidiens', 'les appels professionnels', 'le sport', 'écouter des podcasts'],
    contextB: ['la clarté du son', 'le confort prolongé', 'la réduction de bruit', 'l’autonomie du boîtier'],
    openers: [
      'J’utilise les {product} depuis {duration} pour {contextA} et {contextB} est bluffant.',
      'Colis reçu en {timeframe} bien scellé, connexion Bluetooth immédiate sur mon téléphone.',
      'Très bonne surprise sur {contextB}, même après plusieurs heures d’écoute sans aucune gêne.',
    ],
    middles: [
      'Les micros sont très propres en appel, même dehors avec un peu de vent.',
      'Ils tiennent bien en place pendant {contextA} et le boîtier de charge est super compact.',
    ],
  },
  {
    category: 'Audio & Earbuds',
    language: 'darija_latin',
    contextA: ['les appels', 'la salle', 'tri9 l-khedma', 'l-moussiqa w podcasts'],
    contextB: ['sawt n9i bzzaf', 'ra7a f l-wednin', 'l-micro wade7', 'l-batterie dyal boitier'],
    openers: [
      'Khdit {product} l {contextA} w sara7a {contextB}, ma kayderouch f l-wednin ga3.',
      'Wslouni f {timeframe} mghlfin w originaux, l-connexion bluetooth dghya.',
      'Hadi {duration} wana knsta3ml {product} kol nhar, {contextB} nadi.',
    ],
    middles: [
      'F les appels nas kaysem3ouni mzyan wakha nkoun f zan9a.',
      'L-batterie katched mzyan w boitier sghir kaydkhol f jib b sohola.',
    ],
  },
  {
    category: 'Audio & Earbuds',
    language: 'ar',
    contextA: ['المكالمات اليومية', 'النادي الرياضي', 'التنقل للعمل', 'سماع البودكاست'],
    contextB: ['نقاء الصوت والبيس', 'الراحة الطويلة في الأذن', 'وضوح الميكروفون', 'حجم علبة الشحن'],
    openers: [
      'أستخدم {product} منذ {duration} في {contextA}، وفعلاً {contextB} ممتاز جداً.',
      'وصلت السماعة مختومة خلال {timeframe} واقترنت بالهاتف في ثوانٍ.',
    ],
    middles: [
      'جودة الصوت في المكالمات واضحة جداً حتى في الأماكن المزدحمة، والبطارية ممتازة.',
      'مريحة للاستخدام لساعات طويلة من دون أي إزعاج للأذن.',
    ],
  },

  // TABLETS
  {
    category: 'Tablets',
    language: 'en',
    contextA: ['university note-taking', 'reading PDFs', 'streaming movies', 'remote work'],
    contextB: ['the crisp anti-glare screen', 'the smooth split-screen multitasking', 'the thin metal body', 'all-day battery'],
    openers: [
      'Bought {product} for {contextA} and {contextB} makes it feel way above its price.',
      'Delivered sealed in {timeframe}; set up my apps right away and {contextB} is a joy to use.',
    ],
    middles: [
      'Screen is super easy on the eyes during long reading sessions and speakers sound surprisingly full.',
      'After {duration}, battery easily gets me through a full day of classes and notes.',
    ],
  },
  {
    category: 'Tablets',
    language: 'fr',
    contextA: ['la prise de notes', 'les cours à la fac', 'lire des PDF', 'le télétravail'],
    contextB: ['la qualité de l’écran', 'la fluidité en multitâche', 'la finesse du châssis', 'l’autonomie'],
    openers: [
      'Achetée pour {contextA}, la {product} m’a vraiment bluffé par {contextB}.',
      'Reçue en {timeframe} dans sa boîte d’origine scellée, très fluide dès le premier démarrage.',
    ],
    middles: [
      'L’écran est très agréable pour lire longtemps sans fatigue visuelle et les haut-parleurs sont puissants.',
      'Après {duration} d’utilisation quotidienne, la batterie tient facilement toute la journée.',
    ],
  },
  {
    category: 'Tablets',
    language: 'darija_latin',
    contextA: ['l-9raya f la fac', 'l-khedma', 'tferrij w reading', 'prise de notes'],
    contextB: ['l-ecran wade7 bzzaf', 'l-fluidite', 'l-batterie katched nhar kamel', 'design r9i9 w chik'],
    openers: [
      'Khdit {product} l {contextA} w sara7a {contextB}, khedma n9iya bzzaf.',
      'Wslatni f {timeframe} originale w mghlfa mzyan, khfifa f l-isti3mal.',
    ],
    middles: [
      'Sawt dyal les haut-parleurs mzyan w l-ecran mri7 l l-3inin f l-9raya.',
      'Mor {duration} dyal l-isti3mal, ma katbloki ma walou w batterie zwina.',
    ],
  },
  {
    category: 'Tablets',
    language: 'ar',
    contextA: ['الدراسة وتدوين الملاحظات', 'العمل عن بُعد', 'قراءة ملفات PDF', 'مشاهدة الفيديوهات'],
    contextB: ['وضوح الشاشة العالي', 'سلاسة تعدد المهام', 'خفة الوزن ونحافة التصميم', 'عمر البطارية'],
    openers: [
      'اشتريت {product} من أجل {contextA} وبصراحة {contextB} ممتاز جداً.',
      'وصلني الجهاز مختوماً وأصلياً خلال {timeframe} والأداء سلس للغاية.',
    ],
    middles: [
      'الشاشة مريحة جداً للعين أثناء القراءة الطويلة وصوت السماعات قوي وواضح.',
    ],
  },

  // BUNDLES
  {
    category: 'Bundles',
    language: 'en',
    contextA: ['upgrading my daily setup', 'a complete gift', 'work and workouts together'],
    contextB: ['the bundle savings', 'seamless pairing between both devices', 'everything arriving in one sealed shipment'],
    openers: [
      'Went for {product} instead of buying separately—{contextB} made it an easy decision.',
      'Both boxes in {product} arrived factory-sealed in {timeframe} with zero issues.',
    ],
    middles: [
      'Having both devices work together right out of the box is so convenient for {contextA}.',
      'Saved a nice amount with the combo and everything performs smoothly after {duration}.',
    ],
  },
  {
    category: 'Bundles',
    language: 'fr',
    contextA: ['équiper mon quotidien', 'un cadeau complet', 'le travail et le sport'],
    contextB: ['le prix avantageux du pack', 'la compatibilité fluide entre les deux appareils', 'l’envoi groupé et soigné'],
    openers: [
      'J’ai opté pour le {product} plutôt que d’acheter séparément et {contextB} vaut vraiment le coup.',
      'Les deux produits du {product} sont arrivés scellés en {timeframe}, emballage impeccable.',
    ],
    middles: [
      'Tout se connecte ensemble très facilement et l’économie sur le pack est appréciable.',
    ],
  },
  {
    category: 'Bundles',
    language: 'darija_latin',
    contextA: ['pack kamel l-isti3mal lyawmi', 'kado zwin', 'lkhedma w sport'],
    contextB: ['taman dyal pack monasib', 'les deux produits kaykhdmou m3a ba3diyathom b sohola', 'kolchi wsel mghlef'],
    openers: [
      'Khdit {product} 7it {contextB}, sara7a a7san choix.',
      'Wselni l-pack kamel f {timeframe} b jouj mghlfin w originaux.',
    ],
    middles: [
      'Taman rkhis chwiya 3la ila chrit kol wa7ed bo7dou w qualite top.',
    ],
  },
  {
    category: 'Bundles',
    language: 'ar',
    contextA: ['تجهيز كامل للاستخدام اليومي', 'هدية متكاملة', 'العمل والرياضة معاً'],
    contextB: ['السعر الموفر للباقة', 'التكامل السلس بين الجهازين', 'التغليف الأصلي المختوم'],
    openers: [
      'اخترت {product} بدل شراء كل قطعة وحدها وفعلاً {contextB} كان قراراً موفقاً.',
      'وصلت الباقة كاملة ومختومة خلال {timeframe} بتغليف ممتاز.',
    ],
    middles: [
      'الربط بين الجهازين سريع جداً والاستخدام اليومي مريح للغاية.',
    ],
  },

  // ACCESSORIES (Stylus / Chargers / etc.)
  {
    category: 'Accessories',
    language: 'en',
    contextA: ['sketching and taking notes', 'everyday tablet use', 'annotating documents'],
    contextB: ['the near-zero latency', 'the natural grip and weight', 'magnetic attachment and charging'],
    openers: [
      'Paired {product} with my tablet for {contextA} and {contextB} feels remarkably natural.',
      'Arrived in {timeframe} sealed in the original box—snapped on magnetically and worked right away.',
    ],
    middles: [
      'Palm rejection and pressure sensitivity make handwriting feel close to pen on paper.',
    ],
  },
  {
    category: 'Accessories',
    language: 'fr',
    contextA: ['la prise de notes', 'le dessin', 'annoter des documents'],
    contextB: ['la latence quasi nulle', 'la prise en main naturelle', 'la charge magnétique'],
    openers: [
      'Associé à ma tablette pour {contextA}, le {product} brille par {contextB}.',
      'Reçu scellé en {timeframe}, appairage immédiat par aimantation sans réglage compliqué.',
    ],
    middles: [
      'La précision de la pointe est bluffante pour écrire ou dessiner tous les jours.',
    ],
  },
  {
    category: 'Accessories',
    language: 'darija_latin',
    contextA: ['l-ktaba w les notes', 'rasm', 'l-9raya'],
    contextB: ['sri3 bla retard', 'chdda mri7a f lyed', 'charge magnetique'],
    openers: [
      'Jrebt {product} m3a MatePad f {contextA} w sara7a {contextB}, b7al stylo 3adi.',
      'Wselni f {timeframe} original, lse9tou f tablette w khdem dik sa3a.',
    ],
    middles: [
      'Di9a mzyana bzzaf f l-ktaba w ma kayt3atelch ga3.',
    ],
  },
  {
    category: 'Accessories',
    language: 'ar',
    contextA: ['كتابة الملاحظات', 'الرسم الرقمي', 'مراجعة الملفات'],
    contextB: ['سرعة الاستجابة من دون تأخير', 'الوزن المريح في اليد', 'الشحن المغناطيسي'],
    openers: [
      'أستخدم {product} منذ {duration} في {contextA} وبصراحة {contextB} ممتاز جداً.',
      'وصلني القلم مختوماً خلال {timeframe} واقترن بالتابلت مغناطيسياً فوراً.',
    ],
    middles: [
      'الكتابة دقيقة جداً ومريحة طوال المحاضرات والاجتماعات.',
    ],
  },
];

export const UNIVERSAL_COMPOSER_TOKENS: Record<ReviewLanguage, BusinessLanguageTokens> = {
  en: {
    contextA: [
      'daily use',
      'a weekend trip',
      'a birthday gift',
      'home use',
      'work days',
      'my morning routine',
      'everyday errands',
      'a quick upgrade',
    ],
    contextB: [
      'the finish and feel',
      'the packaging',
      'the overall build',
      'the color accuracy',
      'the material quality',
      'the proportions',
      'the presentation',
      'the attention to detail',
    ],
    duration: [
      'a couple of weeks',
      'almost a month',
      'three weeks',
      'six weeks',
      'a few days',
      'over two months',
      'nearly three months',
    ],
    timeframe: [
      '2 days',
      '48 hours',
      '3 business days',
      '24 hours',
      '4 days',
      'under 72 hours',
    ],
  },
  fr: {
    contextA: [
      'un usage quotidien',
      'un cadeau d’anniversaire',
      'le travail',
      'la maison',
      'ma routine du matin',
      'un départ en week-end',
      'tous les jours',
    ],
    contextB: [
      'les finitions',
      'la qualité de l’emballage',
      'le rendu réel',
      'les matériaux',
      'la prise en main',
      'le soin apporté aux détails',
      'le rapport qualité-prix',
    ],
    duration: [
      'deux semaines',
      'presque un mois',
      'trois semaines',
      'quelques jours',
      'plus de deux mois',
      'six semaines',
    ],
    timeframe: [
      '48h',
      '2 jours',
      '3 jours ouvrés',
      '24h',
      '4 jours',
      'moins de 72h',
    ],
  },
  darija_latin: {
    contextA: [
      'l-isti3mal lyawmi',
      'kado l wa7ed sadi9',
      'dar',
      'lkhedma kol nhar',
      'safar dyal weekend',
      'l-routine dyali',
      'kol nhar',
    ],
    contextB: [
      'l-finition',
      'l-emballage',
      'l-qualite',
      'l-matiere',
      'taman m3a l-qualite',
      'chkel dyalo',
      't-tafasil',
    ],
    duration: [
      'jouj simanat',
      'chhar ta9riban',
      'tlata d simanat',
      'chi yam',
      'ktr mn chahrayn',
      'simana w ness',
    ],
    timeframe: [
      '24h',
      '48h',
      'youmayn',
      '3 yam',
      '4 yam',
      'simana 9lila',
    ],
  },
  ar: {
    contextA: [
      'الاستخدام اليومي',
      'هدية لعزيز',
      'البيت',
      'العمل اليومي',
      'الروتين الصباحي',
      'السفر القصير',
      'الاستعمال المستمر',
    ],
    contextB: [
      'جودة الخامة',
      'التغليف الأنيق',
      'التشطيب النهائي',
      'مطابقة الصور',
      'تفاصيل التصنيع',
      'القيمة مقابل السعر',
    ],
    duration: [
      'أسبوعين',
      'شهر تقريباً',
      'ثلاثة أسابيع',
      'عدة أيام',
      'أكثر من شهرين',
      'ستة أسابيع',
    ],
    timeframe: [
      'يومين',
      '48 ساعة',
      'ثلاثة أيام عمل',
      '24 ساعة',
      'أربعة أيام',
    ],
  },
  es: {
    contextA: [
      'el uso diario',
      'un regalo de cumpleaños',
      'la casa',
      'el trabajo',
      'mi rutina diaria',
      'una escapada de fin de semana',
      'todos los días',
    ],
    contextB: [
      'el acabado',
      'la presentación y el empaque',
      'la calidad del material',
      'los detalles',
      'la relación calidad-precio',
      'el aspecto real',
    ],
    duration: [
      'dos semanas',
      'casi un mes',
      'tres semanas',
      'unos días',
      'más de dos meses',
      'seis semanas',
    ],
    timeframe: [
      '48 horas',
      '2 días',
      '3 días laborables',
      '24 horas',
      '4 días',
    ],
  },
  ...GLOBAL_EXTRA_TOKENS,
};

export const UNIVERSAL_SENTENCE_BANKS: Record<ReviewLanguage, Record<1 | 2 | 3 | 4 | 5, BusinessStarPool>> = {
  en: {
    5: {
      star: 5,
      subjects: [
        'Really happy with {product}',
        'Even better in person',
        'Solid quality, arrived in {timeframe}',
        'Exceeded expectations',
        'Worth every penny',
        'Ordered a second one already',
        'Great for {contextA}',
        'Clean packaging and great feel',
      ],
      openers: [
        'Picked up {product} for {contextA} and honestly did not expect it to feel this well made.',
        'Arrived in {timeframe} neatly packed with zero scuffs or damage.',
        'Been using {product} for {duration} now and it still feels brand new.',
        'Ordered this on a whim after reading the specs and it turned out to be a great call.',
        'Bought {product} for {contextA} and it went over really well.',
        'First time ordering from this store and {product} completely won me over.',
        'Everything about {product} matches the listing photos down to {contextB}.',
        'Straight out of the box you can tell thought went into {contextB}.',
      ],
      middles: [
        'What stood out most was {contextB}, which feels noticeably nicer than similar options I tried before.',
        'After {duration} of regular use, there are no signs of wear or shortcuts.',
        'It fits right into {contextA} without any fuss or breaking-in period.',
        'Shipping took {timeframe} and tracking updates were clear the whole way.',
        'Even the small details around {contextB} feel thoughtful and sturdy.',
        'Compared to pricier alternatives I bought before, {product} holds its own easily.',
      ],
      closers: [
        'Definitely coming back to try more from the catalog.',
        'Would happily recommend it to anyone on the fence.',
        'Easy five stars from me.',
        'Already eyeing another item for next month.',
        'Glad I went with this one.',
      ],
    },
    4: {
      star: 4,
      subjects: [
        'Very good overall',
        'Solid buy with one small nitpick',
        'Nice quality for the price',
        'Happy with {product} so far',
        'Almost perfect',
        'Good everyday pick',
      ],
      openers: [
        'Using {product} for {duration} now and overall it has been a reliable pick for {contextA}.',
        'Arrived in {timeframe} and looks very close to what was shown online.',
        'Really like {contextB} on {product}, especially at this price point.',
        'Picked this up for {contextA} and it does its job well.',
        'Good quality overall—{product} feels sturdy and well thought out.',
      ],
      middles: [
        'Taking off one star only because {contextB} was slightly different from what I pictured, though still totally fine.',
        'Delivery took a tiny bit longer than expected, around {timeframe}, but everything arrived safe.',
        'It took a couple of days to get used to, yet after {duration} it feels natural.',
        'Nothing major to complain about—just minor packaging creases on the outer box.',
        'Works nicely for {contextA}, though I wish there were one more color option.',
      ],
      closers: [
        'Still very satisfied and would order again.',
        'Great value overall, just shy of a full 5.',
        'Does exactly what I needed.',
        'Would still recommend it to a friend.',
      ],
    },
    3: {
      star: 3,
      subjects: [
        'Decent, meets basic expectations',
        'Good for the price, nothing flashy',
        'Mixed feelings on {product}',
        'Works fine for occasional use',
        'Okay overall',
      ],
      openers: [
        '{product} arrived in {timeframe} and works as described, though it feels pretty standard.',
        'Tried {product} for {duration} and it is serviceable for {contextA}.',
        'Not bad at all for the cost, just not quite as standout as I hoped.',
        'Quality is fine for casual use, though {contextB} feels a bit basic.',
      ],
      middles: [
        'It gets the job done for {contextA}, but I probably expected slightly more.',
        'Nothing was broken or missing—it just comes down to personal preference on {contextB}.',
        'Shipping was smooth in {timeframe}, and the item itself is okay for light use.',
        'After {duration}, it still works fine even if it is not my favorite piece.',
      ],
      closers: [
        'Fair enough for the price paid.',
        'Keeping it as a backup option.',
        'Might try a higher-tier option next time.',
      ],
    },
    2: {
      star: 2,
      subjects: [
        'Not quite the right fit for me',
        'Expected a slightly different feel',
        'A bit underwhelming for my needs',
        'Personal preference mismatch',
      ],
      openers: [
        'Shipping was quick ({timeframe}) and the box arrived intact, but {product} was not quite what I needed for {contextA}.',
        'Tested {product} for {duration}, and while it works, {contextB} was not to my taste.',
        'Ordered the standard option without checking the exact specs closely enough.',
        'The item itself arrived in good shape, just felt different than I personally prefer.',
      ],
      middles: [
        'I think it would suit someone looking for something simpler, just not ideal for my routine.',
        'Support answered my question politely, so I may swap it for another model from the shop.',
        'Everything in the package matched the listing—it just did not click with my expectations.',
      ],
      closers: [
        'Giving it to a family member who likes this style more.',
        'Will check the specs more closely before picking another variant.',
        'Fair store experience, just not the right item for me.',
      ],
    },
    1: {
      star: 1,
      subjects: [
        'Wrong fit for my setup',
        'Did not suit my preferences',
        'Had to swap due to mismatch',
      ],
      openers: [
        'Order arrived fine in {timeframe}, but {product} did not work for {contextA} the way I had in mind.',
        'Realized right after opening that I picked the wrong model for my needs.',
        'The delivery was smooth, yet {contextB} really did not match what I personally look for.',
      ],
      middles: [
        'Nothing was missing from the parcel—it is purely a compatibility and preference issue on my end.',
        'Customer service shared exchange instructions right away, which made the process painless.',
        'I should have compared dimensions and specs before checking out.',
      ],
      closers: [
        'Will probably look at a different model from this store next time.',
        'Leaving 1 star strictly because it did not fit my specific use case.',
      ],
    },
  },

  fr: {
    5: {
      star: 5,
      subjects: [
        'Très satisfait de {product}',
        'Encore mieux en vrai',
        'Reçu en {timeframe}, nickel',
        'Excellente qualité pour le prix',
        'Je recommande sans hésiter',
        'Parfait pour {contextA}',
        'Superbes finitions',
      ],
      openers: [
        'Commandé {product} pour {contextA} et franchement la qualité m’a agréablement surpris.',
        'Colis reçu en {timeframe}, emballage propre et produit conforme en tout point.',
        'J’utilise {product} depuis {duration} et rien n’a bougé.',
        'Première commande sur la boutique et très bonne surprise sur {contextB}.',
        'Pris pour {contextA}, le rendu est vraiment soigné dès l’ouverture.',
        'On sent tout de suite le sérieux sur {contextB}, c’est propre et solide.',
      ],
      middles: [
        'Ce qui m’a le plus plu c’est {contextB}, bien au-dessus de ce qu’on trouve habituellement.',
        'Après {duration}, tout tient parfaitement la route au quotidien.',
        'Livraison rapide en {timeframe} avec un suivi clair du début à la fin.',
        'Les photos du site reflètent bien la réalité, aucune mauvaise surprise.',
        'Facile à intégrer dans {contextA}, on voit que c’est bien pensé.',
      ],
      closers: [
        'Je repasserai commande prochainement.',
        'Vraiment ravi de cet achat.',
        '5 étoiles largement méritées.',
        'Je recommande les yeux fermés.',
      ],
    },
    4: {
      star: 4,
      subjects: [
        'Très bon produit dans l’ensemble',
        'Satisfait malgré un petit détail',
        'Bon rapport qualité-prix',
        'Bien pour {contextA}',
        'Presque parfait',
      ],
      openers: [
        'J’utilise {product} depuis {duration} et j’en suis globalement très content.',
        'Reçu en {timeframe}, bien protégé et fidèle à la description.',
        'Très belle qualité sur {contextB}, surtout vu le tarif.',
        'Acheté pour {contextA}, il remplit très bien son rôle.',
      ],
      middles: [
        'J’enlève une étoile uniquement pour un léger détail sur {contextB}, rien de bloquant.',
        'Le carton extérieur était un peu froissé pendant le transport, mais le produit était intact.',
        'Il faut juste quelques jours pour prendre ses marques, ensuite c’est top.',
        'Très bien au quotidien, j’aurais juste aimé un choix de couleur en plus.',
      ],
      closers: [
        'Je reste très satisfait de mon achat.',
        'Bonne adresse, je recommanderai.',
        'Fait exactement ce qu’on lui demande.',
      ],
    },
    3: {
      star: 3,
      subjects: [
        'Correct sans plus',
        'Bien pour un usage occasionnel',
        'Conforme mais assez simple',
        'Moyen, fait le travail',
      ],
      openers: [
        '{product} est arrivé en {timeframe} et fonctionne comme prévu, sans effet wahou particulier.',
        'Testé pendant {duration}, c’est correct pour {contextA}.',
        'Qualité honnête pour le prix, même si {contextB} reste assez basique.',
      ],
      middles: [
        'Rien à signaler sur la livraison, c’est juste une question de goût personnel.',
        'Pour {contextA}, ça fait l’affaire sans souci.',
        'Je m’attendais à un rendu un peu plus poussé sur {contextB}.',
      ],
      closers: [
        'Ça reste correct pour le budget.',
        'Je le garde en dépannage.',
        'Je testerai peut-être la gamme au-dessus la prochaine fois.',
      ],
    },
    2: {
      star: 2,
      subjects: [
        'Pas tout à fait adapté à mon besoin',
        'Un peu déçu par le rendu',
        'Ne correspond pas à mes goûts',
      ],
      openers: [
        'Livraison rapide en {timeframe}, mais {product} ne convient pas vraiment à {contextA} pour moi.',
        'Après {duration} d’essai, je trouve que {contextB} ne correspond pas à ce que je cherchais.',
        'Le colis est arrivé en parfait état, j’ai juste mal évalué mes besoins avant de commander.',
      ],
      middles: [
        'Le produit est conforme à la fiche, c’est vraiment une question de préférence personnelle.',
        'Le service client m’a bien renseigné pour choisir une autre référence.',
      ],
      closers: [
        'Je l’ai finalement donné à un proche à qui ça plaît davantage.',
        'Je lirai mieux les détails avant ma prochaine commande.',
      ],
    },
    1: {
      star: 1,
      subjects: [
        'Ne correspond pas à mon usage',
        'Erreur de choix de ma part',
        'Pas adapté pour moi',
      ],
      openers: [
        'Reçu en {timeframe} sans souci, mais {product} ne convient pas du tout à {contextA}.',
        'Je me suis trompé de variante en commandant et ce modèle ne me correspond pas.',
      ],
      middles: [
        'Tout était complet dans le colis, le souci vient uniquement de l’adéquation avec mon besoin.',
        'Le support m’a envoyé la procédure de retour rapidement.',
      ],
      closers: [
        'Je vais plutôt m’orienter vers un autre modèle de la boutique.',
        'Expérience boutique correcte, juste mauvais produit pour mon cas.',
      ],
    },
  },

  darija_latin: {
    5: {
      star: 5,
      subjects: [
        'Nadi bzzaf, merci',
        '{product} zwin ktr mn tswira',
        'Wselni f {timeframe}, top',
        'Qualite mzyana bzzaf',
        'Sra7a tstahl 5 njmat',
        'Khditou l {contextA} w 3jebni',
      ],
      openers: [
        'Khdit {product} l {contextA} w sara7a ma kntch mtw9e3 ykoun b had l-qualite.',
        'Wselni f {timeframe} mghlef mzyan w b7al li f tswira tamam.',
        'Hadi {duration} wana knsta3ml {product} w ba9i kima nhar lwel.',
        'Awel mra nkomondi mn hna w {product} 3jebni bzzaf.',
        'Khditou l {contextA}, l-finition w {contextB} mzyanin bzzaf.',
        'Sara7a {product} zwin w kaystahel tamanou.',
      ],
      middles: [
        'Li 3jebni ktr howa {contextB}, bayna l-khdma n9iya.',
        'Livraison kant dghya f {timeframe} w m3amla mzyana.',
        'Mor {duration} dyal l-isti3mal kol nhar, ma ban 3lih ta chi 3ib.',
        'Mzyan bzzaf l {contextA}, sahal w 3amali.',
        'M9aranatan m3a chi 7wayj akhrin chrit 9bel, hada a7san bzzaf.',
      ],
      closers: [
        'Ghadi n3awed nkomondi mn 3endkom akid.',
        'Allah y3tikom sa7a, knnesa7 bih.',
        'Top, 5/5 bla taraddod.',
        'Inchaallah lmarra jaya njreb 7aja okhra mn l-store.',
      ],
    },
    4: {
      star: 4,
      subjects: [
        'Zwin bzaf, 4/5',
        'Mzyan l {contextA}',
        'Qualite mezyana b taman ma39ol',
        '3jebni ghir mola7ada sghira',
      ],
      openers: [
        'Hadi {duration} wana knsta3ml {product} w sara7a mzyan bzzaf.',
        'Wselni f {timeframe}, kolchi howa hadak w mghlef mzyan.',
        '{product} zwin l {contextA} w {contextB} mzyana.',
        'Khditou had simana w l-qualite zwina bzaf 3la tamanou.',
      ],
      middles: [
        'N9est njma ghir 7it {contextB} kanet chwiya mokhtalfa 3la li tsawert, walakin mzyana.',
        'Livraison t3atlat b nhar wa7ed walakin l-colis wsel salim.',
        'Khdam mzyan l {contextA}, knt ntmena ghir ykounou chi alwan okhrin.',
      ],
      closers: [
        'B sifa 3ama radi bzzaf 3la cherya.',
        'Mzyan w ystahel tamanou.',
        'N9der n3awed nchri mn 3endkom.',
      ],
    },
    3: {
      star: 3,
      subjects: [
        '3adi, kay9di lgharad',
        'Mezyan chwiya 3la 9ed tamanou',
        'Ma bihch l {contextA}',
      ],
      openers: [
        '{product} wselni f {timeframe}, 3adi walakin kay9di lgharad.',
        'Jrebtou {duration} l {contextA}, ma bihch 3la 9ed tamanou.',
        'L-qualite mtwsta, {contextB} 3adiya machi chi 7aja kbira.',
      ],
      middles: [
        'Ma fih ta chi mochkil, ghir ana knt mtw9e3 chwiya ktr.',
        'Livraison kant mzyana f {timeframe} w l-produit salim.',
      ],
      closers: [
        'Ma39ol b nisba l taman.',
        'Khallitou l-i7tiyat.',
      ],
    },
    2: {
      star: 2,
      subjects: [
        'Ma waf9nich bzzaf',
        'Machi b7al li knt m7taj',
        'Chwiya na9s b nisba l daw9i',
      ],
      openers: [
        'Livraison kant sri3a ({timeframe}) walakin {product} ma jach m3a {contextA} dyali.',
        'Mor {duration} dyal tajriba, {contextB} ma 3jbatnich bzzaf.',
      ],
      middles: [
        'L-colis wsel n9i w kamel, ghir ana li ma khtaritch l-model l-monasib.',
        'Twaselt m3ahom w jawbouni b i7tiram bach nbedel.',
      ],
      closers: [
        '3titou l khouya li 3jebou had style.',
        'Lmarra jaya n9ra t-tafasil mzyan 9bel ma nkomondi.',
      ],
    },
    1: {
      star: 1,
      subjects: [
        'Ma jach m3a li bghit',
        'Ghalat f l-ikhtiyar dyali',
      ],
      openers: [
        'Wselni f {timeframe} bla mochkil, walakin {product} ma nasbnich f {contextA}.',
        'Ghlatt f l-model li khtarit w ma jach m3a daw9i.',
      ],
      middles: [
        'Kolchi kan kamel f l-colis, l-mochkil ghir ma waf9nich l-isti3mal dyali.',
        'Support 3tawni tari9a dyal retour dghya.',
      ],
      closers: [
        'Nchof chi model akhor mn l-store lmarra jaya.',
      ],
    },
  },

  ar: {
    5: {
      star: 5,
      subjects: [
        'منتج ممتاز وأفضل من الصور',
        'تجربة شراء رائعة مع {product}',
        'وصل خلال {timeframe} بجودة عالية',
        'يستحق 5 نجوم بجدارة',
        'مثالي لـ {contextA}',
      ],
      openers: [
        'طلبت {product} من أجل {contextA} وبصراحة الجودة فاقت توقعاتي.',
        'وصلني الطلب خلال {timeframe} بتغليف أنيق ومن دون أي خدوش.',
        'أستخدم {product} منذ {duration} وما زال بحالته الأصلية تماماً.',
        'أول تجربة لي مع المتجر وكانت ممتازة من ناحية {contextB}.',
        'المنتج مطابق للوصف والصور بدقة، خاصة في {contextB}.',
      ],
      middles: [
        'أكثر ما أعجبني هو {contextB} مقارنة بمنتجات مشابهة جربتها سابقاً.',
        'التوصيل كان سريعاً خلال {timeframe} مع متابعة واضحة للشحنة.',
        'بعد {duration} من الاستخدام المستمر لم ألاحظ أي تراجع في الجودة.',
        'مناسب جداً لـ {contextA} وعملي في الاستخدام اليومي.',
      ],
      closers: [
        'بالتأكيد سأكرر الطلب من المتجر قريباً.',
        'أنصح به لكل من يبحث عن جودة حقيقية.',
        'تقييم خمس نجوم عن استحقاق.',
      ],
    },
    4: {
      star: 4,
      subjects: [
        'جيد جداً مقابل السعر',
        'راضٍ عن {product} بشكل عام',
        'جودة جميلة مع ملاحظة بسيطة',
        'خيار ممتاز لـ {contextA}',
      ],
      openers: [
        'أستخدم {product} منذ {duration} وأداؤه ممتاز لـ {contextA}.',
        'وصل خلال {timeframe} وبحالة سليمة تماماً.',
        'أعجبتني {contextB} جداً مقارنة بالسعر المدفوع.',
      ],
      middles: [
        'أنقصت نجمة واحدة فقط لأن {contextB} كانت مختلفة قليلاً عما تخيلته، لكنها تبقى جيدة.',
        'التغليف الخارجي تعرض لثني بسيط أثناء الشحن، لكن المنتج نفسه سليم تماماً.',
        'يحتاج بضعة أيام للاعتياد عليه، وبعدها يصبح عملياً جداً.',
      ],
      closers: [
        'بشكل عام صفقة موفقة وأنصح بها.',
        'راضي جداً عن الشراء وسأعود للمتجر.',
      ],
    },
    3: {
      star: 3,
      subjects: [
        'مقبول ويؤدي الغرض',
        'جودة متوسطة مناسبة للسعر',
        'جيد للاستخدام العادي',
      ],
      openers: [
        'وصل {product} خلال {timeframe} وهو مطابق للوصف لكنه عادي نوعاً ما.',
        'جربته لمدة {duration} وهو مناسب للاستخدام الخفيف في {contextA}.',
      ],
      middles: [
        'لا يوجد أي عيب مصنعي، الأمر يتعلق فقط بتفضيلي الشخصي في {contextB}.',
        'الشحن كان سلساً والمنتج يفي بالغرض الأساسي.',
      ],
      closers: [
        'مناسب مقابل السعر المدفوع.',
        'قد أجرب فئة أعلى في الطلب القادم.',
      ],
    },
    2: {
      star: 2,
      subjects: [
        'لم يناسب احتياجي تماماً',
        'توقعت تفاصيل مختلفة قليلاً',
      ],
      openers: [
        'التوصيل كان سريعاً خلال {timeframe}، لكن {product} لم يكن الأنسب لـ {contextA}.',
        'بعد {duration} من التجربة، لم تعجبني {contextB} بما يكفي لذوقي الشخصي.',
      ],
      middles: [
        'وصل الطلب مكتملاً وسليماً، لكن الاختيار لم يوافق احتياجي الخاص.',
        'تواصلت مع خدمة العملاء وكان ردهم لطيفاً ومفيداً.',
      ],
      closers: [
        'سأنتبه للتفاصيل والمواصفات بشكل أدق في المرة القادمة.',
      ],
    },
    1: {
      star: 1,
      subjects: [
        'اختيار غير مناسب لاحتياجي',
        'لم يتوافق مع تفضيلي الشخصي',
      ],
      openers: [
        'وصلت الشحنة خلال {timeframe} بشكل سليم، لكن {product} لم يناسبني لـ {contextA}.',
        'أدركت بعد فتح العبوة أنني اخترت الموديل غير المناسب لاستخدامي.',
      ],
      middles: [
        'لا يوجد أي نقص في الطلب، المشكلة فقط عدم ملاءمته لتوقعاتي الشخصية.',
        'خدمة العملاء وضحت لي خطوات الاستبدال بسرعة.',
      ],
      closers: [
        'سأجرب منتجاً آخر من قسم مختلف لاحقاً.',
      ],
    },
  },

  es: {
    5: {
      star: 5,
      subjects: [
        'Muy contento con {product}',
        'Mejor de lo que esperaba',
        'Llegó en {timeframe} impecable',
        'Excelente calidad y presentación',
        'Perfecto para {contextA}',
        'Repetiré compra seguro',
      ],
      openers: [
        'Compré {product} para {contextA} y la calidad me sorprendió para bien.',
        'Llegó en {timeframe} muy bien embalado y sin un solo rasguño.',
        'Llevo {duration} usando {product} y sigue como el primer día.',
        'Primera compra en la tienda y acerté totalmente con {product}.',
        'Desde que abres el paquete se nota el cuidado en {contextB}.',
      ],
      middles: [
        'Lo que más destaca es {contextB}, se nota superior a otras opciones que probé.',
        'El envío tardó {timeframe} y el seguimiento fue muy claro.',
        'Después de {duration} de uso continuo, mantiene exactamente el mismo nivel.',
        'Encaja genial en {contextA} y coincide totalmente con las fotos.',
      ],
      closers: [
        'Sin duda volveré a pedir más artículos.',
        'Muy recomendable si estás dudando.',
        'Cinco estrellas merecidas.',
      ],
    },
    4: {
      star: 4,
      subjects: [
        'Muy buena compra en general',
        'Buena calidad por este precio',
        'Contento con {product}',
        'Casi perfecto',
      ],
      openers: [
        'Llevo {duration} con {product} y cumple muy bien para {contextA}.',
        'Recibido en {timeframe} en buen estado y fiel a la descripción.',
        'Me gustó mucho {contextB}, sobre todo teniendo en cuenta el precio.',
      ],
      middles: [
        'Le quito una estrella solo porque {contextB} era un poco distinto a lo que imaginaba, aunque está muy bien.',
        'La caja exterior llegó algo marcada del transporte, pero el producto venía perfecto.',
        'Funciona genial en el día a día, solo echaría en falta algún color más.',
      ],
      closers: [
        'Muy satisfecho con la compra.',
        'Buena relación calidad-precio, lo recomiendo.',
      ],
    },
    3: {
      star: 3,
      subjects: [
        'Correcto, cumple lo básico',
        'Bien por el precio',
        'Aceptable para uso ocasional',
      ],
      openers: [
        '{product} llegó en {timeframe} y funciona bien, aunque es bastante sencillo.',
        'Lo he probado durante {duration} y resulta correcto para {contextA}.',
      ],
      middles: [
        'Todo venía en orden, simplemente esperaba algo un poco más robusto en {contextB}.',
        'Para uso ligero cumple sin problemas.',
      ],
      closers: [
        'Razonable por lo que cuesta.',
        'Lo dejaré como repuesto.',
      ],
    },
    2: {
      star: 2,
      subjects: [
        'No terminó de encajar conmigo',
        'Preferencia personal',
      ],
      openers: [
        'El envío fue rápido ({timeframe}), pero {product} no era exactamente lo que buscaba para {contextA}.',
        'Tras {duration} de uso, {contextB} no me convenció del todo.',
      ],
      middles: [
        'El artículo llegó en perfecto estado; es más un tema de gusto personal.',
        'Atención al cliente respondió amablemente a mis dudas sobre otras opciones.',
      ],
      closers: [
        'Revisaré mejor las especificaciones antes del próximo pedido.',
      ],
    },
    1: {
      star: 1,
      subjects: [
        'No me sirvió para mi caso',
        'Me equivoqué de opción',
      ],
      openers: [
        'El paquete llegó en {timeframe} sin incidencias, pero {product} no encaja con {contextA}.',
        'Me di cuenta al abrirlo de que elegí la variante equivocada para mis necesidades.',
      ],
      middles: [
        'No faltaba nada en el envío, simplemente no era compatible con lo que yo buscaba.',
        'El equipo de soporte me facilitó los pasos de cambio enseguida.',
      ],
      closers: [
        'Miraré otra categoría de la tienda más adelante.',
      ],
    },
  },
  ...GLOBAL_EXTRA_SENTENCE_BANKS,
};

export const UNIVERSAL_EXTRA_TAILS: Record<ReviewLanguage, string[]> = {
  en: [
    'Packaging was clean and factory-sealed too.',
    'Tracking arrived right on schedule.',
    'Bought alongside another item from the shop.',
    'Happy I grabbed this before it went out of stock.',
    'Customer support answered a quick question beforehand.',
    'Would happily gift this to someone else.',
  ],
  fr: [
    'L’emballage était soigné et bien scellé.',
    'Le suivi de livraison était très clair.',
    'Commandé avec un autre article de la boutique.',
    'Content d’avoir testé cette référence.',
    'Le service client a répondu rapidement avant ma commande.',
  ],
  darija_latin: [
    'L-emballage kan n9i w mghlef mzyan.',
    'Livreur kan m2adab w dghya.',
    'Khditou m3a produit akhor f nafs l-commande.',
    'Sara7a tajriba mzyana m3a had l-store.',
    'Twaselt m3ahom 9bel ma nchri w jawbouni dghya.',
  ],
  ar: [
    'التغليف كان أنيقاً ومختوماً بإحكام.',
    'تحديثات الشحن كانت واضحة حتى الاستلام.',
    'طلبته مع منتج آخر في نفس الشحنة.',
    'تجربة مريحة وسلسة مع المتجر.',
    'خدمة العملاء أجابت عن استفساري قبل الطلب بسرعة.',
  ],
  es: [
    'El empaque venía muy bien cuidado y precintado.',
    'El seguimiento del envío fue puntual.',
    'Lo pedí junto con otro artículo de la tienda.',
    'Buena experiencia de compra de principio a fin.',
    'Resolvieron una duda mía rápido antes de pedirlo.',
  ],
  ...GLOBAL_EXTRA_TAILS,
};
