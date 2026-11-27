import {
  CatalogProduct,
  OfferingVoiceContext,
  ReviewLanguage,
} from '../types/reviews';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type ServiceSubArchetype =
  | 'heat_pump'
  | 'boiler_maintenance'
  | 'boiler_install'
  | 'boiler_repair'
  | 'heating_system'
  | 'water_heater'
  | 'leak_repair'
  | 'plumbing_install'
  | 'emergency'
  | 'electrical'
  | 'cleaning'
  | 'clinical'
  | 'beauty'
  | 'digital'
  | 'advisory'
  | 'general_service';

/**
 * Universal offering sub-type classifier (works across any industry without hardcoding).
 * Strictly separates Maintenance, Installation, Repair, Heating Systems, Water Heaters,
 * Leak Detection, Plumbing Installation, Emergency Callouts, and Heat Pumps/Renewables,
 * as well as Clinical, Beauty, Electrical, Cleaning, Digital, and Advisory services.
 */
export function classifyServiceArchetype(product: CatalogProduct): ServiceSubArchetype {
  const itemText = `${product.item_name} ${product.item_slug}`.toLowerCase();
  const fullText = `${itemText} ${product.category}`.toLowerCase();

  if (/\b(heat[- ]?pumps?|warmtepomp\w*|pompes?[- ]a[- ]chaleur|pompe[- ]à[- ]chaleur|geotherm\w*|hybrid[- ]heat\w*|solar|zonnepane\w*)\b/i.test(itemText)) {
    return 'heat_pump';
  }
  if (/\b(emergenc\w*|urgent\w*|spoed\w*|d[eé]pannage|24\/7|notdienst)\b/i.test(itemText)) {
    return 'emergency';
  }
  if (/\b(leak\w*|waterlek\w*|lekdetect\w*|fuites?|unblock\w*|drain\w*|ontstop\w*|d[eé]bouch\w*|sewer|riool\w*)\b/i.test(itemText)) {
    return 'leak_repair';
  }
  if (/\b(water[- ]?heaters?|hot[- ]?water|warm[- ]?water|chauffe[- ]?eau|sanitair[- ]?warm\w*|boiler[- ]?tank)\b/i.test(itemText)) {
    return 'water_heater';
  }
  if (/\b(plumb\w*|plomb\w*|loodgieter\w*|sanitair\w*|sanitary|tap|faucet|toilet|sink|bathroom|badkamer)\b/i.test(itemText)) {
    return 'plumbing_install';
  }
  if (/\b(maintenance|entretien|onderhoud\w*|service[- ]?plan|inspection|check[- ]?up|tune[- ]?up|keuring\w*|attest\w*)\b/i.test(itemText)) {
    return /\b(boiler|ketel|chaudi[eè]re|heat\w*|chauffage|verwarming|hvac|bulex|vaillant|viessmann)\b/i.test(fullText)
      ? 'boiler_maintenance'
      : 'general_service';
  }
  if (/\b(install\w*|replace\w*|vervang\w*|plaatsing|nieuwe[- ]verwarming|montage|pose|gas[- ]?boilers?|condens\w*)\b/i.test(itemText)) {
    return /\b(boiler|ketel|chaudi[eè]re|heat\w*|chauffage|verwarming|gas|bulex|vaillant|viessmann)\b/i.test(fullText)
      ? 'boiler_install'
      : 'general_service';
  }
  if (/\b(heating[- ]?systems?|central[- ]?heating|radiator\w*|thermostat\w*|underfloor|vloerverwarming)\b/i.test(itemText)) {
    return 'heating_system';
  }
  if (/\b(boiler|ketel|chaudi[eè]re|heating|chauffage|verwarming|herstelling|r[eé]paration|hvac)\b/i.test(itemText)) {
    return 'boiler_repair';
  }
  if (/\b(electr\w*|wiring|panel|breaker|outlet|lighting|ev[- ]?charger|laadpaal)\b/i.test(fullText)) {
    return 'electrical';
  }
  if (/\b(clean\w*|nettoyage|schoonmaak|carpet|window|maid|housekeep\w*)\b/i.test(fullText)) {
    return 'cleaning';
  }
  if (/\b(dental|dentist|implant\w*|whitening|orthodont\w*|clinic|medical|physio\w*|osteopath\w*|therapy|dermatol\w*)\b/i.test(fullText)) {
    return 'clinical';
  }
  if (/\b(hair\w*|salon|barber|facial|massage|manicure|pedicure|lash\w*|brow\w*|spa|waxing)\b/i.test(fullText)) {
    return 'beauty';
  }
  // Strictly digital/tech terms — NEVER match generic "consultation" or "solutions"!
  if (/\b(seo|web[- ]?design|website|ppc|google[- ]?ads|branding|social[- ]?media|devops|cloud|saas|software|app[- ]?dev)\b/i.test(itemText)) {
    return 'digital';
  }
  if (/\b(legal|lawyer|attorney|notary|tax|accounting|bookkeep\w*|payroll)\b/i.test(fullText)) {
    return 'advisory';
  }
  return 'general_service';
}

/**
 * Returns a natural, pure-target-language noun phrase for an offering so we NEVER paste
 * untranslated foreign service titles (like "Heat pumps" or "Water Heaters & Hot Water")
 * into French, Dutch, German, Spanish, or Arabic sentences, nor awkward labels into English.
 */
