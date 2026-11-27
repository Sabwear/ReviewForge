import {
  BusinessLanguageTokens,
  BusinessStarPool,
  CatalogProduct,
  ReviewLanguage,
} from '../types/reviews';

const SERVICE_KEYWORDS =
  /\b(service|services|repair|repairs|plumb|plombier|loodgieter|boiler|heating|chauffage|verwarming|hvac|leak|water heater|heat pump|install|installation|maintenance|onderhoud|entretien|emergency|dépannage|depannage|interventions?|cleaning|nettoyage|electrician|roofing|renovation|clinic|dental|dentist|salon|spa|barber|massage|agency|consulting|audit|coaching|training|booking|appointment|inspection|diagnostic|handyman|locksmith|moving|pest control|gardening|landscaping|catering|hotel|restaurant|therapy|physio|veterinary|mechanic|auto repair|car wash|solutions?)\b/i;

const ECOM_KEYWORDS =
  /\b(shirt|jacket|shoe|sneaker|watch|smartwatch|earbuds|headphone|tablet|phone|case|cable|charger|bag|backpack|perfume|cream|serum|lipstick|mug|lamp|chair|table|sofa|dress|hoodie|jeans|socks|bottle|toy|necklace|ring)\b/i;

/**
 * Auto-detects whether a catalog represents a SERVICE business (plumber, HVAC, clinic, agency, salon, etc.)
 * rather than an online e-commerce store selling physical shipped products.
 */
export function isServiceCatalog(products: CatalogProduct[]): boolean {
  if (products.length === 0) return false;
  let serviceHits = 0;
  let ecomHits = 0;
  for (const p of products) {
    const text = `${p.item_name} ${p.category} ${p.item_slug} ${p.product_url || ''}`;
    if (SERVICE_KEYWORDS.test(text)) serviceHits += 1;
    if (ECOM_KEYWORDS.test(text)) ecomHits += 1;
  }
  return serviceHits > ecomHits && serviceHits / products.length >= 0.25;
}

export function getServiceFallbackReference(language: ReviewLanguage): string {
  switch (language) {
    case 'fr':
      return 'cette intervention';
    case 'nl':
      return 'deze service';
    case 'de':
      return 'dieser Service';
    case 'es':
      return 'este servicio';
    case 'it':
      return 'questo servizio';
    case 'pt':
      return 'este serviço';
    case 'ar':
      return 'هذه الخدمة';
    case 'darija_latin':
      return 'had l-khedma';
    case 'tr':
      return 'bu hizmet';
    case 'pl':
      return 'ta usługa';
    default:
      return 'this service';
  }
}

