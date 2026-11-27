import { ReviewLanguage, ReviewerVoice } from '../types/reviews';

export type CategoryDomain = 'iptv' | 'm3u' | 'player' | 'panel' | 'sharing';

export function mapCategoryToDomain(category: string): CategoryDomain {
  const c = category.toLowerCase();
  if (c.includes('m3u') || c.includes('playlist')) return 'm3u';
  if (c.includes('player') || c.includes('activation')) return 'player';
  if (c.includes('panel') || c.includes('reseller') || c.includes('credit')) return 'panel';
  if (c.includes('sharing') || c.includes('forever') || c.includes('funcam') || c.includes('sat')) {
    return 'sharing';
  }
  return 'iptv';
}

export interface SentencePool {
  subjects: string[];
  /** Complete, standalone 1-sentence short reviews or strong openers */
  openers: string[];
  /** Complete, standalone 2nd sentences adding experience/detail */
  middles: string[];
  /** Complete, standalone 3rd sentences adding signoff/context/result */
  closers: string[];
}

export const COMPOSER_TOKENS: Partial<
  Record<
    ReviewLanguage,
    {
      device: string[];
      smartTv: string[];
      match: string[];
      speed: string[];
      duration: string[];
      minutes: string[];
      channels: string[];
      bouquet: string[];
    }
  >
> = {
  en: {
    device: [
      'Firestick 4K', 'Firestick 4K Max', 'Formuler Z11', 'Formuler Z10',
      'Nvidia Shield Pro', 'Google TV Chromecast', 'Apple TV 4K', 'Xiaomi Mi Box S',
      'Sony Android TV', 'Onn 4K box', 'Android TV box',
    ],
    smartTv: [
      'LG OLED C2', 'LG C3 WebOS', 'Samsung QLED', 'Samsung Tizen TV',
      '2022 Samsung TV', 'Hisense VIDAA TV', 'LG WebOS TV', 'Sony Bravia',
      'Philips Android TV', 'Samsung Crystal UHD',
    ],
    match: [
      'Champions League', 'Sunday Premier League', 'the weekend derby',
      'Europa League night', 'Saturday afternoon football', 'El Clasico',
      'the late kickoff', 'F1 qualifying',
    ],
    speed: ['25Mbps fiber', '50Mbps fiber', '100Mbps fiber', 'ethernet', '5GHz wifi', '80Mbps broadband', '300Mbps line'],
    duration: ['2 weeks', '3 weeks', 'a month', '6 weeks', '2 months', '3 months', '5 months', 'half a year'],
    minutes: ['3', '4', '5', '6', '7', '8', '9', '11'],
    channels: ['12k', '18k', '22k', '25k', '30k'],
    bouquet: ['UK Sky Sports', 'beIN Sports', 'TNT Sports', 'European sports', 'US & UK channels', 'international sports'],
  },
  fr: {
    device: [
      'Firestick 4K', 'Firestick 4K Max', 'Formuler Z11', 'Nvidia Shield',
      'Apple TV 4K', 'Mi Box S', 'Chromecast Google TV', 'box Android',
      'Nokia Streaming Box', 'TV Android Sony',
    ],
    smartTv: [
      'TV Samsung Tizen', 'LG OLED WebOS', 'LG C3', 'TV LG',
      'Hisense VIDAA', 'Samsung QLED', 'Sony Bravia', 'TV Samsung 2023',
    ],
    match: [
      'la Ligue des Champions', 'le Classique OM-PSG', 'les gros matchs du dimanche',
      'la Ligue 1', 'la soirée UCL', 'le derby', 'les matchs de Premier League',
    ],
    speed: ['la fibre 100M', 'fibre 300M', 'ADSL 20M', 'wifi 5GHz', 'câble ethernet', 'la fibre'],
    duration: ['2 semaines', '3 semaines', '1 mois', '2 mois', '3 mois', '4 mois', 'presque 6 mois'],
    minutes: ['3', '4', '5', '6', '7', '8', '10'],
    channels: ['12 000', '18 000', '22 000', '25 000', '30 000'],
    bouquet: ['Canal+ et beIN', 'la TNT française', 'RMC Sport et DAZN', 'les chaînes belges et FR', 'les bouquets sport FR'],
  },
  darija_latin: {
    device: [
      'Firestick 4K', 'Firestick Max', 'box Android', 'Mi Box S',
      'Formuler Z11', 'Google TV', 'Android TV', 'Apple TV 4K', 'Chromecast',
    ],
    smartTv: [
      'TV Samsung', 'LG WebOS', 'LG OLED', 'Hisense VIDAA',
      'Samsung QLED', 'Sony Bravia', 'TV LG 2023', 'Samsung 4K',
    ],
    match: [
      'Champions League', 'derby dyal l7ed', 'El Clasico', 'Premier League',
      'matchat dyal lweekend', 'Botola w UCL', 'Europa League', 'soiree Champions League',
    ],
    speed: ['fibre 20M', 'fibre 100M', 'fibre 200M', 'ADSL 12M', 'wifi 5G', 'cable ethernet'],
    duration: ['2 simanat', 'chi chher', '2 chhor', '3 chhor', '4 chhor', '6 chhor'],
    minutes: ['3', '4', '5', '6', '7', '8', '10'],
    channels: ['15k', '20k', '25k', '30k'],
    bouquet: ['beIN 4K w Canal+', 'l9anawat dyal lmaghrib w franca', 'beIN Sports', 'TNT franca w sport', 'les chaines arabes w FR'],
  },
  ar: {
    device: [
      'Firestick 4K', 'رسيفر أندرويد', 'Xiaomi Mi Box', 'Apple TV 4K',
      'Nvidia Shield', 'Chromecast 4K', 'Formuler Z11', 'شاشة أندرويد',
    ],
    smartTv: [
      'شاشة سامسونج', 'شاشة LG WebOS', 'شاشة LG OLED', 'شاشة سوني',
      'شاشة Hisense', 'شاشة سامسونج QLED',
    ],
    match: [
      'دوري أبطال أوروبا', 'الدوري الإنجليزي', 'الكلاسيكو', 'مباريات نهاية الأسبوع',
      'مباريات الأحد', 'دوري روشن والأبطال',
    ],
    speed: ['ألياف 50 ميغا', 'ألياف 100 ميغا', 'ألياف 200 ميغا', 'الواي فاي', 'كيبل إيثرنت'],
    duration: ['أسبوعين', '3 أسابيع', 'شهر', 'شهرين', '3 أشهر', '5 أشهر'],
    minutes: ['3', '4', '5', '6', '7', '8', '10'],
    channels: ['15 ألف', '20 ألف', '25 ألف', '30 ألف'],
    bouquet: ['قنوات beIN 4K', 'الباقة العربية والرياضية', 'القنوات الرياضية الأوروبية', 'قنوات SSC و beIN'],
  },
  es: {
    device: [
      'Firestick 4K', 'Firestick 4K Max', 'Formuler Z11', 'Android TV box',
      'Nvidia Shield', 'Apple TV 4K', 'Chromecast Google TV', 'Xiaomi Mi Box',
    ],
    smartTv: [
      'Samsung Tizen', 'LG OLED WebOS', 'TV LG 2023', 'Hisense VIDAA',
      'Sony Bravia', 'Samsung QLED', 'TV Samsung 4K',
    ],
    match: [
      'el Clásico', 'la Champions', 'LaLiga el domingo', 'los partidos del finde',
      'la jornada de Liga', 'la Europa League', 'la F1 y fútbol',
    ],
    speed: ['fibra 100Mb', 'fibra 300Mb', 'fibra 600Mb', 'wifi 5GHz', 'cable ethernet'],
    duration: ['2 semanas', '3 semanas', 'un mes', '2 meses', '4 meses', 'medio año'],
    minutes: ['3', '4', '5', '6', '7', '8', '10'],
    channels: ['15k', '20k', '25k', '30k'],
    bouquet: ['Movistar LaLiga y DAZN', 'fútbol y TDT', 'canales españoles y deportes', 'DAZN y Champions'],
  },
};

type StarKey = 5 | 4 | 3 | 2 | 1;

/**
 * Rich, grammatically self-contained sentence building blocks per:
 * Language -> CategoryDomain -> StarRating
 *
 * Combining 1, 2, or 3 sentences + localized tokens produces thousands of
 * completely natural, non-duplicate human reviews per language & category.
 *
 * Low-star (1★ and 2★) pools contain strictly benign technical/user friction
 * with ZERO scam, fraud, or undelivered-code accusations.
 */
export const SENTENCE_BANKS: Partial<
  Record<
    ReviewLanguage,
    Record<CategoryDomain, Record<StarKey, SentencePool>>
  >