export function getLocalizedOfferingPhrase(
  product: CatalogProduct,
  language: ReviewLanguage,
  offeringCtx?: OfferingVoiceContext | null
): string {
  if (offeringCtx?.localizedName?.trim()) {
    return offeringCtx.localizedName.trim();
  }
  const arch = classifyServiceArchetype(product);
  const map: Record<ServiceSubArchetype, Partial<Record<ReviewLanguage, string>>> = {
    heat_pump: {
      en: 'our heat pump installation',
      fr: 'notre pompe à chaleur',
      nl: 'onze warmtepomp',
      de: 'unsere Wärmepumpe',
      es: 'nuestra bomba de calor',
      ar: 'المضخة الحرارية',
      darija_latin: 'la pompe à chaleur',
    },
    boiler_maintenance: {
      en: 'our annual boiler service',
      fr: 'l’entretien annuel de notre chaudière',
      nl: 'het onderhoud van onze verwarmingsketel',
      de: 'die jährliche Heizungswartung',
      es: 'el mantenimiento anual de la caldera',
      ar: 'الصيانة الدورية للغلاية',
    },
    boiler_install: {
      en: 'our new condensing boiler installation',
      fr: 'l’installation de notre nouvelle chaudière',
      nl: 'de plaatsing van onze nieuwe condensatieketel',
      de: 'den Einbau unseres neuen Heizkessels',
      es: 'la instalación de nuestra nueva caldera',
      ar: 'تركيب الغلاية الجديدة',
    },
    boiler_repair: {
      en: 'our boiler repair',
      fr: 'la réparation de notre chaudière',
      nl: 'de herstelling van onze verwarmingsketel',
      de: 'die Heizungsreparatur',
      es: 'la reparación de la caldera',
      ar: 'إصلاح عطل التدفئة',
    },
    heating_system: {
      en: 'our central heating system',
      fr: 'notre chauffage central',
      nl: 'onze centrale verwarming',
      de: 'unsere Zentralheizung',
      es: 'nuestro sistema de calefacción',
    },
    water_heater: {
      en: 'our hot water heater',
      fr: 'notre chauffe-eau',
      nl: 'onze warmwaterboiler',
      de: 'unseren Warmwasserbereiter',
      es: 'nuestro calentador de agua',
    },
    leak_repair: {
      en: 'a water leak repair',
      fr: 'une réparation de fuite d’eau',
      nl: 'het herstellen van een waterlek',
      de: 'eine Wasserleck-Reparatur',
      es: 'la reparación de una fuga de agua',
    },
    plumbing_install: {
      en: 'our sanitary plumbing work',
      fr: 'nos travaux de plomberie sanitaire',
      nl: 'onze sanitaire leidingwerken',
      de: 'unsere Sanitärinstallation',
      es: 'nuestra instalación de fontanería',
    },
    emergency: {
      en: 'an urgent callout',
      fr: 'un dépannage en urgence',
      nl: 'een dringende interventie',
      de: 'einen dringenden Notdienst-Einsatz',
      es: 'una intervención de urgencia',
    },
    electrical: {
      en: 'our electrical work',
      fr: 'nos travaux électriques',
      nl: 'onze elektriciteitswerken',
      de: 'unsere Elektroarbeiten',
    },
    cleaning: {
      en: 'our deep cleaning session',
      fr: 'notre prestation de nettoyage',
      nl: 'onze grondige schoonmaakbeurt',
      de: 'unsere Grundreinigung',
    },
    clinical: {
      en: 'my appointment',
      fr: 'mon rendez-vous au cabinet',
      nl: 'mijn afspraak in de praktijk',
      de: 'meinen Praxistermin',
    },
    beauty: {
      en: 'my salon appointment',
      fr: 'mon soin au salon',
      nl: 'mijn behandeling in het salon',
      de: 'meine Behandlung im Studio',
    },
    digital: {
      en: 'our project',
      fr: 'notre projet digital',
      nl: 'ons digitale traject',
      de: 'unser Digitalprojekt',
    },
    advisory: {
      en: 'our consultation',
      fr: 'notre dossier',
      nl: 'ons adviesgesprek',
      de: 'unsere Beratung',
    },
    general_service: {
      en: 'this appointment',
      fr: 'cette intervention',
      nl: 'deze interventie',
      de: 'diesen Termin',
      es: 'este servicio',
      ar: 'هذه الخدمة',
      darija_latin: 'had l-khedma',
    },
  };
  return map[arch]?.[language] || map.general_service[language] || 'this service';
}

/**
 * Generates an offering-accurate detail sentence strictly matching the sub-service.
 */
