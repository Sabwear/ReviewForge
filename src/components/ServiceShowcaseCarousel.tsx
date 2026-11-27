import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RefreshCw,
  Star,
} from 'lucide-react';
import {
  GeneratedReview,
  LANGUAGE_OPTIONS,
  ReviewLanguage,
  SampleBusinessId,
} from '../types/reviews';

interface ShowcaseReviewExample {
  serviceName: string;
  reviewerName: string;
  reviewerEmail: string;
  language: ReviewLanguage;
  stars: number;
  date: string;
  subject: string;
  body: string;
  isReturning?: boolean;
  voiceLabel: string;
}

interface IndustryShowcaseSlide {
  id: string;
  industry: string;
  shortLabel: string;
  domainType: string;
  summary: string;
  sampleId?: SampleBusinessId;
  reviews: ShowcaseReviewExample[];
}

const SHOWCASE_SLIDES: IndustryShowcaseSlide[] = [
  {
    id: 'agency',
    industry: 'Digital Agency & Web Studio',
    shortLabel: 'Web Agency',
    domainType: 'B2B Services',
    summary: 'Website redesigns, technical SEO audits, conversion sprints, and ongoing support retainers.',
    sampleId: 'services',
    reviews: [
      {
        serviceName: 'Custom Website Design & Build',
        reviewerName: 'Claire Bennett',
        reviewerEmail: 'claire.bennett84@gmail.com',
        language: 'en',
        stars: 5,
        date: '2026-10-18',
        subject: 'Fast turnaround and zero friction at launch',
        body: 'Hired the studio to rebuild our B2B marketing site before a product launch. Every milestone landed ahead of schedule, Core Web Vitals jumped to 98 on mobile, and our team can edit pages without calling a developer.',
        isReturning: true,
        voiceLabel: 'Detail-focused',
      },
      {
        serviceName: 'Audit SEO Technique & Performance',
        reviewerName: 'Julien Moreau',
        reviewerEmail: 'j.moreau@orange.fr',
        language: 'fr',
        stars: 5,
        date: '2026-11-04',
        subject: 'Plan d’action clair et résultats mesurables',
        body: 'L’audit ne s’est pas contenté d’un PDF générique : chaque blocage d’indexation était priorisé avec des correctifs concrets. En six semaines, notre trafic organique sur les pages services a progressé de 34%.',
        voiceLabel: 'Regular client',
      },
    ],
  },
  {
    id: 'medical',
    industry: 'Dental & Medical Clinic',
    shortLabel: 'Clinic & Dental',
    domainType: 'Healthcare',
    summary: 'Orthodontic consultations, routine cleanings, laser treatments, and patient follow-ups.',
    reviews: [
      {
        serviceName: 'Clear Aligner Consultation',
        reviewerName: 'Hannah Weber',
        reviewerEmail: 'hannah.weber@gmx.de',
        language: 'de',
        stars: 5,
        date: '2026-10-29',
        subject: 'Sehr ruhige Atmosphäre und transparente Beratung',
        body: 'Kaum Wartezeit in der Praxis und der 3D-Scan wurde direkt am Bildschirm verständlich erklärt. Alle Kosten wurden vorab offen besprochen, ohne Zeitdruck.',
        voiceLabel: 'Detail-focused',
      },
      {
        serviceName: 'تبييض الأسنان الاحترافي',
        reviewerName: 'سلمى العمراني',
        reviewerEmail: 'salma.amrani91@gmail.com',
        language: 'ar',
        stars: 5,
        date: '2026-11-11',
        subject: 'نتيجة طبيعية جداً وتعامل راقٍ',
        body: 'العيادة نظيفة للغاية والموعد كان دقيقاً من دون انتظار طويل. الطبيبة شرحت كل خطوة بلطف والنتيجة كانت واضحة من الجلسة الأولى من دون حساسية مزعجة.',
        isReturning: true,
        voiceLabel: 'Casual patient',
      },
    ],
  },
  {
    id: 'saas',
    industry: 'SaaS & Cloud Software',
    shortLabel: 'SaaS Platform',
    domainType: 'B2B Software',
    summary: 'Team analytics subscriptions, API workflow automation, onboarding, and enterprise tiers.',
    reviews: [
      {
        serviceName: 'Team Analytics Pro Plan',
        reviewerName: 'Haruto Sato',
        reviewerEmail: 'h.sato@yahoo.co.jp',
        language: 'ja',
        stars: 5,
        date: '2026-10-22',
        subject: '導入初日からダッシュボードが直感的',
        body: '既存のCRMとの連携が15分ほどで完了し、毎朝のレポート作成時間が半分以下になりました。サポートの返信も丁寧で非常に助かっています。',
        voiceLabel: 'Detail-focused',
      },
      {
        serviceName: 'Workflow Automation Add-On',
        reviewerName: 'Carlos Morales',
        reviewerEmail: 'cmorales@outlook.es',
        language: 'es',
        stars: 4,
        date: '2026-11-08',
        subject: 'Muy estable, solo falta un filtro extra',
        body: 'Llevamos tres meses automatizando facturas y alertas en Slack sin una sola caída. La curva inicial toma una tarde, pero una vez configurado ahorra horas cada semana.',
        isReturning: true,
        voiceLabel: 'Regular user',
      },
    ],
  },
  {
    id: 'hospitality',
    industry: 'Boutique Hotel & Hospitality',
    shortLabel: 'Hotel & Travel',
    domainType: 'Hospitality',
    summary: 'Suite bookings, airport transfers, guided excursions, and breakfast dining experiences.',
    reviews: [
      {
        serviceName: 'Terrace Junior Suite — 3 Nights',
        reviewerName: 'Giulia Conti',
        reviewerEmail: 'giulia.conti@libero.it',
        language: 'it',
        stars: 5,
        date: '2026-10-14',
        subject: 'Camera silenziosa e colazione curatissima',
        body: 'Check-in rapidissimo nonostante l’arrivo tardi la sera. La terrazza privata era impeccabile e lo staff ci ha prenotato anche il transfer per l’aeroporto senza alcun intoppo.',
        voiceLabel: 'Casual guest',
      },
      {
        serviceName: 'Private Airport Transfer & City Tour',
        reviewerName: 'Youssef Bennani',
        reviewerEmail: 'youssef.bennani@gmail.com',
        language: 'darija_latin',
        stars: 5,
        date: '2026-11-02',
        subject: 'Khidma n9iya w chifor f lwa9t',
        body: 'L-chauffeur kan kaytsenana f l-matar 9bel l-wa9t, tomobil n9iya w climatisee. Derna tour zwina f l-mdina bla stresse, sara7a top.',
        voiceLabel: 'Short note',
      },
    ],
  },
  {
    id: 'beauty',
    industry: 'Beauty Salon & Wellness Spa',
    shortLabel: 'Salon & Spa',
    domainType: 'Local Service',
    summary: 'Keratin hair treatments, deep-tissue massage, facials, and skincare packages.',
    sampleId: 'skincare',
    reviews: [
      {
        serviceName: 'Deep Tissue Aromatherapy Massage (60m)',
        reviewerName: 'Mariana Silva',
        reviewerEmail: 'mariana.silva88@gmail.com',
        language: 'pt',
        stars: 5,
        date: '2026-10-27',
        subject: 'Ambiente relaxante e atendimento impecável',
        body: 'Agendei online em dois minutos e fui atendida exatamente no horário. A terapeuta ajustou a pressão nos ombros perfeitamente—saí realmente renovada.',
        isReturning: true,
        voiceLabel: 'Regular client',
      },
      {
        serviceName: 'Hydra-Glow Facial Treatment',
        reviewerName: 'Minji Kim',
        reviewerEmail: 'minji.kim@naver.com',
        language: 'ko',
        stars: 5,
        date: '2026-11-14',
        subject: '피부 자극 없이 촉촉함이 오래가요',
        body: '민감성 피부라 걱정했는데 상담부터 꼼꼼하게 체크해 주셔서 안심됐어요. 시술 직후 붉은기도 거의 없고 다음 날 화장이 훨씬 잘 먹었습니다.',
        voiceLabel: 'Detail-focused',
      },
    ],
  },
  {
    id: 'home_services',
    industry: 'Home Repair, Plumbing & HVAC',
    shortLabel: 'Home Services',
    domainType: 'Field Service',
    summary: 'AC installations, annual boiler servicing, smart thermostat setup, and emergency repairs.',
    reviews: [
      {
        serviceName: 'Split AC Unit Installation',
        reviewerName: 'Emre Yılmaz',
        reviewerEmail: 'emre.yilmaz@hotmail.com',
        language: 'tr',
        stars: 5,
        date: '2026-10-19',
        subject: 'Temiz işçilik, tam saatinde geldiler',
        body: 'Montaj ekibi randevu saatinde geldi, duvar delme sonrası ortamı tertemiz bıraktı. Cihazın sessiz çalışması ve kullanım anlatımı gerçekten çok iyiydi.',
        voiceLabel: 'Household',
      },
      {
        serviceName: 'Annual Boiler Safety Inspection',
        reviewerName: 'Daan de Vries',
        reviewerEmail: 'daan.devries@ziggo.nl',
        language: 'nl',
        stars: 4,
        date: '2026-11-06',
        subject: 'Duidelijk rapport en nette monteur',
        body: 'De monteur nam rustig de tijd om de druk en kleppen na te lopen en stuurde het onderhoudsrapport direct per mail. Kwam een kwartier later dan gepland maar belde netjes vooraf.',
        voiceLabel: 'Casual buyer',
      },
    ],
  },
  {
    id: 'ecommerce',
    industry: 'E-Commerce & Consumer Tech',
    shortLabel: 'Online Store',
    domainType: 'Shopify / Judge.me',
    summary: 'Wireless audio, desk setups, apparel, and specialty goods exported cleanly to Judge.me.',
    sampleId: 'electronics',
    reviews: [
      {
        serviceName: 'Auralis Studio ANC Wireless Headphones',
        reviewerName: 'Jakub Nowak',
        reviewerEmail: 'jakub.nowak@wp.pl',
        language: 'pl',
        stars: 5,
        date: '2026-10-31',
        subject: 'Świetna redukcja hałasu i wygodne nauszniki',
        body: 'Przesyłka dotarła w 48 godzin w solidnym opakowaniu. W pociągu ANC wycisza szum bez ucisku na uszy, a bateria bez problemu wytrzymuje cały tydzień pracy.',
        isReturning: true,
        voiceLabel: 'Detail-focused',
      },
      {
        serviceName: 'VoltCube 100W GaN 4-Port Charger',
        reviewerName: 'Wei Zhang',
        reviewerEmail: 'wei.zhang92@163.com',
        language: 'zh',
        stars: 5,
        date: '2026-11-12',
        subject: '体积小巧，出差带这一个就够了',
        body: '同时给笔记本和手机快充发热量控制得很好，插脚也很稳固。之前包里要塞三个充电头，现在轻便多了。',
        voiceLabel: 'Short note',
      },
    ],
  },
  {
    id: 'fitness',
    industry: 'Fitness Coaching & Nutrition',
    shortLabel: 'Fitness & Coach',
    domainType: 'Coaching',
    summary: '12-week personal training, custom macro plans, mobility assessments, and group classes.',
    reviews: [
      {
        serviceName: '12-Week Strength & Mobility Program',
        reviewerName: 'Rohan Sharma',
        reviewerEmail: 'rohan.sharma@gmail.com',
        language: 'hi',
        stars: 5,
        date: '2026-10-25',
        subject: 'व्यावहारिक प्लान और नियमित फॉलो-अप',
        body: 'कोच ने मेरे ऑफिस शेड्यूल के हिसाब से 45 मिनट का वर्कआउट प्लान बनाया। हर हफ्ते फॉर्म चेक करने से पीठ का दर्द भी काफी कम हो गया है।',
        voiceLabel: 'Regular client',
      },
      {
        serviceName: 'Персональный план питания и тренировок',
        reviewerName: 'Anna Sokolova',
        reviewerEmail: 'a.sokolova@yandex.ru',
        language: 'ru',
        stars: 5,
        date: '2026-11-09',
        subject: 'Без жёстких диет, понятная система',
        body: 'За два месяца привыкла к новому ритму без стресса. Рацион собран из обычных продуктов, а обратная связь в чате всегда быстрая и по делу.',
        isReturning: true,
        voiceLabel: 'Casual client',
      },
    ],
  },
];

