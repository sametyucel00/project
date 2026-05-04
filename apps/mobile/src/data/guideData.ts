import { type AncientGuideStop, type LocalizedText, type SurvivalKitItem } from "@nar/core";

export interface TouristGuideDetail extends SurvivalKitItem {
  info: LocalizedText;
  hours?: string;
  website?: string;
}

export interface AncientGuideDetail extends AncientGuideStop {
  address: string;
  history: LocalizedText;
  visitingTip: LocalizedText;
}

export const touristGuideDetails: TouristGuideDetail[] = [
  {
    id: "emergency-112",
    category: "emergency",
    title: { tr: "Acil Çağrı 112", en: "Emergency 112", ru: "Экстренный номер 112", de: "Notruf 112" },
    description: {
      tr: "Sağlık, polis, itfaiye ve acil durumlar için tek numara.",
      en: "Single number for health, police, fire and emergencies.",
      ru: "Единый номер для здоровья, полиции, пожарной службы и экстренных случаев.",
      de: "Eine Nummer für Gesundheit, Polizei, Feuerwehr und Notfälle."
    },
    info: {
      tr: "Antalya içinde ve Türkiye genelinde acil durumlarda ilk aranacak numara.",
      en: "The first number to call in emergencies in Antalya and across Türkiye.",
      ru: "Это первый номер для экстренных случаев в Анталье и по всей Турции.",
      de: "Die erste Nummer für Notfälle in Antalya und in der gesamten Türkei."
    },
    phone: "112"
  },
  {
    id: "russian-consulate",
    category: "consulate",
    title: { tr: "Rusya Konsolosluk Bilgisi", en: "Russian Consulate Info", ru: "Информация о консульстве России", de: "Russisches Konsulatsinfo" },
    description: {
      tr: "Antalya'daki Rusya temsilciliği için resmi iletişim numaraları.",
      en: "Official contact numbers for the Russian representation in Antalya.",
      ru: "Официальные контактные номера российского представительства в Анталье.",
      de: "Offizielle Kontaktnummern der russischen Vertretung in Antalya."
    },
    info: {
      tr: "Park Sokak 30, Yenikapı, Antalya adresindeki resmi temsilcilik üzerinden ulaşılabilir.",
      en: "Reachable via the official representation at Park Sokak 30, Yenikapı, Antalya.",
      ru: "Связь через официальное представительство по адресу Park Sokak 30, Yenikapı, Анталья.",
      de: "Erreichbar über die offizielle Vertretung in der Park Sokak 30, Yenikapı, Antalya."
    },
    phone: "+90 242 248 32 02",
    address: "Park Sokak 30, Yenikapı, Antalya, Türkiye",
    hours: "Hafta içi 09:00-13:00",
    website: "http://www.antalya.mid.ru"
  },
  {
    id: "german-consulate",
    category: "consulate",
    title: { tr: "Almanya Konsolosluk Bilgisi", en: "German Consulate Info", ru: "Информация о консульстве Германии", de: "Deutsches Konsulatsinfo" },
    description: {
      tr: "Antalya'daki Alman temsilciliği için resmi iletişim kanalı.",
      en: "Official contact channel for the German representation in Antalya.",
      ru: "Официальный канал связи с немецким представительством в Анталье.",
      de: "Offizieller Kontaktkanal der deutschen Vertretung in Antalya."
    },
    info: {
      tr: "Çaglayan Mahallesi, Barınaklar Bulvarı No:60 adresindeki temsilcilik telefondan ulaşılabilir.",
      en: "The representation at Çaglayan Mahallesi, Barınaklar Bulvarı No:60 can be reached by phone.",
      ru: "С представительством по адресу Çaglayan Mahallesi, Barınaklar Bulvarı No:60 можно связаться по телефону.",
      de: "Die Vertretung in Çaglayan Mahallesi, Barınaklar Bulvarı No:60 ist telefonisch erreichbar."
    },
    phone: "+90 242 314 11 01",
    address: "Çaglayan Mahallesi, Barınaklar Bulvarı No: 60, 07230 Antalya, Türkiye",
    hours: "Hafta içi mesai saatleri",
    website: "http://www.antalya.diplo.de"
  },
  {
    id: "hospital-112",
    category: "hospital",
    title: { tr: "Hastane Yönlendirme", en: "Hospital Guidance", ru: "Направление в больницу", de: "Krankenhaus-Hinweis" },
    description: {
      tr: "Acil durumlarda en yakın hastane ve acil servis yönlendirmesi.",
      en: "Guidance to the nearest hospital and emergency service in urgent cases.",
      ru: "Направление в ближайшую больницу и отделение неотложной помощи.",
      de: "Hinweise zum nächsten Krankenhaus und zur Notaufnahme im Ernstfall."
    },
    info: {
      tr: "Konumunu paylaşarak en yakın sağlık noktasına yönlenebilirsin.",
      en: "Share your location to reach the nearest healthcare point.",
      ru: "Поделитесь своим местоположением, чтобы попасть к ближайшей точке помощи.",
      de: "Teile deinen Standort, um zum nächstgelegenen Gesundheitsort zu gelangen."
    }
  },
  {
    id: "airport-transfer",
    category: "transport",
    title: { tr: "Havalimanı Ulaşımı", en: "Airport Transport", ru: "Транспорт из аэропорта", de: "Flughafentransfer" },
    description: {
      tr: "Tramvay, otobüs, taksi ve transfer seçenekleri için kısa rehber.",
      en: "Short guide for tram, bus, taxi and transfer options.",
      ru: "Краткий гид по трамваю, автобусу, такси и трансферу.",
      de: "Kurzer Guide für Tram, Bus, Taxi und Transferoptionen."
    },
    info: {
      tr: "Havalimanı, otogar ve şehir merkezi ulaşımı için pratik özet.",
      en: "A practical summary for airport, bus terminal and city center travel.",
      ru: "Практическая сводка по аэропорту, автовокзалу и центру города.",
      de: "Praktische Übersicht für Flughafen, Busbahnhof und Innenstadt."
    }
  },
  {
    id: "tourist-info-center",
    category: "touristInfo",
    title: { tr: "Turizm Danışma", en: "Tourism Info", ru: "Туристическая информация", de: "Touristeninformation" },
    description: {
      tr: "Antalya'daki turizm danışma büroları ve hızlı şehir bilgileri.",
      en: "Tourist information desks and quick city guidance in Antalya.",
      ru: "Туристические справочные и быстрые городские подсказки в Анталье.",
      de: "Touristeninformationen und schnelle Stadtübersicht in Antalya."
    },
    info: {
      tr: "Müze kartı, rota planı ve ulaşım soruları için kullanılabilir.",
      en: "Useful for museum cards, route planning and transport questions.",
      ru: "Полезно для музейных карт, планирования маршрута и транспорта.",
      de: "Nützlich für Museumskarten, Routenplanung und Transportfragen."
    }
  }
];