export function getServiceSpecificSentence(
  product: CatalogProduct,
  language: ReviewLanguage,
  stars: number,
  offeringCtx?: OfferingVoiceContext | null
): string | null {
  if (stars <= 2) return null;

  if (offeringCtx?.actions?.length) {
    return pick(offeringCtx.actions);
  }

  const arch = classifyServiceArchetype(product);

  const banks: Partial<Record<ServiceSubArchetype, Partial<Record<ReviewLanguage, string[]>>>> = {
    boiler_repair: {
      en: [
        'He traced the pressure drop to a worn expansion vessel valve, replaced it on the spot, and tested every radiator.',
        'The technician cleared the ignition lockout, swapped out the faulty sensor, and verified steady hot water before leaving.',
        'Diagnosed the error code within fifteen minutes and had the heating running quietly again the same afternoon.',
      ],
      fr: [
        'Il a identifié la baisse de pression sur le vase d’expansion, remplacé la soupape usée et relancé la chaudière proprement.',
        'Diagnostic rapide sur le code d’erreur : capteur remplacé dans la foulée et chauffage testé sur tout l’étage.',
        'La panne d’allumage a été réglée dès le premier passage sans pousser au remplacement complet.',
      ],
      nl: [
        'Hij vond meteen de oorzaak van het drukverlies, verving de versleten klep en testte nadien zowel het warme water als de verwarming.',
        'De foutcode op de ketel werd snel uitgelezen en met een nieuwe ontstekingselektrode draait alles weer rustig.',
        'Binnen het uur was de storing verholpen zonder onnodige vervanging van onderdelen.',
      ],
    },
    boiler_maintenance: {
      en: [
        'He cleaned the burner assembly, checked flue gas readings, and handed over the official maintenance certificate right after.',
        'Thorough statutory inspection: seals checked, heat exchanger cleaned, and water pressure adjusted to 1.5 bar.',
        'Took the time to inspect every safety component during the annual tune-up and left the utility room spotless.',
      ],
      fr: [
        'Nettoyage complet du brûleur, contrôle de combustion et remise immédiate de l’attestation d’entretien réglementaire.',
        'Entretien périodique fait sérieusement : corps de chauffe nettoyé, pression ajustée et réglages vérifiés.',
        'Le chauffagiste a tout contrôlé méthodiquement et m’a remis le certificat officiel en fin de visite.',
      ],
      nl: [
        'De brander werd grondig gereinigd, de rookgassen gecontroleerd en ik kreeg meteen het officiële reinigingsattest mee.',
        'Tweejaarlijks ketelonderhoud netjes uitgevoerd met controle van alle dichtingen en een zuiniger afgestelde ketel.',
        'Zorgvuldig onderhoud volgens de regels in België, inclusief keuringsverslag en heldere tips.',
      ],
    },
    boiler_install: {
      en: [
        'The old unit was removed cleanly, the new condensing boiler and flue were fitted neatly, and they walked us through the thermostat.',
        'From sizing advice on the quote to commissioning the new condensing boiler, the pipework and finish look genuinely tidy.',
        'Installed our replacement gas condensing unit in a single day and hauled away the old appliance.',
      ],
      fr: [
        'Dépose de l’ancienne chaudière, pose du nouveau modèle à condensation et paramétrage du thermostat réalisés proprement sur la journée.',
        'Les raccords cuivre et l’évacuation des fumées sont impeccables, avec une mise en route expliquée étape par étape.',
        'Devis clair pour le remplacement de notre vieille installation et chantier laissé parfaitement propre le soir même.',
      ],
      nl: [
        'Onze verouderde ketel werd op één dag vlot vervangen door een nieuwe gascondensatieketel, inclusief nette afwerking van de rookgasafvoer.',
        'Heldere uitleg bij de offerte en na de plaatsing namen ze rustig de tijd om de slimme thermostaat samen in te stellen.',
        'Strak leidingwerk in de berging en het oude toestel werd meteen netjes meegenomen.',
      ],
    },
    heating_system: {
      en: [
        'He bled the upstairs loop, balanced the radiator lockshield valves, and every room now heats up evenly.',
        'Replaced two stuck thermostatic radiator valves and calibrated the zone thermostat so the top floor finally stays warm.',
      ],
      fr: [
        'Purge complète du circuit, équilibrage des radiateurs à l’étage et remplacement de deux vannes thermostatiques grippées.',
        'La chaleur se répartit enfin uniformément dans toutes les pièces depuis le réglage du circulateur.',
      ],
      nl: [
        'Het hele verwarmingscircuit werd ontlucht en de thermostatische kranen boven zijn opnieuw ingeregeld zodat elke kamer gelijkmatig opwarmt.',
        'Na het bijregelen van de circulatiepomp worden ook de radiatoren op zolder eindelijk weer goed warm.',
      ],
    },
    water_heater: {
      en: [
        'Descaled the hot water cylinder, replaced the dripping safety group, and water temperature is steady again.',
        'Installed the replacement domestic water heater cleanly and verified hot water flow at both bathroom taps.',
      ],
      fr: [
        'Détartrage complet du chauffe-eau et remplacement du groupe de sécurité qui gouttait : l’eau chaude est revenue aussitôt.',
        'Le nouveau ballon d’eau chaude chauffe vite et silencieusement, avec des raccords bien propres.',
      ],
      nl: [
        'De warmwaterboiler werd grondig ontkalkt en de lekkende veiligheidsgroep vervangen; we hebben weer volop warm water in de douche.',
        'Vlotte plaatsing van het nieuwe warmwatertoestel met nette aansluiting op de bestaande leidingen.',
      ],
    },
    leak_repair: {
      en: [
        'Located the seepage behind the kitchen cabinet without breaking tiles, fitted a new compression joint, and pressure-tested the line.',
        'Replaced the cracked trap and supply seal under the basin cleanly, avoiding water damage to the floor.',
      ],
      fr: [
        'Fuite localisée précisément sur le raccord encastré sans tout casser, joint refait et test d’étanchéité validé.',
        'Le plombier a remplacé le siphon fendu et le flexible sous l’évier en laissant le meuble sec et propre.',
      ],
      nl: [
        'Het lek aan de leiding werd zonder breekwerk opgespoord, vakkundig gedicht en meteen op druk getest.',
        'Gebarsten koppeling onder de wastafel snel vervangen voor er waterschade aan de vloer kon ontstaan.',
      ],
    },
    plumbing_install: {
      en: [
        'Fitted the new bathroom mixer taps, shutoff valves, and drain connections neatly with everything level and watertight.',
        'Completed the kitchen supply and waste pipework cleanly ahead of our cabinet fitting.',
      ],
      fr: [
        'Pose soignée de la nouvelle robinetterie, des vannes d’arrêt et des évacuations dans notre salle de bain rénovée.',
        'Les arrivées d’eau et évacuations de la cuisine ont été installées au millimètre et testées sous pression.',
      ],
      nl: [
        'Nieuwe mengkranen, stopkranen en afvoerleidingen in de badkamer keurig geplaatst en meteen op dichtheid gecontroleerd.',
        'Alle aan- en afvoerleidingen voor onze nieuwe keuken strak volgens plan aangelegd.',
      ],
    },
    heat_pump: {
      en: [
        'They ran a proper heat-loss calculation beforehand, positioned the outdoor unit quietly away from the patio, and tuned the heating curve.',
        'Clear guidance on hybrid heat pump sizing for our insulated home, followed by a clean two-day installation.',
      ],
      fr: [
        'Étude thermique sérieuse avant devis, unité extérieure posée discrètement et loi d’eau réglée avec soin pour notre plancher chauffant.',
        'Accompagnement clair sur le dimensionnement de la pompe à chaleur air-eau et mise en service très silencieuse.',
      ],
      nl: [
        'Vooraf een eerlijke warmteverliesberekening gekregen, buitenunit stil geplaatst en de stooklijn netjes afgesteld op onze vloerverwarming.',
        'Duidelijk advies over een hybride warmtepomp voor onze woning en een heel verzorgde oplevering.',
      ],
    },
    emergency: {
      en: [
        'Picked up right away in the evening, arrived within two hours, and isolated the fault safely with transparent callout pricing.',
        'Came out the same Saturday afternoon when we had zero hot water and got us running again without inflated emergency fees.',
      ],
      fr: [
        'Réponse téléphonique immédiate un soir de semaine, arrivée en moins de deux heures et dépannage efficace au tarif annoncé.',
        'Déplacement rapide en urgence le samedi après-midi pour sécuriser l’installation et rétablir l’eau chaude.',
      ],
      nl: [
        'S avonds meteen iemand aan de lijn gekregen, binnen twee uur stond de technieker binnen en was het acute probleem veilig verholpen.',
        'Snelle spoedinterventie op zaterdag zonder verrassingen op de factuur achteraf.',
      ],
    },
  };

  const list = banks[arch]?.[language] || banks[arch]?.en;
  return list && list.length > 0 ? pick(list) : null;
}

