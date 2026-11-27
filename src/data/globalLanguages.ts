import {
  BusinessLanguageTokens,
  BusinessStarPool,
} from '../types/reviews';
import {
  NEW_EXTRA_FALLBACK_REF,
  NEW_EXTRA_NAMES,
  NEW_EXTRA_SENTENCE_BANKS,
  NEW_EXTRA_SURNAMES,
  NEW_EXTRA_TAILS,
  NEW_EXTRA_TOKENS,
  NewExtraLanguage,
} from './extraLanguagesPack';

export type ExtraGlobalLanguage =
  | 'de'
  | 'it'
  | 'pt'
  | 'nl'
  | 'tr'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'hi'
  | 'pl'
  | NewExtraLanguage;

export const GLOBAL_EXTRA_NAMES: Record<
  ExtraGlobalLanguage,
  { first: string[]; last: string[]; domains: string[] }
> = {
  de: {
    first: ['lukas', 'jonas', 'leon', 'hannah', 'laura', 'felix', 'sophie', 'tobias', 'jana', 'markus', 'clara', 'stefan'],
    last: ['mueller', 'schmidt', 'weber', 'wagner', 'becker', 'hoffmann', 'koch', 'richter', 'bauer', 'klein'],
    domains: ['gmail.com', 'gmx.de', 'web.de', 't-online.de', 'outlook.de'],
  },
  it: {
    first: ['luca', 'marco', 'giulia', 'matteo', 'chiara', 'alessandro', 'francesca', 'lorenzo', 'sara', 'davide', 'elena', 'andrea'],
    last: ['rossi', 'russo', 'ferrari', 'esposito', 'bianchi', 'romano', 'colombo', 'ricci', 'marino', 'greco'],
    domains: ['gmail.com', 'libero.it', 'virgilio.it', 'outlook.it', 'icloud.com'],
  },
  pt: {
    first: ['lucas', 'gabriel', 'rafael', 'mariana', 'camila', 'bruno', 'tiago', 'beatriz', 'pedro', 'larissa', 'felipe', 'juliana'],
    last: ['silva', 'santos', 'oliveira', 'souza', 'pereira', 'costa', 'rodrigues', 'almeida', 'ferreira', 'ribeiro'],
    domains: ['gmail.com', 'hotmail.com', 'outlook.com.br', 'uol.com.br', 'icloud.com'],
  },
  nl: {
    first: ['daan', 'sem', 'emma', 'sophie', 'bram', 'lars', 'lotto', 'sanne', 'thijs', 'noa', 'jesse', 'eva'],
    last: ['dejong', 'jansen', 'devries', 'vandenberg', 'bakker', 'visser', 'smit', 'meijer', 'deboer', 'mulder'],
    domains: ['gmail.com', 'ziggo.nl', 'kpnmail.nl', 'outlook.com', 'hotmail.nl'],
  },
  tr: {
    first: ['emre', 'burak', 'elif', 'zeynep', 'mert', 'can', 'selin', 'kerem', 'ayse', 'deniz', 'kaan', 'ece'],
    last: ['yilmaz', 'kaya', 'demir', 'celik', 'sahin', 'yildiz', 'ozturk', 'aydin', 'ozdemir', 'arslan'],
    domains: ['gmail.com', 'hotmail.com', 'outlook.com', 'yandex.com', 'icloud.com'],
  },
  ru: {
    first: ['alexey', 'dmitry', 'anna', 'elena', 'sergey', 'ivan', 'olga', 'maxim', 'natalia', 'andrey', 'maria', 'pavel'],
    last: ['smirnov', 'ivanov', 'kuznetsov', 'sokolov', 'popov', 'lebedev', 'kozlov', 'novikov', 'morozov', 'volkov'],
    domains: ['gmail.com', 'yandex.ru', 'mail.ru', 'outlook.com', 'icloud.com'],
  },
  zh: {
    first: ['wei', 'lin', 'chen', 'ming', 'jing', 'hao', 'yu', 'xin', 'lei', 'yan', 'jun', 'mei'],
    last: ['wang', 'li', 'zhang', 'liu', 'chen', 'yang', 'huang', 'zhao', 'wu', 'zhou'],
    domains: ['gmail.com', 'qq.com', '163.com', 'outlook.com', 'icloud.com'],
  },
  ja: {
    first: ['haruto', 'yuto', 'yui', 'aoi', 'ren', 'sakura', 'kaito', 'hina', 'sora', 'akari', 'riku', 'mei'],
    last: ['sato', 'suzuki', 'takahashi', 'tanaka', 'watanabe', 'ito', 'yamamoto', 'nakamura', 'kobayashi', 'kato'],
    domains: ['gmail.com', 'yahoo.co.jp', 'icloud.com', 'outlook.jp'],
  },
  ko: {
    first: ['minjun', 'seojun', 'seoyeon', 'jiwoo', 'doyun', 'haeun', 'jiho', 'sujin', 'hyunwoo', 'yuna', 'junho', 'minji'],
    last: ['kim', 'lee', 'park', 'choi', 'jung', 'kang', 'cho', 'yoon', 'jang', 'lim'],
    domains: ['gmail.com', 'naver.com', 'daum.net', 'kakao.com', 'icloud.com'],
  },
  hi: {
    first: ['aarav', 'rohan', 'priya', 'ananya', 'vikram', 'neha', 'arjun', 'kavya', 'rahul', 'pooja', 'aditya', 'divya'],
    last: ['sharma', 'verma', 'patel', 'gupta', 'mehta', 'nair', 'singh', 'joshi', 'kapoor', 'reddy'],
    domains: ['gmail.com', 'outlook.in', 'yahoo.co.in', 'icloud.com'],
  },
  pl: {
    first: ['jakub', 'kacper', 'zuzanna', 'julia', 'michal', 'anna', 'piotr', 'maja', 'tomasz', 'natalia', 'mateusz', 'karolina'],
    last: ['nowak', 'kowalski', 'wisniewski', 'wojcik', 'kowalczyk', 'kaminski', 'lewandowski', 'zielinski', 'szymanski', 'dabrowski'],
    domains: ['gmail.com', 'wp.pl', 'onet.pl', 'interia.pl', 'outlook.com'],
  },
  ...NEW_EXTRA_NAMES,
};