export const SERVICE_TOKENS: Partial<Record<ReviewLanguage, BusinessLanguageTokens>> = {
  en: {
    contextA: ['our home', 'an urgent issue at home', 'our apartment', 'a scheduled checkup', 'our rental property', 'an unexpected breakdown'],
    contextB: ['the clear diagnosis', 'punctuality and clean work', 'transparent pricing', 'the technician’s expertise', 'fast scheduling', 'honest advice'],
    duration: ['a couple of weeks', 'nearly a month', 'two months', 'several days', 'over three weeks'],
    timeframe: ['2 hours', 'the same day', '24 hours', 'less than a day', '48 hours'],
  },
  fr: {
    contextA: ['notre maison', 'une panne urgente', 'notre appartement', 'un entretien annuel', 'un souci soudain à la maison', 'une intervention rapide'],
    contextB: ['la ponctualité du technicien', 'le diagnostic clair', 'le travail soigné et propre', 'le devis transparent', 'les explications précises', 'le sérieux de l’équipe'],
    duration: ['quelques semaines', 'près d’un mois', 'deux mois', 'plusieurs jours'],
    timeframe: ['quelques heures', 'la journée même', '24h', '48h'],
  },
  nl: {
    contextA: ['ons huis', 'een dringend probleem thuis', 'ons appartement', 'een jaarlijkse controle', 'een plotselinge storing', 'een snelle herstelling'],
    contextB: ['de stipte aankomst', 'de duidelijke uitleg', 'het nette vakwerk', 'de transparante prijsopgave', 'de professionele aanpak', 'de snelle oplossing'],
    duration: ['enkele weken', 'bijna een maand', 'twee maanden', 'een paar dagen'],
    timeframe: ['enkele uren', 'dezelfde dag', '24 uur', '48 uur'],
  },
  de: {
    contextA: ['unser Zuhause', 'einen akuten Notfall', 'unsere Wohnung', 'eine geplante Wartung', 'ein plötzliches Problem'],
    contextB: ['die pünktliche Ankunft', 'die saubere Arbeit', 'die klare Diagnose', 'die faire Preisgestaltung', 'die freundliche Beratung'],
    duration: ['einigen Wochen', 'fast einem Monat', 'zwei Monaten', 'mehreren Tagen'],
    timeframe: ['wenigen Stunden', 'demselben Tag', '24 Stunden', '48 Stunden'],
  },
  es: {
    contextA: ['nuestra casa', 'una urgencia en casa', 'nuestro piso', 'una revisión programada', 'una avería inesperada'],
    contextB: ['la puntualidad del técnico', 'el diagnóstico claro', 'el trabajo limpio y cuidado', 'el presupuesto transparente', 'la rapidez'],
    duration: ['un par de semanas', 'casi un mes', 'dos meses', 'varios días'],
    timeframe: ['unas horas', 'el mismo día', '24 horas', '48 horas'],
  },
  ar: {
    contextA: ['المنزل', 'عطل طارئ في البيت', 'شقتنا', 'صيانة دورية', 'مشكلة مفاجئة'],
    contextB: ['الالتزام بالموعد', 'التشخيص الدقيق', 'نظافة العمل والاحترافية', 'وضوح السعر منذ البداية', 'سرعة الاستجابة'],
    duration: ['أسبوعين', 'قرابة شهر', 'شهرين', 'عدة أيام'],
    timeframe: ['ساعات قليلة', 'نفس اليوم', '24 ساعة', '48 ساعة'],
  },
  darija_latin: {
    contextA: ['darna', 'mouchkil urgent f dar', 'l-appartement', 'entretien dyal l-3am', 'panne ghefla'],
    contextB: ['l-wa9t mdbout', 'khedma n9iya w mte9na', 'taman wad7 mn lwel', 'l-m3ellem fahem khedmto', 'sor3a f l-intervention'],
    duration: ['jouj simanat', '9rib chehar', 'chehrayn', 'chi yamat'],
    timeframe: ['chi swaye3', 'nefs nhar', '24 sa3a', '48 sa3a'],
  },
};

