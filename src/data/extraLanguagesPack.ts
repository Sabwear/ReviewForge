import { BusinessLanguageTokens, BusinessStarPool } from '../types/reviews';

export type NewExtraLanguage =
  | 'sv'
  | 'no'
  | 'da'
  | 'el'
  | 'ro'
  | 'cs'
  | 'uk'
  | 'id'
  | 'vi'
  | 'th'
  | 'ms'
  | 'he';

export const NEW_EXTRA_NAMES: Record<
  NewExtraLanguage,
  { first: string[]; last: string[]; domains: string[] }
> = {
  sv: {
    first: ['erik', 'oscar', 'lucas', 'maja', 'alice', 'astrid', 'viktor', 'elin', 'filip', 'klara', 'hugo', 'ebba'],
    last: ['andersson', 'johansson', 'karlsson', 'nilsson', 'eriksson', 'larsson', 'olsson', 'persson', 'svensson', 'lindberg'],
    domains: ['gmail.com', 'telia.com', 'outlook.se', 'icloud.com', 'hotmail.se'],
  },
  no: {
    first: ['oliver', 'jakob', 'emil', 'nora', 'emma', 'sofie', 'henrik', 'ingrid', 'sander', 'maja', 'kristian', 'linnea'],
    last: ['hansen', 'johansen', 'olsen', 'larsen', 'andersen', 'pedersen', 'nilsen', 'kristiansen', 'jensen', 'karlsen'],
    domains: ['gmail.com', 'online.no', 'outlook.com', 'icloud.com', 'hotmail.no'],
  },
  da: {
    first: ['william', 'noah', 'oscar', 'emma', 'alma', 'clara', 'mikkel', 'freja', 'kasper', 'sofie', 'mads', 'ida'],
    last: ['nielsen', 'jensen', 'hansen', 'pedersen', 'andersen', 'christensen', 'larsen', 'sorensen', 'rasmussen', 'jorgensen'],
    domains: ['gmail.com', 'mail.dk', 'live.dk', 'outlook.dk', 'icloud.com'],
  },
  el: {
    first: ['nikos', 'giorgos', 'kostas', 'maria', 'eleni', 'katerina', 'dimitris', 'sofia', 'alexis', 'anna', 'petros', 'ioanna'],
    last: ['papadopoulos', 'vlahos', 'nikolaou', 'georgiou', 'pappas', 'christodoulou', 'oikonomou', 'vasiliou', 'karagiannis', 'petrou'],
    domains: ['gmail.com', 'otenet.gr', 'yahoo.gr', 'outlook.com', 'icloud.com'],
  },
  ro: {
    first: ['andrei', 'alexandru', 'mihai', 'maria', 'elena', 'ioana', 'stefan', 'andreea', 'cristian', 'ana', 'vlad', 'diana'],
    last: ['popescu', 'ionescu', 'popa', 'radu', 'dumitru', 'stan', 'stoica', 'gheorghe', 'matei', 'ciobanu'],
    domains: ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'],
  },
  cs: {
    first: ['jakub', 'jan', 'tomas', 'eliska', 'tereza', 'anna', 'martin', 'adela', 'lukas', 'natalie', 'petr', 'karolina'],
    last: ['novak', 'svoboda', 'novotny', 'dvorak', 'cerny', 'prochazka', 'kucera', 'vesely', 'horak', 'nemec'],
    domains: ['seznam.cz', 'gmail.com', 'email.cz', 'centrum.cz', 'outlook.cz'],
  },
  uk: {
    first: ['oleksandr', 'dmytro', 'andriy', 'anna', 'sofia', 'maria', 'maksym', 'olena', 'artem', 'kateryna', 'ivan', 'daria'],
    last: ['melnyk', 'shevchenko', 'kovalenko', 'bondarenko', 'boiko', 'tkachenko', 'kravchenko', 'oliinyk', 'shevchuk', 'polischuk'],
    domains: ['gmail.com', 'ukr.net', 'i.ua', 'outlook.com', 'icloud.com'],
  },
  id: {
    first: ['budi', 'andi', 'rizky', 'putri', 'siti', 'dewi', 'dimas', 'ayu', 'fajar', 'nadia', 'arif', 'ratna'],
    last: ['santoso', 'wijaya', 'pratama', 'saputra', 'hidayat', 'setiawan', 'kusuma', 'nugroho', 'rahman', 'utami'],
    domains: ['gmail.com', 'yahoo.co.id', 'outlook.com', 'icloud.com'],
  },
  vi: {
    first: ['minh', 'anh', 'huy', 'linh', 'trang', 'thao', 'nam', 'ngoc', 'duc', 'huong', 'tuan', 'mai'],
    last: ['nguyen', 'tran', 'le', 'pham', 'hoang', 'huynh', 'phan', 'vu', 'vo', 'dang'],
    domains: ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com'],
  },
  th: {
    first: ['somchai', 'nattapong', 'kittisak', 'ploi', 'pim', 'may', 'bank', 'fern', 'earth', 'mint', 'boss', 'beam'],
    last: ['srisuk', 'charoen', 'wongsa', 'chaiyaporn', 'suksai', 'rattana', 'thanasak', 'boonmee', 'kittikorn', 'phanich'],
    domains: ['gmail.com', 'hotmail.com', 'outlook.co.th', 'icloud.com'],
  },
  ms: {
    first: ['amir', 'farhan', 'hafiz', 'aisyah', 'nurul', 'farah', 'danial', 'syafiq', 'hana', 'iman', 'hakim', 'nadia'],
    last: ['abdullah', 'rahman', 'hassan', 'ismail', 'ibrahim', 'yusof', 'othman', 'razak', 'zainal', 'aziz'],
    domains: ['gmail.com', 'outlook.my', 'hotmail.com', 'icloud.com'],
  },
  he: {
    first: ['noam', 'uri', 'itay', 'maya', 'tamar', 'noa', 'daniel', 'yael', 'omer', 'shira', 'amit', 'ron'],
    last: ['cohen', 'levi', 'mizrahi', 'peretz', 'biton', 'dahan', 'avraham', 'friedman', 'malka', 'azulay'],
    domains: ['gmail.com', 'walla.co.il', 'outlook.co.il', 'icloud.com'],
  },
};