export const ancientGuideDetails: AncientGuideDetail[] = [
  {
    id: "hadrians-gate",
    title: { tr: "Hadrian Kapısı", en: "Hadrian's Gate", ru: "Ворота Адриана", de: "Hadrianstor" },
    description: {
      tr: "Kaleiçi girişinde Roma döneminden kalan şehir simgesi.",
      en: "A Roman-era city landmark at the entrance of Kaleiçi.",
      ru: "Городской символ римской эпохи у входа в Калеiçi.",
      de: "Ein Wahrzeichen aus römischer Zeit am Eingang von Kaleiçi."
    },
    history: {
      tr: "M.S. 130 civarında yapılan kapı, Antalya'nın en bilinen tarih kapılarından biridir ve üç kemerli yapısıyla öne çıkar.",
      en: "Built around AD 130, the gate is one of Antalya's best-known historic entrances and stands out with its triple-arched structure.",
      ru: "Построенные около 130 года н. э. ворота являются одним из самых известных исторических входов Антальи и выделяются тремя арками.",
      de: "Etwa um 130 n. Chr. erbaut, ist das Tor einer der bekanntesten historischen Eingänge Antalyas und fällt durch seine dreibogige Struktur auf."
    },
    visitingTip: {
      tr: "Akşamüstü ışığı taş yüzeyleri çok iyi gösterir; Kaleiçi yürüyüşüyle birlikte gez.",
      en: "Late afternoon light brings out the stone texture best; pair it with a Kaleiçi walk.",
      ru: "Лучше всего смотреть в вечернем свете; совместите с прогулкой по Калеiçi.",
      de: "Am besten im Abendlicht besuchen; ideal mit einem Spaziergang durch Kaleiçi."
    },
    district: "Muratpaşa",
    era: "Roma",
    address: "Barbaros Mahallesi, Kaleiçi girişi, Muratpaşa/Antalya, Türkiye",
    location: { lat: 36.885, lng: 30.7087 },
    image: "https://images.unsplash.com/photo-1604933762023-7213af7ff7a5"
  },
  {
    id: "yivli-minaret",
    title: { tr: "Yivli Minare", en: "Fluted Minaret", ru: "Рифлёный минарет", de: "Yivli-Minare" },
    description: {
      tr: "Selçuklu mirasının Antalya'daki en güçlü simgelerinden biri.",
      en: "One of the strongest symbols of Antalya's Seljuk heritage.",
      ru: "Один из самых ярких символов сельджукского наследия Антальи.",
      de: "Eines der stärksten Symbole des seldschukischen Erbes Antalyas."
    },
    history: {
      tr: "13. yüzyılda inşa edilen minare, kıvrımlı gövdesi ve külliyesiyle şehrin siluetinde özel bir yere sahiptir.",
      en: "Built in the 13th century, the minaret holds a special place in the city's skyline with its fluted body and complex.",
      ru: "Построенный в XIII веке минарет занимает особое место в силуэте города благодаря рифлёному стволу и комплексу.",
      de: "Das Minarett aus dem 13. Jahrhundert nimmt mit seinem gerillten Schaft und dem Ensemble einen besonderen Platz in der Silhouette der Stadt ein."
    },
    visitingTip: {
      tr: "Meydan çevresindeki sokak dokusuyla birlikte gezmek daha etkileyici olur.",
      en: "Walking around the surrounding square and streets gives a fuller experience.",
      ru: "Прогулка по площади и окрестным улицам делает визит полнее.",
      de: "Ein Rundgang um den Platz und die Straßen macht den Besuch vollständiger."
    },
    district: "Muratpaşa",
    era: "Selçuklu",
    address: "Selçuk Mahallesi, Kaleiçi, Muratpaşa/Antalya, Türkiye",
    location: { lat: 36.8845, lng: 30.7098 },
    image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb"
  },
  {
    id: "hidirlik-tower",
    title: { tr: "Hıdırlık Kulesi", en: "Hıdırlık Tower", ru: "Башня Хыдырлык", de: "Hıdırlık-Turm" },
    description: {
      tr: "Antalya sahil hattında tarih ve manzarayı birleştiren kule.",
      en: "A tower that combines history and sea views along Antalya's coast.",
      ru: "Башня, сочетающая историю и виды на море на побережье Антальи.",
      de: "Ein Turm, der Geschichte und Meerblick an Antalyas Küste verbindet."
    },
    history: {
      tr: "Roma ve Bizans dönemlerinde farklı işlevler üstlenen yapı, bugün Kaleiçi siluetinin en romantik noktalarından biridir.",
      en: "Used for different purposes in Roman and Byzantine times, it is now one of the most atmospheric points of the Kaleiçi skyline.",
      ru: "Сооружение, выполнявшее разные функции в римский и византийский периоды, сегодня является одной из самых атмосферных точек силуэта Калеiçi.",
      de: "Das Bauwerk hatte in römischer und byzantinischer Zeit verschiedene Funktionen und ist heute einer der stimmungsvollsten Punkte der Kaleiçi-Silhouette."
    },
    visitingTip: {
      tr: "Gün batımında deniz yönüne bakarak ziyaret et.",
      en: "Visit at sunset and face the sea for the best view.",
      ru: "Посетите на закате, повернувшись к морю.",
      de: "Zum Sonnenuntergang besuchen und zum Meer blicken."
    },
    district: "Muratpaşa",
    era: "Roma / Bizans",
    address: "Kılınçarslan Mahallesi, Hıdırlık Sokak, Muratpaşa/Antalya, Türkiye",
    location: { lat: 36.8838, lng: 30.7069 },
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21"
  },
  {
    id: "perge",
    title: { tr: "Perge Antik Kenti", en: "Perge Ancient City", ru: "Античный город Перге", de: "Antike Stadt Perge" },
    description: {
      tr: "Sütunlu caddesi, tiyatrosu ve stadyumuyla güçlü bir antik rota.",
      en: "A strong ancient route with a colonnaded street, theater and stadium.",
      ru: "Сильный античный маршрут с колоннадной улицей, театром и стадионом.",
      de: "Eine eindrucksvolle antike Route mit Säulenstraße, Theater und Stadion."
    },
    history: {
      tr: "Pamfilya'nın en önemli kentlerinden biri olan Perge, uzun sütunlu caddesi, hamamları ve anıtsal kapılarıyla öne çıkar.",
      en: "One of Pamphylia's most important cities, Perge stands out with its long colonnaded street, baths and monumental gates.",
      ru: "Один из важнейших городов Памфилии, Перге выделяется длинной колоннадной улицей, банями и монументальными воротами.",
      de: "Eine der wichtigsten Städte Pamphyliens; Perge besticht durch die lange Säulenstraße, Bäder und monumentale Tore."
    },
    visitingTip: {
      tr: "Sabah erken saatlerde gezersen hem kalabalık azalır hem ışık daha yumuşak olur.",
      en: "Early morning visits mean fewer crowds and softer light.",
      ru: "Ранний визит означает меньше людей и более мягкий свет.",
      de: "Frühmorgens ist weniger los und das Licht ist weicher."
    },
    district: "Aksu",
    era: "Pamfilya",
    address: "Aksu ilçesi, Perge Örenyeri yolu, Aksu/Antalya, Türkiye",
    location: { lat: 36.9588, lng: 30.8522 },
    image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb"
  },
  {
    id: "aspendos",
    title: { tr: "Aspendos Tiyatrosu", en: "Aspendos Theater", ru: "Театр Аспендос", de: "Theater von Aspendos" },
    description: {
      tr: "Dünyanın en iyi korunmuş antik tiyatrolarından biri.",
      en: "One of the best-preserved ancient theaters in the world.",
      ru: "Один из лучше всего сохранившихся античных театров мира.",
      de: "Eines der am besten erhaltenen antiken Theater der Welt."
    },
    history: {
      tr: "Roma döneminde inşa edilen tiyatro, olağanüstü akustiği ve sahne mimarisiyle hâlâ etkinliklere ev sahipliği yapar.",
      en: "Built in the Roman era, the theater still hosts events thanks to its outstanding acoustics and stage architecture.",
      ru: "Построенный в римскую эпоху театр до сих пор принимает мероприятия благодаря выдающейся акустике и сценической архитектуре.",
      de: "Das in römischer Zeit errichtete Theater beherbergt dank seiner herausragenden Akustik und Bühnenarchitektur weiterhin Veranstaltungen."
    },
    visitingTip: {
      tr: "Tiyatro akustiğini denemek için sahneye yakın bir noktada kısa konuşma yap.",
      en: "Try speaking briefly near the stage to feel the acoustics.",
      ru: "Попробуйте коротко сказать что-нибудь у сцены, чтобы ощутить акустику.",
      de: "Sprich kurz nahe der Bühne, um die Akustik zu erleben."
    },
    district: "Serik",
    era: "Roma",
    address: "Belkıs Mahallesi, Aspendos Yolu, Serik/Antalya, Türkiye",
    location: { lat: 36.9397, lng: 31.1739 },
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523"
  },
  {
    id: "side",
    title: { tr: "Side Antik Kenti", en: "Side Ancient City", ru: "Античный город Сиде", de: "Antike Stadt Side" },
    description: {
      tr: "Deniz kenarında tiyatro, agora ve liman kalıntılarını bir arada sunar.",
      en: "A seaside ancient city with a theater, agora and harbor ruins.",
      ru: "Античный город на море с театром, агорой и руинами гавани.",
      de: "Eine antike Küstenstadt mit Theater, Agora und Hafenruinen."
    },
    history: {
      tr: "Antik çağda önemli bir liman kenti olan Side, Roma dönemi kalıntıları ve liman dokusuyla dikkat çeker.",
      en: "An important port city in antiquity, Side is known for its Roman remains and harbor fabric.",
      ru: "Важный портовый город древности, Сиде известен римскими руинами и портовой структурой.",
      de: "Eine bedeutende Hafenstadt der Antike, Side ist für römische Überreste und die Hafensubstanz bekannt."
    },
    visitingTip: {
      tr: "Kıyı hattı yürüyüşünü antik alan gezisiyle birleştir.",
      en: "Combine the coastal walk with the archaeological area.",
      ru: "Совместите прогулку вдоль берега с посещением археологической зоны.",
      de: "Kombiniere den Küstenspaziergang mit dem archäologischen Gebiet."
    },
    district: "Manavgat",
    era: "Roma",
    address: "Side Mahallesi, Side Antik Kenti, Manavgat/Antalya, Türkiye",
    location: { lat: 36.7661, lng: 31.3887 },
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21"
  },
  {
    id: "termessos",
    title: { tr: "Termessos", en: "Termessos", ru: "Термессос", de: "Termessos" },
    description: {
      tr: "Torosların tepesinde doğal koruma içinde bir dağ kenti.",
      en: "A mountain city preserved within nature in the Taurus Mountains.",
      ru: "Горный город, сохранившийся в природе Таврских гор.",
      de: "Eine Bergstadt, die inmitten der Natur im Taurusgebirge erhalten ist."
    },
    history: {
      tr: "Yüksek konumu sayesinde kuşatılması zor olan kent, doğa ve tarih birleşimini en etkileyici biçimde yaşatır.",
      en: "Its high location made it hard to conquer, and today it offers one of the most striking blends of nature and history.",
      ru: "Высокое расположение делало город трудным для завоевания, а сегодня он дарит одно из самых впечатляющих сочетаний природы и истории.",
      de: "Die hohe Lage machte die Stadt schwer zu erobern; heute bietet sie eine der eindrucksvollsten Verbindungen von Natur und Geschichte."
    },
    visitingTip: {
      tr: "Rahat ayakkabı şart; rotayı hafife alma.",
      en: "Wear comfortable shoes; the route is more demanding than it looks.",
      ru: "Нужна удобная обувь; маршрут серьезнее, чем кажется.",
      de: "Bequeme Schuhe sind Pflicht; die Route ist anspruchsvoller als sie aussieht."
    },
    district: "Döşemealtı",
    era: "Helenistik / Roma",
    address: "Termessos Milli Parkı yolu, Döşemealtı/Antalya, Türkiye",
    location: { lat: 37.0159, lng: 30.5014 },
    image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455"
  },
  {
    id: "phaselis",
    title: { tr: "Phaselis", en: "Phaselis", ru: "Фазелис", de: "Phaselis" },
    description: {
      tr: "Deniz, antik limanlar ve çam ormanlarını bir araya getirir.",
      en: "A mix of sea, ancient harbors and pine forests.",
      ru: "Сочетает море, античные гавани и сосновые леса.",
      de: "Eine Mischung aus Meer, antiken Häfen und Kiefernwäldern."
    },
    history: {
      tr: "Likya kıyısındaki bu şehir üç limanı, tiyatrosu ve su kemeriyle döneminin deniz ticaret merkezlerindendi.",
      en: "This Lycian coastal city was a maritime trade center of its time, with three harbors, a theater and an aqueduct.",
      ru: "Этот ликийский прибрежный город был морским торговым центром своего времени с тремя гаванями, театром и акведуком.",
      de: "Diese lykische Küstenstadt war mit drei Häfen, Theater und Aquädukt ein Handelszentrum ihrer Zeit."
    },
    visitingTip: {
      tr: "Yüzme molasıyla birlikte yarım günlük rota yap.",
      en: "Plan a half-day trip and add a swim break.",
      ru: "Запланируйте полдня и добавьте перерыв на купание.",
      de: "Plane einen Halbtagesausflug mit Badepause ein."
    },
    district: "Kemer",
    era: "Likya",
    address: "Tekirova Mahallesi, Phaselis Örenyeri, Kemer/Antalya, Türkiye",
    location: { lat: 36.5273, lng: 30.5502 },
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21"
  },
  {
    id: "olympos",
    title: { tr: "Olympos", en: "Olympos", ru: "Олимпос", de: "Olympos" },
    description: {
      tr: "Doğa, antik kalıntılar ve sahil atmosferi tek rotada birleşir.",
      en: "Nature, ancient ruins and seaside atmosphere in one route.",
      ru: "Природа, античные руины и морская атмосфера в одном маршруте.",
      de: "Natur, antike Ruinen und Küstenstimmung auf einer Route."
    },
    history: {
      tr: "Likya Birliği'nin önemli liman kentlerinden biri olan Olympos, mitolojik kimliği ve gizemli orman dokusuyla bilinir.",
      en: "One of the important port cities of the Lycian League, Olympos is known for its mythic identity and mysterious forest setting.",
      ru: "Один из важных портовых городов Ликийского союза, Олимпос известен своей мифической идентичностью и загадочным лесным окружением.",
      de: "Als eine der wichtigen Hafenstädte des Lykischen Bundes ist Olympos für seine mythologische Identität und seine geheimnisvolle Waldkulisse bekannt."
    },
    visitingTip: {
      tr: "Antik alanı Çıralı sahiliyle birlikte planla.",
      en: "Plan the archaeological site together with Çıralı beach.",
      ru: "Совместите посещение с пляжем Чиралы.",
      de: "Kombiniere den Besuch mit dem Strand von Çıralı."
    },
    district: "Kemer",
    era: "Likya",
    address: "Yazır Mahallesi, Olympos Örenyeri yolu, Kumluca/Antalya, Türkiye",
    location: { lat: 36.4082, lng: 30.4762 },
    image: "https://images.unsplash.com/photo-1519046904884-53103b34b206"
  },
  {
    id: "karain-cave",
    title: { tr: "Karain Mağarası", en: "Karain Cave", ru: "Пещера Караин", de: "Karain-Höhle" },
    description: {
      tr: "Antalya'nın en eski yerleşim izlerinden bazılarını taşıyan doğal mağara.",
      en: "A natural cave that holds some of the oldest traces of settlement in Antalya.",
      ru: "Природная пещера с одними из самых древних следов поселения в Анталье.",
      de: "Eine Naturhöhle mit einigen der ältesten Siedlungsspuren in Antalya."
    },
    history: {
      tr: "Paleolitik çağdan itibaren kullanılan mağara, bölgedeki insan varlığının en eski kanıtları arasında yer alır ve arkeolojik değeri çok yüksektir.",
      en: "Used since the Paleolithic era, the cave is among the oldest evidence of human presence in the region and holds high archaeological value.",
      ru: "Пещера, использовавшаяся с палеолита, является одним из древнейших свидетельств присутствия человека в регионе и имеет высокую археологическую ценность.",
      de: "Die seit dem Paläolithikum genutzte Höhle gehört zu den ältesten Belegen menschlicher Präsenz in der Region und hat hohen archäologischen Wert."
    },
    visitingTip: {
      tr: "Sabah erken gitmek hem serin hem de daha sakin olur.",
      en: "Go early in the morning for cooler weather and fewer crowds.",
      ru: "Лучше приехать рано утром: прохладнее и спокойнее.",
      de: "Am besten früh am Morgen besuchen, dann ist es kühler und ruhiger."
    },
    district: "Döşemealtı",
    era: "Prehistorya",
    address: "Yağca Mahallesi, Karain Mağarası Yolu, Döşemealtı/Antalya, Türkiye",
    location: { lat: 37.0296, lng: 30.6344 },
    image: "https://images.unsplash.com/photo-1516048517990-68b0eb8e5a6b"
  }
];