> = {
  // =========================================================================
  // ENGLISH
  // =========================================================================
  en: {
    iptv: {
      5: {
        subjects: [
          'Works great', 'Solid server', 'Zero buffering', 'Very happy with it',
          'Fast code delivery', 'Great for football', 'Renewed again', 'Smooth on {device}',
          'No freeze during {match}', 'Clean 50fps streams', 'Worth the money', 'Steady so far',
        ],
        openers: [
          'Received the login in {minutes} minutes and set it up on my {device}.',
          'Been running {product} on {device} for {duration} with zero real issues.',
          'Tested this during {match} on {speed} and the stream did not stutter once.',
          'Switched to {product} after two unreliable sellers last year.',
          'Works smoothly on my {device} over {speed}.',
          'Second time renewing here and the server still feels rock solid.',
          'Set this up on the living room {device} in under five minutes.',
          'Got the code right before kickoff and watched the full game without a single drop.',
          'Picture quality on {bouquet} is crisp 1080p50 instead of blurry upscaled feeds.',
          'Cut my monthly satellite package after trying {product} for {duration}.',
        ],
        middles: [
          'Zapping between {bouquet} takes less than a second.',
          'The EPG loaded automatically without hunting for external XML links.',
          'Even during peak weekend traffic on {match}, playback stayed steady.',
          'Audio tracks switch cleanly when multiple commentaries are available.',
          'Channel folders are organized cleanly without thousands of dead links.',
          'My parents can navigate the channel list easily with the normal remote.',
          'VOD movies and series load quickly and cover most recent releases.',
          'Bitrates look genuinely high on a 65-inch screen.',
          'Didn’t even need to mess with buffer settings on {speed}.',
        ],
        closers: [
          'Definitely keeping this for the season.',
          'Easily the most reliable line I’ve used so far.',
          'Would happily buy again when this expires.',
          'Really good value for the whole year.',
          'No complaints at all.',
          'Recommended if you mainly care about live sports.',
          'Glad I made the switch.',
        ],
      },
      4: {
        subjects: [
          'Pretty good overall', 'Solid live TV', 'Good value', 'Works well on {device}',
          'Reliable sports feeds', 'Happy with live channels', '4 stars, small VOD delay',
        ],
        openers: [
          'Live channels on {product} work smoothly on my {device} over {speed}.',
          'Been using this for {duration} mostly for {bouquet}.',
          'Code arrived in {minutes} minutes and setup was straightforward.',
          'Good stability during {match} without annoying loops.',
          'Picture clarity is sharp and zapping feels snappy on {device}.',
        ],
        middles: [
          'Only knocking off a star because brand-new VOD films take a couple days to get synced subtitles.',
          'Had to apply a 1-hour EPG timezone offset in player settings, easy fix once done.',
          'Live sports sit roughly 25 seconds behind cable, so I just mute score alerts.',
          'A few smaller regional channels don’t have catch-up enabled yet.',
          'There are a lot of international folders so it helps to hide countries you don’t watch.',
        ],
        closers: [
          'Live server itself is 10/10 though.',
          'Still much better than what I used before.',
          'Great value for the price.',
          'Overall very satisfied.',
        ],
      },
      3: {
        subjects: [
          'Decent overall', 'Fine on fiber', 'Okay for the price', 'Works best on ethernet',
          'Mixed on 4G hotspot', 'Needs decent internet',
        ],
        openers: [
          'On home {speed} {product} runs fine on my {device}.',
          'Works well Monday through Saturday for regular TV and news.',
          'Activation was quick ({minutes} minutes) and picture looks clear.',
          'Used {product} for {duration} across two different rooms.',
        ],
        middles: [
          'During peak {match} I had a couple brief freezes and switched to the backup stream.',
          'When using a rural 4G hotspot on holiday, I had to raise the buffer to 3 seconds.',
          'Too many foreign categories by default until I built a favorites list.',
          'Works much better plugged into ethernet than over weak upstairs wifi.',
        ],
        closers: [
          'Usable once you dial in your player settings.',
          'Fair enough for what it costs.',
          'Decent backup line.',
        ],
      },
      2: {
        subjects: [
          'Needed a VPN on my ISP', 'Heavy for older boxes', 'Weak wifi struggles', 'ISP throttling issue',
        ],
        openers: [
          'Code activated fine on my {device}, but my broadband provider throttles streams during {match}.',
          'Tried running {product} on an older streaming stick over wifi.',
          'Live channels open fine on ethernet, though upstairs wifi kept dropping frames.',
        ],
        middles: [
          'Turning on a VPN cleared the weekend buffering, just didn’t want to pay for an extra app.',
          'The full VOD and channel catalog felt heavy on low-RAM hardware.',
          'Had to lower resolution to HD on slower connections to avoid looping.',
        ],
        closers: [
          'Make sure your ISP doesn’t block streams before committing.',
          'Better suited for newer devices and wired connections.',
        ],
      },
      1: {
        subjects: [
          'Old box couldn’t handle the list', 'ISP blocked without VPN', 'Not compatible with my 2018 box',
        ],
        openers: [
          'My older 1GB RAM Android box kept crashing whenever {product} tried loading the full catalog.',
          'Login worked right away, but my UK ISP blocks live matches after 8pm unless a VPN is running.',
          'Ended up sticking with standard cable because my rural connection couldn’t hold HD streams.',
        ],
        middles: [
          'Probably works fine on a newer {device}, just not suited for dated hardware.',
          'Didn’t feel like configuring a router VPN just to watch weekend football.',
        ],
        closers: [
          'Check your hardware RAM and ISP policy first.',
          'Just wasn’t the right fit for my setup.',
        ],
      },
    },
    m3u: {
      5: {
        subjects: [
          'Clean in TiviMate', 'Fast Xtream sync', 'Well-organized playlist', 'Great on Apple TV',
          'Zero parsing errors', 'Solid M3U list', 'Smooth multiscreen',
        ],
        openers: [
          'Dropped the Xtream credentials for {product} straight into TiviMate on my {device}.',
          'Imported the M3U link into UHF on Apple TV in about 12 seconds with zero errors.',
          'Been using {product} for {duration} across {device} on {speed}.',
          'Compared three M3U lists over a weekend and this one opened channels noticeably faster.',
          'Really clean channel grouping by country and resolution—no messy duplicates.',
        ],
        middles: [
          'All {channels} entries, logos, and 7-day EPG synced cleanly on the first refresh.',
          'Multiscreen split-view held two {match} feeds at once without dropping frames.',
          'Catch-up works reliably on {bouquet} and series seasons are neatly indexed.',
          'Headers parse cleanly in VLC and TiviMate without crashing device memory.',
          'Low latency to European servers keeps zapping under a second.',
        ],
        closers: [
          'Best organized playlist I’ve loaded this year.',
          'Saves hours compared to cleaning up bloated M3U files.',
          'Very happy with the setup.',
          'Will definitely renew.',
        ],
      },
      4: {
        subjects: ['Solid M3U', 'Good quality, big file', 'Clean live groups', 'Works well in TiviMate'],
        openers: [
          'Xtream login synced smoothly on my {device} in {minutes} minutes.',
          'Good 50fps streams across {bouquet} on {speed}.',
          'Series and live categories are well sorted in {product}.',
        ],
        middles: [
          'The full playlist is large, so hiding unused countries makes daily EPG refresh much quicker.',
          'A few older archive VOD movies were missing alternate SRT subtitle tracks.',
          'Live delay sits around 20–25 seconds behind satellite, pretty normal for M3U.',
        ],
        closers: [
          'Very dependable once you trim to your favorite groups.',
          'Solid choice for TiviMate users.',
        ],
      },
      3: {
        subjects: ['Heavy on Firestick Lite', 'Takes a moment to refresh', 'Okay once cached'],
        openers: [
          'Streams play smoothly once loaded on {speed}, though the full list is hefty.',
          'Loaded {product} on an older streaming stick and playlist refresh took ~25 seconds.',
        ],
        middles: [
          'Primary sports channels held up during {match}, while a couple backup links timed out.',
          'Using Xtream API worked much better than pasting the raw M3U_plus link.',
        ],
        closers: [
          'Decent once cached on newer hardware.',
          'Works fine if you trim unused VOD folders.',
        ],
      },
      2: {
        subjects: ['Raw M3U link timed out on TV', 'Use Xtream instead of raw URL'],
        openers: [
          'The raw M3U URL timed out on my TV app because of the massive VOD catalog.',
          'My older player struggled to parse all {channels} entries at once.',
        ],
        middles: [
          'Switching to Xtream Codes credentials fixed loading, just took some trial and error.',
        ],
        closers: ['Stick to Xtream login if your TV has low RAM.'],
      },
      1: {
        subjects: ['Too big for old TV memory', 'Needed a trimmed country list'],
        openers: [
          'Loaded fine in VLC on my laptop, but my 2018 smart TV ran out of RAM caching all the VOD posters.',
        ],
        middles: ['Only practical on a dedicated {device} rather than built-in older TV memory.'],
        closers: ['Check your device storage before loading unfiltered playlists.'],
      },
    },
    player: {
      5: {
        subjects: [
          'Activated in {minutes} min', 'Smooth on {smartTv}', 'Worth the license', 'Fast MAC unlock',
          'No more ads', 'Much faster than Smart IPTV', 'Verified on official site',
        ],
        openers: [
          'Sent my MAC and Device Key, rebooted my {smartTv} {minutes} minutes later, and the trial banner was gone.',
          'Upgraded from Smart IPTV on my {smartTv} and the speed jump is night and day.',
          'Was about to spend £55 on a streaming stick until I activated {product} on my {smartTv}.',
          'Verified my MAC status directly on the official player portal right after activation.',
          'Clean, fast player that actually handles {channels} channels without crashing my {smartTv}.',
          'Ordered {product} late in the evening and it still unlocked in {minutes} minutes flat.',
        ],
        middles: [
          'Uploading my playlist through the web portal took less than a minute.',
          'Native TV remote channel up/down and favorites work smoothly with zero lag.',
          'Dual audio switching and subtitle sync work cleanly on 4K HDR movies.',
          'No more annoying pop-up ads interrupting live TV, and the parental PIN locks folders properly.',
          'Playlist loads in ~4 seconds instead of freezing the TV memory.',
        ],
        closers: [
          'Easily worth a one-time license.',
          'Runs like a built-in TV app now.',
          'Highly recommend for smart TV owners.',
          'Zero issues since activating {duration} ago.',
        ],
      },
      4: {
        subjects: ['Quick activation', 'Clean UI on {smartTv}', 'Good media player', 'Smooth navigation'],
        openers: [
          'MAC activation for {product} went through in roughly {minutes} minutes on my {smartTv}.',
          'Slick interface that non-technical family members figured out right away.',
        ],
        middles: [
          'Only wish there were more options to customize home screen tiles.',
          'Took a minute to figure out the portal upload URL, smooth sailing after that.',
        ],
        closers: ['Great player overall.', 'Solid upgrade over free apps.'],
      },
      3: {
        subjects: ['Good app, slight wait', 'Activation only (no channels)', 'Works well once unlocked'],
        openers: [
          'App itself runs nicely on {smartTv}, though Friday evening activation took about 25 minutes.',
          'Fast interface once unlocked—just remember {product} is the player license only.',
        ],
        middles: ['Once active and paired with my playlist, channel zapping has been smooth.'],
        closers: ['Works as advertised.'],
      },
      2: {
        subjects: ['Needed full TV power cycle', 'Trial screen stuck until reboot'],
        openers: [
          'My {smartTv} kept showing the trial message after activation until I unplugged it from the wall for 30 seconds.',
        ],
        middles: ['After a hard power cycle the license showed active immediately.'],
        closers: ['Works fine now, just wish instructions mentioned unplugging the TV.'],
      },
      1: {
        subjects: ['My mistake: no channels included', 'Ordered player thinking it was a sub'],
        openers: [
          'My own fault—I ordered {product} thinking live channels came included rather than just the TV player license.',
        ],
        middles: ['The app itself unlocked cleanly on my {smartTv}, I just had to buy a playlist separately.'],
        closers: ['Read carefully before buying if you still need a channel list.'],
      },
    },
    panel: {
      5: {
        subjects: ['Credits added in {minutes} min', 'Great reseller panel', 'Zero failed activations'],
        openers: [
          'Credits showed up in my reseller dashboard within {minutes} minutes of ordering {product}.',
          'Activated 7 client Smart TVs over the weekend directly from my phone browser.',
        ],
        middles: [
          'Every Samsung Tizen and LG WebOS MAC unlocked on the first reboot with an accurate ledger.',
          'Instant dashboard activation saves tons of time during customer installs.',
        ],
        closers: ['Dependable portal for daily setups.', 'Zero customer callbacks so far.'],
      },
      4: {
        subjects: ['Fast API, solid portal', 'Reliable panel'],
        openers: ['Balance updated promptly and mobile dashboard is responsive on site.'],
        middles: ['Would love a slightly steeper discount tier when buying 50+ bulk credits.'],
        closers: ['Very useful tool for installers.'],
      },
      3: {
        subjects: ['Works well, login went to spam', 'Solid once logged in'],
        openers: ['Panel credits were accurate once I pulled the initial login email out of my spam folder.'],
        middles: ['MAC activations themselves process in under a minute.'],
        closers: ['Working fine now.'],
      },
      2: {
        subjects: ['Portal took a minute to learn', 'Basic mobile layout'],
        openers: ['Activation API works, though the sub-reseller permission menu took a while to figure out.'],
        middles: ['Desktop view is much easier to manage than phone screen.'],
        closers: ['Functional once set up.'],
      },
      1: {
        subjects: ['Ordered wrong panel brand first', 'Check player app before buying credits'],
        openers: ['Accidentally ordered credits for the wrong player brand compared to what my clients had installed.'],
        middles: ['Make sure you verify the exact app name on the TV store first.'],
        closers: ['Lesson learned on checking app versions.'],
      },
    },
    sharing: {
      5: {
        subjects: ['Astra 19.2E opens fast', 'Server 40 updated 1 year', 'Steady IKS decoding'],
        openers: [
          'Sent my 12-digit box serial number and expiry pushed forward 365 days within {minutes} minutes.',
          'Renewed {product} on my receiver—Canal+ and Movistar on Astra decrypted immediately.',
        ],
        middles: [
          'ECM response sits around 110ms with zero micro-freezes during {match}.',
          'No USB firmware flashing needed, just a quick box reboot.',
        ],
        closers: ['Far steadier than old CCcam lines.', 'Keeps my satellite box alive another year.'],
      },
      4: {
        subjects: ['Good IKS stability', 'Fast serial recharge'],
        openers: ['Serial updated quickly and French/Spanish packages opened right up.'],
        middles: ['Just keep dish signal above 80% for smooth decoding on Astra.'],
        closers: ['Great value renewal.'],
      },
      3: {
        subjects: ['Needed router + box reboot', 'Decent once synced'],
        openers: ['Had to restart both router and receiver before Server 40 displayed the new date.'],
        middles: ['Decoding has stayed steady since rebooting.'],
        closers: ['Works fine now.'],
      },
      2: {
        subjects: ['Sensitive to weak dish signal', 'Check dish alignment first'],
        openers: ['Had micro-freezes until I re-aligned my Astra dish above 82% quality.'],
        middles: ['Server itself stays connected when signal is strong.'],
        closers: ['Check LNB alignment before blaming the server.'],
      },
      1: {
        subjects: ['Box firmware was too old', 'Needed latest STB update first'],
        openers: ['My older receiver needed a firmware update before connecting properly to Server 40.'],
        middles: ['Once updated the serial showed valid, just took extra tinkering.'],
        closers: ['Verify box firmware compatibility first.'],
      },
    },
  },

  // =========================================================================
  // FRENCH
  // =========================================================================
  fr: {
    iptv: {
      5: {
        subjects: [
          'Nickel', 'Très stable', 'Zéro coupure', 'Code reçu vite', 'Top pour le foot',
          '2ème renouvellement', 'Fluide sur {device}', 'Parfait pendant {match}',
        ],
        openers: [
          'Code reçu en {minutes} minutes et installé direct sur mon {device}.',
          'J’utilise {product} depuis {duration} sur {device} avec {speed}, rien à signaler.',
          'Regardé {match} en entier sur {bouquet} sans la moindre coupure.',
          'Après deux serveurs qui plantaient le week-end, celui-ci tient vraiment la route.',
          'Installé dans le salon sur {device} en cinq minutes chrono.',
          'Déjà mon deuxième renouvellement ici et toujours aussi stable.',
          'Image ultra nette sur {bouquet}, vrai 50fps sans saccade.',
          'On a résilié notre vieux décodeur câble après avoir testé {product} pendant {duration}.',
        ],
        middles: [
          'Le zapping entre les chaînes prend moins d’une seconde.',
          'Le guide EPG s’est chargé tout seul sans bricoler de lien XML.',
          'Même le dimanche soir pendant {match}, aucun freeze à signaler.',
          'Les dossiers par pays sont propres et sans milliers de chaînes mortes.',
          'Même mes parents s’y retrouvent facilement avec la télécommande.',
          'La VOD est bien fournie en films récents et séries VF/VOSTFR.',
          'Le changement de piste audio fonctionne nickel sans faire planter le flux.',
        ],
        closers: [
          'Franchement je recommande.',
          'Très bon rapport qualité-prix pour l’année.',
          'Rien à redire pour le moment.',
          'Je reprendrai sans hésiter à l’échéance.',
          'Vraiment satisfait.',
        ],
      },
      4: {
        subjects: ['Bon serveur', 'Direct impeccable', 'Satisfait globalement', 'Bien sur {device}'],
        openers: [
          'Les chaînes en direct sur {product} tournent nickel sur mon {device}.',
          'Utilisé depuis {duration} sur {speed}, très bonne stabilité pendant {match}.',
          'Code reçu en {minutes} minutes, installation rapide.',
        ],
        middles: [
          'J’enlève une étoile car les films tout juste sortis mettent 2 à 3 jours pour les sous-titres FR.',
          'Il y a environ 25 secondes de décalage par rapport au satellite, normal en IPTV.',
          'Quelques petites chaînes régionales n’ont pas encore le replay activé.',
          'J’ai dû ajuster un décalage EPG d’une heure dans l’appli, ensuite parfait.',
        ],
        closers: [
          'Pour le live c’est du 10/10.',
          'Très bon choix dans l’ensemble.',
          'Bon rapport qualité-prix.',
        ],
      },
      3: {
        subjects: ['Bien sur fibre', 'Correct pour le prix', 'Moyen en 4G'],
        openers: [
          'À la maison sur {speed} {product} passe bien sur mon {device}.',
          'Nickel en semaine, quelques légers ralentissements lors des gros pics du dimanche.',
        ],
        middles: [
          'En vacances en partage 4G j’ai dû monter le buffer à 3 secondes pour éviter les coupures.',
          'Beaucoup de pays affichés au début, mieux vaut créer une liste de favoris.',
        ],
        closers: ['Correct une fois bien réglé.', 'Fait le job avec une bonne connexion.'],
      },
      2: {
        subjects: ['Besoin d’un VPN le week-end', 'Lourd sur vieille box'],
        openers: [
          'Mon opérateur bride les flux pendant {match}, ça coupait avant d’activer un VPN sur {device}.',
          'Sur une ancienne box Android en wifi faible, les flux 4K saccadaient.',
        ],
        middles: [
          'Avec un VPN ou un câble ethernet c’est stable, mais j’espérais m’en passer.',
        ],
        closers: ['Vérifiez si votre FAI bride le dimanche soir.'],
      },
      1: {
        subjects: ['Ancienne box trop juste en RAM', 'Matériel pas adapté'],
        openers: [
          'Ma vieille box 1 Go de RAM plantait au chargement de tout le catalogue {product}.',
          'Le code fonctionne mais mon FAI bloque sans VPN et je ne voulais pas en installer.',
        ],
        middles: ['Prévoir une box récente type {device} pour que ça tourne proprement.'],
        closers: ['Pas adapté à mon ancien matériel.'],
      },
    },
    m3u: {
      5: {
        subjects: ['Parfait sur TiviMate', 'Playlist propre', 'Rapide sur Apple TV', 'Xtream API nickel'],
        openers: [
          'Identifiants Xtream saisis dans TiviMate sur {device}, tout s’est synchronisé en 10 secondes.',
          'Importé dans UHF sur Apple TV 4K sans aucune erreur de chargement.',
          'Playlist {product} vraiment bien rangée par pays, fini les listes pleines de liens morts.',
          'Testé depuis {duration} sur {speed}, les flux {bouquet} sont fluides en 50fps.',
        ],
        middles: [
          'Le replay 48h fonctionne bien sur les principales chaînes françaises et sport.',
          'Les logos, séries et saisons s’affichent proprement avec les résumés.',
          'Le mode multi-écran sur {match} tient deux flux simultanés sans baisse de qualité.',
        ],
        closers: ['Clairement la liste la plus propre que j’aie testée.', 'Je recommande pour TiviMate.'],
      },
      4: {
        subjects: ['Bonne liste M3U', 'Qualité top, fichier lourd'],
        openers: ['Très bons flux FHD/4K sur {device} avec une latence faible.'],
        middles: [
          'La liste complète avec {channels} entrées est lourde, pensez à masquer les pays inutiles.',
          'Quelques vieux films VOD manquent encore de sous-titres FR.',
        ],
        closers: ['Très fiable une fois triée.'],
      },
      3: {
        subjects: ['Un peu lent à rafraîchir sur Firestick Lite', 'Correct une fois en cache'],
        openers: ['Une fois chargée sur {speed} la lecture est fluide, mais la mise à jour prend ~20 secondes sur vieux stick.'],
        middles: ['Passer par Xtream Codes marche bien mieux que le lien M3U brut.'],
        closers: ['Correct pour le tarif.'],
      },
      2: {
        subjects: ['Privilégier Xtream Codes', 'Lien M3U trop lourd sur ma TV'],
        openers: ['Le lien M3U brut faisait planter l’appli native de ma télé à cause de la VOD.'],
        middles: ['En passant sur la connexion Xtream API ça s’est chargé normalement.'],
        closers: ['Utilisez Xtream si votre télé a peu de mémoire.'],
      },
      1: {
        subjects: ['Trop lourd pour TV 2018', 'Mémoire TV insuffisante'],
        openers: ['Fonctionne sur VLC sur PC mais ma vieille télé sature en mémoire en chargeant toute la VOD.'],
        middles: ['Il faut un boîtier dédié type {device}.'],
        closers: ['Vérifiez la mémoire de votre télé avant.'],
      },
    },
    player: {
      5: {
        subjects: [
          'Activé en {minutes} min', 'Fluide sur {smartTv}', 'Fini les pubs',
          'Beaucoup mieux que Smart IPTV', 'Licence vérifiée', 'Top sur Smart TV',
        ],
        openers: [
          'MAC envoyée, redémarrage de ma {smartTv} {minutes} minutes plus tard et licence débloquée.',
          'Smart IPTV plantait tout le temps sur ma {smartTv}, avec {product} ça charge en 4 secondes.',
          'Ça m’a évité d’acheter un boîtier externe, tout tourne fluide directement sur {smartTv}.',
          'Statut de la licence vérifié directement sur le site officiel juste après l’achat.',
          'Activé en {minutes} minutes un soir de semaine, aucune prise de tête.',
        ],
        middles: [
          'Fini les bandeaux de pub qui coupent les films, et le code PIN parental fonctionne bien.',
          'La télécommande d’origine de la télé répond au quart de tour.',
          'Gère sans souci les playlists de {channels} chaînes et les flux 4K HDR.',
          'L’ajout de la playlist depuis le portail web prend une minute.',
        ],
        closers: ['Ça vaut largement son prix.', 'Super lecteur pour Smart TV.', 'Nickel depuis {duration}.'],
      },
      4: {
        subjects: ['Activation rapide', 'Interface propre', 'Bon lecteur'],
        openers: ['Licence activée en {minutes} minutes sur {smartTv}, menu moderne et clair.'],
        middles: ['J’aimerais juste pouvoir personnaliser un peu plus les tuiles de l’écran d’accueil.'],
        closers: ['Très bon lecteur dans l’ensemble.'],
      },
      3: {
        subjects: ['Bon lecteur, 25 min d’attente vendredi', 'Lecteur seul sans chaînes'],
        openers: ['Appli très fluide sur {smartTv}, juste 25 minutes d’attente un vendredi soir pour l’activation.'],
        middles: ['Bien penser que c’est uniquement la licence du lecteur, il faut sa propre playlist.'],
        closers: ['Tourne nickel depuis.'],
      },
      2: {
        subjects: ['Il a fallu débrancher la TV', 'Bandeau essai resté bloqué au début'],
        openers: ['La bannière d’essai restait affichée sur {smartTv} jusqu’à ce que je débranche la prise 30 secondes.'],
        middles: ['Après redémarrage électrique complet, licence active tout de suite.'],
        closers: ['Fonctionne maintenant.'],
      },
      1: {
        subjects: ['Erreur de ma part : pas de chaînes incluses', 'Confusion lecteur / abonnement'],
        openers: ['J’ai commandé {product} en pensant que les chaînes étaient incluses dedans.'],
        middles: ['La licence s’est bien activée sur {smartTv}, mais il faut un abonnement playlist à part.'],
        closers: ['Bien lire la description avant achat.'],
      },
    },
    panel: {
      5: {
        subjects: ['Crédits reçus en {minutes} min', 'Panel fiable', 'Idéal pour mes installs'],
        openers: ['Crédits ajoutés au tableau de bord en {minutes} minutes, activations Samsung/LG instantanées.'],
        middles: ['Interface mobile pratique chez les clients avec historique clair de chaque MAC.'],
        closers: ['Aucun retour client négatif.'],
      },
      4: {
        subjects: ['Bon panel revendeur', 'API rapide'],
        openers: ['Système fiable et crédits jamais perdus.'],
        middles: ['Un palier tarifaire pour 50+ crédits serait encore mieux.'],
        closers: ['Bon outil pro.'],
      },
      3: {
        subjects: ['Mail de connexion dans les spams', 'Fonctionne bien'],
        openers: ['Solde exact, pensez juste à vérifier les spams pour les identifiants du panel.'],
        middles: ['Une fois connecté, tout est fluide.'],
        closers: ['Fait le travail.'],
      },
      2: {
        subjects: ['Menu sous-revendeur un peu daté', 'Mieux sur PC'],
        openers: ['Les activations fonctionnent mais le menu de gestion est plus lisible sur ordinateur.'],
        middles: ['Prise en main un peu longue au début.'],
        closers: ['Ok une fois habitué.'],
      },
      1: {
        subjects: ['Mauvaise marque d’appli choisie', 'Vérifier l’appli client avant'],
        openers: ['Je me suis trompé de marque de lecteur par rapport à l’appli installée chez mes clients.'],
        middles: ['Bien vérifier le nom exact sur le store TV avant de recharger.'],
        closers: ['À vérifier avant commande.'],
      },
    },
    sharing: {
      5: {
        subjects: ['Astra 19.2E fluide', 'Serveur 40 prolongé 1 an', 'Recharge rapide'],
        openers: ['Numéro de série envoyé et date mise à jour pour 12 mois en {minutes} minutes.'],
        middles: ['Canal+ et Movistar décryptent sans micro-coupure pendant {match}.'],
        closers: ['Bien plus stable que les anciennes lignes CCcam.'],
      },
      4: {
        subjects: ['Bon serveur IKS', 'Simple sans flash USB'],
        openers: ['Renouvellement rapide sans rien flasher sur le récepteur.'],
        middles: ['Assurez-vous que le signal parabole dépasse 80%.'],
        closers: ['Très bon tarif.'],
      },
      3: {
        subjects: ['Redémarrage box + routeur nécessaire', 'Stable ensuite'],
        openers: ['Il a fallu redémarrer le routeur et le démodulateur pour voir la nouvelle date.'],
        middles: ['Depuis, les bouquets ouvrent normalement.'],
        closers: ['Correct.'],
      },
      2: {
        subjects: ['Sensible au signal parabole', 'Vérifier pointage Astra'],
        openers: ['Quelques coupures tant que ma parabole était sous 78% de signal.'],
        middles: ['Une fois réalignée, décryptage stable.'],
        closers: ['Contrôlez votre LNB avant.'],
      },
      1: {
        subjects: ['Mise à jour firmware requise', 'Ancien récepteur'],
        openers: ['Mon démodulateur avait un firmware trop vieux pour se connecter au serveur 40.'],
        middles: ['Après mise à jour du récepteur c’est passé, mais ça m’a pris du temps.'],
        closers: ['Vérifiez la version du récepteur avant.'],
      },
    },
  },

  // =========================================================================
  // DARIJA LATIN / ARABIZI (Moroccan / Maghreb)
  // =========================================================================
  darija_latin: {
    iptv: {
      5: {
        subjects: [
          'Nadi bzzaf', 'Top wallah', 'Serveur wa3er', 'Bla ta9ti3', 'Code wsel dghya',
          'Merra taniya', 'Khdam mzyan f {device}', 'Mzyan f {match}', 'Tbarkallah 3likom',
          'Qualite 4K zwina', 'Serveur thabet', 'Mrigel 10/10',
        ],
        openers: [
          'Code wselni f email f {minutes} d9ay9 w khdam direct f {device}.',
          'Hadi {duration} wana khdam b {product} f {device} b {speed}, makayn la freeze la walo.',
          'Tferejna f {match} kamel f {bouquet} bla 7ta coupure we7da.',
          'Sara7a knt jarabt ch7al men serveur 9bel w dima kayt9et3o f lweekend, hada nadi.',
          '3awedet jadedt 3am akhor, serveur ba9i thabet b7al nhar lwel.',
          'Chritou 15 d9i9a 9bel lmatch, wsel f {minutes} d9ay9 w t7el f blassa.',
          'Dertou lwalid f salon f {device}, sora safya w sahl f lkhdma.',
          'Khdam mzyan bzzaf f {device}, zapping khfif w makaytzegach ga3.',
          'Hennani men abonnements lghalyin, {bouquet} kamlin khdamin 50fps.',
        ],
        middles: [
          'Zapping bin l9anawat 9el men taniya w makaynch decalage dyal sawt.',
          'Ta3li9 arabi w francais bjoj khdamin mriglin f lmatchat.',
          'L9anawat dyal lmaghrib w franca w sport mretbin mzyan bla tkherbi9.',
          'EPG tchargat automatique bla ma nb9a nqeleb 3la fichier XML.',
          '7ta f wa9t {match} mli kaykon daght kbir, sora b9at 4K thabta.',
          'VOD fih l’aflam w les series jdad w kayt7elo dghya b {speed}.',
          'Lwalid kayqeleb b telecommande 3adi bla ma y3iyet liya kol merra.',
        ],
        closers: [
          'Allah y3tikom sa7a, kanse7 bih.',
          'A7sen serveur jarabt had l3am.',
          'Ghadi n3awed njeded m3akom inshallah.',
          'Taman mzyan bzzaf b nisba lqualite.',
          'Chokran bzzaf, kolchi mrigel.',
          'Wallah ma ndemt 3lih.',
        ],
      },
      4: {
        subjects: [
          'Mzyan bzzaf', 'Live nadi, VOD chwiya', 'Serveur mezyan', '4/5 top f direct',
          'Khdam mzyan f {device}',
        ],
        openers: [
          'Les chaines direct w {bouquet} khdamin 10/10 f {device} b {speed}.',
          'Hadi {duration} wana khdam b {product}, live nadi bla ta9ti3 f {match}.',
          'Code wsel f {minutes} d9ay9 w kolchi t7el dghya.',
        ],
        middles: [
          '3tit 4 nejmat ghir 7it l’aflam jdad kayakhdo youmayn bach ynzlo b tarjama arabiya/franca.',
          'Kayn wa7ed 20 secondes dyal decalage 3la parabole f lmatchat, 3adi f IPTV.',
          'Chi 9anawat sghar mafihomch catch-up, walakin l’asasiyin kamlin khdamin.',
          'Fih bzzaf dyal dowal, men l’a7san tdir liste favoris bach tsehel 3lik.',
        ],
        closers: [
          'Direct top sara7a.',
          'B nisba ltaman rah wa3er.',
          'Radi bzzaf b lkhdma dyalou.',
        ],
      },
      3: {
        subjects: ['Mzyan f fibre, f 4G chwiya', 'Moyen f l7ed b lil', 'Khass connexion thabta'],
        openers: [
          'F dar b {speed} {product} khdam mrigel f {device}.',
          'F simana kamla mzyan, ghir l7ed b lil wa9t {match} w9a3 wahd lfreeze khfif.',
        ],
        middles: [
          'Mli dit {device} lsafer b partage 4G kan khassni nzid buffer l 3 secondes bach mayb9ach ydor.',
          'Bedelt l backup channel w daz lmatch normal bla mouchkil.',
          'F wifi b3id kayt9el chwiya f 4K, b cable ethernet kaykhdem 7sen.',
        ],
        closers: [
          'Mzyan ila 3endek fibre thabta.',
          'Ma bihch b nisba ltaman.',
        ],
      },
      2: {
        subjects: ['Khassou cable ethernet', 'F box 9dim t9il chwiya', 'Wifi d3if kayt9ete3'],
        openers: [
          'F salon b cable khdam mzyan, walakin f bit n3as b wifi b3id b9a kay3awed ychargi f 4K.',
          'Lbox Android dyali l9dim kan kayt9el mli kayt7el lcatalogue kamil dyal {product}.',
        ],
        middles: [
          'Mli khbit dowal li makantferejch fihom w deret HD blasset 4K wela 7sen chwiya.',
          'Operateur dyali kaydir bridage f {match}, khassou VPN bach ythbet.',
        ],
        closers: ['Khass connexion mzyana w box jdid chwiya.'],
      },
      1: {
        subjects: ['Box dyali 9dim ma9derch ychargih', '1GB RAM makafyach'],
        openers: [
          'Lcode khdam mzyan walakin lbox Android dyali dyal 2018 fih ghir 1GB RAM kaytkhneq mli kayt7el lcatalogue kamil.',
          'Connexion ADSL 3andi d3ifa bzzaf (4M) ma9dratch tkhdem 4K w FHD bla ta9ti3.',
        ],
        middles: ['Khass box jdid b7al {device} ola connexion fibre bach ykhdem nadi.'],
        closers: ['T2akdo men box dyalkom w debit 9bel ma tachriw.'],
      },
    },
    m3u: {
      5: {
        subjects: ['Nadi f TiviMate', 'Playlist n9iya', 'Khfifa f {device}', 'Xtream khdam top'],
        openers: [
          'Dakhelt Xtream dyal {product} f TiviMate f {device}, tchargat f 10 secondes.',
          'Playlist n9iya bzzaf, makaynch dak tkherbi9 dyal 80 alf 9anat maytin.',
          'Khdam biha f Apple TV (UHF) hadi {duration} b {speed}, kolchi mreteb.',
          'Dowal mretbin mzyan w {bouquet} kamlin f 50fps nadin.',
        ],
        middles: [
          'EPG w logos w les series b les posters t7elo automatique.',
          'Multiscreen f TiviMate khdem liya joj matchat f nefs lwa9t bla freeze.',
          'Zapping sri3 bzzaf w catch-up khdam f l9anawat lkbira.',
        ],
        closers: ['A7sen M3U jarabt had l3am.', 'Merci bzzaf, liste professionnelle.'],
      },
      4: {
        subjects: ['Qualite zwina mais lista kbira', 'Mzyana f TiviMate'],
        openers: ['Les chaines sport w VOD nadin f {device}.'],
        middles: [
          '7it fiha {channels} 9anat w VOD bzzaf, men l’a7san tkhbi dowal li makatferejch fihom.',
          'Chi aflam 9dam mafihomch sous-titres FR, walakin jdad kamlin kaynin.',
        ],
        closers: ['Mzyana bzzaf mli katretbha.'],
      },
      3: {
        subjects: ['Katakhod 20s f Firestick 9dim', 'Mzyana mli katchargi'],
        openers: ['Mli kat7el katkhdem mzyan b {speed}, ghir mise a jour katakhod 20 secondes f Firestick Lite.'],
        middles: ['Xtream API khfif 7sen men lien M3U twil.'],
        closers: ['Mezyana f box jdid.'],
      },
      2: {
        subjects: ['Khedmo b Xtream machi M3U', 'Lien M3U t9il 3la tele'],
        openers: ['Lien M3U t9il 3la tele dyali w kan kaybloqui f chargement.'],
        middles: ['Mli bedelt l Xtream Codes t7elat 3adi bla mouchkil.'],
        closers: ['Nasi7a: khedmo dima b Xtream.'],
      },
      1: {
        subjects: ['Tele 2018 mafihach espace', 'Memoire tele 3amra'],
        openers: ['F PC VLC t7elat 3adi walakin tele dyali 9dima 3mrat liha memoire b VOD.'],
        middles: ['Khassha {device} bo7dou bach tchargi kolchi.'],
        closers: ['Chofo memoire dyal tele 9bel.'],
      },
    },
    player: {
      5: {
        subjects: [
          'Tactivat f {minutes} d9ay9', 'Khfif 7sen men Smart IPTV', 'Hennani men chra dyal box',
          'Top f {smartTv}', 'Activation sri3a', 'Bla pub w khfif',
        ],
        openers: [
          'Sift MAC w Device Key, redemarit {smartTv} mora {minutes} d9ay9 w t7elat f blassa.',
          'Knt ghadi nechri Firestick 7it apps lfabour kaybloqiw f {smartTv}, {product} hennani.',
          'Smart IPTV kan dima kayplanti f {smartTv}, hada kaychargi {channels} 9anat f 4 secondes.',
          'T2akedt men site officiel dyal l’app mora {minutes} d9ay9 w l9itha active mrigla.',
          'Activit {product} f {smartTv} b lil w t7elat dghya bla ma ntsenna 7ta sba7.',
        ],
        middles: [
          'Daba kankhdem ghir b telecommande dyal tele bo7dha, bla joj telecommandes.',
          'Makaynch les pubs li kay9et3o lfilm, w code parental khdam mzyan.',
          'Katbedel sawt w tarjama f 4K bla ma yw9ef lvideo.',
          'T7et playlist f site dyalhom f d9i9a we7da w kolchi ban b les logos.',
        ],
        closers: ['Tstahel tamanha 100%.', 'Chokran 3la sor3a.', 'Khdama top hadi {duration}.'],
      },
      4: {
        subjects: ['Activation sri3a w interface zwina', 'Lecteur mzyan f {smartTv}'],
        openers: ['Tactivat f {minutes} d9ay9 f {smartTv}, menu zwin w sahl l3a2ila kamla.'],
        middles: ['Knt nbghi ghir n9der nbedel tartib dyal screen principal chwiya.'],
        closers: ['Lecteur wa3er bzzaf.'],
      },
      3: {
        subjects: ['App zwina, t3etlat 25 min', 'Activation bo7dha bla 9anawat'],
        openers: ['L’application khfifa f {smartTv}, ghir nhar ljem3a b lil activation khdat 25 d9i9a.'],
        middles: ['Bghit ghir nfaker nas belli hadi ghir activation dyal lecteur, khassk playlist bo7dha.'],
        closers: ['Daba khdama mrigla.'],
      },
      2: {
        subjects: ['Kan khassni n7eyed prise dyal tele', 'Trial b9at katban f lwel'],
        openers: ['B9at katban trial f {smartTv} 7ta 7eyedt prise dyal do 30 secondes w rja3tha.'],
        middles: ['Mora redemarrage kamel banet active f blassa.'],
        closers: ['Khdama daba bla mouchkil.'],
      },
      1: {
        subjects: ['Ghalat dyali 7sabli fiha les chaines', 'Ma reditch lbal'],
        openers: ['Ghalat dyali chrit {product} 7sabli m3aha 9anawat, sa3a hadi ghir activation dyal l’app.'],
        middles: ['L’app tactivat mzyan f {smartTv}, ghir khassni nechri playlist bo7dha.'],
        closers: ['9raw mzyan 9bel ma tachriw.'],
      },
    },
    panel: {
      5: {
        subjects: ['Credits weslo f {minutes} d9ay9', 'Panel khfif f tilifon', 'Top l’installateurs'],
        openers: ['Credits tzado f panel f {minutes} d9ay9, activit 6 TVs Samsung w LG f weekend we7da.'],
        middles: ['Historique dyal kol MAC bayen w 7ta credit ma da3.'],
        closers: ['Mzyan bzzaf lkhdma m3a les clients.'],
      },
      4: {
        subjects: ['Panel mzyan w sri3', 'Khdam mrigel'],
        openers: ['Dashboard khfif f 4G mli kankon 3end client.'],
        middles: ['Kon kan prix mzyan kter f pack 50 credits ykon a7sen.'],
        closers: ['Mzyan bzzaf.'],
      },
      3: {
        subjects: ['Email dyal panel mcha lspam', 'Khdam mzyan'],
        openers: ['Solde exact, ghir 9elbo f spam bach tl9aw login dyal panel.'],
        middles: ['Mli dkhelt kolchi khdam mrigel.'],
        closers: ['Mezyan.'],
      },
      2: {
        subjects: ['Panel 7sen f PC', 'Menu chwiya 9dim'],
        openers: ['Activations khdamin walakin dashboard sahl f PC kter men tilifon.'],
        middles: ['Khda liya chwiya dyal lwa9t bach nfhem sous-revendeurs.'],
        closers: ['Khdam mzyan f l’akhir.'],
      },
      1: {
        subjects: ['Ghelet f smiyet l’app', 'T2akdo men l’app 9bel'],
        openers: ['Chrit credits dyal app akhra machi li 3end les clients dyali.'],
        middles: ['Chofo smiya exact f store dyal tele 9bel ma tachriw.'],
        closers: ['Ghalat dyali.'],
      },
    },
    sharing: {
      5: {
        subjects: ['Astra w Hotbird t7elo dghya', 'Serveur 40 tzad 3am', 'Bla ta9ti3'],
        openers: ['Sift numero de serie w mora {minutes} d9ay9 redemarit recepteur tzad 3am f serveur 40.'],
        middles: ['Canal+ w Movistar w DAZN f Astra khdamin bla micro-freeze f {match}.'],
        closers: ['7sen b bzzaf men CCcam.'],
      },
      4: {
        subjects: ['IKS thabet', 'Recharge sri3a'],
        openers: ['T3emer serial f {minutes} d9ay9 bla flash USB.'],
        middles: ['Ghir khass signal parabole ykon fo9 80%.'],
        closers: ['Taman mzyan.'],
      },
      3: {
        subjects: ['Khass redemarrage routeur w box', 'Khdam daba'],
        openers: ['Redemarit routeur w recepteur 3ad bant date jdida f serveur 40.'],
        middles: ['Daba l9anawat kayt7elo normal.'],
        closers: ['Mezyan.'],
      },
      2: {
        subjects: ['Khass parabole mrigla', 'Signal kan d3if 3andi'],
        openers: ['Kan kayt9ete3 7it signal Astra 3andi kan ghir 74%, mli rigelt parabole thbet.'],
        middles: ['Serveur mzyan mli kaykon signal 9wi.'],
        closers: ['Riglo parabole 9bel.'],
      },
      1: {
        subjects: ['Recepteur kan khassou mise a jour', 'Firmware 9dim'],
        openers: ['Recepteur dyali kan fih firmware 9dim ma bghach yconnecti l serveur 40 f lwel.'],
        middles: ['Mli dert mise a jour 3ad khdam.'],
        closers: ['Chofo version dyal recepteur.'],
      },
    },
  },

  // =========================================================================
  // ARABIC SCRIPT (ar)
  // =========================================================================
  ar: {
    iptv: {
      5: {
        subjects: [
          'ممتاز وسريع', 'سيرفر ثابت جدا', 'بدون تقطيع وقت المباريات', 'تجربة رائعة',
          'ثبات عالي على {device}', 'تجديد للسنة الثانية', 'جودة 4K ممتازة',
        ],
        openers: [
          'وصلني الكود خلال {minutes} دقائق واشتغل فورا على {device}.',
          'أستخدم {product} منذ {duration} على {device} مع {speed} بدون أي مشاكل.',
          'تابعت {match} بالكامل على {bouquet} بثبات ممتاز وبدون تقطيع.',
          'هذا ثاني تجديد لي معكم والسيرفر ما زال بنفس الجودة والسرعة.',
          'جربت اشتراكات كثيرة قبل هذا وكان التقطيع مزعجا، أما {product} فمختلف تماما.',
          'الصورة واضحة جدا وجودة {bouquet} حقيقية 50 إطار بالثانية.',
        ],
        middles: [
          'التنقل بين القنوات سريع جدا ولا يوجد تأخير في الصوت.',
          'ترتيب القنوات العربية والرياضية سهل جدا حتى للعائلة والوالدين.',
          'دليل القنوات EPG اشتغل تلقائيا بدون أي إعدادات إضافية.',
          'مكتبة الأفلام والمسلسلات محدثة وتعمل بسلاسة على {speed}.',
          'تبديل المعلقين يعمل بشكل سليم وقت {match}.',
        ],
        closers: [
          'أنصح به بشدة لمن يبحث عن الثبات.',
          'يستحق سعره بالكامل.',
          'شكرا على سرعة التفعيل.',
          'ممتاز جدا ولا توجد أي ملاحظات.',
        ],
      },
      4: {
        subjects: ['القنوات المباشرة ممتازة', 'سيرفر جيد جدا', 'قيمة ممتازة مقابل السعر'],
        openers: [
          'البث المباشر و{bouquet} يعمل بثبات عالي على {device}.',
          'أستخدم {product} منذ {duration} وأغلب القنوات تعمل بجودة رائعة.',
        ],
        middles: [
          'فقط الأفلام الجديدة أحيانا تحتاج يومين لإضافة الترجمة العربية المتزامنة.',
          'هناك تأخير بسيط حوالي 25 ثانية مقارنة بالستلايت وهو أمر طبيعي في IPTV.',
          'بعض القنوات الفرعية لا تدعم الإعادة بعد، لكن القنوات الرئيسية كلها تعمل.',
        ],
        closers: ['بشكل عام تجربة ممتازة.', 'راضٍ جدا عن البث المباشر.'],
      },
      3: {
        subjects: ['ممتاز على الألياف فقط', 'جيد مع إنترنت قوي', 'مقبول وقت الذروة'],
        openers: [
          'في البيت على {speed} يعمل {product} بسلاسة على {device}.',
          'ممتاز طوال الأسبوع، فقط وقت الذروة في {match} حصل توقف خفيف وانتقلت للقناة الاحتياطية.',
        ],
        middles: [
          'على شبكة الجوال 4G احتجت لرفع البافر إلى 3 ثواني لتجنب التوقف.',
          'عدد الباقات كبير جدا في البداية حتى قمت بعمل قائمة مفضلة.',
        ],
        closers: ['جيد إذا كانت سرعة الإنترنت مستقرة.'],
      },
      2: {
        subjects: ['يحتاج VPN مع مزود الإنترنت عندي', 'ثقيل على الأجهزة القديمة'],
        openers: [
          'مزود الإنترنت عندي يضغط سرعة البث وقت {match} ولم يستقر إلا بعد تشغيل VPN على {device}.',
          'على الواي فاي البعيد كانت قنوات 4K تقطع، ومع الكيبل أصبحت أفضل.',
        ],
        middles: ['يعمل بشكل جيد مع VPN لكن كنت أفضل عدم الحاجة لتطبيق إضافي.'],
        closers: ['تأكد من أن مزود الإنترنت لا يقيد البث.'],
      },
      1: {
        subjects: ['الجهاز القديم لم يتحمل حجم القائمة', 'الذاكرة عندي غير كافية'],
        openers: [
          'الكود يعمل بشكل صحيح لكن جهاز الأندرويد القديم عندي بذاكرة 1 جيجا يغلق التطبيق مع كثرة القنوات.',
        ],
        middles: ['يحتاج جهاز حديث مثل {device} ليعمل بدون مشاكل.'],
        closers: ['تأكد من مواصفات جهازك قبل الاشتراك.'],
      },
    },
    m3u: {
      5: {
        subjects: ['مرتب على TiviMate', 'قائمة نظيفة وسريعة', 'ممتاز على Apple TV'],
        openers: [
          'أضفت بيانات Xtream لـ {product} في TiviMate على {device} واشتغلت القنوات فورا.',
          'القائمة منظمة جدا حسب الدول والجودة بدون قنوات معطلة.',
          'يعمل معي منذ {duration} على {speed} وسرعة فتح القنوات ممتازة.',
        ],
        middles: [
          'دليل البرامج EPG والشعارات والمسلسلات ظهرت بشكل مرتب تلقائيا.',
          'المشاهدة المتعددة Multiscreen اشتغلت على مباراتين في نفس الوقت بدون تقطيع.',
        ],
        closers: ['أفضل قائمة M3U جربتها.', 'أنصح بها لمستخدمي TiviMate.'],
      },
      4: {
        subjects: ['جودة عالية وحجم كبير', 'قائمة ممتازة للرياضة'],
        openers: ['جودة {bouquet} ممتازة بـ 50fps على {device}.'],
        middles: ['بسبب وجود {channels} قناة وفيلم، يفضل إخفاء الدول غير المطلوبة لتسريع التحديث.'],
        closers: ['ممتازة جدا بعد التخصيص.'],
      },
      3: {
        subjects: ['التحديث يأخذ وقت على Firestick قديم', 'جيدة بعد التحميل'],
        openers: ['البث ممتاز بعد التحميل، فقط تحديث القائمة الكاملة يأخذ 20 ثانية على الأجهزة الاقتصادية.'],
        middles: ['استخدام Xtream أسرع بكثير من رابط M3U المباشر.'],
        closers: ['جيدة للاستخدام اليومي.'],
      },
      2: {
        subjects: ['استخدم Xtream بدل رابط M3U', 'الرابط المباشر ثقيل على الشاشة'],
        openers: ['رابط M3U المباشر كان ثقيلا على تطبيق الشاشة، وبعد التحويل لـ Xtream اشتغلت القائمة.'],
        middles: ['حجم مكتبة الأفلام كبير على الشاشات القديمة.'],
        closers: ['يفضل دائما الدخول عبر Xtream.'],
      },
      1: {
        subjects: ['الشاشة القديمة لا تكفي ذاكرتها', 'تحتاج جهاز خارجي'],
        openers: ['اشتغلت القائمة على الكمبيوتر بـ VLC لكن ذاكرة شاشتي القديمة امتلأت بسبب صور الأفلام.'],
        middles: ['تحتاج رسيفر خارجي مثل {device}.'],
        closers: ['تأكد من مساحة جهازك أولا.'],
      },
    },
    player: {
      5: {
        subjects: ['تفعيل خلال {minutes} دقائق', 'أفضل مشغل للشاشات الذكية', 'سريع وبدون إعلانات'],
        openers: [
          'أرسلت عنوان الـ MAC وأعدت تشغيل {smartTv} بعد {minutes} دقائق وفتح التطبيق مباشرة.',
          'كان التطبيق القديم يعلق على {smartTv}، أما {product} فيفتح {channels} قناة في ثوانٍ.',
          'وفرت شراء جهاز خارجي لأن التطبيق يعمل بسلاسة بالريموت الأصلي على {smartTv}.',
          'تأكدت من تفعيل الرخصة مباشرة في الموقع الرسمي للتطبيق.',
        ],
        middles: [
          'التبديل بين اللغات والترجمة يعمل بدون تعليق وبلا إعلانات مزعجة.',
          'رفع القائمة من الموقع الرسمي أخذ دقيقة واحدة فقط.',
          'القفل الأبوي للمجلدات يعمل بشكل ممتاز.',
        ],
        closers: ['أفضل استثمار للشاشة الذكية.', 'يعمل معي بامتياز منذ {duration}.'],
      },
      4: {
        subjects: ['واجهة جميلة وتفعيل سريع', 'مشغل ممتاز'],
        openers: ['تم التفعيل في {minutes} دقائق على {smartTv} والواجهة سهلة للعائلة.'],
        middles: ['أتمنى فقط إضافة خيار تخصيص أكثر للشاشة الرئيسية.'],
        closers: ['تجربة ممتازة جدا.'],
      },
      3: {
        subjects: ['تطبيق ممتاز، انتظرنا 25 دقيقة', 'تفعيل للمشغل فقط بدون قنوات'],
        openers: ['المشغل سلس جدا على {smartTv}، فقط التفعيل مساء الجمعة أخذ حوالي 25 دقيقة.'],
        middles: ['للتوضيح هذا تفعيل للتطبيق فقط وتحتاج لإضافة قائمتك الخاصة.'],
        closers: ['يعمل ممتازا الآن.'],
      },
      2: {
        subjects: ['احتجت لفصل الشاشة من الكهرباء', 'ظهرت الرخصة بعد إعادة التشغيل'],
        openers: ['بقيت رسالة التجربة ظاهرة على {smartTv} حتى فصلت سلك الكهرباء 30 ثانية ثم أعدت تشغيلها.'],
        middles: ['بعد ذلك ظهرت الرخصة مفعلة فورا.'],
        closers: ['يعمل بشكل طبيعي الآن.'],
      },
      1: {
        subjects: ['خطأ مني ظننت أنه يشمل القنوات', 'تفعيل مشغل فقط'],
        openers: ['لم أنتبه أن {product} تفعيل للمشغل فقط بدون اشتراك قنوات.'],
        middles: ['التطبيق تفعل بشكل سليم على {smartTv} وسأقوم بشراء قائمة قنوات منفصلة.'],
        closers: ['اقرأ الوصف جيدا قبل الطلب.'],
      },
    },
    panel: {
      5: {
        subjects: ['إضافة الرصيد خلال {minutes} دقائق', 'لوحة موزعين ممتازة'],
        openers: ['تمت إضافة الرصيد خلال {minutes} دقائق وفعلت 5 شاشات سامسونج و LG بدون أي خطأ.'],
        middles: ['سجل التفعيلات دقيق ويعمل بسلاسة من الجوال.'],
        closers: ['ممتاز للعمل اليومي.'],
      },
      4: {
        subjects: ['لوحة سريعة ومستقرة', 'ممتاز للموزعين'],
        openers: ['تفعيل فوري ولم يضيع أي رصيد.'],
        middles: ['نتمنى خصم أكبر لباقات 50 رصيد فأكثر.'],
        closers: ['أداة ممتازة.'],
      },
      3: {
        subjects: ['رسالة الدخول وصلت للبريد العشوائي', 'يعمل بشكل جيد'],
        openers: ['الرصيد صحيح تماما، فقط تفقد مجلد السبام لبيانات الدخول.'],
        middles: ['التفعيلات نفسها فورية.'],
        closers: ['جيد جدا.'],
      },
      2: {
        subjects: ['أفضل على الكمبيوتر من الجوال', 'واجهة بسيطة'],
        openers: ['اللوحة تعمل جيدا لكن إدارة الموزعين الفرعيين أسهل من الكمبيوتر.'],
        middles: ['تحتاج بضع دقائق للاعتياد على القوائم.'],
        closers: ['تؤدي الغرض.'],
      },
      1: {
        subjects: ['اخترت رصيد تطبيق مختلف بالخطأ', 'تأكد من اسم التطبيق'],
        openers: ['طلبت رصيد تطبيق مختلف عن الموجود لدى عملائي بالخطأ.'],
        middles: ['تأكد من اسم المشغل الدقيق قبل شحن الرصيد.'],
        closers: ['خطأ شخصي.'],
      },
    },
    sharing: {
      5: {
        subjects: ['تجديد فوري على السيرفر 40', 'ثبات ممتاز على أسترا'],
        openers: ['أرسلت السيريال وخلال {minutes} دقائق تم تمديد الصلاحية سنة كاملة.'],
        middles: ['القنوات الأوروبية على أسترا وهوتبيرد تفتح بسرعة وبدون تقطيع وقت {match}.'],
        closers: ['أفضل بكثير من سيسكام القديم.'],
      },
      4: {
        subjects: ['ثبات ممتاز للسعر', 'شحن سريع بدون فلاش'],
        openers: ['تجديد سريع بدون الحاجة لتحديث عبر USB.'],
        middles: ['فقط حافظ على إشارة الطبق فوق 80%.'],
        closers: ['تجديد موفق.'],
      },
      3: {
        subjects: ['احتاج إعادة تشغيل الراوتر والرسيفر', 'يعمل الآن جيدا'],
        openers: ['بعد إعادة تشغيل الراوتر والرسيفر معا ظهر التاريخ الجديد فورا.'],
        middles: ['الفتح مستقر منذ ذلك الحين.'],
        closers: ['جيد.'],
      },
      2: {
        subjects: ['يحتاج إشارة صحن قوية', 'اضبط الطبق أولا'],
        openers: ['كان هناك تقطيع بسيط حتى رفعت إشارة أسترا فوق 82%.'],
        middles: ['بعد ضبط الإشارة استقرت القنوات.'],
        closers: ['تأكد من الإشارة أولا.'],
      },
      1: {
        subjects: ['الرسيفر احتاج تحديث سوفتوير', 'نسخة قديمة'],
        openers: ['جهازي القديم احتاج تحديث سوفتوير قبل الاتصال بالسيرفر 40.'],
        middles: ['بعد التحديث اشتغل السيريال بشكل طبيعي.'],
        closers: ['تأكد من تحديث جهازك أولا.'],
      },
    },
  },

  // =========================================================================
  // SPANISH (es)
  // =========================================================================
  es: {
    iptv: {
      5: {
        subjects: [
          'Va perfecto', 'Cero cortes en {match}', 'Muy estable', 'Código rápido',
          'Genial en {device}', 'Segunda renovación', 'Calidad 50fps real',
        ],
        openers: [
          'Recibí el código en {minutes} minutos y lo configuré en mi {device} sin complicaciones.',
          'Llevo {duration} usando {product} en {device} con {speed} y va como un tiro.',
          'Vimos {match} completo en {bouquet} sin un solo corte ni pixelación.',
          'Después de probar dos servidores malos el año pasado, por fin uno que aguanta el finde.',
          'Instalado en el salón en un {device} y toda la familia encantada.',
          'Imagen muy nítida en {bouquet}, se nota que son 50fps de verdad.',
        ],
        middles: [
          'El zapping entre canales tarda menos de un segundo.',
          'La guía EPG se cargó sola sin andar buscando enlaces XML.',
          'Las carpetas vienen bien ordenadas y sin miles de canales caídos.',
          'El cambio de pista de audio y subtítulos funciona sin colgar la app.',
          'El catálogo de VOD tiene casi todos los estrenos recientes en castellano.',
        ],
        closers: [
          'Totalmente recomendable.',
          'Muy buena relación calidad-precio para todo el año.',
          'Volveré a renovar cuando caduque.',
          'Ni una queja hasta ahora.',
        ],
      },
      4: {
        subjects: ['Muy estable en directo', 'Buen servicio', 'Bien en {device}', '4 estrellas por el VOD'],
        openers: [
          'Los canales en directo de {product} van de lujo en mi {device}.',
          'Lo llevo usando {duration} sobre todo para {bouquet} con {speed}.',
        ],
        middles: [
          'Solo quito una estrella porque los estrenos nuevos en VOD tardan 2 días en tener audio castellano.',
          'El fútbol lleva unos 25 segundos de retardo respecto al satélite, algo normal en IPTV.',
          'Conviene ocultar países que no ves para tener los favoritos más a mano.',
        ],
        closers: ['En directo es de 10.', 'Muy buena compra en general.'],
      },
      3: {
        subjects: ['Bien con fibra, justo en 4G', 'Correcto por el precio', 'Mejor con cable'],
        openers: [
          'En casa con {speed} va fino en {device}.',
          'Entre semana perfecto, algún microcorte puntual el domingo en {match} que arreglé pasando al canal backup.',
        ],
        middles: [
          'Compartiendo datos 4G de viaje tuve que subir el buffer a 3 segundos.',
          'Funciona mucho más estable con ethernet que con wifi lejano.',
        ],
        closers: ['Cumple bien con buena conexión.'],
      },
      2: {
        subjects: ['Necesita VPN los domingos con mi operadora', 'Pesado en stick antiguo'],
        openers: [
          'Mi operadora bloquea las IPs durante {match} así que tuve que poner VPN en el {device}.',
          'En un stick antiguo por wifi le costaba mover los canales 4K.',
        ],
        middles: ['Con VPN va sin cortes, solo que prefería no tener que activar nada extra.'],
        closers: ['Comprueba si tu operadora bloquea fútbol antes.'],
      },
      1: {
        subjects: ['Mi box viejo de 1GB RAM se cerraba', 'Hardware demasiado antiguo'],
        openers: [
          'El código funciona, pero mi TV box de 2018 con 1GB de RAM se cerraba al cargar todo el catálogo.',
        ],
        middles: ['Necesita un {device} más actual para mover tantos canales y VOD.'],
        closers: ['Revisad la memoria del dispositivo antes.'],
      },
    },
    m3u: {
      5: {
        subjects: ['Perfecto en TiviMate', 'Lista M3U muy limpia', 'Rápido en Apple TV', 'Xtream sin errores'],
        openers: [
          'Metí las credenciales Xtream de {product} en TiviMate en mi {device} y sincronizó en segundos.',
          'Importada en UHF en Apple TV 4K sin un solo error de sintaxis.',
          'Por fin una lista M3U ordenada por países y calidades sin basura ni enlaces muertos.',
          'Probada {duration} con {speed}, los canales de {bouquet} van finísimos en 50fps.',
        ],
        middles: [
          'Los logos, la EPG de 7 días y las series con carátulas cargan automáticamente.',
          'Con pantalla dividida en TiviMate aguanta dos partidos de {match} a la vez sin bajar bitrate.',
          'El catch-up de 48h en deportes funciona de maravilla.',
        ],
        closers: ['La lista mejor mantenida que he probado.', 'Muy recomendable para TiviMate.'],
      },
      4: {
        subjects: ['Buena calidad, conviene filtrar países', 'Muy sólida en Xtream'],
        openers: ['Canales 4K y FHD muy nítidos en {device} con poca latencia.'],
        middles: [
          'Al tener {channels} entradas conviene desactivar países que no usas para que actualice al vuelo.',
          'A alguna película antigua del VOD le faltan subtítulos en español.',
        ],
        closers: ['Excelente una vez filtrada a tu gusto.'],
      },
      3: {
        subjects: ['Tarda ~20s en actualizar en Firestick Lite', 'Bien una vez en caché'],
        openers: ['Una vez cargada en {speed} reproduce fluida, pero refrescar la lista completa tarda unos 20 segundos en sticks básicos.'],
        middles: ['Usar Xtream API es mucho más ágil que el enlace M3U completo.'],
        closers: ['Correcta para el día a día.'],
      },
      2: {
        subjects: ['Mejor usar Xtream que enlace M3U', 'El enlace largo daba timeout'],
        openers: ['El enlace M3U directo se quedaba colgado en mi tele por el peso del VOD.'],
        middles: ['Al cambiar a acceso Xtream Codes cargó bien a la primera.'],
        closers: ['Usad Xtream en teles con poca memoria.'],
      },
      1: {
        subjects: ['Demasiado grande para tele de 2018', 'Memoria insuficiente en TV'],
        openers: ['En VLC del ordenador abre bien, pero mi tele antigua se quedó sin espacio cacheando las carátulas.'],
        middles: ['Hace falta un {device} dedicado.'],
        closers: ['Comprobad la memoria libre de la tele.'],
      },
    },
    player: {
      5: {
        subjects: [
          'Activado en {minutes} minutos', 'Vuela en mi {smartTv}', 'Sin anuncios por fin',
          'Mucho mejor que Smart IPTV', 'Licencia verificada', 'Muy fluida en Smart TV',
          'Fácil con el mando original', 'Ahorré comprar un Firestick',
        ],
        openers: [
          'Mandé la MAC y Device Key, reinicié mi {smartTv} a los {minutes} minutos y ya estaba activa.',
          'Smart IPTV se me colgaba todo el rato en la {smartTv}; con {product} carga {channels} canales en 4 segundos.',
          'Iba a comprar un dispositivo externo pero activando {product} en mi {smartTv} va súper fluida.',
          'Comprobé el estado en la web oficial a los {minutes} minutos y ya figuraba activada.',
          'La pedí por la noche y aun así en {minutes} minutos tenía el aviso de prueba quitado en la {smartTv}.',
          'Gran mejora respecto a las apps gratuitas llenas de anuncios en {smartTv}.',
        ],
        middles: [
          'Se maneja comodísimo con el mando original de la tele sin aparatos extra.',
          'Subir la lista desde el portal web me llevó menos de un minuto.',
          'Cambia de idioma y subtítulos en películas 4K HDR sin congelar la imagen.',
          'El bloqueo parental por PIN funciona perfecto para las carpetas del salón.',
          'La guía EPG y el zapping responden al instante sin tirones.',
        ],
        closers: [
          'Vale cada céntimo la licencia.',
          'Llevo {duration} usándola y cero cuelgues.',
          'Totalmente recomendable para Smart TV.',
          'Muy contento con el cambio.',
        ],
      },
      4: {
        subjects: ['Activación rápida y menú limpio', 'Buen reproductor para {smartTv}'],
        openers: ['Licencia activa en {minutes} minutos en {smartTv}, interfaz moderna y fácil para cualquiera.'],
        middles: ['Solo echo en falta poder ordenar un poco más los accesos directos del inicio.'],
        closers: ['Muy buen reproductor en general.'],
      },
      3: {
        subjects: ['Buena app, tardó 25 min el viernes', 'Solo reproductor sin canales'],
        openers: ['La app va muy fina en {smartTv}, aunque el viernes por la noche la activación tardó unos 25 minutos.'],
        middles: ['Recordad que esto es solo la licencia del reproductor y hace falta tu propia lista.'],
        closers: ['Desde que se activó funciona perfecta.'],
      },
      2: {
        subjects: ['Tuve que desenchufar la tele', 'El aviso de prueba no se iba al principio'],
        openers: ['En mi {smartTv} seguía saliendo el mensaje de prueba hasta que la desenchufé 30 segundos de la corriente.'],
        middles: ['Tras el reinicio completo apareció activa al instante.'],
        closers: ['Ahora va sin problemas.'],
      },
      1: {
        subjects: ['Fallo mío: no incluye canales', 'Creí que traía lista incluida'],
        openers: ['Error mío, compré {product} pensando que incluía canales y es solo la activación de la app.'],
        middles: ['La aplicación se activó bien en mi {smartTv}, solo tuve que pillar la lista aparte.'],
        closers: ['Leed bien antes de comprar si aún no tenéis lista.'],
      },
    },
    panel: {
      5: {
        subjects: ['Créditos en {minutes} min', 'Panel muy rápido', 'Cero fallos con clientes'],
        openers: ['Saldo añadido al panel en {minutes} minutos y ya activé 6 teles Samsung y LG sin problemas.'],
        middles: ['El historial de cada MAC es claro y funciona bien desde el móvil.'],
        closers: ['Herramienta muy fiable para instaladores.'],
      },
      4: {
        subjects: ['Buen panel revendedor', 'API instantánea'],
        openers: ['Las activaciones entran al momento sin perder créditos.'],
        middles: ['Estaría genial un tramo con más descuento a partir de 50 créditos.'],
        closers: ['Muy útil.'],
      },
      3: {
        subjects: ['El correo de acceso fue a spam', 'Funciona bien'],
        openers: ['El saldo estaba correcto, solo tuve que sacar las credenciales de la carpeta de spam.'],
        middles: ['Una vez dentro todo responde rápido.'],
        closers: ['Cumple perfectamente.'],
      },
      2: {
        subjects: ['Más cómodo en ordenador', 'Interfaz sencilla'],
        openers: ['Activar funciona bien pero gestionar sub-revendedores es más cómodo desde el PC.'],
        middles: ['En pantalla pequeña algunos botones quedan justos.'],
        closers: ['Funcional.'],
      },
      1: {
        subjects: ['Elegí marca de app equivocada', 'Revisar app instalada antes'],
        openers: ['Compré créditos de otro reproductor distinto al que tenían mis clientes.'],
        middles: ['Comprobad el nombre exacto en la tienda de la TV antes de recargar.'],
        closers: ['Despiste mío.'],
      },
    },
    sharing: {
      5: {
        subjects: ['Astra 19.2E sin cortes', 'Servidor 40 renovado 1 año', 'Recarga rápida'],
        openers: ['Mandé el número de serie y en {minutes} minutos se actualizó la caducidad 12 meses.'],
        middles: ['Movistar y DAZN en Astra abren al instante sin microcortes durante {match}.'],
        closers: ['Mucho más estable que las viejas líneas CCcam.'],
      },
      4: {
        subjects: ['Buen servidor IKS', 'Sin necesidad de USB'],
        openers: ['Renovación limpia sin tocar el firmware del deco.'],
        middles: ['Eso sí, mantened la parabólica por encima del 80% de señal.'],
        closers: ['Buena relación calidad-precio.'],
      },
      3: {
        subjects: ['Necesitó reiniciar router y deco', 'Estable después'],
        openers: ['Tuve que reiniciar tanto el router como el receptor para que mostrara la nueva fecha.'],
        middles: ['Desde entonces decodifica sin fallos.'],
        closers: ['Correcto.'],
      },
      2: {
        subjects: ['Sensible a señal baja de antena', 'Ajustar parabólica'],
        openers: ['Tenía cortes hasta que afiné la antena de Astra por encima del 82%.'],
        middles: ['Con buena señal aguanta bien los partidos.'],
        closers: ['Revisad el LNB primero.'],
      },
      1: {
        subjects: ['Faltaba actualizar firmware del deco', 'Deco antiguo'],
        openers: ['Mi receptor tenía un firmware antiguo y no conectaba al servidor 40 al principio.'],
        middles: ['Tras actualizar el deco ya reconoció la renovación.'],
        closers: ['Comprobad la versión del receptor.'],
      },
    },
  },
};