const LANG_META_MAP = Object.fromEntries(
  LANGUAGE_OPTIONS.map((opt) => [opt.code, opt])
);

interface MarqueeItem {
  id: string;
  offering: string;
  category: string;
  reviewerName: string;
  language: ReviewLanguage;
  stars: number;
  subject: string;
  body: string;
  date: string;
}

interface EndlessReviewBannerProps {
  reviews?: GeneratedReview[];
}

/**
 * Endless smoothly-moving horizontal ticker banner of reviews (marquee).
 * Uses two identical seamless tracks translating 0% -> -50% with pause-on-hover.
 */
export function EndlessReviewBanner({ reviews }: EndlessReviewBannerProps) {
  const [paused, setPaused] = useState(false);

  const items: MarqueeItem[] = useMemo(() => {
    if (reviews && reviews.length > 0) {
      return reviews.slice(0, 16).map((r) => ({
        id: r.id,
        offering: r.item_name,
        category: r.category,
        reviewerName: r.reviewer_name,
        language: r.language,
        stars: r.stars,
        subject: r.subject,
        body: r.body,
        date: r.review_date,
      }));
    }

    return SHOWCASE_SLIDES.flatMap((slide) =>
      slide.reviews.map((rev, idx) => ({
        id: `${slide.id}-${idx}`,
        offering: rev.serviceName,
        category: slide.shortLabel,
        reviewerName: rev.reviewerName,
        language: rev.language,
        stars: rev.stars,
        subject: rev.subject,
        body: rev.body,
        date: rev.date,
      }))
    );
  }, [reviews]);

  if (items.length === 0) return null;

  const renderTrack = (trackPrefix: string) => (
    <div className="flex items-stretch gap-4 pr-4 shrink-0">
      {items.map((item) => {
        const langMeta = LANG_META_MAP[item.language];
        return (
          <article
            key={`${trackPrefix}-${item.id}`}
            className="w-[312px] shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3.5 flex flex-col justify-between gap-2 hover:border-sky-300 transition-colors"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="inline-flex items-center gap-0.5 text-amber-600 font-mono font-semibold">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`w-3 h-3 ${
                        idx < item.stars
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-200 fill-slate-200'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                  <span className="ml-1 text-slate-700">{item.stars}.0</span>
                </span>
                <span className="inline-flex items-center gap-1 text-slate-500 truncate">
                  <span aria-hidden="true">{langMeta?.flag}</span>
                  <span className="truncate">{item.category}</span>
                </span>
              </div>

              <div dir={langMeta?.dir || 'ltr'}>
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {item.subject}
                </p>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-0.5">
                  “{item.body}”
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="font-medium text-slate-700 truncate">
                {item.reviewerName}
              </span>
              <span className="truncate text-slate-400 max-w-[140px]">
                {item.offering}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <section
      aria-label="Endless scrolling reviews banner"
      className="space-y-2.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-800">
            {reviews && reviews.length > 0
              ? 'Live Generated Reviews Stream'
              : 'Endless Multi-Industry Reviews Stream'}
          </span>
          <span className="text-slate-400" aria-hidden="true">·</span>
          <span className="text-slate-500">
            Hover any card to pause
          </span>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          {paused ? (
            <>
              <Play className="w-3 h-3" aria-hidden="true" />
              <span>Resume stream</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3" aria-hidden="true" />
              <span>Pause stream</span>
            </>
          )}
        </button>
      </div>

      <div className="relative overflow-hidden marquee-fade-mask py-1">
        <div
          className="animate-review-marquee"
          data-paused={paused ? 'true' : 'false'}
        >
          {renderTrack('a')}
          {renderTrack('b')}
        </div>
      </div>
    </section>
  );
}

interface ServiceShowcaseCarouselProps {
  onLoadSampleBusiness?: (id: SampleBusinessId) => void;
}

/**
 * True horizontal slide carousel with smooth spring track translation,
 * swipe/drag gestures, industry jump strip, and slide pagination dots.
 */
export function ServiceShowcaseCarousel({
  onLoadSampleBusiness,
}: ServiceShowcaseCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slideCount = SHOWCASE_SLIDES.length;

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slideCount);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isPaused, slideCount]);

  const goTo = (nextIdx: number) => {
    setActiveIndex((nextIdx + slideCount) % slideCount);
  };

  return (
    <section
      aria-label="Business service review examples slide carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      {/* Header & Slide Controls */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Business Service Review Slide Carousel
            </h2>
            <span className="text-xs text-slate-400" aria-hidden="true">·</span>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              Slide {activeIndex + 1} / {slideCount}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Swipe or slide through realistic reviews across 8 industries and 16 world languages.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? 'Resume slide auto-play' : 'Pause slide auto-play'}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3" aria-hidden="true" />
                <span>Play</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" aria-hidden="true" />
                <span>Auto</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous industry slide"
            className="h-8 w-8 inline-flex items-center justify-center text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next industry slide"
            className="h-8 w-8 inline-flex items-center justify-center text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Industry Selector Strip */}
      <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
        {SHOWCASE_SLIDES.map((slide, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(idx)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {slide.shortLabel}
            </button>
          );
        })}
      </div>

      {/* True Horizontal Sliding Track */}
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: `-${activeIndex * 100}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 32, mass: 0.9 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.x < -55) goTo(activeIndex + 1);
            else if (info.offset.x > 55) goTo(activeIndex - 1);
          }}
        >
          {SHOWCASE_SLIDES.map((slide) => (
            <div
              key={slide.id}
              className="w-full shrink-0 p-6 space-y-5 select-none"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {slide.industry}
                    </h3>
                    <span className="text-xs text-slate-400" aria-hidden="true">·</span>
                    <span className="text-xs font-mono text-sky-700">
                      {slide.domainType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {slide.summary}
                  </p>
                </div>
                {slide.sampleId && onLoadSampleBusiness && (
                  <button
                    type="button"
                    onClick={() => onLoadSampleBusiness(slide.sampleId!)}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-900 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Load {slide.shortLabel} sample →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {slide.reviews.map((rev, i) => {
                  const langMeta = LANG_META_MAP[rev.language];
                  return (
                    <article
                      key={`${slide.id}-${i}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-0.5 text-amber-600 font-mono font-semibold">
                            {Array.from({ length: 5 }).map((_, starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3.5 h-3.5 ${
                                  starIdx < rev.stars
                                    ? 'fill-amber-500 text-amber-500'
                                    : 'text-slate-200 fill-slate-200'
                                }`}
                                aria-hidden="true"
                              />
                            ))}
                            <span className="ml-1 text-slate-700">{rev.stars}.0</span>
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                            <span aria-hidden="true">{langMeta?.flag}</span>
                            <span>{langMeta?.label || rev.language}</span>
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="font-semibold text-slate-800">{rev.serviceName}</span>
                          <span aria-hidden="true">·</span>
                          <span>{rev.voiceLabel}</span>
                          {rev.isReturning && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-sky-700 font-medium">Returning client</span>
                            </>
                          )}
                        </div>

                        <div dir={langMeta?.dir || 'ltr'} className="space-y-1 pt-0.5">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {rev.subject}
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {rev.body}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="truncate">
                          <span className="font-medium text-slate-700">{rev.reviewerName}</span>
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {rev.reviewerEmail}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0">
                          {rev.date}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Pagination Dots + Progress Footer */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Carousel slides">
          {SHOWCASE_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Slide ${idx + 1}: ${s.industry}`}
              onClick={() => goTo(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === activeIndex
                  ? 'w-6 bg-sky-700'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] text-slate-400">
          Drag or use arrows to slide
        </span>
      </div>
    </section>
  );
}

interface LiveReviewSpotlightCarouselProps {
  reviews: GeneratedReview[];
  onRegenerateReview: (reviewId: string) => void;
}

/**
 * Horizontal sliding spotlight carousel for the user's own generated reviews.
 */
export function LiveReviewSpotlightCarousel({
  reviews,
  onRegenerateReview,
}: LiveReviewSpotlightCarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const spotlightReviews = useMemo(() => {
    if (reviews.length === 0) return [];
    const selected: GeneratedReview[] = [];
    const seenPairs = new Set<string>();

    for (const r of reviews) {
      const pairKey = `${r.language}::${r.category}`;
      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey);
        selected.push(r);
        if (selected.length >= 10) break;
      }
    }
    if (selected.length < Math.min(8, reviews.length)) {
      const usedIds = new Set(selected.map((s) => s.id));
      for (const r of reviews) {
        if (!usedIds.has(r.id)) {
          selected.push(r);
          if (selected.length >= 8) break;
        }
      }
    }
    return selected;
  }, [reviews]);

  const count = spotlightReviews.length;
  const safeIdx = count > 0 ? index % count : 0;
  const activeReview = spotlightReviews[safeIdx];

  useEffect(() => {
    if (isPaused || count <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isPaused, count]);

  if (!activeReview) return null;

  const step = (delta: number) => {
    setIndex((prev) => (prev + delta + count) % count);
  };

  return (
    <section
      aria-label="Detailed spotlight review slide carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Detailed Review Slide Carousel
          </h2>
          <span className="text-xs text-slate-400" aria-hidden="true">·</span>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            Slide {safeIdx + 1} / {count}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onRegenerateReview(activeReview.id)}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-sky-700 bg-white hover:bg-sky-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Regenerate</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? 'Resume slide carousel' : 'Pause slide carousel'}
            className="h-8 px-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {isPaused ? (
              <Play className="w-3 h-3" aria-hidden="true" />
            ) : (
              <Pause className="w-3 h-3" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous review slide"
            className="h-8 w-8 inline-flex items-center justify-center text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next review slide"
            className="h-8 w-8 inline-flex items-center justify-center text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Horizontal Slide Track */}
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: `-${safeIdx * 100}%` }}
          transition={{ type: 'spring', stiffness: 270, damping: 32, mass: 0.9 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) step(1);
            else if (info.offset.x > 50) step(-1);
          }}
        >
          {spotlightReviews.map((review) => {
            const langMeta = LANG_META_MAP[review.language];
            return (
              <div
                key={review.id}
                className="w-full shrink-0 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start select-none"
              >
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-0.5 text-amber-600 font-mono font-semibold">
                      {Array.from({ length: 5 }).map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-4 h-4 ${
                            starIdx < review.stars
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-200 fill-slate-200'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                      <span className="ml-1 text-slate-800">{review.stars}.0</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      <span aria-hidden="true">{langMeta?.flag}</span>
                      <span>{langMeta?.label || review.language}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{review.review_date}</span>
                    {review.isReturningCustomer && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-sky-700">Returning customer</span>
                      </>
                    )}
                  </div>

                  <div dir={langMeta?.dir || 'ltr'} className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {review.subject}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-[68ch]">
                      {review.body}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Offering</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[190px]">
                      {review.item_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Category</span>
                    <span className="font-medium text-slate-700 text-right truncate">
                      {review.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Reviewer</span>
                    <span className="font-medium text-slate-800 text-right truncate">
                      {review.reviewer_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Email</span>
                    <span className="font-mono text-[11px] text-slate-600 text-right truncate max-w-[190px]">
                      {review.reviewer_email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Handle</span>
                    <span className="font-mono text-[11px] text-slate-500 text-right truncate max-w-[190px]">
                      {review.item_slug}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Pagination Dots */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Spotlight slides">
          {spotlightReviews.map((r, idx) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={idx === safeIdx}
              aria-label={`Review slide ${idx + 1}`}
              onClick={() => setIndex(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === safeIdx
                  ? 'w-6 bg-sky-700'
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
        <span className="text-[11px] text-slate-400">
          Swipe or click arrows to slide
        </span>
      </div>
    </section>
  );
}
