import { ReviewLanguage, ReviewTemplate } from '../types/reviews';
import { GLOBAL_EXTRA_NAMES } from './globalLanguages';

export const NAMES_BY_LANGUAGE: Record<
  ReviewLanguage,
  { first: string[]; last: string[]; domains: string[] }
> = {
  en: {
    first: ['dave', 'kevin', 'marcus', 'richard', 'steve', 'mark', 'adam', 'chris', 'daniel', 'simon', 'paul', 'alex', 'david', 'nils', 'erik', 'petar'],
    last: ['tech', 'smith', 'clark', 'walker', 'bham', 'uk', 'bristol', 'cardiff', 'nordic', 'hansen', 'novak', 'dublin', 'miller', 'wright'],
    domains: ['gmail.com', 'gmail.com', 'outlook.com', 'hotmail.com', 'btinternet.com', 'icloud.com', 'proton.me'],
  },
  fr: {
    first: ['julien', 'lucas', 'charlotte', 'laurent', 'thomas', 'fabien', 'olivier', 'benjamin', 'hugo', 'denis', 'patrick', 'mehdi', 'karim', 'nadia'],
    last: ['morin', 'leroy', 'dubois', 'moreau', 'lambert', 'bernard', 'fontaine', 'duval', 'chevalier', 'blanchard', 'paris', 'lyon', 'brussels', 'fr'],
    domains: ['gmail.com', 'gmail.com', 'orange.fr', 'free.fr', 'yahoo.fr', 'outlook.fr', 'skynet.be', 'hotmail.fr'],
  },
  darija_latin: {
    first: ['youssef', 'amine', 'hamza', 'karim', 'sami', 'tarik', 'ahmed', 'mustapha', 'faycal', 'abdel', 'walid', 'driss', 'mehdi', 'rafik', 'sofiane', 'mounir', 'hicham', 'rachid', 'zakaria', 'omar', 'bilal', 'ayoub', 'anas', 'reda'],
    last: ['casa', 'rabat', 'tanger', 'marrakech', 'oran', 'alger', 'dz', 'ma', 'tn', 'tunis', 'meknes', 'fes', 'agadir', 'setif', 'annaba', 'bennani', 'benali', 'mansour', 'khelifi', 'alaoui'],
    domains: ['gmail.com', 'gmail.com', 'gmail.com', 'hotmail.com', 'yahoo.fr', 'outlook.com', 'live.fr'],
  },
  ar: {
    first: ['ahmed', 'mohamed', 'hassan', 'youssef', 'omar', 'khaled', 'tarek', 'salem', 'nasser', 'faisal', 'ali', 'samir', 'rami', 'adel', 'waleed', 'karim'],
    last: ['dubai', 'ksa', 'qtr', 'dxb', 'sat', 'tv', 'mansour', 'hassan', 'ali', 'noor', 'saad', 'farouk', 'ammar', 'rashid', 'masri'],
    domains: ['gmail.com', 'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'],
  },
  es: {
    first: ['carlos', 'felipe', 'pedro', 'sergio', 'jorge', 'roberto', 'miguel', 'javier', 'diego', 'pablo', 'raul', 'andres', 'mario'],
    last: ['morales', 'valencia', 'madrid', 'garcia', 'torres', 'gomez', 'alvarez', 'rodriguez', 'lopez', 'santos', 'costa', 'silva'],
    domains: ['gmail.com', 'gmail.com', 'hotmail.es', 'outlook.es', 'yahoo.es', 'icloud.com'],
  },
  ...GLOBAL_EXTRA_NAMES,
};

export const LOCALIZED_TOKENS: Partial<
  Record<
    ReviewLanguage,
    {
      device: string[];
      smartTv: string[];
      match: string[];
      speed: string[];
      duration: string[];
    }
  >
> = {
  en: {
    device: ['Firestick 4K', 'Firestick 4K Max', 'Formuler Z11', 'Nvidia Shield', 'Android box', 'Google TV', 'Apple TV', 'Mi Box'],
    smartTv: ['LG OLED', 'Samsung TV', 'LG WebOS TV', 'Hisense TV', 'Sony Bravia', 'Samsung QLED'],
    match: ['Champions League', 'Sunday Premier League', 'the weekend derby', 'UCL night', 'Europa League'],
    speed: ['25mbps', '50mbps fiber', '100mbps', 'wifi', 'ethernet'],
    duration: ['2 weeks', 'a month', '3 months', '6 months', 'a few weeks'],
  },
  fr: {
    device: ['Firestick 4K', 'Formuler Z11', 'Nvidia Shield', 'box Android', 'Apple TV 4K', 'Mi Box S', 'Chromecast Google TV'],
    smartTv: ['TV Samsung', 'LG OLED WebOS', 'TV LG', 'Hisense VIDAA', 'Sony Android TV'],
    match: ['la Ligue des Champions', 'le Classique OM-PSG', 'les gros matchs du dimanche', 'la Ligue 1'],
    speed: ['fibre 100M', 'ADSL 20M', 'wifi', 'câble ethernet', 'la fibre'],
    duration: ['3 semaines', '2 mois', '4 mois', 'presque 6 mois', 'un bon mois'],
  },
  darija_latin: {
    device: ['Firestick 4K', 'box Android', 'Mi Box', 'Formuler Z11', 'Google TV', 'Android TV', 'Apple TV'],
    smartTv: ['TV Samsung', 'LG WebOS', 'Hisense', 'TV LG OLED', 'Sony Bravia'],
    match: ['matchat dyal Champions League', 'derby', 'matchat dyal l7ed', 'El Clasico', 'Botola w UCL', 'Premier League'],
    speed: ['fibre 20M', 'fibre 100M', 'ADSL 12M', 'wifi', 'cable ethernet'],
    duration: ['chi chher', '2 chhor', '3 chhor', '6 chhor', 'chi simanat'],
  },
  ar: {
    device: ['Firestick 4K', 'رسيفر أندرويد', 'Mi Box', 'Apple TV', 'Nvidia Shield', 'شاشة أندرويد'],
    smartTv: ['شاشة سامسونج', 'شاشة LG WebOS', 'شاشة سوني', 'شاشة Hisense'],
    match: ['دوري أبطال أوروبا', 'الدوري الإنجليزي', 'الكلاسيكو', 'مباريات نهاية الأسبوع'],
    speed: ['ألياف 50 ميغا', 'ألياف 100 ميغا', 'الواي فاي', 'كيبل إيثرنت'],
    duration: ['أسبوعين', 'شهر', '3 أشهر', '6 أشهر'],
  },
  es: {
    device: ['Firestick 4K', 'Formuler Z11', 'Android TV box', 'Nvidia Shield', 'Apple TV 4K', 'Chromecast'],
    smartTv: ['Samsung Tizen', 'LG OLED WebOS', 'TV LG', 'Hisense', 'Sony Bravia'],
    match: ['el Clásico', 'la Champions', 'LaLiga el domingo', 'los partidos del finde'],
    speed: ['fibra 100Mb', 'fibra 300Mb', 'wifi', 'cable ethernet'],
    duration: ['3 semanas', '2 meses', '4 meses', 'medio año'],
  },
};