/**
 * Concise, natural 1-sentence human reviews (~15% of dataset) — zero mechanical service-label pasting!
 */
export function buildUltraShortReview(
  product: CatalogProduct,
  language: ReviewLanguage,
  stars: 1 | 2 | 3 | 4 | 5,
  serviceMode: boolean,
  offeringCtx?: OfferingVoiceContext | null
): { subject: string; body: string } | null {
  const localPhrase = getLocalizedOfferingPhrase(product, language, offeringCtx);

  if (serviceMode) {
    if (stars === 5) {
      const pool: Partial<Record<ReviewLanguage, Array<[string, string]>>> = {
        en: [
          ['Punctual and tidy', `Arrived right on time for ${localPhrase} and left everything spotless.`],
          ['Clear quote, clean work', 'Fair price agreed upfront, polite technician, and everything works properly now.'],
          ['Sorted on the first visit', 'Quick diagnosis, clear explanation, and no mess left behind.'],
          ['Reliable local team', `Handled ${localPhrase} smoothly from booking to completion.`],
        ],
        fr: [
          ['Ponctuel et soigné', `Horaire respecté pour ${localPhrase} et travail laissé parfaitement propre.`],
          ['Devis respecté', 'Technicien courtois, tarif annoncé à l’avance et intervention efficace.'],
          ['Réglé du premier coup', 'Diagnostic clair sur place et exécution rapide sans mauvaise surprise.'],
          ['Sérieux et efficace', `Très bon suivi pour ${localPhrase}, rien à redire.`],
        ],
        nl: [
          ['Stipt en verzorgd', `Netjes op tijd gekomen voor ${localPhrase} en alles proper achtergelaten.`],
          ['Correcte prijsafspraak', 'Vriendelijke vakman, duidelijke uitleg vooraf en vlot afgewerkt.'],
          ['Meteen in orde', 'Rustige aanpak, eerlijk advies en meteen goed opgelost bij het eerste bezoek.'],
          ['Betrouwbare vakman', `Heel vlotte afhandeling voor ${localPhrase}.`],
        ],
        de: [
          ['Pünktlich und sauber', `Zuverlässiger Termin für ${localPhrase} und faire Abrechnung.`],
          ['Klare Empfehlung', 'Freundlicher Techniker, saubere Ausführung und transparenter Preis.'],
        ],
      };
      const items = pool[language] || pool.en!;
      const [subject, body] = pick(items);
      return { subject, body };
    }
    if (stars === 4) {
      const pool: Partial<Record<ReviewLanguage, Array<[string, string]>>> = {
        en: [
          ['Good work overall', `Solid job on ${localPhrase}, even if arrival was about twenty minutes past the window.`],
          ['Competent technician', 'Workmanship was clean and the quote stayed fair; booking took a couple of days.'],
        ],
        fr: [
          ['Bon travail dans l’ensemble', `Prestation sérieuse pour ${localPhrase}, malgré un léger retard annoncé par téléphone.`],
          ['Intervention propre', 'Travail soigné et tarif respecté, juste un petit délai pour obtenir un créneau.'],
        ],
        nl: [
          ['Degelijk uitgevoerd', `Goed geholpen voor ${localPhrase}, al liep het geplande tijdslot een halfuurtje uit.`],
          ['Tevreden over het vakwerk', 'Keurig werk geleverd tegen de afgesproken prijs, enkel even wachten op een vrij moment.'],
        ],
      };
      const items = pool[language] || pool.en!;
      const [subject, body] = pick(items);
      return { subject, body };
    }
    if (stars === 3) {
      const pool: Partial<Record<ReviewLanguage, Array<[string, string]>>> = {
        en: [['Decent work, slow scheduling', `The technical work for ${localPhrase} was fine, though getting a confirmed time slot took longer than expected.`]],
        fr: [['Travail correct mais délai long', `L’intervention pour ${localPhrase} a été bien faite, mais il a fallu relancer pour fixer le rendez-vous.`]],
        nl: [['Werk in orde, planning kon vlotter', `Technisch prima uitgevoerd voor ${localPhrase}, alleen duurde het vrij lang voor de afspraak vastlag.`]],
      };
      const items = pool[language] || pool.en!;
      const [subject, body] = pick(items);
      return { subject, body };
    }
    if (stars <= 2) {
      const pool: Partial<Record<ReviewLanguage, Array<[string, string]>>> = {
        en: [['Appointment rescheduled twice', `Our slot for ${localPhrase} was pushed back twice before someone could attend, which made planning difficult.`]],
        fr: [['Rendez-vous décalé deux fois', `Le créneau prévu pour ${localPhrase} a été reporté à deux reprises, ce qui est compliqué quand on pose congé.`]],
        nl: [['Tijdslot twee keer verplaatst', `Onze afspraak voor ${localPhrase} werd helaas twee keer verschoven voordat er iemand kon langskomen.`]],
      };
      const items = pool[language] || pool.en!;
      const [subject, body] = pick(items);
      return { subject, body };
    }
  } else if (stars === 5) {
    const pool: Partial<Record<ReviewLanguage, Array<[string, string]>>> = {
      en: [
        ['Solid quality', 'Matches the description well and arrived carefully packed on schedule.'],
        ['Happy with this purchase', 'Build quality feels sturdy in daily use and setup was straightforward.'],
      ],
      fr: [
        ['Bonne qualité', 'Conforme à la fiche descriptive et reçu dans les délais annoncés.'],
        ['Satisfait de mon achat', 'Finitions propres et utilisation simple au quotidien.'],
      ],
      nl: [
        ['Degelijke kwaliteit', 'Voldoet precies aan de beschrijving en werd netjes op tijd geleverd.'],
        ['Blij met de aankoop', 'Voelt stevig aan in dagelijks gebruik, geen enkel minpunt tot nu toe.'],
      ],
    };
    const items = pool[language] || pool.en!;
    const [subject, body] = pick(items);
    return { subject, body };
  }

  return null;
}

