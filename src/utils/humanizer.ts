import { CatalogProduct, ReviewLanguage } from '../types/reviews';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a concrete, service-matched micro-detail sentence based on the exact offering name/slug
 * so a boiler repair review mentions heating/hot water, a leak repair mentions pipes/water damage, etc.
 */
export function getServiceSpecificSentence(
  product: CatalogProduct,
  language: ReviewLanguage,
  stars: number
): string | null {
  const haystack = `${product.item_name} ${product.item_slug} ${product.category}`.toLowerCase();

  // Negative/mixed reviews stay focused on scheduling/expectations rather than praising fixes
  if (stars <= 2) return null;

  // 1. Boiler / Heating / Heat Pump / Hot Water
  if (/boiler|heat|chauffage|verwarming|ketel|warm|hot water|bulex|vaillant|radiator|thermostat/i.test(haystack)) {
    const pool: Partial<Record<ReviewLanguage, string[]>> = {
      en: [
        'Hot water and radiators were back to normal before he even packed up his tools.',
        'Checked the boiler pressure, swapped the worn valve, and tested the heating twice.',
        'Our heating had been cutting out all week and now it runs quietly and steadily.',
        'Explained what caused the error code on our boiler so we know what to watch for.',
      ],
      fr: [
        'L’eau chaude et les radiateurs refonctionnaient normalement avant même qu’il ne reparte.',
        'Il a vérifié la pression de la chaudière, remplacé la pièce usée et tout testé.',
        'Le chauffage ne s’arrête plus tout seul, tout tourne enfin sans bruit.',
        'Diagnostic précis sur le code d’erreur de la chaudière, rien à redire.',
      ],
      nl: [
        'Warm water en de radiatoren werkten meteen weer normaal nog voor hij vertrok.',
        'Keteldruk nagekeken, versleten onderdeel vervangen en de verwarming rustig getest.',
        'De ketel viel al dagen uit maar draait nu weer stil en stabiel.',
        'Duidelijke uitleg gekregen over de foutcode op onze ketel.',
      ],
      de: [
        'Warmwasser und Heizkörper liefen wieder normal, noch bevor er sein Werkzeug eingepackt hatte.',
        'Heizungsdruck geprüft, defektes Ventil getauscht und alles sauber entlüftet.',
      ],
    };
    const list = pool[language] || pool.en!;
    return pick(list);
  }

  // 2. Water Leak / Pipe / Drain / Plumbing
  if (/leak|lek|fuite|plumb|plombier|loodgieter|pipe|drain|sink|toilet|tap|faucet|water/i.test(haystack)) {
    const pool: Partial<Record<ReviewLanguage, string[]>> = {
      en: [
        'Found the hidden leak under the sink quickly without tearing up the cabinet.',
        'Replaced the leaking joint and checked water pressure across every tap before leaving.',
        'Stopped the drip right away and saved us from serious water damage.',
        'Clean pipework, zero mess left on the bathroom floor.',
      ],
      fr: [
        'Il a repéré la fuite sous l’évier rapidement sans abîmer le meuble.',
        'Joint remplacé et pression vérifiée sur tous les robinets avant de partir.',
        'Fuite stoppée net, ça nous a évité un gros dégât des eaux.',
        'Travail de plomberie propre, aucune trace laissée dans la salle de bain.',
      ],
      nl: [
        'Het lek onder de gootsteen snel gevonden zonder de kast te beschadigen.',
        'Lekkende koppeling vervangen en alle kranen nog eens gecontroleerd.',
        'Het lek was direct gestopt, blij dat we waterschade hebben vermeden.',
        'Netjes gewerkt aan de leidingen en de badkamer schoon achtergelaten.',
      ],
      de: [
        'Das Leck unter dem Waschbecken wurde schnell gefunden und sauber abgedichtet.',
        'Alle Anschlüsse geprüft und das Bad komplett sauber hinterlassen.',
      ],
    };
    const list = pool[language] || pool.en!;
    return pick(list);
  }

  // 3. Emergency / Urgent / 24/7
  if (/emergenc|urgent|dringend|dépannage|depannage|24\/7|spoed|notdienst/i.test(haystack)) {
    const pool: Partial<Record<ReviewLanguage, string[]>> = {
      en: [
        'Answered on the first ring and had someone at our door much faster than expected.',
        'Huge relief having an emergency technician actually show up when promised.',
        'Sorted the urgent issue out the same evening with no crazy surcharge.',
      ],
      fr: [
        'Ils ont décroché tout de suite et un dépanneur était là bien plus vite que prévu.',
        'Quel soulagement de tomber sur un service d’urgence qui tient vraiment ses horaires.',
        'Souci urgent réglé le soir même sans tarif abusif.',
      ],
      nl: [
        'Direct opgenomen aan de telefoon en sneller ter plaatse dan verwacht.',
        'Echt een opluchting bij een dringend probleem als iemand ook echt op tijd komt.',
        'Dezelfde avond nog opgelost zonder overdreven spoedkosten.',
      ],
    };
    const list = pool[language] || pool.en!;
    return pick(list);
  }

  // 4. Installation / Setup
  if (/install|setup|montage|plaatsing|pose/i.test(haystack)) {
    const pool: Partial<Record<ReviewLanguage, string[]>> = {
      en: [
        'The new installation looks super neat and they walked us through all the controls.',
        'Everything was fitted cleanly on the scheduled day and tested thoroughly.',
      ],
      fr: [
        'La nouvelle installation est très propre et ils nous ont bien montré comment tout régler.',
        'Pose terminée dans les temps et vérifiée de fond en comble.',
      ],
      nl: [
        'De nieuwe installatie ziet er heel strak uit en alles werd duidelijk uitgelegd.',
        'Alles netjes geplaatst op de afgesproken dag en grondig getest.',
      ],
    };
    const list = pool[language] || pool.en!;
    return pick(list);
  }

  return null;
}