export const EXTRA_CONTEXT_TAILS: Partial<Record<ReviewLanguage, string[]>> = {
  en: [
    'Tested on {device} over {speed}.',
    'Still running fine after {duration}.',
    'Setup took about {minutes} minutes total.',
    'Checked mostly on {bouquet}.',
    'Works cleanly with my home {speed} connection.',
    'No issues so far on {smartTv}.',
  ],
  fr: [
    'Testé sur {device} avec {speed}.',
    'Toujours nickel après {duration}.',
    'Mise en route en {minutes} minutes environ.',
    'Utilisé surtout pour {bouquet}.',
    'Aucun souci sur {smartTv} jusqu’ici.',
  ],
  darija_latin: [
    'Mjerreb f {device} b {speed}.',
    'Ba9i khdam mzyan mora {duration}.',
    'Tregla f chi {minutes} d9ay9.',
    'Khedam bih bzzaf f {bouquet}.',
    'Makayn 7ta mouchkil f {smartTv}.',
  ],
  ar: [
    'تمت التجربة على {device} مع {speed}.',
    'ما زال يعمل بثبات بعد {duration}.',
    'أخذ الإعداد حوالي {minutes} دقائق.',
    'أستخدمه غالبا لمتابعة {bouquet}.',
    'يعمل بسلاسة على {smartTv}.',
  ],
  es: [
    'Probado en {device} con {speed}.',
    'Sigue yendo fino después de {duration}.',
    'Configurado en unos {minutes} minutos.',
    'Lo uso sobre todo para {bouquet}.',
    'Sin fallos hasta ahora en {smartTv}.',
  ],
};

export function pickVoiceStyleForLength(sentenceCount: number, hasTechHint: boolean): ReviewerVoice {
  if (sentenceCount === 1) return 'minimalist';
  if (hasTechHint) return 'technical';
  const r = Math.random();
  if (r < 0.55) return 'casual';
  if (r < 0.78) return 'sports';
  return 'family';
}