export const EXTRA_DIVERSE_SUBJECTS: Partial<Record<ReviewLanguage, Record<1 | 2 | 3 | 4 | 5, string[]>>> = {
  en: {
    5: ['Clear diagnosis and tidy work', 'On time and straightforward', 'Solved on the first visit', 'Honest advice, fair quote', 'Clean workmanship', 'Prompt and methodical', 'Smooth appointment from start to finish', 'Very thorough work'],
    4: ['Good work, slight delay', 'Reliable technician overall', 'Happy with the outcome', 'Clean job once scheduled', 'Fair pricing and polite'],
    3: ['Fine once booked', 'Work was okay, slow follow-up', 'Competent work but long wait', 'Average scheduling experience'],
    2: ['Rescheduled twice', 'Wait time was frustrating', 'Hard to get updates before arrival'],
    1: ['Missed the agreed window', 'Too difficult to confirm a slot'],
  },
  fr: {
    5: ['Diagnostic clair et travail propre', 'Ponctuel et méthodique', 'Réglé dès le premier passage', 'Devis transparent, sans surprise', 'Intervention soignée', 'Explications claires sur place', 'Équipe sérieuse et ponctuelle', 'Travail net et précis'],
    4: ['Bon travail malgré un léger retard', 'Intervention sérieuse dans l’ensemble', 'Satisfait du résultat final', 'Tarif correct et technicien poli'],
    3: ['Travail correct mais attente longue', 'Résultat convenable, suivi lent', 'Prestation ok une fois planifiée'],
    2: ['Créneau reporté deux fois', 'Délai d’attente contraignant', 'Manque de suivi sur l’horaire'],
    1: ['Plage horaire non respectée', 'Planification trop compliquée'],
  },
  nl: {
    5: ['Heldere uitleg en net vakwerk', 'Stipt op de afgesproken tijd', 'Meteen verholpen bij eerste bezoek', 'Duidelijke offerte zonder verrassingen', 'Zorgvuldig en proper gewerkt', 'Vriendelijke en kundige technieker', 'Vlotte afspraak en degelijk werk', 'Keurige afwerking'],
    4: ['Goed vakwerk, iets later dan gepland', 'Over het algemeen heel tevreden', 'Nette uitvoering en eerlijke prijs', 'Betrouwbare aanpak'],
    3: ['Uitvoering oké, lange wachttijd', 'Degelijk werk maar trage planning', 'Redelijke ervaring zodra ingepland'],
    2: ['Afspraak twee keer verzet', 'Communicatie over het tijdslot kon beter'],
    1: ['Afgesproken uren niet gehaald', 'Moeilijk om een vast moment te krijgen'],
  },
};

/**
 * Clean natural formatting polisher — NEVER introduces artificial spelling mistakes or chat slang!
 * Fixes accidental double spaces, mid-sentence capital splices, and missing terminal punctuation.
 */
export function applyHumanImperfections(
  subject: string,
  body: string,
  _language: ReviewLanguage
): { subject: string; body: string } {
  const cleanSubject = subject
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/\.+$/, '')
    .trim();

  let cleanBody = body
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([.!?])\s*\./g, '$1')
    .replace(/([a-zà-ÿ])\s+\.\s+/gi, '$1. ')
    .trim();

  if (cleanBody.length > 0 && !/[.!?؟。]$/.test(cleanBody)) {
    cleanBody += '.';
  }

  return { subject: cleanSubject, body: cleanBody };
}

function cleanCompanyName(raw?: string): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/\(built-in\)/gi, '')
    .replace(/custom business catalog/gi, '')
    .replace(/^www\./i, '')
    .replace(/\.(com|be|nl|fr|org|net|io|co\.uk|de|ch|ma)$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  if (cleaned.length < 2 || cleaned.length > 48) return '';
  return cleaned;
}

function pickUniqueSentence(arr: string[], usedSentences?: Set<string>): string | null {
  if (arr.length === 0) return null;
  if (!usedSentences) return pick(arr);
  const unused = arr.filter((s) => !usedSentences.has(s.toLowerCase()));
  if (unused.length === 0) return null;
  const chosen = pick(unused);
  usedSentences.add(chosen.toLowerCase());
  return chosen;
}

/**
 * Builds a grounded, non-repetitive, offering-accurate multi-sentence customer review:
 * 1) Prefers AI-scanned `offeringContext` (works dynamically for ANY business/URL!).
 * 2) Falls back to strictly separated sub-archetypes in keyless mode.
 * 3) Enforces star-to-sentiment honesty and caps company-name mentions to <= 12%.
 */