export const NEW_EXTRA_SURNAMES: Record<NewExtraLanguage, string[]> = {
  sv: ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson', 'Larsson', 'Olsson', 'Persson', 'Svensson', 'Lindberg'],
  no: ['Hansen', 'Johansen', 'Olsen', 'Larsen', 'Andersen', 'Pedersen', 'Nilsen', 'Kristiansen', 'Jensen', 'Karlsen'],
  da: ['Nielsen', 'Jensen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen', 'Sørensen', 'Rasmussen', 'Jørgensen'],
  el: ['Papadopoulos', 'Vlahos', 'Nikolaou', 'Georgiou', 'Pappas', 'Christodoulou', 'Oikonomou', 'Vasiliou', 'Karagiannis', 'Petrou'],
  ro: ['Popescu', 'Ionescu', 'Popa', 'Radu', 'Dumitru', 'Stan', 'Stoica', 'Gheorghe', 'Matei', 'Ciobanu'],
  cs: ['Novák', 'Svoboda', 'Novotný', 'Dvořák', 'Černý', 'Procházka', 'Kučera', 'Veselý', 'Horák', 'Němec'],
  uk: ['Melnyk', 'Shevchenko', 'Kovalenko', 'Bondarenko', 'Boiko', 'Tkachenko', 'Kravchenko', 'Oliinyk', 'Shevchuk', 'Polishchuk'],
  id: ['Santoso', 'Wijaya', 'Pratama', 'Saputra', 'Hidayat', 'Setiawan', 'Kusuma', 'Nugroho', 'Rahman', 'Utami'],
  vi: ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'],
  th: ['Srisuk', 'Charoen', 'Wongsa', 'Chaiyaporn', 'Suksai', 'Rattana', 'Thanasak', 'Boonmee', 'Kittikorn', 'Phanich'],
  ms: ['Abdullah', 'Rahman', 'Hassan', 'Ismail', 'Ibrahim', 'Yusof', 'Othman', 'Razak', 'Zainal', 'Aziz'],
  he: ['Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Dahan', 'Avraham', 'Friedman', 'Malka', 'Azulay'],
};

export const NEW_EXTRA_FALLBACK_REF: Record<NewExtraLanguage, string> = {
  sv: 'den här produkten',
  no: 'dette produktet',
  da: 'dette produkt',
  el: 'αυτό το προϊόν',
  ro: 'acest produs',
  cs: 'tento produkt',
  uk: 'цей варіант',
  id: 'produk ini',
  vi: 'sản phẩm này',
  th: 'รายการนี้',
  ms: 'produk ini',
  he: 'המוצר הזה',
};