/**
 * Ultra-short, realistic human-typed reviews (~15% of dataset) — real people often write 3–10 words on their phone.
 */
export function buildUltraShortReview(
  product: CatalogProduct,
  language: ReviewLanguage,
  stars: 1 | 2 | 3 | 4 | 5,
  serviceMode: boolean
): { subject: string; body: string } | null {
  const name = product.item_name;

  if (serviceMode) {
    if (stars === 5) {
      const pool: Partial<Record<ReviewLanguage, Array<[string, string]>>> = {
        en: [
          ['Quick & clean', `Fixed ${name} same day, super polite guy`],
          ['Top service', 'On time, fair price, problem solved.'],
          ['Recommended', `Great job with ${name}, zero mess left behind.`],
          ['fast fix', 'arrived in 2 hrs and sorted it out fast thx'],
          ['5 stars', `Very happy with ${name}. Will call again.`],
        ],
        fr: [
          ['Nickel', `Intervention rapide pour ${name}, travail propre.`],
          ['Top', 'Ponctuel, sympa et prix correct.'],
          ['Merci !', `tres efficace pour ${name}, je recommande`],
          ['Impeccable', 'Passé le jour même, problème réglé en 30 min.'],
          ['Sérieux', 'Bon technicien, rien a redire'],
        ],
        nl: [
          ['Top service', `Snel opgelost (${name}), heel vriendelijke man.`],
          ['Prima!', 'Op tijd, eerlijke prijs en netjes gewerkt'],
          ['Aanrader', `${name} vlot in orde gebracht, bedankt!`],
          ['Goed werk', 'binnen paar uur opgelost, super tevreden'],
          ['Vlot geregeld', 'Nette vakman, alles werkt weer.'],
        ],
        de: [
          ['Top!', `Schnell erledigt (${name}), sehr sauber gearbeitet.`],
          ['Sehr zufrieden', 'Pünktlich, freundlich und fairer Preis.'],
        ],
      };
      const items = pool[language] || pool.en!;
      const [subject, body] = pick(items);
      return { subject, body };
    }
    if (stars === 4) {
      const pool: Partial<Record<ReviewLanguage, Array<[string, string]>>> = {
        en: [
          ['Good job', `${name} done properly, arrived 20 mins late tho.`],
          ['Solid work', 'Good technician and fair quote.'],
        ],
        fr: [
          ['Bon travail', `${name} bien fait, juste un petit retard a l'arrivee.`],
          ['Satisfait', 'Travail propre et devis respecté.'],
        ],
        nl: [
          ['Goed geholpen', `${name} netjes gedaan, iets later dan gepland.`],
          ['Tevreden', 'Goede service voor een correcte prijs.'],
        ],
      };
      const items = pool[language] || pool.en!;
      const [subject, body] = pick(items);
      return { subject, body };
    }
    if (stars === 3) {
      const pool: Partial<Record<ReviewLanguage, Array<[string, string]>>> = {
        en: [['Okay overall', `Work on ${name} was fine, took a while to get a slot.`]],
        fr: [['Correct', `Travail correct pour ${name}, un peu long pour le rdv.`]],
        nl: [['Redelijk', `Werk voor ${name} was oké, wachten duurde wat lang.`]],
      };
      const items = pool[language] || pool.en!;
      const [subject, body] = pick(items);
      return { subject, body };
    }
    if (stars <= 2) {
      const pool: Partial<Record<ReviewLanguage, Array<[string, string]>>> = {
        en: [['Long wait', `Had to reschedule ${name} twice, bit frustrating.`]],
        fr: [['Rdv décalé', `Le créneau pour ${name} a été déplacé deux fois.`]],
        nl: [['Afspraak verzet', `Tijdslot voor ${name} werd helaas verplaatst.`]],
      };
      const items = pool[language] || pool.en!;
      const [subject, body] = pick(items);
      return { subject, body };
    }
  } else if (stars === 5) {
    const pool: Partial<Record<ReviewLanguage, Array<[string, string]>>> = {
      en: [
        ['Love it', `${name} works great, fast delivery.`],
        ['Super happy', 'Exactly what I wanted, good quality'],
        ['5/5', `Really nice ${name}, would buy again.`],
      ],
      fr: [
        ['Top', `${name} conforme, reçu vite.`],
        ['Très bien', 'Bonne qualité pour le prix, merci'],
      ],
      nl: [
        ['Heel blij mee', `${name} werkt prima en snel binnen.`],
        ['Top!', 'Goede kwaliteit, precies zoals verwacht'],
      ],
    };
    const items = pool[language] || pool.en!;
    const [subject, body] = pick(items);
    return { subject, body };
  }

  return null;
}