/**
 * Multi-language, multi-persona natural review library:
 * - Languages: English (en), French (fr), Darija Latin (darija_latin), Arabic (ar), Spanish (es)
 * - Voices: minimalist, casual, sports, family, technical
 * - Strict low-star guardrail: ZERO scam, fraud, or undelivered-code accusations in any language!
 */
export const DEFAULT_REVIEW_TEMPLATES: ReviewTemplate[] = [
  // =========================================================================
  // ENGLISH (en)
  // =========================================================================
  // --- IPTV Subscriptions ---
  {
    id: 'en-sub-5-min1', category: 'IPTV Subscriptions', language: 'en', stars: 5, voice: 'minimalist',
    subject: 'Works great', body: 'Fast code, no issues so far.',
  },
  {
    id: 'en-sub-5-min2', category: 'IPTV Subscriptions', language: 'en', stars: 5, voice: 'minimalist',
    subject: 'Solid server', body: 'works fine on my {device}. happy with it',
  },
  {
    id: 'en-sub-5-min3', category: 'IPTV Subscriptions', language: 'en', stars: 5, voice: 'minimalist',
    subject: 'Second time buying', body: 'Renewed for another year, still steady.',
  },
  {
    id: 'en-sub-5-cas1', category: 'IPTV Subscriptions', language: 'en', stars: 5, voice: 'casual',
    subject: 'Really happy with this one',
    body: 'Tried a couple other codes before that buffered on weekends. Been on {product} for {duration} on my {device} and haven’t had any real problems.',
  },
  {
    id: 'en-sub-5-cas2', category: 'IPTV Subscriptions', language: 'en', stars: 5, voice: 'casual',
    subject: 'Quick email delivery',
    body: 'Ordered right before evening kickoff and got my code in about 5 minutes. Put it into the app and everything unlocked straight away.',
  },
  {
    id: 'en-sub-5-spt1', category: 'IPTV Subscriptions', language: 'en', stars: 5, voice: 'sports',
    subject: 'Held up during {match}',
    body: 'That was my main test. Watched the full 90 minutes on Sky and beIN without a single freeze. My last provider always died at halftime so this is a relief.',
  },
  {
    id: 'en-sub-5-fam1', category: 'IPTV Subscriptions', language: 'en', stars: 5, voice: 'family',
    subject: 'Cancelled our cable box',
    body: 'We were paying over £75 a month for satellite and half the channels were useless. Switched the living room {device} to {product} {duration} ago and nobody misses the old box.',
  },
  {
    id: 'en-sub-5-tech1', category: 'IPTV Subscriptions', language: 'en', stars: 5, voice: 'technical',
    subject: 'True 50fps streams and clean EPG',
    body: 'Checked stream stats on {device}—genuine 1080p50 on the main sports bouquets instead of upscaled 25fps. EPG populated automatically without hunting for external XML links.',
  },
  {
    id: 'en-sub-4-min1', category: 'IPTV Subscriptions', language: 'en', stars: 4, voice: 'minimalist',
    subject: 'Pretty good', body: 'Live tv is solid. VOD takes a couple days for brand new movies.',
  },
  {
    id: 'en-sub-4-cas1', category: 'IPTV Subscriptions', language: 'en', stars: 4, voice: 'casual',
    subject: 'Solid live channels, small VOD delay',
    body: 'Live sports work great with zero lag during {match}. Giving 4 stars only because new movies sometimes take 2–3 days before subtitles match up.',
  },
  {
    id: 'en-sub-3-cas1', category: 'IPTV Subscriptions', language: 'en', stars: 3, voice: 'casual',
    subject: 'Fine most days, occasional Sunday stutter',
    body: 'Monday to Saturday {product} works well on my {device}. During peak Sunday games I got a couple short freezes and switched to the backup channel, which worked ok.',
  },
  {
    id: 'en-sub-2-cas1', category: 'IPTV Subscriptions', language: 'en', stars: 2, voice: 'casual',
    subject: 'Needed a VPN on my ISP',
    body: 'My internet provider blocks streams during {match} so it buffered until I turned on a VPN on my {device}. Works with VPN on, just wish I didn’t need an extra app.',
  },
  {
    id: 'en-sub-1-cas1', category: 'IPTV Subscriptions', language: 'en', stars: 1, voice: 'casual',
    subject: 'Wouldn’t run smoothly on my old TV box',
    body: 'My old 1GB RAM Android box kept crashing when loading the full channel list for {product}. Probably fine on a newer stick, just too heavy for older hardware.',
  },

  // --- M3U Playlists (en) ---
  {
    id: 'en-m3u-5-min1', category: 'M3U Playlists', language: 'en', stars: 5, voice: 'minimalist',
    subject: 'Works in tivimate', body: 'Loaded xtream login into tivimate, fast and clean.',
  },
  {
    id: 'en-m3u-5-cas1', category: 'M3U Playlists', language: 'en', stars: 5, voice: 'casual',
    subject: 'Cleaner than other M3Us I tried',
    body: 'Usually M3U lists have thousands of dead links mixed in. {product} is organized properly by country so I didn’t waste an hour editing groups on {device}.',
  },
  {
    id: 'en-m3u-5-tech1', category: 'M3U Playlists', language: 'en', stars: 5, voice: 'technical',
    subject: 'Low latency EU CDN and clean headers',
    body: 'Zero parsing errors in VLC or TiviMate. Ping to their European edge sits around 35ms on {speed} and the 1080p50 sports feeds stay crisp.',
  },
  {
    id: 'en-m3u-4-cas1', category: 'M3U Playlists', language: 'en', stars: 4, voice: 'casual',
    subject: 'Series sync great, playlist is large',
    body: 'Live TV and series episodes are super tidy on {device}. If you use an older Firestick, hide countries you don’t watch so EPG updates stay fast.',
  },
  {
    id: 'en-m3u-3-cas1', category: 'M3U Playlists', language: 'en', stars: 3, voice: 'casual',
    subject: 'Takes ~20s to refresh on Firestick Lite',
    body: 'Once loaded, {product} streams fine on {speed}. Because of the huge VOD catalog it takes a moment to refresh on low-spec sticks.',
  },
  {
    id: 'en-m3u-2-cas1', category: 'M3U Playlists', language: 'en', stars: 2, voice: 'casual',
    subject: 'Use Xtream login instead of raw M3U link',
    body: 'The raw M3U URL timed out twice in my TV’s built-in player because of file size. Switching to Xtream API worked cleanly.',
  },
  {
    id: 'en-m3u-1-cas1', category: 'M3U Playlists', language: 'en', stars: 1, voice: 'casual',
    subject: 'Too big for my 2018 smart TV memory',
    body: 'Loaded fine on VLC on my laptop, but my older smart TV ran out of storage trying to cache all the VOD posters.',
  },

  // --- Player Activation (en) ---
  {
    id: 'en-ply-5-min1', category: 'Player Activation', language: 'en', stars: 5, voice: 'minimalist',
    subject: 'Activated fast', body: 'Sent MAC, restarted TV 5 mins later and it was unlocked.',
  },
  {
    id: 'en-ply-5-cas1', category: 'Player Activation', language: 'en', stars: 5, voice: 'casual',
    subject: 'Saved me from buying a Firestick',
    body: 'Default apps on my {smartTv} kept freezing on big playlists. Activated {product} instead and now the native TV app runs smooth with one remote.',
  },
  {
    id: 'en-ply-5-tech1', category: 'Player Activation', language: 'en', stars: 5, voice: 'technical',
    subject: 'Handles 30k channels and 4K HDR cleanly',
    body: 'Smart IPTV used to crash on my {smartTv}. {product} loads 30k entries in ~4 seconds and switches audio tracks without dropping frames.',
  },
  {
    id: 'en-ply-4-cas1', category: 'Player Activation', language: 'en', stars: 4, voice: 'casual',
    subject: 'Quick MAC activation, nice layout',
    body: 'Unlocked on my {smartTv} in about 10 minutes. Subtitles stay synced and uploading my playlist via web portal was simple.',
  },
  {
    id: 'en-ply-3-cas1', category: 'Player Activation', language: 'en', stars: 3, voice: 'casual',
    subject: 'Good app, took ~25 mins on Friday night',
    body: 'App itself runs smoothly on {smartTv}. Only gave 3 stars because Friday evening activation took about 25 minutes instead of instant.',
  },
  {
    id: 'en-ply-2-cas1', category: 'Player Activation', language: 'en', stars: 2, voice: 'casual',
    subject: 'Had to unplug TV to refresh license',
    body: 'My {smartTv} kept showing the trial message after activation until I unplugged the TV from the wall for 30 seconds. Works fine now.',
  },
  {
    id: 'en-ply-1-cas1', category: 'Player Activation', language: 'en', stars: 1, voice: 'casual',
    subject: 'Didn’t realize channels weren’t included',
    body: 'My mistake—ordered {product} thinking it came with live TV channels, not just the player license. App unlocked fine on {smartTv}, just needed a playlist separately.',
  },

  // =========================================================================
  // FRENCH (fr)
  // =========================================================================
  // --- IPTV Subscriptions (fr) ---
  {
    id: 'fr-sub-5-min1', category: 'IPTV Subscriptions', language: 'fr', stars: 5, voice: 'minimalist',
    subject: 'Nickel', body: 'Code reçu rapidement, ça tourne sans coupure.',
  },
  {
    id: 'fr-sub-5-min2', category: 'IPTV Subscriptions', language: 'fr', stars: 5, voice: 'minimalist',
    subject: 'Très stable', body: 'marche nickel sur {device}, je recommande',
  },
  {
    id: 'fr-sub-5-min3', category: 'IPTV Subscriptions', language: 'fr', stars: 5, voice: 'minimalist',
    subject: '2ème renouvellement', body: 'Déjà un an sans souci, j’ai repris 12 mois.',
  },
  {
    id: 'fr-sub-5-cas1', category: 'IPTV Subscriptions', language: 'fr', stars: 5, voice: 'casual',
    subject: 'Enfin un serveur qui tient le week-end',
    body: 'J’ai testé deux autres abonnements avant qui coupaient dès qu’il y avait un gros match. Avec {product} sur mon {device} depuis {duration}, zéro freeze.',
  },
  {
    id: 'fr-sub-5-spt1', category: 'IPTV Subscriptions', language: 'fr', stars: 5, voice: 'sports',
    subject: 'Zéro coupure pendant {match}',
    body: 'Regardé tout le match sur Canal+ et beIN 4K avec {speed}, image super nette et aucun décalage son. Franchement satisfait.',
  },
  {
    id: 'fr-sub-5-fam1', category: 'IPTV Subscriptions', language: 'fr', stars: 5, voice: 'family',
    subject: 'Simple pour toute la famille',
    body: 'Installé dans le salon sur {device}. Les chaînes TNT françaises, belges et maghrébines sont bien rangées, même mes parents s’y retrouvent facilement.',
  },
  {
    id: 'fr-sub-5-tech1', category: 'IPTV Subscriptions', language: 'fr', stars: 5, voice: 'technical',
    subject: 'Vrai 1080p 50fps et EPG complet',
    body: 'Flux fluides en 50fps sur les chaînes sport et zapping sous la seconde sur {device}. L’EPG s’est chargé tout seul sans fichier XML externe.',
  },
  {
    id: 'fr-sub-4-min1', category: 'IPTV Subscriptions', language: 'fr', stars: 4, voice: 'minimalist',
    subject: 'Bon serveur', body: 'Direct impeccable, les derniers films VOD mettent 2-3 jours à arriver.',
  },
  {
    id: 'fr-sub-4-cas1', category: 'IPTV Subscriptions', language: 'fr', stars: 4, voice: 'casual',
    subject: 'Très bon live, VOD un peu décalée',
    body: 'Les chaînes en direct sur {product} sont au top pendant {match}. J’enlève une étoile juste parce que les sous-titres FR sur les sorties récentes arrivent parfois 48h après.',
  },
  {
    id: 'fr-sub-3-cas1', category: 'IPTV Subscriptions', language: 'fr', stars: 3, voice: 'casual',
    subject: 'Bien sur fibre, moyen sur 4G',
    body: 'À la maison avec {speed} aucun souci. En vacances en partage 4G j’ai dû mettre le buffer à 3 secondes pour éviter les coupures.',
  },
  {
    id: 'fr-sub-2-cas1', category: 'IPTV Subscriptions', language: 'fr', stars: 2, voice: 'casual',
    subject: 'Besoin d’un VPN le dimanche soir',
    body: 'Mon opérateur bride les flux pendant {match}, ça coupait toutes les 10 minutes avant d’activer un VPN sur mon {device}. Avec VPN ça fonctionne.',
  },
  {
    id: 'fr-sub-1-cas1', category: 'IPTV Subscriptions', language: 'fr', stars: 1, voice: 'casual',
    subject: 'Trop lourd pour mon ancienne box',
    body: 'Ma vieille box Android avec 1 Go de RAM plantait au chargement de tout le catalogue {product}. Prévoir un matériel récent.',
  },

  // --- M3U Playlists (fr) ---
  {
    id: 'fr-m3u-5-min1', category: 'M3U Playlists', language: 'fr', stars: 5, voice: 'minimalist',
    subject: 'Parfait sur TiviMate', body: 'Xtream API reconnue direct, groupes bien triés.',
  },
  {
    id: 'fr-m3u-5-cas1', category: 'M3U Playlists', language: 'fr', stars: 5, voice: 'casual',
    subject: 'Playlist propre sans chaînes mortes',
    body: 'Importé sur Apple TV (UHF) en quelques secondes. Le replay 48h marche sur les chaînes sport françaises et les séries sont bien classées par saison.',
  },
  {
    id: 'fr-m3u-4-cas1', category: 'M3U Playlists', language: 'fr', stars: 4, voice: 'casual',
    subject: 'Bonne qualité, penser à trier les pays',
    body: 'Très bons flux HD/4K sur {device}. La playlist complète est volumineuse donc mieux vaut masquer les pays inutiles dans les réglages.',
  },
  {
    id: 'fr-m3u-3-cas1', category: 'M3U Playlists', language: 'fr', stars: 3, voice: 'casual',
    subject: 'Un peu lent à rafraîchir sur vieux Firestick',
    body: 'Une fois en cache ça marche bien, mais la mise à jour de la liste prend 20 secondes sur un Firestick Lite.',
  },
  {
    id: 'fr-m3u-2-cas1', category: 'M3U Playlists', language: 'fr', stars: 2, voice: 'casual',
    subject: 'Privilégier Xtream Codes plutôt que le lien M3U',
    body: 'Le lien M3U brut faisait planter l’appli de ma télé à cause du poids de la VOD. En passant par Xtream Codes ça s’est chargé correctement.',
  },

  // --- Player Activation (fr) ---
  {
    id: 'fr-ply-5-min1', category: 'Player Activation', language: 'fr', stars: 5, voice: 'minimalist',
    subject: 'Activé en 5 min', body: 'MAC envoyée, redémarrage de la {smartTv} et licence débloquée.',
  },
  {
    id: 'fr-ply-5-cas1', category: 'Player Activation', language: 'fr', stars: 5, voice: 'casual',
    subject: 'Évite d’acheter une box externe',
    body: 'Je voulais prendre un Firestick car les applis gratuites buguaient sur ma {smartTv}. Avec {product} activé, tout tourne fluide directement sur la télé.',
  },
  {
    id: 'fr-ply-4-cas1', category: 'Player Activation', language: 'fr', stars: 4, voice: 'casual',
    subject: 'Interface propre et contrôle parental ok',
    body: 'Activation rapide sur {smartTv}. Plus aucune pub et le code PIN parental verrouille bien les dossiers sensibles.',
  },
  {
    id: 'fr-ply-3-cas1', category: 'Player Activation', language: 'fr', stars: 3, voice: 'casual',
    subject: 'Bon lecteur, activé en ~25 minutes',
    body: 'L’appli est très fluide sur {smartTv}, juste un petit délai de 25 minutes un vendredi soir pour l’activation.',
  },
  {
    id: 'fr-ply-1-cas1', category: 'Player Activation', language: 'fr', stars: 1, voice: 'casual',
    subject: 'Erreur de ma part : lecteur seul sans chaînes',
    body: 'J’ai commandé {product} en pensant qu’un abonnement chaînes était inclus. La licence est bien active sur ma {smartTv} mais il faut ajouter sa propre playlist.',
  },

  // =========================================================================
  // DARIJA LATIN / ARABIZI (darija_latin)
  // =========================================================================
  // --- IPTV Subscriptions (darija_latin) ---
  {
    id: 'dj-sub-5-min1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 5, voice: 'minimalist',
    subject: 'Nadi bzzaf', body: 'Khdam mzyan bla ta9ti3 f {device}. merci',
  },
  {
    id: 'dj-sub-5-min2', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 5, voice: 'minimalist',
    subject: 'Top wallah', body: 'code wsel f 5 d9ay9 w kolchi khdam mrigel',
  },
  {
    id: 'dj-sub-5-min3', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 5, voice: 'minimalist',
    subject: 'Merra taniya', body: '3awedet jadedt 3am akhor, serveur thabet tbarkallah.',
  },
  {
    id: 'dj-sub-5-min4', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 5, voice: 'minimalist',
    subject: 'Mzyan', body: 'khdam 3andi hadi {duration}, makayn la freeze la walo',
  },
  {
    id: 'dj-sub-5-cas1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 5, voice: 'casual',
    subject: 'Sara7a serveur wa3er',
    body: 'Knt jarabt ch7al men code 9bel w dima kayt9ete3 f lweekend. Hadi {duration} wana khdam b {product} f {device} b {speed} w sora nadya bla ta9ti3.',
  },
  {
    id: 'dj-sub-5-cas2', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 5, voice: 'casual',
    subject: 'Livraison dghya 9bel lmatch',
    body: 'Chrit lcode 15 d9i9a 9bel ma ybda lmatch, wselni f email f 4 d9ay9. Dakheltou f lapp w t7el kolchi f blassa, allah y3tikom sa7a.',
  },
  {
    id: 'dj-sub-5-spt1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 5, voice: 'sports',
    subject: 'beIN 4K makaytzegach f {match}',
    body: 'Tferejna f {match} kamel f beIN 4K w Canal+ bla 7ta coupure we7da. Ta3li9 arabi w francais bjoj khdamin mriglin.',
  },
  {
    id: 'dj-sub-5-fam1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 5, voice: 'family',
    subject: 'Dertou lwalid f salon w 3ejbou',
    body: 'Lwalid kaybghi l9anawat dyal lmaghrib w franca w l’akhbar. {product} mreteb mzyan f {device} w sahl yqeleb b telecommande bla ma y3iyet liya.',
  },
  {
    id: 'dj-sub-5-tech1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 5, voice: 'technical',
    subject: 'Qualite 50fps w zapping khfif',
    body: 'Khdam b {product} f {device} b {speed}. Zapping 9el men taniya, les chaines sport 1080p50 7a9i9iya w EPG tchargat automatique.',
  },
  {
    id: 'dj-sub-4-min1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 4, voice: 'minimalist',
    subject: 'Mzyan bzzaf', body: 'Direct nadi 10/10, ghir l’aflam jdad kayt3etlo youmayn f VOD.',
  },
  {
    id: 'dj-sub-4-cas1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 4, voice: 'casual',
    subject: 'Live top, VOD na9es chwiya f tarjama',
    body: 'Les chaines direct w {match} khdamin bla ta9ti3 f {device}. 3tit 4 nejmat ghir 7it chi aflam jdad kayakhdo 48h bach ynzlo b tarjama arabiya/franca.',
  },
  {
    id: 'dj-sub-4-spt1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 4, voice: 'sports',
    subject: 'Khdam mzyan f lmatchat',
    body: 'Sora zwina w makaynch freeze. Kayn ghir chi 20 secondes dyal decalage 3la parabole walakin 3adi f IPTV.',
  },
  {
    id: 'dj-sub-3-cas1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 3, voice: 'casual',
    subject: 'Mzyan f fibre, f 4G chwiya kayt9el',
    body: 'F dar b {speed} khdam mrigel. Mli dit {device} lsafer b partage 4G kan khassni nzid buffer l 3 secondes bach mayb9ach ydor.',
  },
  {
    id: 'dj-sub-3-min1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 3, voice: 'minimalist',
    subject: 'Moyen f l7ed b lil', body: 'F simana kamla mzyan, l7ed f {match} w9a3 wahd lfreeze khfif w bedelt l backup daz normal.',
  },
  {
    id: 'dj-sub-2-cas1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 2, voice: 'casual',
    subject: 'Khassou wifi 9rib ola cable',
    body: 'F salon b cable ethernet khdam mzyan, walakin f bit n3as b wifi b3id b9a kayt9ete3 bzzaf f 4K. Khass connexion thabta.',
  },
  {
    id: 'dj-sub-1-cas1', category: 'IPTV Subscriptions', language: 'darija_latin', stars: 1, voice: 'casual',
    subject: 'Box dyali 9dim ma9derch ychargih',
    body: 'Lcode khdam walakin lbox Android dyali dyal 2018 fih ghir 1GB RAM kaytkhneq mli kayt7el lcatalogue kamil dyal {product}. Khass box jdid.',
  },

  // --- M3U Playlists (darija_latin) ---
  {
    id: 'dj-m3u-5-min1', category: 'M3U Playlists', language: 'darija_latin', stars: 5, voice: 'minimalist',
    subject: 'Nadi f TiviMate', body: 'Dakhelt Xtream f TiviMate, kolchi mreteb w khfif.',
  },
  {
    id: 'dj-m3u-5-cas1', category: 'M3U Playlists', language: 'darija_latin', stars: 5, voice: 'casual',
    subject: 'Playlist n9iya bla 9anawat maytin',
    body: 'Mezyana bzzaf {product} f {device}, makaynch dak tkherbi9 dyal 80 alf 9anat makaykhdmouch. Dowal mretbin w les series kamlin b les posters.',
  },
  {
    id: 'dj-m3u-4-cas1', category: 'M3U Playlists', language: 'darija_latin', stars: 4, voice: 'casual',
    subject: 'Qualite zwina mais lista kbira',
    body: 'Les chaines sport f 50fps nadin. Gher 7it fiha bzzaf dyal VOD, men l’a7san tkhbi dowal li makatferejch fihom bach tchargi dghya.',
  },
  {
    id: 'dj-m3u-3-cas1', category: 'M3U Playlists', language: 'darija_latin', stars: 3, voice: 'casual',
    subject: 'Katakhod 20 secondes f Firestick 9dim',
    body: 'Mli kat7el katkhdem mzyan b {speed}, ghir f lwel katakhod chwiya dyal lwa9t bach tdir mise a jour f Firestick Lite.',
  },
  {
    id: 'dj-m3u-2-cas1', category: 'M3U Playlists', language: 'darija_latin', stars: 2, voice: 'casual',
    subject: 'Khedmo b Xtream machi lien M3U',
    body: 'Lien M3U t9il 3la tele w kan kaybloqui, mli bedelt l Xtream API t7elat 3adi.',
  },

  // --- Player Activation (darija_latin) ---
  {
    id: 'dj-ply-5-min1', category: 'Player Activation', language: 'darija_latin', stars: 5, voice: 'minimalist',
    subject: 'Tactivat f 5 d9ay9', body: 'Sift MAC w redemarit {smartTv}, t7elat f blassa. chokran',
  },
  {
    id: 'dj-ply-5-cas1', category: 'Player Activation', language: 'darija_latin', stars: 5, voice: 'casual',
    subject: 'Hennani men chra dyal box',
    body: 'Knt ghadi nechri Firestick 7it les apps lfabour kaybloqiw f {smartTv}. Activit {product} w daba khdam khfif b telecommande dyal tele bo7dha.',
  },
  {
    id: 'dj-ply-5-tech1', category: 'Player Activation', language: 'darija_latin', stars: 5, voice: 'technical',
    subject: 'Khfif 7sen men Smart IPTV',
    body: 'Smart IPTV kan dima kayplanti f {smartTv} mli katkon playlist kbira. {product} kaychargi 30k 9anat f 4 secondes w kaybedel sawt bla ma yw9ef.',
  },
  {
    id: 'dj-ply-4-cas1', category: 'Player Activation', language: 'darija_latin', stars: 4, voice: 'casual',
    subject: 'Activation sri3a w interface zwina',
    body: 'Tactivat f 10 d9ay9 f {smartTv} w t2akedt men site officiel. Sahl f l’isti3mal w fih code parental.',
  },
  {
    id: 'dj-ply-3-cas1', category: 'Player Activation', language: 'darija_latin', stars: 3, voice: 'casual',
    subject: 'App zwina, t3etlat 25 min nhar ljem3a',
    body: 'L’application mzyana w khfifa f {smartTv}, ghir activation nhar ljem3a b lil khdat chi 25 d9i9a. Daba khdama top.',
  },
  {
    id: 'dj-ply-2-cas1', category: 'Player Activation', language: 'darija_latin', stars: 2, voice: 'casual',
    subject: 'Kan khassni n7eyed prise dyal tele',
    body: 'B9at katban liya trial f {smartTv} 7ta 7eyedt prise dyal do 30 secondes w rja3tha 3ad bant active.',
  },
  {
    id: 'dj-ply-1-cas1', category: 'Player Activation', language: 'darija_latin', stars: 1, voice: 'casual',
    subject: 'Ghalat dyali 7sabli fiha les chaines',
    body: 'Chrit {product} 7sabli m3aha 9anawat, sa3a hadi ghir activation dyal lecteur. L’app tactivat mzyan f {smartTv} walakin khassk playlist bo7dha.',
  },

  // =========================================================================
  // ARABIC SCRIPT (ar)
  // =========================================================================
  // --- IPTV Subscriptions (ar) ---
  {
    id: 'ar-sub-5-min1', category: 'IPTV Subscriptions', language: 'ar', stars: 5, voice: 'minimalist',
    subject: 'ممتاز وسريع', body: 'وصل الكود خلال دقائق ويعمل بدون تقطيع على {device}.',
  },
  {
    id: 'ar-sub-5-min2', category: 'IPTV Subscriptions', language: 'ar', stars: 5, voice: 'minimalist',
    subject: 'سيرفر ثابت', body: 'شغال ممتاز من {duration}، أنصح به.',
  },
  {
    id: 'ar-sub-5-cas1', category: 'IPTV Subscriptions', language: 'ar', stars: 5, voice: 'casual',
    subject: 'ثبات رائع وقت المباريات الكبيرة',
    body: 'جربت اشتراكات كثيرة قبل هذا وكانت تقطع وقت {match}. مع {product} على {device} الصورة واضحة جدا وبدون أي تجميد.',
  },
  {
    id: 'ar-sub-5-fam1', category: 'IPTV Subscriptions', language: 'ar', stars: 5, voice: 'family',
    subject: 'ترتيب القنوات سهل للعائلة',
    body: 'القنوات العربية والرياضية والفرنسية مرتبة بشكل واضح في {device}. حتى الوالد يستخدمه بسهولة بدون مساعدة.',
  },
  {
    id: 'ar-sub-4-cas1', category: 'IPTV Subscriptions', language: 'ar', stars: 4, voice: 'casual',
    subject: 'القنوات المباشرة ممتازة، مكتبة الأفلام تتأخر قليلا',
    body: 'البث المباشر و{match} يعمل بثبات عالي على {speed}. فقط الأفلام الجديدة أحيانا تحتاج يومين لتنزيل الترجمة العربية.',
  },
  {
    id: 'ar-sub-3-cas1', category: 'IPTV Subscriptions', language: 'ar', stars: 3, voice: 'casual',
    subject: 'ممتاز على الألياف ويحتاج إنترنت مستقر',
    body: 'في البيت على {speed} يعمل بسلاسة، لكن على شبكة الجوال 4G احتجت لرفع البافر إلى 3 ثواني لتجنب التوقف.',
  },
  {
    id: 'ar-sub-2-cas1', category: 'IPTV Subscriptions', language: 'ar', stars: 2, voice: 'casual',
    subject: 'يحتاج VPN مع بعض شركات الإنترنت',
    body: 'مزود الإنترنت عندي يضغط سرعة البث وقت {match} ولم يستقر إلا بعد تشغيل VPN على {device}.',
  },
  {
    id: 'ar-sub-1-cas1', category: 'IPTV Subscriptions', language: 'ar', stars: 1, voice: 'casual',
    subject: 'الجهاز القديم عندي لم يتحمل حجم القائمة',
    body: 'الكود يعمل لكن جهاز الأندرويد القديم عندي بذاكرة 1 جيجا يغلق التطبيق بسبب كثرة القنوات والأفلام في {product}.',
  },

  // --- M3U Playlists (ar) ---
  {
    id: 'ar-m3u-5-min1', category: 'M3U Playlists', language: 'ar', stars: 5, voice: 'minimalist',
    subject: 'مرتب ويعمل على TiviMate', body: 'أضفت بيانات Xtream على {device} واشتغلت القنوات والـ EPG فورا.',
  },
  {
    id: 'ar-m3u-5-cas1', category: 'M3U Playlists', language: 'ar', stars: 5, voice: 'casual',
    subject: 'قائمة نظيفة وسرعة تنقل ممتازة',
    body: 'أفضل ما في {product} أن القنوات مصنفة حسب الدول والجودة بدون قنوات معطلة، والتبديل بين القنوات سريع جدا.',
  },
  {
    id: 'ar-m3u-4-cas1', category: 'M3U Playlists', language: 'ar', stars: 4, voice: 'casual',
    subject: 'جودة عالية وحجم القائمة كبير',
    body: 'جودة قنوات الرياضة 50fps ممتازة، أنصح بإخفاء الباقات غير المطلوبة على الأجهزة الضعيفة لتسريع التحديث.',
  },
  {
    id: 'ar-m3u-3-cas1', category: 'M3U Playlists', language: 'ar', stars: 3, voice: 'casual',
    subject: 'جيد لكن التحديث يأخذ وقت على Firestick قديم',
    body: 'البث ممتاز بعد التحميل، فقط تحديث القائمة الكاملة يأخذ حوالي 20 ثانية على الأجهزة الاقتصادية.',
  },

  // --- Player Activation (ar) ---
  {
    id: 'ar-ply-5-min1', category: 'Player Activation', language: 'ar', stars: 5, voice: 'minimalist',
    subject: 'تفعيل خلال 5 دقائق', body: 'أرسلت عنوان الـ MAC وأعدت تشغيل {smartTv} وفتح التطبيق مباشرة.',
  },
  {
    id: 'ar-ply-5-cas1', category: 'Player Activation', language: 'ar', stars: 5, voice: 'casual',
    subject: 'أفضل مشغل على الشاشات الذكية',
    body: 'كان المشغل القديم يعلق على {smartTv} مع القوائم الكبيرة. بعد تفعيل {product} أصبح التنقل سلسا وبدون إعلانات.',
  },
  {
    id: 'ar-ply-4-cas1', category: 'Player Activation', language: 'ar', stars: 4, voice: 'casual',
    subject: 'واجهة جميلة وتفعيل سريع',
    body: 'تم التفعيل في أقل من 10 دقائق على {smartTv} وتأكدت من الحالة في الموقع الرسمي للتطبيق.',
  },
  {
    id: 'ar-ply-1-cas1', category: 'Player Activation', language: 'ar', stars: 1, voice: 'casual',
    subject: 'خطأ مني ظننت أنه يشمل القنوات',
    body: 'التطبيق تفعل بشكل سليم على {smartTv} لكن لم أنتبه أن {product} تفعيل للمشغل فقط بدون قائمة قنوات.',
  },

  // =========================================================================
  // SPANISH (es)
  // =========================================================================
  {
    id: 'es-sub-5-min1', category: 'IPTV Subscriptions', language: 'es', stars: 5, voice: 'minimalist',
    subject: 'Va perfecto', body: 'Código rápido y sin cortes en {device}.',
  },
  {
    id: 'es-sub-5-cas1', category: 'IPTV Subscriptions', language: 'es', stars: 5, voice: 'casual',
    subject: 'Cero cortes durante {match}',
    body: 'Llevo {duration} usando {product} en mi {device} con {speed}. Los canales de LaLiga y DAZN en 50fps van fluidos y sin congelaciones.',
  },
  {
    id: 'es-sub-4-cas1', category: 'IPTV Subscriptions', language: 'es', stars: 4, voice: 'casual',
    subject: 'Muy estable en directo',
    body: 'El fútbol y la TDT van de lujo. Solo pongo 4 estrellas porque los estrenos nuevos en VOD a veces tardan un par de días en salir en castellano.',
  },
  {
    id: 'es-sub-3-cas1', category: 'IPTV Subscriptions', language: 'es', stars: 3, voice: 'casual',
    subject: 'Bien con fibra, justo en 4G',
    body: 'En casa con {speed} va fino, pero compartiendo datos 4G tuve que subir el buffer a 3 segundos.',
  },
  {
    id: 'es-sub-2-cas1', category: 'IPTV Subscriptions', language: 'es', stars: 2, voice: 'casual',
    subject: 'Hace falta VPN los domingos con mi operadora',
    body: 'Mi operadora bloquea durante {match} así que tuve que activar VPN en el {device} para verlo sin cortes.',
  },
  {
    id: 'es-m3u-5-cas1', category: 'M3U Playlists', language: 'es', stars: 5, voice: 'casual',
    subject: 'Perfecto en TiviMate con Xtream',
    body: 'Cargué {product} en TiviMate en segundos. Carpetas ordenadas por país y guía EPG funcionando sin tocar nada.',
  },
  {
    id: 'es-m3u-4-cas1', category: 'M3U Playlists', language: 'es', stars: 4, voice: 'casual',
    subject: 'Buena calidad, conviene filtrar países',
    body: 'Canales 4K y FHD muy nítidos. Como la lista completa es grande, oculté países que no uso y ahora actualiza al instante.',
  },
  {
    id: 'es-ply-5-cas1', category: 'Player Activation', language: 'es', stars: 5, voice: 'casual',
    subject: 'Activado en 6 minutos en mi {smartTv}',
    body: 'Mandé la MAC, reinicié la tele y ya estaba activo. Mucho más rápido que las apps gratuitas con anuncios.',
  },
  {
    id: 'es-ply-4-cas1', category: 'Player Activation', language: 'es', stars: 4, voice: 'casual',
    subject: 'Fácil de usar y sin publicidad',
    body: 'Funciona fluido en {smartTv} con el mando original. Subtítulos y cambio de idioma sin problemas.',
  },

  // =========================================================================
  // SECONDARY CATEGORIES (24h Test, Reseller Panels, Sharing, Premium Streaming)
  // =========================================================================
  {
    id: 'en-tst-5-cas1', category: '24h Test Codes', language: 'en', stars: 5, voice: 'casual',
    subject: 'Full package unlocked during {match}',
    body: 'Tested {product} on {device} over {speed}. Zero stutter during the game so I ordered the 12-month plan right after.',
  },
  {
    id: 'fr-tst-5-cas1', category: '24h Test Codes', language: 'fr', stars: 5, voice: 'casual',
    subject: 'Bon test avant de prendre 12 mois',
    body: 'Testé pendant {match} sur {device}. Toutes les chaînes 4K étaient accessibles, fluide du début à la fin.',
  },
  {
    id: 'dj-tst-5-cas1', category: '24h Test Codes', language: 'darija_latin', stars: 5, voice: 'casual',
    subject: 'Test mzyan 9bel ma nechri 3am',
    body: 'Jarabt {product} f {device} wa9t {match}, kolchi t7el 7ta 4K w VOD bla ta9ti3. Ghadi nakhod 12 mois.',
  },
  {
    id: 'en-pnl-5-cas1', category: 'Reseller Panels & Credits', language: 'en', stars: 5, voice: 'casual',
    subject: 'Credits added quickly to panel',
    body: 'Activated 6 client Smart TVs over the weekend from my phone. Clean credit log and zero failed MAC activations.',
  },
  {
    id: 'fr-pnl-5-cas1', category: 'Reseller Panels & Credits', language: 'fr', stars: 5, voice: 'casual',
    subject: 'Panel fiable pour mes clients',
    body: 'Crédits ajoutés en moins de 10 minutes. Les activations Samsung et LG passent du premier coup.',
  },
  {
    id: 'dj-pnl-5-cas1', category: 'Reseller Panels & Credits', language: 'darija_latin', stars: 5, voice: 'casual',
    subject: 'Credits weslo f 10 d9ay9',
    body: 'Panel khfif f tilifon mli kankon 3end les clients. Activit 5 TVs Samsung w LG kolhom t7elo men awal merra.',
  },
  {
    id: 'en-shr-5-tech1', category: 'Sharing', language: 'en', stars: 5, voice: 'technical',
    subject: 'Steady IKS on Server 40',
    body: 'Renewed receiver serial with {product}. Astra 19.2E and Hotbird decrypted cleanly with ~110ms ECM.',
  },
  {
    id: 'fr-shr-5-cas1', category: 'Sharing', language: 'fr', stars: 5, voice: 'casual',
    subject: 'Astra 19.2E fluide sans coupure',
    body: 'Numéro de série renouvelé en 10 minutes, date d’expiration mise à jour sur le serveur 40 pour un an.',
  },
  {
    id: 'dj-shr-5-cas1', category: 'Sharing', language: 'darija_latin', stars: 5, voice: 'casual',
    subject: 'Astra w Hotbird t7elo dghya',
    body: 'Sift numero de serie, redemarit recepteur mora 10 d9ay9 w tzad 3am f serveur 40. Canal+ w Movistar khdamin bla ta9ti3.',
  },
  {
    id: 'en-prm-5-min1', category: 'Premium Streaming', language: 'en', stars: 5, voice: 'minimalist',
    subject: 'Crisp 4K broadcast', body: 'Official quality picture on {smartTv}, zero lag on 5G too.',
  },
  {
    id: 'dj-prm-5-cas1', category: 'Premium Streaming', language: 'darija_latin', stars: 5, voice: 'casual',
    subject: 'Qualite officielle wa3ra',
    body: 'Khdam b {product} f {smartTv} w tilifon f 5G, sora 4K safya bzzaf f {match}.',
  },
];