export function buildDetailedServiceStory(
  product: CatalogProduct,
  language: ReviewLanguage,
  stars: 1 | 2 | 3 | 4 | 5,
  companyName?: string,
  usedSentences?: Set<string>,
  offeringCtx?: OfferingVoiceContext | null
): { subject: string; body: string } | null {
  if (stars <= 3) return null; // Keep 1-3★ on dedicated neutral/critical paths so 3★ never gets 5★ praise!

  const company = cleanCompanyName(companyName);

  // Path A: AI-scanned per-offering context (100% tailored to ANY scanned URL & offering!)
  if (
    offeringCtx &&
    offeringCtx.scenarios?.length > 0 &&
    offeringCtx.actions?.length > 0 &&
    offeringCtx.outcomes?.length > 0
  ) {
    const s1 = pickUniqueSentence(offeringCtx.scenarios, usedSentences);
    const s2 = pickUniqueSentence(offeringCtx.actions, usedSentences);
    const s3 = pickUniqueSentence(offeringCtx.outcomes, usedSentences);
    if (s1 && s2) {
      const parts = [s1, s2];
      if (s3 && Math.random() < 0.7) parts.push(s3);
      if (stars === 4) {
        const nuance =
          language === 'fr'
            ? 'Il a fallu patienter quelques jours pour avoir un créneau, mais le résultat vaut l’attente.'
            : language === 'nl'
            ? 'Het duurde een paar dagen voor er plek was in de agenda, maar het werk zelf is keurig uitgevoerd.'
            : 'Getting a slot took a couple of days, though the work itself was handled very cleanly.';
        parts.push(nuance);
      } else if (company && Math.random() < 0.12) {
        const mention =
          language === 'fr'
            ? `Bon premier contact avec ${company}, nous gardons leurs coordonnées.`
            : language === 'nl'
            ? `Fijne eerste ervaring met ${company}.`
            : `Good first experience with ${company}.`;
        parts.push(mention);
      }
      const subjPool = EXTRA_DIVERSE_SUBJECTS[language]?.[stars] || EXTRA_DIVERSE_SUBJECTS.en![stars];
      return applyHumanImperfections(pick(subjPool), parts.join(' '), language);
    }
  }

  if (!['en', 'fr', 'nl'].includes(language)) return null;

  const arch = classifyServiceArchetype(product);
  const localPhrase = getLocalizedOfferingPhrase(product, language, offeringCtx);

  type ArchetypeStory = { scenarios: string[]; actions: string[]; outcomes: string[] };
  const storyMap: Partial<Record<ServiceSubArchetype, Record<'en' | 'fr' | 'nl', ArchetypeStory>>> = {
    boiler_repair: {
      en: {
        scenarios: [
          'Our boiler dropped to zero bar overnight and locked out with an error code before breakfast.',
          'Hot water kept cutting out mid-shower while the boiler made a metallic rattling sound.',
          'The central heating stopped firing right as temperatures dipped over the weekend.',
        ],
        actions: [
          'The technician tested the expansion vessel, replaced the worn pressure sensor, and bled the circuit.',
          'He traced the fault to a sticking diverter valve, fitted the replacement part from his van, and checked flue safety.',
          'After checking the ignition electrode and cleaning the condensate trap, he ran two full heating cycles.',
        ],
        outcomes: [
          'Pressure has stayed rock steady for weeks now and he explained clearly what caused the fault.',
          'Quote was confirmed before starting and the utility area was left completely tidy.',
        ],
      },
      fr: {
        scenarios: [
          'Notre chaudière affichait un code d’erreur au réveil avec une pression retombée sous 0,5 bar.',
          'Plus d’eau chaude sous la douche depuis la veille et le brûleur refusait de se relancer.',
          'La chaudière se mettait en sécurité toutes les deux heures dès que le chauffage démarrait.',
        ],
        actions: [
          'Le chauffagiste a contrôlé le vase d’expansion, remplacé la vanne trois voies défectueuse et purgé le réseau.',
          'Il a testé la sonde de pression, changé l’électrode d’allumage usée et vérifié la stabilité de l’eau chaude.',
          'Après nettoyage du siphon des condensats et réglage de la pression, il a testé l’installation pendant vingt minutes.',
        ],
        outcomes: [
          'Le tarif a été annoncé avant réparation et nous n’avons plus eu la moindre coupure depuis.',
          'Explications claires sans pousser au remplacement de l’appareil.',
        ],
      },
      nl: {
        scenarios: [
          'Onze ketel sprong s ochtends telkens in veiligheid met een knipperende foutcode en koude kranen.',
          'De waterdruk op het display zakte elke dag weg waardoor de verwarming niet meer aansloeg.',
          'Tijdens het douchen viel het warme water telkens na twee minuten weg.',
        ],
        actions: [
          'De technieker meette het expansievat na, verving de defecte druksensor en ontluchtte het circuit.',
          'Hij verving de versleten driewegklep met een wisselstuk uit de wagen en controleerde alle aansluitingen.',
          'Na het reinigen van de sifon en het afstellen van de ontsteking draaide het toestel meteen weer stil.',
        ],
        outcomes: [
          'Vooraf een duidelijke prijsafspraak gekregen en intussen draait alles al weken stabiel.',
          'Fijn dat hij rustig uitlegde waar de storing vandaan kwam zonder iets op te dringen.',
        ],
      },
    },
    boiler_maintenance: {
      en: {
        scenarios: [
          'Booked our biennial statutory boiler inspection ahead of the autumn heating season.',
          'Scheduled a routine preventive boiler checkup required for our home insurance and rental lease.',
        ],
        actions: [
          'The technician brushed down the burner, cleaned the heat exchanger, and ran a full flue-gas analyzer check.',
          'He inspected all seals, topped up system pressure, and emailed the official inspection certificate on the spot.',
        ],
        outcomes: [
          'Whole visit took about an hour, price matched the fixed maintenance tariff, and everything was left clean.',
          'Good to have the compliance paperwork sorted with clear advice for next winter.',
        ],
      },
      fr: {
        scenarios: [
          'Rendez-vous pris avant l’automne pour l’entretien légal de notre chaudière gaz.',
          'Nous devions faire réaliser le contrôle périodique obligatoire avec remise d’attestation.',
        ],
        actions: [
          'Le technicien a démonté et nettoyé le brûleur, vérifié les gaz de combustion et contrôlé chaque joint.',
          'Nettoyage complet du corps de chauffe, appoint de pression et envoi immédiat du certificat officiel.',
        ],
        outcomes: [
          'Intervention ponctuelle au forfait convenu et chaufferie laissée impeccable.',
          'Pratique d’avoir reçu l’attestation officielle directement en fin de visite.',
        ],
      },
      nl: {
        scenarios: [
          'Afspraak ingepland voor het verplichte tweejaarlijkse onderhoud van onze gasketel voor de winter.',
          'Voor onze brandverzekering en verhuur hadden we een officieel reinigings- en verbrandingsattest nodig.',
        ],
        actions: [
          'De technieker reinigde de brander en warmtewisselaar grondig en voerde een rookgasmeting uit.',
          'Alle dichtingen en beveiligingen werden nagekeken en ik ontving meteen het wettelijke keuringsattest.',
        ],
        outcomes: [
          'Stipt op tijd en exact volgens het afgesproken onderhoudstarief afgerekend.',
          'De ketel draait merkbaar stiller na het onderhoud en alle documenten zijn netjes in orde.',
        ],
      },
    },
    boiler_install: {
      en: {
        scenarios: [
          'After fifteen years with an inefficient non-condensing unit, we decided to upgrade to a modern gas condensing boiler.',
          'During our utility room renovation we wanted our aging boiler replaced with a compact wall-hung condensing model.',
        ],
        actions: [
          'They sent an itemized quote first, removed the old unit, adapted the flue pipework, and commissioned the new boiler in one day.',
          'Pipe routing was finished neatly in copper, magnetic filter installed, and they set up the modulating room thermostat with us.',
        ],
        outcomes: [
          'Hot water heats up much faster now and gas consumption has already dropped noticeably.',
          'Clean installation from quote to handover with zero surprise extras on the invoice.',
        ],
      },
      fr: {
        scenarios: [
          'Nous souhaitions remplacer notre vieille chaudière de quinze ans par un modèle gaz à condensation plus sobre.',
          'Dans le cadre de nos travaux, nous cherchions un chauffagiste sérieux pour poser une nouvelle chaudière murale.',
        ],
        actions: [
          'Après un devis détaillé, l’équipe a déposé l’ancien appareil, adapté le tubage et mis en service la nouvelle chaudière sur la journée.',
          'Pose très propre avec filtre magnétique, raccords soignés et explications complètes sur le thermostat modulant.',
        ],
        outcomes: [
          'La maison chauffe plus vite en consommant nettement moins et l’ancien matériel a été repris.',
          'Facture identique au devis signé et chantier laissé nickel.',
        ],
      },
      nl: {
        scenarios: [
          'Onze oude verwarmingsketel van zestien jaar was aan vervanging toe en we wilden overschakelen op een zuinige condensatieketel.',
          'Bij de vernieuwing van onze technische ruimte zochten we een vakman voor de plaatsing van een nieuwe wandketel.',
        ],
        actions: [
          'Eerst kwamen ze langs voor een heldere offerte op maat, waarna de oude ketel en rookgasafvoer op één dag netjes werden vervangen.',
          'De leidingen en vuilafscheider zijn strak gemonteerd en de modulerende thermostaat werd samen met ons ingesteld.',
        ],
        outcomes: [
          'Het toestel is fluisterstil en ons gasverbruik ligt nu al merkbaar lager.',
          'Alles volgens offerte afgewerkt en het oude toestel meteen meegenomen.',
        ],
      },
    },
    heat_pump: {
      en: {
        scenarios: [
          'While renovating our house with underfloor heating, we wanted an air-to-water heat pump sized properly for Belgian winters.',
          'We asked for technical advice on switching from gas to a hybrid heat pump setup.',
        ],
        actions: [
          'They completed a room-by-room heat-loss study, mounted the outdoor unit on anti-vibration feet, and configured the weather-compensated curve.',
          'Both indoor hydrobox and outdoor unit were installed neatly over two days with clear explanations of the app controls.',
        ],
        outcomes: [
          'Indoor temperature stays comfortable day and night and you barely hear the outdoor fan.',
          'Appreciated the realistic efficiency projections before we committed.',
        ],
      },
      fr: {
        scenarios: [
          'Pour notre rénovation avec chauffage sol, nous voulions installer une pompe à chaleur air-eau bien dimensionnée.',
          'Nous cherchions un avis technique honnête pour passer sur une pompe à chaleur hybride.',
        ],
        actions: [
          'Étude de déperdition précise avant devis, pose de l’unité extérieure sur plots anti-vibrations et réglage fin de la loi d’eau.',
          'Installation complète du module hydraulique et de l’unité extérieure en deux jours avec prise en main de la régulation.',
        ],
        outcomes: [
          'Confort thermique très stable dans toute la maison et niveau sonore extérieur bluffant de discrétion.',
          'Conseils honnêtes sur le dimensionnement sans promesses exagérées.',
        ],
      },
      nl: {
        scenarios: [
          'Bij onze verbouwing met vloerverwarming wilden we overstappen op een lucht-waterwarmtepomp.',
          'We zochten eerlijk technisch advies over het combineren van onze isolatie met een hybride warmtepomp.',
        ],
        actions: [
          'Na een grondige warmteverliesberekening plaatsten ze de buitenunit op trillingsdempers en stelden ze de stooklijn nauwkeurig in.',
          'Zowel de binnenmodule als de buitenunit werden in twee dagen strak geïnstalleerd met duidelijke uitleg over de regeling.',
        ],
        outcomes: [
          'Constante aangename warmte in huis en de buitenunit hoor je in de tuin nauwelijks draaien.',
          'Fijn dat ze realistisch rekenden in plaats van een te zwaar systeem te verkopen.',
        ],
      },
    },
    leak_repair: {
      en: {
        scenarios: [
          'We noticed a damp patch spreading along the hallway wall near the downstairs bathroom.',
          'Water started pooling inside the kitchen sink cabinet every time the dishwasher drained.',
        ],
        actions: [
          'The plumber pinpointed the weeping copper elbow with acoustic detection, replaced the fitting cleanly, and pressure-tested the pipe.',
          'He swapped the split drain manifold and perished washer in forty minutes without damaging the cabinetry.',
        ],
        outcomes: [
          'Completely dry ever since and he left a clear report we could forward to our insurer.',
        ],
      },
      fr: {
        scenarios: [
          'Une auréole d’humidité apparaissait sur la cloison mitoyenne de la salle de douche.',
          'De l’eau s’accumulait sous le meuble d’évier à chaque ouverture du robinet.',
        ],
        actions: [
          'Le plombier a détecté le raccord fuyard sans démolir le carrelage, refait la soudure et testé la conduite sous pression.',
          'Remplacement rapide du joint fibre et du flexible abîmé avec vérification complète des évacuations.',
        ],
        outcomes: [
          'Plus une goutte depuis son passage et rapport d’intervention clair pour notre assurance.',
        ],
      },
      nl: {
        scenarios: [
          'Er verscheen plots een vochtplek onderaan de muur naast onze badkamer.',
          'Onder het aanrecht stond telkens een plasje water zodra we de kraan of vaatwasser gebruikten.',
        ],
        actions: [
          'Met lekdetectie vond de loodgieter snel de lekkende koppeling zonder tegels uit te breken en herstelde de leiding netjes.',
          'Hij verving de gescheurde afvoerdichting en versleten flexibele slang en controleerde daarna alle aansluitingen op druk.',
        ],
        outcomes: [
          'Sindsdien kurkdroog gebleven en een duidelijk verslag gekregen voor de verzekering.',
        ],
      },
    },
    plumbing_install: {
      en: {
        scenarios: [
          'Needed new water supply lines, shutoff valves, and sanitary hookups installed for our utility room.',
          'Booked a plumber to fit a new thermostatic shower mixer, basin tap, and wall-hung toilet frame.',
        ],
        actions: [
          'All pipework was clipped squarely, shutoff valves labeled, and every joint tested before closing the panel.',
          'Mounted the fixtures cleanly, sealed the edges neatly, and checked flow and drainage across the bathroom.',
        ],
        outcomes: [
          'Tidy finish and straightforward invoicing matching the written estimate.',
        ],
      },
      fr: {
        scenarios: [
          'Nous avions besoin de faire poser de nouvelles arrivées d’eau, vannes d’arrêt et raccords pour notre buanderie.',
          'Intervention demandée pour installer un mitigeur thermostatique, un lavabo et un bâti-support WC.',
        ],
        actions: [
          'Tuyauterie fixée proprement, vannes repérées et test d’étanchéité complet avant fermeture du coffrage.',
          'Pose soignée des équipements sanitaires avec joints propres et contrôle du débit.',
        ],
        outcomes: [
          'Finitions nettes et facture conforme au devis initial.',
        ],
      },
      nl: {
        scenarios: [
          'Voor onze vernieuwde wasplaats moesten nieuwe waterleidingen, dubbeldienstkranen en een afvoer worden aangelegd.',
          'We schakelden hen in voor het plaatsen van een nieuw inbouwtoilet, wastafelkraan en thermostatische douchekraan.',
        ],
        actions: [
          'Alle leidingen zijn recht en overzichtelijk gemonteerd en voor het dichtmaken grondig op druk getest.',
          'Het sanitair werd waterpas geplaatst, netjes afgekit en meteen getest op vlotte afvoer.',
        ],
        outcomes: [
          'Verzorgd resultaat en exact afgerekend zoals op de offerte stond.',
        ],
      },
    },
  };

  const langKey = language as 'en' | 'fr' | 'nl';
  const entry = storyMap[arch]?.[langKey];
  if (!entry) {
    // Clean general fallback without foreign-label insertion
    const genScenarios =
      langKey === 'fr'
        ? [`Nous avons pris rendez-vous pour ${localPhrase} et l’organisation a été simple dès le premier appel.`]
        : langKey === 'nl'
        ? [`We maakten een afspraak voor ${localPhrase} en kregen vooraf meteen een duidelijk tijdslot door.`]
        : [`We scheduled an appointment for ${localPhrase} and got a clear confirmation window right away.`];
    const genActions =
      langKey === 'fr'
        ? ['Le spécialiste a pris le temps d’expliquer les étapes sur place et a travaillé avec soin.']
        : langKey === 'nl'
        ? ['De vakman legde ter plaatse rustig uit wat hij ging doen en werkte alles netjes af.']
        : ['The specialist walked us through the work beforehand and completed everything methodically.'];
    const s1 = pickUniqueSentence(genScenarios, usedSentences);
    const s2 = pickUniqueSentence(genActions, usedSentences);
    if (!s1 || !s2) return null;
    const subjPool = EXTRA_DIVERSE_SUBJECTS[language]?.[stars] || EXTRA_DIVERSE_SUBJECTS.en![stars];
    return applyHumanImperfections(pick(subjPool), `${s1} ${s2}`, language);
  }

  const s1 = pickUniqueSentence(entry.scenarios, usedSentences);
  const s2 = pickUniqueSentence(entry.actions, usedSentences);
  const s3 = pickUniqueSentence(entry.outcomes, usedSentences);
  if (!s1 || !s2) return null;

  const parts = [s1, s2];
  if (s3) parts.push(s3);
  if (stars === 4) {
    parts.push(
      langKey === 'fr'
        ? 'Seul petit bémol : un léger décalage d’horaire le matin, mais annoncé par téléphone.'
        : langKey === 'nl'
        ? 'Enige kleine minpuntje was dat het tijdslot iets uitliep, al belden ze netjes vooraf.'
        : 'Only minor note was a short delay on arrival, though they called ahead to let us know.'
    );
  } else if (company && Math.random() < 0.12) {
    parts.push(
      langKey === 'fr'
        ? `Bon suivi de la part de ${company}.`
        : langKey === 'nl'
        ? `Correcte opvolging door ${company}.`
        : `Straightforward experience with ${company}.`
    );
  }

  const subjPool = EXTRA_DIVERSE_SUBJECTS[language]?.[stars] || EXTRA_DIVERSE_SUBJECTS.en![stars];
  return applyHumanImperfections(pick(subjPool), parts.join(' '), language);
}