/**
 * Diverse short human subjects to prevent repeating the same 4 titles across 50+ rows.
 */
export const EXTRA_DIVERSE_SUBJECTS: Partial<Record<ReviewLanguage, Record<1 | 2 | 3 | 4 | 5, string[]>>> = {
  en: {
    5: ['Great experience', 'Really glad I called', 'Super professional', 'Zero hassle', 'Worth every penny', 'Clean work', 'Fast turnaround', 'Spot on', 'Friendly & skilled', 'Solved quickly'],
    4: ['Happy with the result', 'Good experience overall', 'Reliable & polite', 'Mostly great', 'Would use again', 'Fair pricing'],
    3: ['It was alright', 'Fine once booked', 'Average wait time', 'Got the job done'],
    2: ['Rescheduled twice', 'Wait was a bit long', 'Communication could be better'],
    1: ['Hard to schedule', 'Slot kept moving', 'Took too long to confirm'],
  },
  fr: {
    5: ['Très bonne surprise', 'Efficace et sympa', 'Rien à redire', 'Travail soigné', 'Rapide et fiable', 'Super pro', 'Je garde le numéro', 'Propre et carré'],
    4: ['Bon rapport qualité-prix', 'Globalement ravi', 'Équipe pro', 'Très correct', 'Bonne intervention'],
    3: ['Correct sans plus', 'Travail ok, délai moyen', 'Ça fait le job'],
    2: ['Délai un peu long', 'Rdv reporté', 'Attente un peu pénible'],
    1: ['Créneau difficile à avoir', 'Horaire trop flou'],
  },
  nl: {
    5: ['Heel tevreden', 'Keurig werk', 'Vlot en correct', 'Echte aanrader', 'Snel geholpen', 'Professioneel', 'Duidelijke uitleg', 'Top vakman'],
    4: ['Prima ervaring', 'Goed uitgevoerd', 'Betrouwbaar', 'Tevreden over het resultaat'],
    3: ['Gewoon goed', 'Oké maar wat wachttijd', 'Degelijk werk'],
    2: ['Planning was lastig', 'Moest even wachten'],
    1: ['Moeilijk te plannen', 'Tijdslot schoof op'],
  },
};