export const SERVICE_SENTENCE_BANKS: Partial<Record<ReviewLanguage, Record<1 | 2 | 3 | 4 | 5, BusinessStarPool>>> = {
  en: {
    5: {
      star: 5,
      subjects: ['Fast, clean and reliable', 'Fixed on the first visit', 'Great technician, fair price', 'Highly recommend their team', 'Sorted quickly'],
      openers: [
        'Called them for {product} at {contextA} and they managed to fit us in within {timeframe}.',
        'Had {product} done recently and I was genuinely impressed by {contextB}.',
        'Booked {product} after a friend recommended them, and the whole visit went smoothly from start to finish.',
        'Needed {product} urgently for {contextA} — the technician arrived right on time and explained every step.',
      ],
      middles: [
        'Everything was diagnosed clearly upfront with no surprise charges, and they left the workspace spotless.',
        'It has been {duration} since the visit and everything has been running smoothly without a single hiccup.',
        'What stood out most was {contextB} — you can tell they really know their craft.',
      ],
      closers: [
        'Saved their number for any future work.',
        'Would happily recommend them to neighbors and friends.',
        'Glad I called them, very solid work.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Solid, professional work', 'Very good service overall', 'Polite and thorough', 'Clean job once scheduled', 'Good experience'],
      openers: [
        'Scheduled {product} for {contextA} and the work was completed properly within {timeframe}.',
        'Happy with how {product} went; {contextB} made the whole visit straightforward.',
        'We booked an appointment for {product} and the technician handled everything methodically.',
      ],
      middles: [
        'He phoned twenty minutes beforehand and left the work area tidy when finished.',
        'After {duration}, everything still works quietly as expected.',
        'Scheduling took a couple of emails to line up, though the on-site work itself was spot on.',
      ],
      closers: [
        'Would call them again when needed.',
        'Fair invoice with no unexpected add-ons.',
        'Good local option if you want tidy workmanship.',
        'Overall a dependable experience.',
      ],
    },
    3: {
      star: 3,
      subjects: ['Job got done, minor delay', 'Decent work once scheduled', 'Okay result, slow callback', 'Competent technician, busy calendar', 'Mixed scheduling experience'],
      openers: [
        'Used them for {product} at {contextA}; the technical work itself was carried out properly.',
        'The technician handled {product} competently once on site, though getting a slot took patience.',
        'Our appointment for {product} required a bit of back-and-forth with the office beforehand.',
      ],
      middles: [
        'Office follow-up could have been faster prior to the visit, yet the work has held up over {duration}.',
        'The invoice was slightly higher than I first expected, although the technician explained the parts used.',
        'We waited past the original morning window before someone arrived to complete the job.',
      ],
      closers: [
        'Satisfactory outcome in the end, just allow extra lead time.',
        'Decent workmanship, though dispatch communication has room to improve.',
        'Acceptable overall once the technician actually arrived.',
        'Technical side was fine even if booking felt slow.',
      ],
    },
    2: {
      star: 2,
      subjects: ['Scheduling took longer than expected', 'Needed a follow-up visit'],
      openers: [
        'Booked {product} for {contextA}, but we had to reschedule once before the technician could come out.',
      ],
      middles: [
        'The technician was polite and resolved the issue eventually, though the wait was frustrating.',
      ],
      closers: [
        'Hoping their scheduling communication improves next time.',
      ],
    },
    1: {
      star: 1,
      subjects: ['Hard to get a quick slot', 'Rescheduled appointment'],
      openers: [
        'Tried booking {product} for {contextA} during a busy week and the time slot kept shifting.',
      ],
      middles: [
        'The staff were courteous on the phone, but I needed a firmer arrival window for my schedule.',
      ],
      closers: [
        'Better suited if your schedule is flexible.',
      ],
    },
  },
  fr: {
    5: {
      star: 5,
      subjects: ['Intervention rapide et propre', 'Technicien très sérieux', 'Travail impeccable', 'Je recommande vivement', 'Problème réglé dès la première visite'],
      openers: [
        'J’ai fait appel à eux pour {product} chez nous ({contextA}) et un technicien est venu en {timeframe}.',
        'Très belle expérience pour {product} : on remarque tout de suite {contextB}.',
        'Intervention pour {product} parfaitement gérée du premier appel jusqu’à la fin des travaux.',
      ],
      middles: [
        'Le diagnostic a été expliqué clairement avant de commencer, sans frais cachés, et tout a été laissé propre.',
        'Cela fait maintenant {duration} depuis leur passage et tout fonctionne parfaitement.',
        'Ce qui m’a le plus rassuré, c’est {contextB} et des explications simples.',
      ],
      closers: [
        'Je garde précieusement leur contact pour l’avenir.',
        'Équipe fiable que je recommande sans hésiter.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Très bon travail', 'Équipe compétente', 'Service sérieux', 'Bon suivi sur place', 'Prestation soignée'],
      openers: [
        'Rendez-vous pris pour {product} ({contextA}) et travail bien réalisé en {timeframe}.',
        'Satisfait du passage pour {product}, notamment grâce à {contextB}.',
        'Nous avons sollicité leur équipe pour {product} et l’intervention s’est bien déroulée.',
      ],
      middles: [
        'Le technicien a appelé avant de passer et a laissé la pièce propre en partant.',
        'Après {duration}, l’installation fonctionne de façon tout à fait stable.',
        'Il a fallu patienter quelques jours pour avoir une disponibilité, mais le travail sur place était carré.',
      ],
      closers: [
        'Je referai appel à eux si besoin.',
        'Facture conforme à ce qui avait été annoncé.',
        'Une adresse sérieuse dans la région.',
        'Bon résultat technique au final.',
      ],
    },
    3: {
      star: 3,
      subjects: ['Travail correct, un peu d’attente', 'Service convenable', 'Bon technicien mais planning chargé', 'Résultat ok, suivi lent', 'Mitigé sur le délai'],
      openers: [
        'Le technicien a correctement assuré {product} chez nous.',
        'L’intervention pour {product} s’est bien passée techniquement, malgré une attente assez longue.',
        'Il a fallu rappeler le secrétariat deux fois avant de confirmer la visite pour {product}.',
      ],
      middles: [
        'La planification a pris plus de temps que prévu, même si le résultat tient bien après {duration}.',
        'Le créneau du matin a glissé vers la fin d’après-midi sans beaucoup d’informations entre-temps.',
        'Le tarif final reste dans la moyenne haute, bien que le travail ait été fait proprement.',
      ],
      closers: [
        'Convenable sur le plan technique, moins sur la ponctualité.',
        'L’essentiel est réglé, mais la communication gagnerait à être plus fluide.',
        'Prestation honnête une fois le technicien sur place.',
        'Rien à redire sur le geste technique, dommage pour l’attente.',
      ],
    },
    2: {
      star: 2,
      subjects: ['Créneau déplacé', 'Un peu long à planifier'],
      openers: [
        'J’ai réservé {product} pour {contextA}, mais le rendez-vous a dû être décalé une fois.',
      ],
      middles: [
        'Le technicien était courtois et a réglé le souci, mais l’attente était un peu contraignante.',
      ],
      closers: [
        'Dommage pour le délai, même si le travail final est correct.',
      ],
    },
    1: {
      star: 1,
      subjects: ['Difficile d’avoir un créneau fixe', 'Attente trop longue'],
      openers: [
        'J’ai essayé de planifier {product} pour {contextA} en pleine semaine chargée et l’horaire a changé deux fois.',
      ],
      middles: [
        'L’accueil téléphonique était poli, mais j’avais besoin d’un créneau garanti.',
      ],
      closers: [
        'À privilégier si vous avez un emploi du temps flexible.',
      ],
    },
  },
  nl: {
    5: {
      star: 5,
      subjects: ['Snel en netjes opgelost', 'Echte vakman', 'Stipt en betrouwbaar', 'Zeker aan te raden', 'Direct verholpen'],
      openers: [
        'Contact opgenomen voor {product} bij {contextA} en binnen {timeframe} stond de technieker al voor de deur.',
        'Heel goede ervaring met {product}; vooral {contextB} viel meteen positief op.',
        'Voor {product} een afspraak gemaakt en alles werd vlot en vakkundig uitgevoerd.',
      ],
      middles: [
        'Eerst een duidelijke diagnose en eerlijke prijsafspraak, daarna netjes gewerkt en alles schoon achtergelaten.',
        'Intussen zijn we {duration} verder en alles werkt nog altijd zonder problemen.',
        'Je merkt meteen de ervaring: {contextB} maakte echt het verschil.',
      ],
      closers: [
        'Hun nummer staat vast opgeslagen voor toekomstig onderhoud.',
        'Zeker een aanrader in de buurt.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Goede service', 'Netjes uitgevoerd', 'Tevreden klant', 'Vakkundig geholpen', 'Correcte afhandeling'],
      openers: [
        'We maakten een afspraak voor {product} en binnen {timeframe} was alles keurig afgewerkt.',
        'Tevreden over de gang van zaken bij {product}, vooral vanwege {contextB}.',
        'Voor {product} langskomen zoals afgesproken en rustig doorgewerkt tot alles klopte.',
      ],
      middles: [
        'De agenda zat vrij vol die week, maar ter plaatse werd er heel zorgvuldig gewerkt.',
        'Na {duration} draait alles nog steeds stabiel zonder haperingen.',
        'Ze belden vooraf netjes dat ze onderweg waren en lieten geen rommel achter.',
      ],
      closers: [
        'Zou hen bij een volgende gelegenheid opnieuw vragen.',
        'Factuur kwam netjes overeen met de prijsopgave.',
        'Degelijk adres voor wie net vakwerk zoekt.',
        'Al bij al een vlotte en eerlijke tussenkomst.',
      ],
    },
    3: {
      star: 3,
      subjects: ['Goed werk, iets langer wachten', 'Technisch oké, trage planning', 'Degelijk maar druk bezet', 'Redelijk resultaat na wachttijd', 'Uitvoering prima, communicatie matig'],
      openers: [
        'De vakman heeft het werk rond {product} technisch goed aangepakt.',
        'Voor {product} moesten we enkele dagen langer wachten dan aanvankelijk gezegd.',
        'Het vastleggen van een moment voor {product} vroeg wat extra telefoontjes naar de planning.',
      ],
      middles: [
        'De terugkoppeling vanuit kantoor mocht vlotter, al werkt alles na {duration} wel naar behoren.',
        'De monteur kwam pas laat in de namiddag aan in plaats van in de ochtend, maar werkte wel netjes.',
        'De prijs viel iets hoger uit door klein materiaal, al werd dat achteraf wel toegelicht.',
      ],
      closers: [
        'Vakinhoudelijk in orde, alleen de telefonische opvolging kan strakker.',
        'Het probleem is verholpen, maar reken wel wat marge in qua wachttijd.',
        'Zodra de technieker binnen was ging het vlot, enkel het inplannen liep stroef.',
        'Gemiddelde ervaring door de vertraging, technisch wel goed opgelost.',
      ],
    },
    2: {
      star: 2,
      subjects: ['Afspraak werd verzet', 'Wachttijd was wat lang'],
      openers: [
        'Had {product} ingepland voor {contextA}, maar het tijdslot moest een keer worden verplaatst.',
      ],
      middles: [
        'De technieker zelf was vriendelijk en loste het op, alleen de wachttijd was lastig.',
      ],
      closers: [
        'Hopelijk volgende keer een strakkere planning.',
      ],
    },
    1: {
      star: 1,
      subjects: ['Lastig om snel een tijdslot te krijgen', 'Planning liep uit'],
      openers: [
        'Probeerde {product} te boeken voor {contextA} in een drukke week, maar het tijdstip schoof steeds op.',
      ],
      middles: [
        'Vriendelijk aan de telefoon, maar ik had echt een vast tijdslot nodig.',
      ],
      closers: [
        'Alleen handig als je flexibel bent qua uren.',
      ],
    },
  },
  de: {
    5: {
      star: 5,
      subjects: ['Schnell und sauber erledigt', 'Sehr zuverlässiger Fachbetrieb', 'Klare Empfehlung'],
      openers: [
        'Haben {product} für {contextA} angefragt und innerhalb von {timeframe} war der Techniker vor Ort.',
        'Sehr gute Erfahrung mit {product} — besonders {contextB} hat uns überzeugt.',
      ],
      middles: [
        'Transparente Diagnose vorab, saubere Ausführung und der Arbeitsbereich wurde ordentlich hinterlassen.',
        'Auch nach {duration} läuft alles absolut einwandfrei.',
      ],
      closers: [
        'Jederzeit gerne wieder, klare Weiterempfehlung.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Gute Arbeit', 'Zuverlässiger Service'],
      openers: ['{product} wurde für {contextA} sauber und innerhalb von {timeframe} erledigt.'],
      middles: ['Kleiner zeitlicher Puffer bei der Anfahrt, aber fachlich top und nach {duration} alles stabil.'],
      closers: ['Würde ich wieder beauftragen.'],
    },
    3: {
      star: 3,
      subjects: ['Solide Ausführung', 'Gute Arbeit, etwas Wartezeit'],
      openers: ['Die Arbeiten für {product} wurden fachgerecht erledigt.'],
      middles: ['Die Terminabstimmung dauerte etwas, aber das Ergebnis überzeugt nach {duration}.'],
      closers: ['Insgesamt in Ordnung.'],
    },
    2: {
      star: 2,
      subjects: ['Termin wurde verschoben'],
      openers: ['Für {product} musste der Termin leider einmal verlegt werden.'],
      middles: ['Der Techniker war freundlich und kompetent, nur die Wartezeit war etwas lang.'],
      closers: ['Die Arbeit war okay, Planung ausbaufähig.'],
    },
    1: {
      star: 1,
      subjects: ['Schwierige Terminfindung'],
      openers: ['In einer vollen Woche war es schwer, für {product} ein festes Zeitfenster zu bekommen.'],
      middles: ['Am Telefon nett, aber ich brauchte eine verbindliche Uhrzeit.'],
      closers: ['Nur sinnvoll, wenn man zeitlich flexibel ist.'],
    },
  },
};

export const SERVICE_EXTRA_TAILS: Partial<Record<ReviewLanguage, string[]>> = {
  en: [
    'They even took a few minutes to answer my maintenance questions before leaving.',
    'Everything was left clean and tidy once the job wrapped up.',
    'Fair quote and zero pushy upselling.',
  ],
  fr: [
    'Le technicien a même pris le temps de nous donner des conseils d’entretien avant de partir.',
    'Chantier laissé parfaitement propre après l’intervention.',
    'Devis respecté à l’euro près, aucune mauvaise surprise.',
  ],
  nl: [
    'De technieker gaf ook nog nuttige tips om problemen in de toekomst te voorkomen.',
    'Alles werd netjes opgeruimd na de interventie.',
    'Eerlijke prijs en geen onnodige kosten.',
  ],
  de: [
    'Der Techniker hat uns vor der Abfahrt noch hilfreiche Tipps zur Wartung gegeben.',
    'Alles wurde sauber hinterlassen und der Preis entsprach dem Angebot.',
  ],
};