export const NEW_EXTRA_TOKENS: Record<NewExtraLanguage, BusinessLanguageTokens> = {
  sv: {
    contextA: ['vardagen', 'jobbet', 'en present', 'hemma', 'min dagliga rutin'],
    contextB: ['kvaliteten', 'detaljerna', 'snabb hantering', 'prisvärdheten', 'tydlig kommunikation'],
    duration: ['två veckor', 'nästan en månad', 'tre veckor', 'några dagar'],
    timeframe: ['2 dagar', '48 timmar', '3 arbetsdagar', '24 timmar'],
  },
  no: {
    contextA: ['hverdagen', 'jobben', 'en gave', 'hjemme', 'min ukentlige rutine'],
    contextB: ['kvaliteten', 'utførelsen', 'rask levering', 'god verdi for pengene', 'ryddig service'],
    duration: ['to uker', 'nesten en måned', 'tre uker', 'noen dager'],
    timeframe: ['2 dager', '48 timer', '3 virkedager', '24 timer'],
  },
  da: {
    contextA: ['hverdagen', 'arbejdet', 'en gave', 'hjemmet', 'min daglige rutine'],
    contextB: ['kvaliteten', 'finishen', 'hurtig betjening', 'prisen i forhold til kvaliteten', 'detaljerne'],
    duration: ['to uger', 'næsten en måned', 'tre uger', 'et par dage'],
    timeframe: ['2 dage', '48 timer', '3 hverdage', '24 timer'],
  },
  el: {
    contextA: ['καθημερινή χρήση', 'τη δουλειά', 'δώρο', 'το σπίτι', 'το πρόγραμμά μου'],
    contextB: ['την ποιότητα', 'τις λεπτομέρειες', 'την άμεση εξυπηρέτηση', 'τη σχέση ποιότητας-τιμής'],
    duration: ['δύο εβδομάδες', 'σχεδόν έναν μήνα', 'τρεις εβδομάδες', 'λίγες ημέρες'],
    timeframe: ['2 ημέρες', '48 ώρες', '3 εργάσιμες', '24 ώρες'],
  },
  ro: {
    contextA: ['uz zilnic', 'muncă', 'un cadou', 'acasă', 'rutina mea'],
    contextB: ['calitatea', 'atenția la detalii', 'promptitudinea', 'raportul calitate-preț'],
    duration: ['două săptămâni', 'aproape o lună', 'trei săptămâni', 'câteva zile'],
    timeframe: ['2 zile', '48 de ore', '3 zile lucrătoare', '24 de ore'],
  },
  cs: {
    contextA: ['každodenní používání', 'práci', 'dárek', 'domácnost', 'běžný provoz'],
    contextB: ['zpracování', 'kvalitu', 'rychlé vyřízení', 'poměr ceny a kvality'],
    duration: ['dva týdny', 'skoro měsíc', 'tři týdny', 'pár dní'],
    timeframe: ['2 dny', '48 hodin', '3 pracovní dny', '24 hodin'],
  },
  uk: {
    contextA: ['щоденного використання', 'роботи', 'подарунка', 'дому', 'постійних завдань'],
    contextB: ['якість виконання', 'увагу до деталей', 'швидкий сервіс', 'співвідношення ціни та якості'],
    duration: ['два тижні', 'майже місяць', 'три тижні', 'кілька днів'],
    timeframe: ['2 дні', '48 годин', '3 робочі дні', 'добу'],
  },
  id: {
    contextA: ['pemakaian harian', 'kebutuhan kerja', 'hadiah', 'di rumah', 'rutinitas saya'],
    contextB: ['kualitasnya', 'kerapian detail', 'proses yang cepat', 'harga yang sepadan'],
    duration: ['dua minggu', 'hampir sebulan', 'tiga minggu', 'beberapa hari'],
    timeframe: ['2 hari', '48 jam', '3 hari kerja', '24 jam'],
  },
  vi: {
    contextA: ['sử dụng hằng ngày', 'công việc', 'làm quà tặng', 'gia đình', 'nhu cầu cá nhân'],
    contextB: ['chất lượng hoàn thiện', 'sự chỉn chu', 'tốc độ xử lý nhanh', 'mức giá hợp lý'],
    duration: ['hai tuần', 'gần một tháng', 'ba tuần', 'vài ngày'],
    timeframe: ['2 ngày', '48 giờ', '3 ngày làm việc', '24 giờ'],
  },
  th: {
    contextA: ['การใช้งานประจำวัน', 'การทำงาน', 'ของขวัญ', 'ที่บ้าน', 'กิจวัตรประจำวัน'],
    contextB: ['คุณภาพโดยรวม', 'ความใส่ใจในรายละเอียด', 'ความรวดเร็ว', 'ความคุ้มค่า'],
    duration: ['สองสัปดาห์', 'เกือบหนึ่งเดือน', 'สามสัปดาห์', 'ไม่กี่วัน'],
    timeframe: ['2 วัน', '48 ชั่วโมง', '3 วันทำการ', '24 ชั่วโมง'],
  },
  ms: {
    contextA: ['kegunaan harian', 'kerja', 'hadiah', 'di rumah', 'rutin harian saya'],
    contextB: ['kualitinya', 'kemasan yang teliti', 'servis yang pantas', 'nilai yang berbaloi'],
    duration: ['dua minggu', 'hampir sebulan', 'tiga minggu', 'beberapa hari'],
    timeframe: ['2 hari', '48 jam', '3 hari bekerja', '24 jam'],
  },
  he: {
    contextA: ['שימוש יומיומי', 'העבודה', 'מתנה', 'הבית', 'השגרה שלי'],
    contextB: ['האיכות', 'הדיוק בפרטים', 'השירות המהיר', 'התמורה למחיר'],
    duration: ['שבועיים', 'כמעט חודש', 'שלושה שבועות', 'כמה ימים'],
    timeframe: ['יומיים', '48 שעות', '3 ימי עסקים', '24 שעות'],
  },
};