export const GLOBAL_EXTRA_SURNAMES: Record<ExtraGlobalLanguage, string[]> = {
  de: ['Müller', 'Schmidt', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Koch', 'Richter', 'Bauer', 'Klein'],
  it: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'],
  pt: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Ferreira', 'Ribeiro'],
  nl: ['de Jong', 'Jansen', 'de Vries', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Bos'],
  tr: ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan'],
  ru: ['Smirnov', 'Ivanov', 'Kuznetsov', 'Sokolov', 'Popov', 'Lebedev', 'Kozlov', 'Novikov', 'Morozov', 'Volkov'],
  zh: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou'],
  ja: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato'],
  ko: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim'],
  hi: ['Sharma', 'Verma', 'Patel', 'Gupta', 'Mehta', 'Nair', 'Singh', 'Joshi', 'Kapoor', 'Reddy'],
  pl: ['Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Dąbrowski'],
  ...NEW_EXTRA_SURNAMES,
};

export const GLOBAL_EXTRA_FALLBACK_REF: Record<ExtraGlobalLanguage, string> = {
  de: 'dieser Artikel',
  it: 'questo articolo',
  pt: 'este item',
  nl: 'dit artikel',
  tr: 'bu ürün',
  ru: 'этот вариант',
  zh: '这个产品',
  ja: 'こちら',
  ko: '이 제품',
  hi: 'यह विकल्प',
  pl: 'ten produkt',
  ...NEW_EXTRA_FALLBACK_REF,
};

export const GLOBAL_EXTRA_TOKENS: Record<ExtraGlobalLanguage, BusinessLanguageTokens> = {
  de: {
    contextA: ['den Alltag', 'die Arbeit', 'ein Geschenk', 'zu Hause', 'unterwegs', 'den regelmäßigen Einsatz'],
    contextB: ['die Verarbeitung', 'die Qualität', 'die schnelle Abwicklung', 'das Preis-Leistungs-Verhältnis', 'die klare Kommunikation', 'die Details'],
    duration: ['zwei Wochen', 'fast einem Monat', 'drei Wochen', 'einigen Tagen', 'über zwei Monaten'],
    timeframe: ['2 Tagen', '48 Stunden', '3 Werktagen', '24 Stunden', 'wenigen Tagen'],
  },
  it: {
    contextA: ['uso quotidiano', 'il lavoro', 'un regalo', 'casa', 'un viaggio', 'la mia routine'],
    contextB: ['la qualità dei materiali', 'la cura nei dettagli', 'la rapidità', 'il rapporto qualità-prezzo', 'la presentazione', 'la precisione'],
    duration: ['due settimane', 'quasi un mese', 'tre settimane', 'qualche giorno', 'più di due mesi'],
    timeframe: ['48 ore', '2 giorni', '3 giorni lavorativi', '24 ore', 'pochi giorni'],
  },
  pt: {
    contextA: ['uso diário', 'o trabalho', 'um presente', 'casa', 'a rotina semanal', 'um projeto recente'],
    contextB: ['o acabamento', 'a qualidade geral', 'a rapidez no atendimento', 'o custo-benefício', 'a apresentação', 'a atenção aos detalhes'],
    duration: ['duas semanas', 'quase um mês', 'três semanas', 'alguns dias', 'mais de dois meses'],
    timeframe: ['48 horas', '2 dias', '3 dias úteis', '24 horas', 'poucos dias'],
  },
  nl: {
    contextA: ['dagelijks gebruik', 'op kantoor', 'een cadeau', 'thuis', 'mijn routine', 'een recent project'],
    contextB: ['de afwerking', 'de kwaliteit', 'de snelle service', 'de prijs-kwaliteitverhouding', 'de nette verpakking', 'de duidelijke uitleg'],
    duration: ['twee weken', 'bijna een maand', 'drie weken', 'een paar dagen', 'ruim twee maanden'],
    timeframe: ['2 dagen', '48 uur', '3 werkdagen', '24 uur', 'een paar dagen'],
  },
  tr: {
    contextA: ['günlük kullanım', 'iş hayatı', 'hediye olarak', 'evde kullanım', 'düzenli rutinim', 'yeni bir başlangıç'],
    contextB: ['işçilik kalitesi', 'genel performans', 'hızlı geri dönüş', 'fiyat-performans dengesi', 'özenli sunum', 'detaylara verilen önem'],
    duration: ['iki haftadır', 'neredeyse bir aydır', 'üç haftadır', 'birkaç gündür', 'iki aydan uzun süredir'],
    timeframe: ['2 günde', '48 saatte', '3 iş gününde', '24 saatte', 'kısa sürede'],
  },
  ru: {
    contextA: ['ежедневного использования', 'работы', 'подарка', 'дома', 'постоянной практики', 'личного проекта'],
    contextB: ['качество исполнения', 'внимание к деталям', 'скорость работы', 'соотношение цены и качества', 'аккуратная подача', 'понятный сервис'],
    duration: ['две недели', 'почти месяц', 'три недели', 'несколько дней', 'больше двух месяцев'],
    timeframe: ['2 дня', '48 часов', '3 рабочих дня', 'сутки', 'пару дней'],
  },
  zh: {
    contextA: ['日常使用', '办公需求', '送给朋友', '居家体验', '周末出行', '长期使用'],
    contextB: ['整体做工', '细节品质', '响应速度', '性价比', '包装和呈现', '实用体验'],
    duration: ['两周', '快一个月', '三周', '几天', '两个多月'],
    timeframe: ['48小时内', '两天内', '三个工作日内', '24小时内', '很快'],
  },
  ja: {
    contextA: ['毎日の使用', '仕事用', 'プレゼント', '自宅での利用', '普段使い', '継続的な利用'],
    contextB: ['仕上がりの丁寧さ', '全体の品質', '対応の早さ', 'コストパフォーマンス', '使いやすさ', '細部のつくり'],
    duration: ['2週間', '約1か月', '3週間', '数日間', '2か月以上'],
    timeframe: ['2日', '48時間', '3営業日', '翌日', '数日'],
  },
  ko: {
    contextA: ['일상 사용', '업무용', '선물용', '집에서 사용', '매일 루틴', '최근 프로젝트'],
    contextB: ['마감 퀄리티', '전반적인 완성도', '빠른 응대', '가성비', '깔끔한 구성', '세심한 디테일'],
    duration: ['2주', '거의 한 달', '3주', '며칠', '두 달 넘게'],
    timeframe: ['이틀', '48시간', '영업일 3일', '하루', '며칠'],
  },
  hi: {
    contextA: ['रोज़ाना इस्तेमाल', 'ऑफिस के काम', 'गिफ्ट देने', 'घर के उपयोग', 'नियमित रूटीन'],
    contextB: ['क्वालिटी और फिनिश', 'तेज़ सर्विस', 'कीमत के हिसाब से वैल्यू', 'साफ़-सुथरा अनुभव', 'डिटेल्स पर ध्यान'],
    duration: ['दो हफ्तों', 'लगभग एक महीने', 'तीन हफ्तों', 'कुछ दिनों', 'दो महीने से ज़्यादा'],
    timeframe: ['2 दिन', '48 घंटे', '3 कार्य दिवस', '24 घंटे', 'कुछ दिनों'],
  },
  pl: {
    contextA: ['codziennego użytku', 'pracy', 'prezentu', 'domu', 'regularnej rutyny', 'nowego projektu'],
    contextB: ['jakość wykonania', 'dbałość o szczegóły', 'szybka realizacja', 'stosunek jakości do ceny', 'jasna komunikacja', 'estetyka'],
    duration: ['dwa tygodnie', 'prawie miesiąc', 'trzy tygodnie', 'kilka dni', 'ponad dwa miesiące'],
    timeframe: ['2 dni', '48 godzin', '3 dni robocze', '24 godziny', 'kilka dni'],
  },
  ...NEW_EXTRA_TOKENS,
};

export const GLOBAL_EXTRA_SENTENCE_BANKS: Record<
  ExtraGlobalLanguage,
  Record<1 | 2 | 3 | 4 | 5, BusinessStarPool>
> = {
  de: {
    5: {
      star: 5,
      subjects: ['Sehr zufrieden', 'Top Qualität', 'Klare Empfehlung', 'Besser als erwartet', 'Perfekt für den Alltag'],
      openers: [
        'Nutze {product} jetzt seit {duration} für {contextA} und bin wirklich begeistert.',
        'Kam in {timeframe} an und {contextB} überzeugt auf ganzer Linie.',
        'Habe {product} zum ersten Mal ausprobiert und {contextB} hat meine Erwartungen übertroffen.',
        'Alles rund um {product} lief reibungslos und genau wie beschrieben.',
      ],
      middles: [
        'Besonders {contextB} fällt sofort positiv auf.',
        'Auch nach {duration} funktioniert alles zuverlässig ohne Schwächen.',
        'Die Umsetzung wirkt durchdacht und hochwertig bis ins Detail.',
      ],
      closers: [
        'Würde ich jederzeit wieder wählen.',
        'Definitiv eine klare Empfehlung von meiner Seite.',
        'Sehr gutes Gesamtpaket.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Sehr solide', 'Gute Wahl', 'Überzeugend mit kleinem Detail', 'Empfehlenswert'],
      openers: [
        'Bin mit {product} nach {duration} sehr zufrieden, vor allem wegen {contextB}.',
        'Für {contextA} passt {product} richtig gut und lief ab Tag eins problemlos.',
        'Insgesamt ein starkes Erlebnis, erledigt in {timeframe}.',
      ],
      middles: [
        'Ein kleines Detail hätte noch etwas feiner sein können, stört im Alltag aber kaum.',
        'Preis und Leistung stehen hier in einem sehr fairen Verhältnis.',
      ],
      closers: [
        'Vier verdiente Sterne, gerne wieder.',
        'Würde ich Freunden weiterempfehlen.',
      ],
    },
    3: {
      star: 3,
      subjects: ['Ganz ordentlich', 'Okay für den Preis', 'Solider Durchschnitt'],
      openers: [
        '{product} erfüllt seinen Zweck für {contextA}, haut mich aber nicht komplett um.',
        'Nach {duration} würde ich sagen: solide Leistung, aber noch etwas Luft nach oben.',
      ],
      middles: [
        'Die Grundlagen passen, nur bei {contextB} hatte ich etwas mehr erwartet.',
      ],
      closers: [
        'Für einfache Ansprüche absolut brauchbar.',
      ],
    },
    2: {
      star: 2,
      subjects: ['Nicht ganz mein Fall', 'Anders vorgestellt', 'Passt leider nicht optimal'],
      openers: [
        'Die Abwicklung war ordentlich, aber {product} passt leider nicht recht zu meinem Bedarf für {contextA}.',
        'Nach {duration} merke ich, dass ich wohl besser eine andere Variante gewählt hätte.',
      ],
      middles: [
        'Qualitativ an sich in Ordnung, nur persönlich etwas umständlicher als gedacht.',
      ],
      closers: [
        'Für andere sicher passend, für mich leider nicht ideal.',
      ],
    },
    1: {
      star: 1,
      subjects: ['Leider unpassend für mich', 'Falsche Wahl getroffen'],
      openers: [
        'Alles kam pünktlich in {timeframe}, allerdings habe ich mich bei {product} schlicht vergriffen.',
        'Für {contextA} hat {product} in meinem konkreten Setup leider nicht funktioniert.',
      ],
      middles: [
        'Kein Problem mit dem Team oder dem Ablauf, es entsprach einfach nicht meinen persönlichen Vorstellungen.',
      ],
      closers: [
        'Werde beim nächsten Mal vorher genauer vergleichen.',
      ],
    },
  },
  it: {
    5: {
      star: 5,
      subjects: ['Esperienza ottima', 'Qualità davvero alta', 'Consigliatissimo', 'Superiore alle aspettative'],
      openers: [
        'Uso {product} da {duration} per {contextA} e {contextB} mi ha davvero colpito.',
        'Tutto pronto in {timeframe}, esattamente come descritto e curato nei minimi dettagli.',
        'Prima volta che scelgo {product} e non potrei essere più soddisfatto.',
      ],
      middles: [
        'Si nota subito {contextB} rispetto ad altre soluzioni provate in passato.',
        'Anche dopo {duration} l’esperienza resta impeccabile giorno dopo giorno.',
      ],
      closers: [
        'Lo risceglierei senza alcun dubbio.',
        'Consigliato a chi cerca serietà e qualità.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Molto valido', 'Buon risultato', 'Quasi perfetto'],
      openers: [
        'Nel complesso {product} funziona benissimo per {contextA}.',
        'Arrivato in {timeframe}, {contextB} è sicuramente il punto forte.',
      ],
      middles: [
        'C’è un piccolo margine di miglioramento, ma il risultato resta molto buono.',
      ],
      closers: [
        'Quattro stelle piene e meritare.',
      ],
    },
    3: {
      star: 3,
      subjects: ['Nella media', 'Discreto', 'Fa il suo lavoro'],
      openers: [
        '{product} fa quello che promette per {contextA}, senza particolari sorprese.',
        'Dopo {duration} direi che è corretto per il prezzo, ma migliorabile.',
      ],
      middles: [
        'Mi aspettavo qualcosa in più su {contextB}, comunque utilizzabile senza problemi.',
      ],
      closers: [
        'Scelta onesta per esigenze di base.',
      ],
    },
    2: {
      star: 2,
      subjects: ['Non adatto alle mie esigenze', 'Diverso da come pensavo'],
      openers: [
        'Servizio puntuale in {timeframe}, ma {product} non si adatta bene al mio uso per {contextA}.',
      ],
      middles: [
        'Niente di rotto o sbagliato, semplicemente preferisco un’impostazione diversa.',
      ],
      closers: [
        'Probabilmente avrei dovuto scegliere un’altra opzione.',
      ],
    },
    1: {
      star: 1,
      subjects: ['Scelta sbagliata per me', 'Non fa al caso mio'],
      openers: [
        'Tutto gestito correttamente, ma {product} non rispecchia le mie preferenze personali per {contextA}.',
      ],
      middles: [
        'È stata soprattutto una mia valutazione affrettata sulle caratteristiche.',
      ],
      closers: [
        'La prossima volta controllerò meglio i dettagli prima di decidere.',
      ],
    },
  },
  pt: {
    5: {
      star: 5,
      subjects: ['Excelente experiência', 'Superou expectativas', 'Muito bom mesmo', 'Recomendo demais'],
      openers: [
        'Estou usando {product} há {duration} para {contextA} e {contextB} impressiona bastante.',
        'Tudo resolvido em {timeframe}, com muita transparência e qualidade.',
        'Escolhi {product} por indicação e valeu cada centavo.',
      ],
      middles: [
        'Dá para perceber {contextB} logo no primeiro contato.',
        'Depois de {duration}, continua entregando exatamente o que promete.',
      ],
      closers: [
        'Com certeza voltarei a contratar e recomendar.',
        'Nota máxima sem pensar duas vezes.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Muito bom', 'Ótimo custo-benefício', 'Gostei bastante'],
      openers: [
        'Gostei muito de {product} para {contextA}, especialmente por causa de {contextB}.',
        'Atendimento rápido em {timeframe} e resultado bem consistente.',
      ],
      middles: [
        'Apenas um pequeno detalhe de ajuste no começo, depois ficou ótimo.',
      ],
      closers: [
        'Recomendo tranquilamente.',
      ],
    },
    3: {
      star: 3,
      subjects: ['Bom, dentro do esperado', 'Razoável', 'Atende o básico'],
      openers: [
        '{product} cumpre o papel para {contextA}, mas nada fora do comum.',
      ],
      middles: [
        'Esperava um pouco mais em relação a {contextB}, porém funciona bem.',
      ],
      closers: [
        'Ok pelo valor pago.',
      ],
    },
    2: {
      star: 2,
      subjects: ['Não combinou comigo', 'Poderia ser mais prático'],
      openers: [
        'Recebi tudo certo em {timeframe}, mas {product} não encaixou bem na minha rotina de {contextA}.',
      ],
      middles: [
        'É uma questão de preferência pessoal e adaptação.',
      ],
      closers: [
        'Acabei preferindo outra alternativa.',
      ],
    },
    1: {
      star: 1,
      subjects: ['Escolhi a opção errada', 'Não serviu para o meu caso'],
      openers: [
        'O processo foi normal, mas {product} não era o formato certo para o que eu precisava em {contextA}.',
      ],
      middles: [
        'Deveria ter tirado mais dúvidas sobre as especificações antes.',
      ],
      closers: [
        'Fica o aprendizado para a próxima escolha.',
      ],
    },
  },
  nl: {
    5: {
      star: 5,
      subjects: ['Erg tevreden', 'Topkwaliteit', 'Absolute aanrader', 'Boven verwachting'],
      openers: [
        'Gebruik {product} nu {duration} voor {contextA} en {contextB} valt echt positief op.',
        'Binnen {timeframe} geregeld en precies zoals omschreven.',
        'Heel prettige ervaring met {product}, vanaf het begin professioneel en netjes.',
      ],
      middles: [
        'Vooral {contextB} maakt het verschil in het dagelijks gebruik.',
        'Ook na {duration} blijft alles soepel en betrouwbaar.',
      ],
      closers: [
        'Zou ik direct opnieuw kiezen.',
        'Echt een aanrader.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Goede keuze', 'Netjes geregeld', 'Prima kwaliteit'],
      openers: [
        '{product} bevalt erg goed voor {contextA}, met name door {contextB}.',
      ],
      middles: [
        'Kleine leercurve in het begin, maar daarna werkt het uitstekend.',
      ],
      closers: [
        'Zeker vier sterren waard.',
      ],
    },
    3: {
      star: 3,
      subjects: ['Prima voor de prijs', 'Redelijk', 'Doet wat het moet doen'],
      openers: [
        '{product} is prima bruikbaar voor {contextA}, maar niet bijzonder opvallend.',
      ],
      middles: [
        'Had iets meer verwacht van {contextB}, al is de basis in orde.',
      ],
      closers: [
        'Voldoende voor eenvoudig gebruik.',
      ],
    },
    2: {
      star: 2,
      subjects: ['Net niet mijn stijl', 'Valt iets tegen'],
      openers: [
        'Alles liep vlot binnen {timeframe}, maar {product} past minder goed bij mijn wensen voor {contextA}.',
      ],
      middles: [
        'Meer een kwestie van persoonlijke voorkeur dan een echt defect.',
      ],
      closers: [
        'Voor iemand anders waarschijnlijk wel geschikt.',
      ],
    },
    1: {
      star: 1,
      subjects: ['Verkeerde keuze voor mij', 'Past helaas niet'],
      openers: [
        'Levering in {timeframe} was prima, maar ik heb zelf de verkeerde variant van {product} gekozen.',
      ],
      middles: [
        'Sluit helaas niet aan bij mijn specifieke situatie.',
      ],
      closers: [
        'Volgende keer lees ik de details beter door.',
      ],
    },
  },
  tr: {
    5: {
      star: 5,
      subjects: ['Çok memnun kaldım', 'Harika kalite', 'Kesinlikle tavsiye ederim', 'Beklediğimden iyi'],
      openers: [
        '{product} deneyimini {duration} {contextA} için kullanıyorum ve {contextB} gerçekten harika.',
        '{timeframe} içinde sorunsuz teslim aldım, her şey anlatıldığı gibiydi.',
        'İlk kez tercih ettim ama {contextB} beni fazlasıyla memnun etti.',
      ],
      middles: [
        'Benzer seçeneklere kıyasla {contextB} hemen fark ediliyor.',
        'Düzenli kullanımda bile performansı ilk günkü gibi istikrarlı.',
      ],
      closers: [
        'Gönül rahatlığıyla tavsiye ediyorum.',
        'Tekrar tercih edeceğim kesin.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Gayet başarılı', 'İyi fiyat-performans', 'Memnunum'],
      openers: [
        '{contextA} için {product} oldukça kullanışlı, özellikle {contextB} hoşuma gitti.',
      ],
      middles: [
        'Küçük bir alışma süreci oldu ama genel sonuç gayet tatmin edici.',
      ],
      closers: [
        'Dört yıldızı rahatlıkla hak ediyor.',
      ],
    },
    3: {
      star: 3,
      subjects: ['Ortalama', 'İdare eder', 'Temel ihtiyaçlar için yeterli'],
      openers: [
        '{product} beklentimi temel düzeyde karşıladı, {contextA} için fena değil.',
      ],
      middles: [
        '{contextB} konusunda biraz daha iyi olabilirdi ama iş görüyor.',
      ],
      closers: [
        'Fiyatına göre makul bir tercih.',
      ],
    },
    2: {
      star: 2,
      subjects: ['Bana pek uymadı', 'Farklı beklemiştim'],
      openers: [
        '{timeframe} ulaştı, süreçle ilgili sorun yoktu ama {product} benim {contextA} alışkanlığıma pek uymadı.',
      ],
      middles: [
        'Tamamen kişisel tercih meselesi, başka bir model bana daha uygun olurmuş.',
      ],
      closers: [
        'Almadan önce detayları daha dikkatli incelemeliydim.',
      ],
    },
    1: {
      star: 1,
      subjects: ['Yanlış tercih yaptım', 'İhtiyacıma uygun değilmiş'],
      openers: [
        'Süreç zamanında tamamlandı ancak {product} benim beklediğim formatta değilmiş.',
      ],
      middles: [
        'Sorun ekipten değil, kendi ihtiyacımı yanlış değerlendirmemden kaynaklandı.',
      ],
      closers: [
        'Bir dahaki sefere farklı bir seçenek deneyeceğim.',
      ],
    },
  },
  ru: {
    5: {
      star: 5,
      subjects: ['Отличный результат', 'Очень доволен', 'Смело рекомендую', 'Превзошло ожидания'],
      openers: [
        'Пользуюсь {product} уже {duration} для {contextA}, и {contextB} действительно на высоте.',
        'Всё оформили и доставили за {timeframe}, полностью соответствует описанию.',
        'Приятно удивлён тем, насколько аккуратно продумано {contextB}.',
      ],
      middles: [
        'Даже спустя {duration} впечатления остаются только положительными.',
        'Сразу чувствуется серьёзный подход и стабильное качество.',
      ],
      closers: [
        'Определённо обращусь снова.',
        'Рекомендую всем, кто ценит качество.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Хороший вариант', 'Достойное качество', 'В целом отлично'],
      openers: [
        'Для {contextA} {product} отлично подходит, особенно радует {contextB}.',
      ],
      middles: [
        'Есть пара мелких нюансов, но на общее удобство они почти не влияют.',
      ],
      closers: [
        'Уверенные четыре звезды.',
      ],
    },
    3: {
      star: 3,
      subjects: ['Нормально', 'Средний уровень', 'За свою цену пойдёт'],
      openers: [
        '{product} справляется с базовыми задачами для {contextA}, без особых сюрпризов.',
      ],
      middles: [
        'Хотелось бы чуть больше внимания к деталям, но пользоваться можно.',
      ],
      closers: [
        'Вполне рабочий базовый вариант.',
      ],
    },
    2: {
      star: 2,
      subjects: ['Не совсем мой формат', 'Ожидал немного другого'],
      openers: [
        'Всё прошло чётко за {timeframe}, однако {product} не совсем подошёл под мои задачи.',
      ],
      middles: [
        'Дело скорее в личных предпочтениях, чем в самом исполнении.',
      ],
      closers: [
        'В следующий раз выберу другую конфигурацию.',
      ],
    },
    1: {
      star: 1,
      subjects: ['Ошибся с выбором', 'Мне не подошло'],
      openers: [
        'Претензий к срокам нет, но {product} оказался неудобен лично для моего сценария.',
      ],
      middles: [
        'Стоило внимательнее изучить характеристики перед оформлением.',
      ],
      closers: [
        'Оставлю как опыт на будущее.',
      ],
    },
  },
  zh: {
    5: {
      star: 5,
      subjects: ['非常满意', '超出预期', '品质很赞', '值得推荐'],
      openers: [
        '使用{product}已经{duration}了，用来满足{contextA}非常顺手，{contextB}让我很惊喜。',
        '{timeframe}就完成了交付，整体体验和描述完全一致。',
        '第一次选择{product}，{contextB}做得非常用心，没有踩坑。',
      ],
      middles: [
        '和之前用过的同类相比，{contextB}明显更胜一筹。',
        '用了{duration}依然稳定可靠，细节经得起推敲。',
      ],
      closers: [
        '已经推荐给身边的朋友了。',
        '下次有需要还会继续选择。',
      ],
    },
    4: {
      star: 4,
      subjects: ['整体不错', '性价比挺高', '体验良好'],
      openers: [
        '{product}用于{contextA}表现很稳，尤其是{contextB}很加分。',
      ],
      middles: [
        '刚开始需要稍微适应一下，熟悉之后非常省心。',
      ],
      closers: [
        '综合给四星，值得入手。',
      ],
    },
    3: {
      star: 3,
      subjects: ['中规中矩', '基本够用', '还可以'],
      openers: [
        '{product}满足{contextA}的基本需求没问题，但没有特别惊艳的地方。',
      ],
      middles: [
        '{contextB}还有提升空间，日常使用倒是顺畅。',
      ],
      closers: [
        '按这个价位来说算合理。',
      ],
    },
    2: {
      star: 2,
      subjects: ['不太适合我', '和预期有偏差'],
      openers: [
        '处理速度很快，{timeframe}就搞定了，只是{product}不太契合我的{contextA}习惯。',
      ],
      middles: [
        '本身没有质量问题，主要是个人偏好不同。',
      ],
      closers: [
        '可能更适合其他类型的用户。',
      ],
    },
    1: {
      star: 1,
      subjects: ['选错规格了', '不太合用'],
      openers: [
        '流程本身没问题，但我自己买错了{product}的规格，导致不太适合{contextA}。',
      ],
      middles: [
        '下次下单前应该先仔细确认细节再决定。',
      ],
      closers: [
        '纯粹是个人选型失误。',
      ],
    },
  },
  ja: {
    5: {
      star: 5,
      subjects: ['大満足です', '期待以上の品質', 'おすすめできます', '丁寧な仕上がり'],
      openers: [
        '{contextA}のために{product}を{duration}使っていますが、{contextB}が本当に素晴らしいです。',
        '{timeframe}ほどでスムーズに届き、説明通りのクオリティでした。',
        '初めて{product}を選びましたが、{contextB}にとても満足しています。',
      ],
      middles: [
        '細部まで丁寧に作られていて、安心して使い続けられます。',
        '{duration}経った今でも快適に使えており、選んで正解でした。',
      ],
      closers: [
        'また機会があればぜひ利用したいです。',
        '知人にも自信を持ってすすめられます。',
      ],
    },
    4: {
      star: 4,
      subjects: ['とても良い', '満足しています', '使い勝手が良い'],
      openers: [
        '{contextA}に{product}はぴったりで、特に{contextB}が気に入りました。',
      ],
      middles: [
        '慣れるまで少しだけ時間がかかりましたが、全体的に高評価です。',
      ],
      closers: [
        '価格とのバランスも良く満足しています。',
      ],
    },
    3: {
      star: 3,
      subjects: ['普通に使えます', '価格相応', 'まずまずです'],
      openers: [
        '{product}は{contextA}の基本的な用途には問題なく使えます。',
      ],
      middles: [
        '{contextB}はもう少し改善の余地があると感じました。',
      ],
      closers: [
        'シンプルな用途なら十分だと思います。',
      ],
    },
    2: {
      star: 2,
      subjects: ['自分の用途には合わず', 'イメージと少し違った'],
      openers: [
        '{timeframe}で対応は早かったのですが、{product}は自分の{contextA}には少し合いませんでした。',
      ],
      middles: [
        '品質自体は悪くないものの、好みの問題だと思います。',
      ],
      closers: [
        '別のタイプを選べばよかったです。',
      ],
    },
    1: {
      star: 1,
      subjects: ['選択を間違えました', '残念ながら合わず'],
      openers: [
        '手続きは問題ありませんでしたが、{product}は自分の環境に合いませんでした。',
      ],
      middles: [
        '事前にもう少し仕様を確認しておくべきでした。',
      ],
      closers: [
        '次回は慎重に選びたいと思います。',
      ],
    },
  },
  ko: {
    5: {
      star: 5,
      subjects: ['정말 만족합니다', '기대 이상이에요', '적극 추천해요', '퀄리티가 훌륭해요'],
      openers: [
        '{contextA} 목적으로 {product}을(를) {duration}째 쓰고 있는데 {contextB} 부분이 정말 마음에 들어요.',
        '{timeframe} 만에 깔끔하게 받아보았고 설명 그대로였습니다.',
        '처음 이용해 본 {product}인데 {contextB} 덕분에 만족도가 매우 높습니다.',
      ],
      middles: [
        '비슷한 제품들과 비교해도 완성도 차이가 확실히 느껴집니다.',
        '{duration} 넘게 사용해도 변함없이 안정적이고 편합니다.',
      ],
      closers: [
        '재구매 의사 100%입니다.',
        '주변 지인에게도 추천하고 싶어요.',
      ],
    },
    4: {
      star: 4,
      subjects: ['전반적으로 좋아요', '가성비 만족', '무난하게 추천'],
      openers: [
        '{contextA}에 {product}이(가) 잘 어울리고 특히 {contextB} 점이 좋았어요.',
      ],
      middles: [
        '처음에만 살짝 적응이 필요했지만 이후엔 아주 만족스럽습니다.',
      ],
      closers: [
        '별 네 개 충분히 줄 만합니다.',
      ],
    },
    3: {
      star: 3,
      subjects: ['무난합니다', '가격 대비 적당해요', '보통이에요'],
      openers: [
        '{product}은(는) {contextA} 용도로 기본 기능은 잘 해줍니다.',
      ],
      middles: [
        '{contextB} 부분은 조금 아쉽지만 실사용에는 큰 문제 없어요.',
      ],
      closers: [
        '가볍게 쓰기에는 괜찮은 선택입니다.',
      ],
    },
    2: {
      star: 2,
      subjects: ['제 취향과는 조금 달라요', '생각보다 덜 맞네요'],
      openers: [
        '{timeframe} 만에 빠르게 진행됐지만 {product}이(가) 제 {contextA} 스타일과는 조금 안 맞았어요.',
      ],
      middles: [
        '품질 문제라기보다 개인적인 취향 차이인 것 같습니다.',
      ],
      closers: [
        '다른 옵션을 골랐으면 더 좋았을 것 같아요.',
      ],
    },
    1: {
      star: 1,
      subjects: ['옵션을 잘못 골랐어요', '제 용도와 안 맞네요'],
      openers: [
        '진행 자체는 문제없었지만 제가 {product} 사양을 착각해서 {contextA}에 쓰기 어려웠습니다.',
      ],
      middles: [
        '다음에는 세부 설명을 더 꼼꼼히 확인하고 선택해야겠어요.',
      ],
      closers: [
        '제 선택 실수라 아쉽네요.',
      ],
    },
  },
  hi: {
    5: {
      star: 5,
      subjects: ['बहुत बढ़िया अनुभव', 'उम्मीद से बेहतर', 'पूरी तरह संतुष्ट', 'ज़रूर चुनें'],
      openers: [
        '{duration} से {contextA} के लिए {product} इस्तेमाल कर रहा हूँ और {contextB} वाकई शानदार है।',
        '{timeframe} में सब कुछ बिल्कुल सही तरीके से मिल गया।',
        'पहली बार {product} आज़माया और इसका अनुभव बेहद अच्छा रहा।',
      ],
      middles: [
        'बाकी विकल्पों के मुकाबले {contextB} साफ़ तौर पर बेहतर लगा।',
        'लगातार इस्तेमाल के बाद भी क्वालिटी बिल्कुल भरोसेमंद है।',
      ],
      closers: [
        'मैं इसे दोस्तों को भी ज़रूर सुझाऊँगा।',
        'पैसे के हिसाब से बेहतरीन चुनाव है।',
      ],
    },
    4: {
      star: 4,
      subjects: ['काफी अच्छा है', 'बढ़िया वैल्यू', 'संतोषजनक अनुभव'],
      openers: [
        '{contextA} के लिए {product} काफी उपयोगी है और {contextB} अच्छा लगा।',
      ],
      middles: [
        'शुरू में समझने में थोड़ा समय लगा, लेकिन अब बहुत बढ़िया काम करता है।',
      ],
      closers: [
        'आराम से चार स्टार का हक़दार है।',
      ],
    },
    3: {
      star: 3,
      subjects: ['ठीक-ठाक है', 'सामान्य अनुभव', 'बजट के हिसाब से सही'],
      openers: [
        '{product} सामान्य {contextA} के लिए ठीक है, लेकिन कुछ खास अलग नहीं लगा।',
      ],
      middles: [
        '{contextB} थोड़ा और बेहतर हो सकता था।',
      ],
      closers: [
        'बुनियादी ज़रूरत के लिए सही विकल्प है।',
      ],
    },
    2: {
      star: 2,
      subjects: ['मेरे हिसाब से सही नहीं बैठा', 'थोड़ा अलग सोचा था'],
      openers: [
        '{timeframe} में डिलीवरी समय पर हुई, लेकिन {product} मेरी पसंद के मुताबिक नहीं था।',
      ],
      middles: [
        'यह ज़्यादातर निजी पसंद का फर्क है, कोई खराबी नहीं है।',
      ],
      closers: [
        'शायद दूसरा वेरिएंट मेरे लिए बेहतर रहता।',
      ],
    },
    1: {
      star: 1,
      subjects: ['गलत विकल्प चुन लिया', 'मेरी ज़रूरत के अनुकूल नहीं'],
      openers: [
        'प्रक्रिया समय पर पूरी हुई, लेकिन {product} मेरी {contextA} की ज़रूरत से मेल नहीं खाता।',
      ],
      middles: [
        'चुनने से पहले विवरण और ध्यान से पढ़ना चाहिए था।',
      ],
      closers: [
        'अगली बार दूसरा विकल्प देखूँगा।',
      ],
    },
  },
  pl: {
    5: {
      star: 5,
      subjects: ['Świetna jakość', 'Bardzo polecam', 'Powyżej oczekiwań', 'Pełne zadowolenie'],
      openers: [
        'Korzystam z {product} od {duration} do {contextA} i {contextB} robi świetne wrażenie.',
        'Wszystko zrealizowane w {timeframe}, dokładnie tak jak w opisie.',
        'Pierwszy raz wybrałem {product} i jestem pozytywnie zaskoczony.',
      ],
      middles: [
        'Szczególnie {contextB} wyróżnia się na tle innych opcji.',
        'Po {duration} wszystko nadal działa bez najmniejszego zarzutu.',
      ],
      closers: [
        'Zdecydowanie wrócę ponownie.',
        'Polecam z czystym sumieniem.',
      ],
    },
    4: {
      star: 4,
      subjects: ['Bardzo dobry wybór', 'Solidna realizacja', 'Polecam'],
      openers: [
        '{product} dobrze sprawdza się do {contextA}, zwłaszcza pod kątem {contextB}.',
      ],
      middles: [
        'Drobny szczegół mógłby być jeszcze lepszy, ale ogólnie super.',
      ],
      closers: [
        'Mocne cztery gwiazdki.',
      ],
    },
    3: {
      star: 3,
      subjects: ['W porządku', 'Przeciętnie', 'Spełnia podstawowe wymagania'],
      openers: [
        '{product} spełnia swoją funkcję przy {contextA}, choć bez efektu wow.',
      ],
      middles: [
        'Liczyłem na nieco więcej w kwestii {contextB}, ale daje radę.',
      ],
      closers: [
        'Uczciwa opcja w tej cenie.',
      ],
    },
    2: {
      star: 2,
      subjects: ['Nie do końca dla mnie', 'Inaczej to sobie wyobrażałem'],
      openers: [
        'Obsługa sprawna w {timeframe}, jednak {product} nie pasuje idealnie do mojego stylu {contextA}.',
      ],
      middles: [
        'To raczej kwestia osobistych preferencji niż jakości wykonania.',
      ],
      closers: [
        'Dla innych osób może być zupełnie w porządku.',
      ],
    },
    1: {
      star: 1,
      subjects: ['Nietrafiony wybór', 'Niestety nie pasuje'],
      openers: [
        'Wszystko dotarło na czas, ale źle dobrałem wariant {product} do swoich potrzeb.',
      ],
      middles: [
        'Powinienem dokładniej sprawdzić parametry przed decyzją.',
      ],
      closers: [
        'Następnym razem wybiorę inną opcję.',
      ],
    },
  },
  ...NEW_EXTRA_SENTENCE_BANKS,
};

export const GLOBAL_EXTRA_TAILS: Record<ExtraGlobalLanguage, string[]> = {
  de: [
    'Auch die Rückfragen wurden freundlich und zügig beantwortet.',
    'Für den täglichen Einsatz absolut zuverlässig.',
    'Hat sich bereits nach wenigen Tagen bezahlt gemacht.',
  ],
  it: [
    'Anche l’assistenza è stata gentile e rapida nelle risposte.',
    'Si integra benissimo nella routine quotidiana.',
    'Ottima impressione fin dal primo giorno.',
  ],
  pt: [
    'O suporte também respondeu rápido quando tirei uma dúvida.',
    'Encaixou muito bem na minha rotina semanal.',
    'Ótima experiência do início ao fim.',
  ],
  nl: [
    'Ook het contact verliep vriendelijk en duidelijk.',
    'Past moeiteloos in het dagelijks gebruik.',
    'Goede indruk vanaf het eerste moment.',
  ],
  tr: [
    'Sorduğum sorulara da hızlı ve kibar dönüş yaptılar.',
    'Günlük düzene kolayca uyum sağladı.',
    'Baştan sona sorunsuz bir süreçti.',
  ],
  ru: [
    'На вопросы тоже ответили быстро и по делу.',
    'Удобно вписалось в повседневные задачи.',
    'Приятное впечатление с первого дня.',
  ],
  zh: [
    '客服沟通也很顺畅，回复很及时。',
    '融入日常使用完全没有负担。',
    '从下单到体验整体都很省心。',
  ],
  ja: [
    '問い合わせへの対応も丁寧で安心感がありました。',
    '普段の生活にすんなり馴染んでいます。',
    '最初から最後まで気持ちよく利用できました。',
  ],
  ko: [
    '문의했을 때도 친절하고 빠르게 안내해 주셨어요.',
    '일상에 자연스럽게 잘 어울려서 자주 쓰게 됩니다.',
    '처음부터 끝까지 만족스러운 경험이었습니다.',
  ],
  hi: [
    'सपोर्ट टीम का जवाब भी समय पर और मददगार रहा।',
    'रोज़मर्रा के काम में आसानी से फिट हो गया।',
    'शुरुआत से अंत तक अनुभव सहज रहा।',
  ],
  pl: [
    'Kontakt w razie pytań również bardzo sprawny i miły.',
    'Świetnie wpasowało się w codzienne korzystanie.',
    'Bardzo dobre wrażenie od pierwszego dnia.',
  ],
  ...NEW_EXTRA_TAILS,
};