const NATURAL_TYPOS_EN: Array<[RegExp, string]> = [
  [/\brecommend\b/i, 'reccomend'],
  [/\bdefinitely\b/i, 'definately'],
  [/\breally\b/i, 'realy'],
  [/\band\b/, '&'],
  [/\bminutes\b/i, 'mins'],
  [/\bhours\b/i, 'hrs'],
  [/\bthank you\b/i, 'thx'],
  [/\bthough\b/i, 'tho'],
];

const NATURAL_TYPOS_FR: Array<[RegExp, string]> = [
  [/\btrès\b/i, 'tres'],
  [/\bvraiment\b/i, 'vrmt'],
  [/\bbeaucoup\b/i, 'bcp'],
  [/\bà\b/, 'a'],
  [/\bproblème\b/i, 'probleme'],
  [/\brendez-vous\b/i, 'rdv'],
];

const NATURAL_TYPOS_NL: Array<[RegExp, string]> = [
  [/\bgoede\b/i, 'goeie'],
  [/\bheel\b/i, 'echt'],
  [/\bafspraak\b/i, 'afsprak'],
  [/\btechnieker\b/i, 'monteur'],
];

/**
 * Applies subtle, authentic human typing imperfections to ~28% of reviews
 * (casual lowercase start, missing trailing period, natural phone typo/abbreviation)
 * so the dataset doesn't look sterile or AI-polished.
 */
export function applyHumanImperfections(
  subject: string,
  body: string,
  language: ReviewLanguage
): { subject: string; body: string } {
  let nextSubject = subject;
  let nextBody = body;

  // 1. ~22% chance: subtle casual typo or phone shorthand (max 1 replacement per review)
  if (Math.random() < 0.22) {
    const table =
      language === 'fr'
        ? NATURAL_TYPOS_FR
        : language === 'nl'
        ? NATURAL_TYPOS_NL
        : language === 'en'
        ? NATURAL_TYPOS_EN
        : [];
    if (table.length > 0) {
      const shuffled = [...table].sort(() => Math.random() - 0.5);
      for (const [rx, rep] of shuffled) {
        if (rx.test(nextBody)) {
          nextBody = nextBody.replace(rx, rep);
          break;
        }
      }
    }
  }

  // 2. ~18% chance: drop trailing period on body (very common on mobile)
  if (language !== 'ar' && language !== 'he' && Math.random() < 0.18 && nextBody.endsWith('.')) {
    nextBody = nextBody.slice(0, -1);
  }

  // 3. ~12% chance: casual lowercase subject or body opening (real phone typing)
  if (language !== 'de' && language !== 'ar' && language !== 'he') {
    if (Math.random() < 0.12 && nextSubject.length > 0) {
      nextSubject = nextSubject[0].toLowerCase() + nextSubject.slice(1);
    }
    if (Math.random() < 0.09 && nextBody.length > 0 && !/^[A-Z]{2,}/.test(nextBody)) {
      nextBody = nextBody[0].toLowerCase() + nextBody.slice(1);
    }
  }

  return { subject: nextSubject, body: nextBody };
}