function makeBank(
  s5: [string[], string[], string[], string[]],
  s4: [string[], string[], string[], string[]],
  s3: [string[], string[], string[], string[]],
  s2: [string[], string[], string[], string[]],
  s1: [string[], string[], string[], string[]]
): Record<1 | 2 | 3 | 4 | 5, BusinessStarPool> {
  return {
    5: { star: 5, subjects: s5[0], openers: s5[1], middles: s5[2], closers: s5[3] },
    4: { star: 4, subjects: s4[0], openers: s4[1], middles: s4[2], closers: s4[3] },
    3: { star: 3, subjects: s3[0], openers: s3[1], middles: s3[2], closers: s3[3] },
    2: { star: 2, subjects: s2[0], openers: s2[1], middles: s2[2], closers: s2[3] },
    1: { star: 1, subjects: s1[0], openers: s1[1], middles: s1[2], closers: s1[3] },
  };
}

export const NEW_EXTRA_SENTENCE_BANKS: Record<NewExtraLanguage, Record<1 | 2 | 3 | 4 | 5, BusinessStarPool>> = {
  sv: makeBank(
    [['Riktigt nöjd', 'Toppenkvalitet', 'Rekommenderas varmt'], ['Jag har använt {product} i {duration} för {contextA} och är supernöjd.', 'Beställde {product} och blev positivt överraskad direkt.'], ['Allt gick smidigt på {timeframe} och {contextB} håller hög klass.', 'Särskilt {contextB} märks tydligt i praktiken.'], ['Rekommenderar absolut vidare.', 'Kommer garanterat beställa igen.']],
    [['Bra val', 'Mycket nöjd', 'Stabil kvalitet'], ['{product} fungerar riktigt bra för {contextA} efter {duration}.', 'Överlag en väldigt bra upplevelse med {product}.'], ['{contextB} levererar som utlovat på {timeframe}.'], ['Klart värt priset.', 'Bra helhetsintryck.']],
    [['Helt okej', 'Fungerar som tänkt'], ['{product} gör sitt jobb för {contextA}, varken mer eller mindre.'], ['{contextB} är godkänt och allt kom fram inom {timeframe}.'], ['Ett rimligt alternativ för priset.']],
    [['Inte helt för mig', 'Lite blandat'], ['Provade {product} i {duration} men det passade inte riktigt mina behov.'], ['Det tog lite tid att vänja sig och jag valde nog fel variant.'], ['Kundtjänst var trevlig men jag byter modell nästa gång.']],
    [['Fel val för mig', 'Passade inte mitt behov'], ['Beställde fel alternativ av {product} för {contextA}.'], ['Själva leveransen kom inom {timeframe} men storleken stämde inte för mig.'], ['Dubbelkolla måtten innan beställning.']]
  ),
  no: makeBank(
    [['Kjempefornøyd', 'Høy kvalitet', 'Anbefales'], ['Har brukt {product} i {duration} til {contextA} og er strålende fornøyd.', 'Veldig positivt overrasket over {product}.'], ['Alt var på plass innen {timeframe} og {contextB} imponerer virkelig.'], ['Anbefales på det varmeste.', 'Handler gjerne her igjen.']],
    [['Veldig bra', 'Solid valg'], ['{product} fungerer veldig godt til {contextA}.'], ['{contextB} holder god standard og kom på {timeframe}.'], ['God verdi for pengene.']],
    [['Helt greit', 'Som forventet'], ['{product} fungerer greit til {contextA} etter {duration}.'], ['{contextB} er helt ok for prisen.'], ['Gjør jobben uten overraskelser.']],
    [['Ikke helt min stil', 'Litt under forventning'], ['Testet {product} i {duration}, men den passet ikke helt til mitt bruk.'], ['Fint utført, men jeg burde valgt en annen variant.'], ['Grei kundeservice ved bytte.']],
    [['Passet ikke for meg', 'Feil variant'], ['Valgte dessverre feil modell av {product} til {contextA}.'], ['Leveringen gikk fint på {timeframe}, men det var ikke riktig passform for meg.'], ['Sjekk detaljene nøye før bestilling.']]
  ),
  da: makeBank(
    [['Virkelig tilfreds', 'Super kvalitet', 'Kan klart anbefales'], ['Har brugt {product} i {duration} til {contextA} og er meget tilfreds.', 'Rigtig god oplevelse med {product}.'], ['Leveret på {timeframe} og {contextB} er helt i top.'], ['Kan varmt anbefales.', 'Køber helt sikkert igen.']],
    [['Godt køb', 'Meget fin kvalitet'], ['{product} fungerer rigtig godt i {contextA}.'], ['{contextB} lever op til forventningerne efter {duration}.'], ['God værdi for pengene.']],
    [['Helt fint', 'Som forventet'], ['{product} er udmærket til {contextA}.'], ['{contextB} er tilfredsstillende og hurtigt fremme på {timeframe}.'], ['Et fornuftigt valg.']],
    [['Ikke helt det rigtige', 'Lidt blandet'], ['Prøvede {product} i {duration}, men det matchede ikke helt mine præferencer.'], ['Det tog lidt længere tid at vænne sig til end forventet.'], ['Fin service, men jeg vælger en anden model.']],
    [['Forkert valg for mig', 'Passede ikke'], ['Fik bestilt den forkerte udgave af {product} til {contextA}.'], ['Alt kom fint inden for {timeframe}, men pasformen var ikke rigtig til mig.'], ['Tjek varianterne grundigt først.']]
  ),
  el: makeBank(
    [['Εξαιρετική επιλογή', 'Πολύ ικανοποιημένος', 'Το προτείνω ανεπιφύλακτα'], ['Χρησιμοποιώ το {product} εδώ και {duration} για {contextA} και έμεινα απόλυτα ικανοποιημένος.', 'Άψογη εμπειρία με το {product} από την πρώτη στιγμή.'], ['Όλα ολοκληρώθηκαν σε {timeframe} και ξεχωρίζει {contextB}.'], ['Θα το επέλεγα ξανά χωρίς δεύτερη σκέψη.', 'Συστήνεται ανεπιφύλακτα.']],
    [['Πολύ καλό', 'Αξίζει τα χρήματά του'], ['Το {product} ανταποκρίνεται πολύ καλά σε {contextA}.'], ['{contextB} είναι σε πολύ καλό επίπεδο μετά από {duration}.'], ['Συνολικά μια πολύ καλή αγορά.']],
    [['Ικανοποιητικό', 'Αναμενόμενο'], ['Το {product} κάνει τη δουλειά του για {contextA}.'], ['{contextB} είναι αξιοπρεπές και έφτασε σε {timeframe}.'], ['Καλή επιλογή για την τιμή του.']],
    [['Όχι ακριβώς για μένα', 'Μέτρια εφαρμογή'], ['Δοκίμασα το {product} για {duration}, αλλά δεν ταίριαξε απόλυτα στις ανάγκες μου.'], ['Χρειάστηκε λίγος χρόνος προσαρμογής και μάλλον ήθελα άλλη έκδοση.'], ['Καλή εξυπηρέτηση στην αλλαγή.']],
    [['Λάθος επιλογή έκδοσης', 'Δεν μου ταίριαξε'], ['Παρήγγειλα λάθος επιλογή του {product} για {contextA}.'], ['Η παράδοση έγινε σε {timeframe}, αλλά δεν ήταν αυτό που χρειαζόμουν.'], ['Ελέγξτε καλά τα χαρακτηριστικά πριν την παραγγελία.']]
  ),
  ro: makeBank(
    [['Foarte mulțumit', 'Calitate excelentă', 'Recomand cu drag'], ['Folosesc {product} de {duration} pentru {contextA} și sunt foarte mulțumit.', 'Experiență excelentă cu {product} încă din prima zi.'], ['Totul a ajuns în {timeframe}, iar {contextB} face diferența.'], ['Recomand cu toată încrederea.', 'Cu siguranță voi mai comanda.']],
    [['Foarte bun', 'Alegere inspirată'], ['{product} se descurcă foarte bine pentru {contextA}.'], ['{contextB} este peste așteptări după {duration}.'], ['Raport calitate-preț foarte bun.']],
    [['Decent', 'Conform descrierii'], ['{product} își face treaba pentru {contextA}.'], ['{contextB} este corect pentru preț și a venit în {timeframe}.'], ['O opțiune rezonabilă.']],
    [['Nu mi s-a potrivit complet', 'Așteptam altceva'], ['Am testat {product} timp de {duration}, dar nu se potrivește stilului meu.'], ['Probabil trebuia să aleg o altă variantă.'], ['Suportul a fost amabil la retur.']],
    [['Variantă greșită', 'Nu s-a potrivit nevoilor mele'], ['Am comandat din greșeală o altă variantă de {product} pentru {contextA}.'], ['Livrarea a fost ok în {timeframe}, dar dimensiunea nu mi se potrivește.'], ['Verificați cu atenție opțiunile înainte de comandă.']]
  ),
  cs: makeBank(
    [['Naprosto spokojený', 'Skvělá kvalita', 'Doporučuji'], ['Používám {product} už {duration} na {contextA} a jsem nadšený.', 'Velmi příjemné překvapení s {product}.'], ['Vše dorazilo za {timeframe} a {contextB} je na špičkové úrovni.'], ['Rozhodně doporučuji dál.', 'Určitě objednám znovu.']],
    [['Velmi dobré', 'Spokojenost'], ['{product} funguje skvěle pro {contextA}.'], ['{contextB} odpovídá popisu i po {duration}.'], ['Dobrý poměr ceny a výkonu.']],
    [['Ujde to', 'Dělá co má'], ['{product} splňuje základ pro {contextA}.'], ['{contextB} je standardní a dorazilo během {timeframe}.'], ['Za tu cenu v pořádku.']],
    [['Nebylo to pro mě', 'Smíšené pocity'], ['Zkoušel jsem {product} {duration}, ale úplně mi nevyhovuje.'], ['Asi jsem měl vybrat jinou variantu.'], ['Komunikace při výměně byla ale v pohodě.']],
    [['Špatně zvolená varianta', 'Nesedlo mi to'], ['Objednal jsem si špatnou verzi {product} pro {contextA}.'], ['Doručení proběhlo za {timeframe}, ale nesedí mi parametry.'], ['Před nákupem si dobře zkontrolujte specifikace.']]
  ),
  uk: makeBank(
    [['Дуже задоволений', 'Чудова якість', 'Рекомендую'], ['Користуюся {product} вже {duration} для {contextA} — враження чудові.', 'Замовив {product} і залишився повністю задоволений.'], ['Усе оформили за {timeframe}, особливо тішить {contextB}.'], ['Сміливо рекомендую.', 'Обов’язково звернуся ще.']],
    [['Гарний вибір', 'Якісно та швидко'], ['{product} чудово підходить для {contextA}.'], ['{contextB} на високому рівні після {duration}.'], ['Ціна повністю виправдана.']],
    [['Нормально', 'Відповідає опису'], ['{product} виконує свою функцію для {contextA}.'], ['{contextB} середнього рівня, отримав за {timeframe}.'], ['Непоганий базовий варіант.']],
    [['Не зовсім мій формат', 'Очікував трохи іншого'], ['Тестував {product} {duration}, але особисто мені підійшло не ідеально.'], ['Мабуть, варто було обрати іншу конфігурацію.'], ['Підтримка допомогла швидко оформити обмін.']],
    [['Помилився з варіантом', 'Не підійшло особисто мені'], ['Випадково замовив не ту версію {product} для {contextA}.'], ['Доставка була вчасна за {timeframe}, але формат мені не підійшов.'], ['Раджу уважно перевіряти параметри перед замовленням.']]
  ),
  id: makeBank(
    [['Sangat puas', 'Kualitas mantap', 'Sangat direkomendasikan'], ['Sudah pakai {product} selama {duration} untuk {contextA} dan hasilnya memuaskan.', 'Pengalaman terbaik dengan {product} sejak hari pertama.'], ['Proses cepat dalam {timeframe} dan {contextB} benar-benar terasa bagus.'], ['Pasti bakal pesan lagi.', 'Sangat layak dibeli.']],
    [['Bagus banget', 'Sesuai ekspektasi'], ['{product} cocok sekali untuk {contextA}.'], ['{contextB} rapi dan dikirim dalam {timeframe}.'], ['Cukup sepadan dengan harganya.']],
    [['Lumayan oke', 'Standar sesuai harga'], ['{product} berfungsi normal untuk {contextA} selama {duration}.'], ['{contextB} cukup baik untuk kebutuhan dasar.'], ['Pilihan yang masuk akal.']],
    [['Kurang cocok di saya', 'Agak beda selera'], ['Sudah coba {product} {duration}, tapi kurang pas dengan preferensi pribadi saya.'], ['Sepertinya saya perlu pilih varian lain.'], ['CS ramah saat bantu penukaran.']],
    [['Salah pilih varian', 'Kurang pas ukurannya'], ['Saya salah pilih tipe {product} untuk {contextA}.'], ['Pengiriman tepat waktu dalam {timeframe}, hanya saja tidak sesuai kebutuhan saya.'], ['Pastikan cek detail varian sebelum checkout.']]
  ),
  vi: makeBank(
    [['Rất hài lòng', 'Chất lượng tuyệt vời', 'Rất đáng mua'], ['Mình đã dùng {product} được {duration} cho {contextA} và cực kỳ hài lòng.', 'Trải nghiệm {product} vượt ngoài mong đợi ngay từ lần đầu.'], ['Mọi thứ hoàn tất trong {timeframe} và {contextB} rất ấn tượng.'], ['Chắc chắn sẽ ủng hộ tiếp.', 'Rất khuyến khích mọi người dùng thử.']],
    [['Khá tốt', 'Đáng đồng tiền'], ['{product} đáp ứng tốt nhu cầu {contextA}.'], ['{contextB} ổn định sau {duration} sử dụng.'], ['Tổng thể rất ổn trong tầm giá.']],
    [['Tạm ổn', 'Đúng mô tả'], ['{product} dùng ổn cho {contextA}.'], ['{contextB} ở mức khá và nhận hàng trong {timeframe}.'], ['Phù hợp với nhu cầu cơ bản.']],
    [['Chưa thật sự hợp gu', 'Hơi khác kỳ vọng'], ['Mình thử {product} {duration} nhưng cảm thấy chưa hợp lắm với thói quen cá nhân.'], ['Có lẽ mình nên chọn phiên bản khác thì sẽ hợp hơn.'], ['Hỗ trợ đổi trả khá nhanh nhẹn.']],
    [['Chọn nhầm phân loại', 'Không hợp nhu cầu'], ['Mình đặt nhầm phiên bản {product} cho {contextA}.'], ['Giao đúng hẹn trong {timeframe} nhưng không đúng kích cỡ mình cần.'], ['Nên xem kỹ thông số trước khi đặt.']]
  ),
  th: makeBank(
    [['ประทับใจมาก', 'คุณภาพดีเยี่ยม', 'แนะนำเลยครับ'], ['ใช้งาน {product} มา {duration} สำหรับ {contextA} แล้วพอใจมากครับ', 'ประทับใจ {product} ตั้งแต่ครั้งแรกที่ได้ลอง'], ['ได้รับภายใน {timeframe} และ {contextB} ดีเกินคาดจริงๆ'], ['กลับมาใช้บริการอีกแน่นอนครับ', 'คุ้มค่าและแนะนำต่อเลย'],],
    [['ดีมากครับ', 'คุ้มราคา'], ['{product} ตอบโจทย์สำหรับ {contextA} ได้ดีมาก'], ['{contextB} ทำได้ดีและรวดเร็วภายใน {timeframe}'], ['โดยรวมพอใจมากครับ']],
    [['โอเคเลย', 'ตามที่คาดไว้'], ['{product} ใช้งานได้ปกติสำหรับ {contextA} ตลอด {duration}'], ['{contextB} อยู่ในระดับมาตรฐานคุ้มราคา'], ['เป็นตัวเลือกที่ใช้ได้ครับ']],
    [['ยังไม่ค่อยตรงสไตล์', 'กลางๆ สำหรับผม'], ['ลองใช้ {product} มา {duration} แต่ยังไม่ค่อยเข้ากับสไตล์ส่วนตัวเท่าไร'], ['น่าจะต้องเลือกรุ่นอื่นแทนในครั้งหน้า'], ['ทีมงานตอบไวและช่วยเหลือดี']],
    [['เลือกผิดรุ่นเอง', 'ไม่พอดีกับการใช้งาน'], ['สั่ง {product} ผิดตัวเลือกสำหรับ {contextA} เองครับ'], ['จัดส่งตรงเวลาภายใน {timeframe} แต่ขนาดไม่ตรงที่ต้องการ'], ['แนะนำให้เช็กรายละเอียดก่อนสั่งครับ']]
  ),
  ms: makeBank(
    [['Sangat berpuas hati', 'Kualiti terbaik', 'Sangat disyorkan'], ['Sudah guna {product} selama {duration} untuk {contextA} dan memang puas hati.', 'Pengalaman sangat baik dengan {product} sejak hari pertama.'], ['Siap dalam {timeframe} dan {contextB} memang memuaskan.'], ['Akan repeat order lagi.', 'Memang berbaloi.']],
    [['Bagus dan kemas', 'Berbaloi'], ['{product} sangat sesuai untuk {contextA}.'], ['{contextB} memuaskan dan cepat dalam {timeframe}.'], ['Nilai yang baik untuk harga.']],
    [['Boleh tahan', 'Seperti yang dijangka'], ['{product} berfungsi baik untuk {contextA} selepas {duration}.'], ['{contextB} okay untuk kegunaan asas.'], ['Pilihan yang munasabah.']],
    [['Kurang sesuai dengan saya', 'Agak berbeza dari jangkaan'], ['Cuba {product} selama {duration} tetapi kurang kena dengan cita rasa saya.'], ['Mungkin saya patut pilih variasi lain.'], ['Khidmat pelanggan sangat membantu.']],
    [['Tersalah pilih variasi', 'Tidak sesuai keperluan'], ['Saya tersalah pilih model {product} untuk {contextA}.'], ['Penghantaran cepat dalam {timeframe} cuma saiz tidak sesuai dengan saya.'], ['Semak butiran betul-betul sebelum buat pesanan.']]
  ),
  he: makeBank(
    [['מרוצה מאוד', 'איכות מעולה', 'ממליץ בחום'], ['משתמש ב-{product} כבר {duration} עבור {contextA} ופשוט תענוג.', 'הופתעתי לטובה מ-{product} מהרגע הראשון.'], ['הכל הגיע תוך {timeframe} ו-{contextB} ברמה גבוהה מאוד.'], ['אמליץ בשמחה.', 'בהחלט אזמין שוב.']],
    [['בחירה מצוינת', 'שווה את המחיר'], ['{product} עובד מצוין ל-{contextA}.'], ['{contextB} מורגש מאוד גם אחרי {duration}.'], ['תמורה נהדרת למחיר.']],
    [['בסדר גמור', 'כפי שמתואר'], ['{product} עושה את העבודה עבור {contextA}.'], ['{contextB} סביר והגיע תוך {timeframe}.'], ['אופציה הוגנת ביחס למחיר.']],
    [['פחות התאים לי', 'חוויה מעורבת'], ['ניסיתי את {product} במשך {duration}, אבל זה פחות התאים להעדפה האישית שלי.'], ['כנראה שהייתי צריך לבחור בגרסה אחרת.'], ['השירות היה אדיב בהחלפה.']],
    [['הזמנתי גרסה לא נכונה', 'לא התאים לי'], ['בחרתי בטעות דגם אחר של {product} ל-{contextA}.'], ['המשלוח הגיע בזמן תוך {timeframe}, אבל המידה לא התאימה לי.'], ['כדאי לבדוק מידות לפני ההזמנה.']]
  ),
};

export const NEW_EXTRA_TAILS: Record<NewExtraLanguage, string[]> = {
  sv: ['Smidig kommunikation hela vägen.', 'Passar perfekt i vardagen.'],
  no: ['Ryddig oppfølging fra start til slutt.', 'Lett å bruke i hverdagen.'],
  da: ['Venlig og hurtig kundeservice.', 'Passer rigtig fint i hverdagen.'],
  el: ['Πολύ φιλική και άμεση επικοινωνία.', 'Εξαιρετική εμπειρία συνολικά.'],
  ro: ['Comunicare clară și rapidă.', 'Se integrează ușor în rutina zilnică.'],
  cs: ['Rychlá a milá komunikace.', 'Bezproblémová zkušenost od začátku do konce.'],
  uk: ['Швидкий і ввічливий зворотний зв’язок.', 'Приємний досвід від початку до кінця.'],
  id: ['Respon admin juga cepat dan ramah.', 'Nyaman dipakai untuk aktivitas sehari-hari.'],
  vi: ['Nhân viên hỗ trợ nhanh và nhiệt tình.', 'Trải nghiệm mua sắm rất suôn sẻ.'],
  th: ['แอดมินตอบไวและให้คำแนะนำดีมากครับ', 'ใช้งานจริงได้สะดวกมาก'],
  ms: ['Layanan pelanggan pun pantas dan mesra.', 'Mudah digunakan setiap hari.'],
  he: ['גם השירות היה מהיר ונעים.', 'חוויה חלקה מההתחלה ועד הסוף.'],
};
