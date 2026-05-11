import type {
  AncientGuideStop,
  Badge,
  EventItem,
  EventType,
  EventViewMode,
  GeoPoint,
  ImportExportFormat,
  ImportPreviewRow,
  LocalizedText,
  Offer,
  OfferStory,
  Place,
  PlaceFilterKey,
  PushPreferences,
  SurvivalKitItem,
  UserTask
} from "./index";
import { createTranslationFallbackReport, dictionary, hasCompleteTranslations, isLocale, localizeText, missingLocales, t } from "./i18n";
import { extractSynopsisOnly, normalizeSynopsisText } from "./synopsis";
import { translateText } from "./translate";
import { mapLegacyTheatrePlayToEvent, mapLegacyVenueToPlace } from "./legacy";
import { fetchGooglePlaceSnapshot, mapGoogleSnapshotToPlace } from "./places";
import {
  exportRowsByFormat,
  exportRowsToCsv,
  flattenRow,
  parseCsvRows,
  parseJsonRows,
  parseRowsByFormat,
  parseXlsxMatrixRows,
  previewRows,
  readPath,
  writePath
} from "./importExport";

export { createTranslationFallbackReport, dictionary, hasCompleteTranslations, isLocale, localizeText, missingLocales, t };
export { extractSynopsisOnly, normalizeSynopsisText };
export { translateText };
export { mapLegacyTheatrePlayToEvent, mapLegacyVenueToPlace };
export { fetchGooglePlaceSnapshot, mapGoogleSnapshotToPlace };
export {
  exportRowsByFormat,
  exportRowsToCsv,
  flattenRow,
  parseCsvRows,
  parseJsonRows,
  parseRowsByFormat,
  parseXlsxMatrixRows,
  previewRows,
  readPath,
  writePath
};

export type { ImportExportFormat, ImportPreviewRow };
export type {
  AncientGuideStop,
  Badge,
  EventItem,
  EventType,
  EventViewMode,
  GeoPoint,
  LocalizedText,
  Offer,
  OfferStory,
  Place,
  PlaceFilterKey,
  PushPreferences,
  SurvivalKitItem,
  UserTask
};

export const defaultUserPoints = 500;

export const defaultPushPreferences: PushPreferences = {
  offers: true,
  events: true,
  theater: true,
  reminders: true,
  quietHoursStart: "23:00",
  quietHoursEnd: "08:00"
};

export const placeFilters: Array<{ id: PlaceFilterKey; label: string }> = [
  { id: "category", label: "Kategori" },
  { id: "district", label: "İlçe" },
  { id: "openNow", label: "Açık" },
  { id: "rating", label: "Puan" },
  { id: "nearMe", label: "Yakınımda" },
  { id: "popular", label: "Popüler" },
  { id: "hasOffer", label: "Fırsat var" },
  { id: "nightlife", label: "Gece hayatı" },
  { id: "vegan", label: "Vegan" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "parking", label: "Otopark" },
  { id: "childFriendly", label: "Çocuk dostu" },
  { id: "wheelchair", label: "Engelli dostu" }
];

export const placeCategoryOptions = [
  { id: "restaurants", title: { tr: "Restoran", en: "Restaurant", ru: "Ресторан", de: "Restaurant" } },
  { id: "coffee", title: { tr: "Kahve", en: "Coffee", ru: "Кофе", de: "Kaffee" } },
  { id: "nightlife", title: { tr: "Gece Hayatı", en: "Nightlife", ru: "Ночная жизнь", de: "Nachtleben" } },
  { id: "theater", title: { tr: "Sahne ve Kültür", en: "Stage & Culture", ru: "Сцена и культура", de: "Bühne & Kultur" } },
  { id: "beach", title: { tr: "Plaj ve Deniz", en: "Beach & Sea", ru: "Пляж и море", de: "Strand & Meer" } },
  { id: "shopping", title: { tr: "Alışveriş", en: "Shopping", ru: "Покупки", de: "Shopping" } },
  { id: "stay", title: { tr: "Konaklama", en: "Stay", ru: "Проживание", de: "Aufenthalt" } },
  { id: "wellness", title: { tr: "Sağlık ve Bakım", en: "Wellness", ru: "Здоровье и уход", de: "Wellness" } },
  { id: "family", title: { tr: "Aile", en: "Family", ru: "Семья", de: "Familie" } },
  { id: "ancient", title: { tr: "Antik ve Tarih", en: "Ancient & History", ru: "Античность и история", de: "Antik & Geschichte" } },
  { id: "services", title: { tr: "Şehir Hizmetleri", en: "City Services", ru: "Городские сервисы", de: "Stadtservices" } }
] as const;

export const eventViewModes: Array<{ id: EventViewMode; label: string }> = [
  { id: "month", label: "Aylık" },
  { id: "week", label: "Haftalık" },
  { id: "list", label: "Liste" }
];

export const eventFilters = [
  { id: "month", label: "Ay" },
  { id: "dateRange", label: "Tarih aralığı" },
  { id: "today", label: "Bugün" },
  { id: "thisWeek", label: "Bu hafta" },
  { id: "type", label: "Tür" },
  { id: "district", label: "İlçe" },
  { id: "price", label: "Ücretli/ücretsiz" },
  { id: "popular", label: "Popüler" },
  { id: "soon", label: "Yakında" }
] as const;

export const eventTypes: Array<{ id: EventType; title: LocalizedText }> = [
  { id: "theater", title: { tr: "Tiyatro", en: "Theater", ru: "Театр", de: "Theater" } },
  { id: "ballet", title: { tr: "Bale", en: "Ballet", ru: "Балет", de: "Ballett" } },
  { id: "musical", title: { tr: "Müzikal", en: "Musical", ru: "Мюзикл", de: "Musical" } },
  { id: "cinema", title: { tr: "Sinema", en: "Cinema", ru: "Кино", de: "Kino" } },
  { id: "concert", title: { tr: "Konser", en: "Concert", ru: "Концерт", de: "Konzert" } },
  { id: "festival", title: { tr: "Festival", en: "Festival", ru: "Фестиваль", de: "Festival" } },
  { id: "exhibition", title: { tr: "Sergi", en: "Exhibition", ru: "Выставка", de: "Ausstellung" } },
  { id: "fair", title: { tr: "Fuar", en: "Fair", ru: "Ярмарка", de: "Messe" } },
  { id: "workshop", title: { tr: "Workshop", en: "Workshop", ru: "Мастер sınıf", de: "Workshop" } },
  { id: "kids", title: { tr: "Çocuk Etkinliği", en: "Kids Event", ru: "Детское etkinlik", de: "Kinderveranstaltung" } },
  { id: "standup", title: { tr: "Stand-up", en: "Stand-up", ru: "Стэндап", de: "Stand-up" } },
  { id: "show", title: { tr: "Gösteri", en: "Show", ru: "Шоу", de: "Show" } }
];

export const timeBasedDiscovery = {
  morning: {
    label: "Sabah",
    title: "Güne iyi başlayan mekanlar",
    filters: ["kahvaltı", "kahve", "sessiz çalışma"]
  },
  noon: {
    label: "Öğle Yaklaşıyor",
    title: "Yakındaki öğle molaları",
    filters: ["restoran", "kahve", "yemek fırsatları"]
  },
  evening: {
    label: "Akşam",
    title: "Sahne, konser ve şehir ışıkları",
    filters: ["tiyatro", "konser", "sergi"]
  },
  night: {
    label: "Gece",
    title: "Geç saat açık rotalar",
    filters: ["gece hayatı", "açık mekanlar", "canlı müzik"]
  }
} as const;

export const userTasks: UserTask[] = [
  {
    id: "first-qr-scan",
    title: { tr: "İlk QR", en: "First QR", ru: "Первый QR", de: "Erster QR" },
    description: {
      tr: "İlk QR işlemini yap ve puan akışını başlat.",
      en: "Complete your first QR action and start earning points.",
      ru: "Завершите первое QR-действие и начните получать баллы.",
      de: "Schließe deine erste QR-Aktion ab und sammle Punkte."
    },
    rewardPoints: 75,
    badgeId: "city-starter",
    trigger: "scanQr",
    status: "published"
  },
  {
    id: "save-three-places",
    title: { tr: "Üç rota kaydet", en: "Save three routes", ru: "Сохраните три маршрута", de: "Drei Routen speichern" },
    description: {
      tr: "Üç mekanı favorilerine ekle.",
      en: "Add three places to your favorites.",
      ru: "Добавьте три места в избранное.",
      de: "Füge drei Orte zu deinen Favoriten hinzu."
    },
    rewardPoints: 120,
    badgeId: "curious-local",
    trigger: "visitPlace",
    status: "published"
  }
];

export const badges: Badge[] = [
  {
    id: "city-starter",
    title: { tr: "Şehre Başladın", en: "City Starter", ru: "Начало города", de: "Stadtstarter" },
    description: {
      tr: "Nar QR ile ilk etkileşimini tamamladın.",
      en: "You completed your first Nar QR interaction.",
      ru: "Вы завершили первое взаимодействие с Nar QR.",
      de: "Du hast deine erste Nar-QR-Interaktion abgeschlossen."
    },
    icon: "qr",
    level: "bronze"
  },
  {
    id: "curious-local",
    title: { tr: "Meraklı Yerel", en: "Curious Local", ru: "Любопытный местный", de: "Neugieriger Local" },
    description: {
      tr: "Şehirdeki iyi rotaları kaydetmeye başladın.",
      en: "You started saving good city routes.",
      ru: "Вы начали сохранять хорошие городские маршруты.",
      de: "Du hast begonnen, gute Stadtrouten zu speichern."
    },
    icon: "sparkles",
    level: "silver"
  }
];

export const touristSurvivalKit: SurvivalKitItem[] = [
  {
    id: "emergency-112",
    category: "emergency",
    title: { tr: "Acil Çağrı 112", en: "Emergency 112", ru: "Экстренный номер 112", de: "Notruf 112" },
    description: {
      tr: "Sağlık, polis, itfaiye ve acil durumlar için tek numara.",
      en: "Single number for health, police, fire and emergencies.",
      ru: "Единый номер для скорой, полиции, пожарной службы и ЧС.",
      de: "Eine Nummer für Gesundheit, Polizei, Feuerwehr und Notfälle."
    },
    phone: "112"
  },
  {
    id: "pharmacy-duty",
    category: "pharmacy",
    title: { tr: "Nöbetçi Eczane", en: "Duty Pharmacy", ru: "Дежурная аптека", de: "Notdienst-Apotheke" },
    description: {
      tr: "Yakındaki nöbetçi eczane bilgisi şehir verisiyle eşleşecek.",
      en: "Nearby duty pharmacy info will be matched with city data.",
      ru: "Информация о ближайшей дежурной аптеке будет сопоставлена с городскими данными.",
      de: "Nahe Notdienst-Apotheken werden mit Stadtdaten abgeglichen."
    }
  },
  {
    id: "transport-tram",
    category: "transport",
    title: { tr: "Toplu Taşıma", en: "Public Transport", ru: "Общественный транспорт", de: "ÖPNV" },
    description: {
      tr: "Otobüs, tramvay ve transfer seçenekleri için hızlı rehber.",
      en: "Quick guide for bus, tram and transfer options.",
      ru: "Краткий гид по автобусу, трамваю и трансферам.",
      de: "Kurzer Guide für Bus, Tram und Transferoptionen."
    }
  }
];

export const ancientGuideStops: AncientGuideStop[] = [
  {
    id: "hadrians-gate",
    title: { tr: "Hadrian Kapısı", en: "Hadrian's Gate", ru: "Ворота Адриана", de: "Hadrianstor" },
    description: {
      tr: "Kaleiçi girişinde Roma döneminden kalan şehir simgesi.",
      en: "A Roman-era city landmark at the entrance of Kaleiçi.",
      ru: "Городской символ римской эпохи у входа в Калеiçi.",
      de: "Ein Wahrzeichen aus römischer Zeit am Eingang von Kaleiçi."
    },
    district: "Muratpaşa",
    era: "Roma",
    location: { lat: 36.885, lng: 30.7087 },
    image: "https://images.unsplash.com/photo-1604933762023-7213af7ff7a5"
  },
  {
    id: "perge",
    title: { tr: "Perge Antik Kenti", en: "Perge Ancient City", ru: "Древний город Перге", de: "Antike Stadt Perge" },
    description: {
      tr: "Sütunlu caddesi, tiyatrosu ve stadyumuyla güçlü bir antik rota.",
      en: "A strong ancient route with colonnaded street, theater and stadium.",
      ru: "Сильный античный маршрут с колоннадной улицей, театром и стадионом.",
      de: "Eine starke antike Route mit Säulenstraße, Theater und Stadion."
    },
    district: "Aksu",
    era: "Pamfilya",
    location: { lat: 36.9588, lng: 30.8522 },
    image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb"
  },
  {
    id: "side-ancient",
    title: { tr: "Side Antik Kenti", en: "Side Ancient City", ru: "Древний город Сиде", de: "Antike Stadt Side" },
    description: {
      tr: "Deniz kıyısındaki sütunlar, tiyatro ve agora ile tarihi bir yürüyüş.",
      en: "A historical walk among seaside columns, theater and agora.",
      ru: "Историческая прогулка среди прибрежных колонн, театра и агоры.",
      de: "Ein historischer Spaziergang zwischen Küstensäulen, Theater und Agora."
    },
    district: "Manavgat",
    era: "Roma",
    location: { lat: 36.767, lng: 31.388 },
    image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e"
  }
];

export const featuredPlaces: Place[] = [
  {
    id: "old-town-table",
    googlePlaceId: "mock-google-old-town-table",
    title: { tr: "Kaleiçi Sofrası", en: "Old Town Table", ru: "Стол старого города", de: "Altstadt Tisch" },
    description: {
      tr: "Taş sokakların arasında sakin, yerel ve rafine bir akşam rotası.",
      en: "A calm, local and refined evening route among stone streets.",
      ru: "Спокойный и изысканный вечерний маршрут среди каменных улиц.",
      de: "Eine ruhige, lokale und feine Abendroute zwischen Steingassen."
    },
    categoryId: "restaurants",
    district: "Muratpaşa",
    address: "Kaleiçi, Antalya",
    location: { lat: 36.8841, lng: 30.7056 },
    phone: "+90 242 000 00 01",
    website: "https://example.com/kaleici-sofrasi",
    email: "merhaba@kaleicisofrasi.example",
    menuUrl: "https://example.com/kaleici-sofrasi/menu",
    openingHours: ["Pazartesi-Cuma 10:00-23:00", "Cumartesi-Pazar 09:00-00:00"],
    socialLinks: { instagram: "https://instagram.com/kaleicisofrasi" },
    coverImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    gallery: [],
    features: ["rezervasyon", "yerel mutfak", "teras"],
    accessibility: { wheelchair: true, childFriendly: true, parking: false, wifi: true, vegan: true },
    googleRating: 4.7,
    googleReviewCount: 842,
    openNow: true,
    status: "published"
  },
  {
    id: "harbor-coffee",
    title: { tr: "Liman Kahve", en: "Harbor Coffee", ru: "Кофе у гавани", de: "Hafen Kaffee" },
    description: {
      tr: "Sabah yürüyüşünden sonra minimal kahve barı ve deniz esintisi.",
      en: "A minimal coffee bar and sea breeze after a morning walk.",
      ru: "Минималистичный кофейный бар и морской бриз после утренней прогулки.",
      de: "Minimalistische Kaffeebar und Meeresbrise nach dem Morgenspaziergang."
    },
    categoryId: "coffee",
    district: "Konyaaltı",
    address: "Liman, Antalya",
    location: { lat: 36.8407, lng: 30.6092 },
    phone: "+90 242 000 00 02",
    website: "https://example.com/liman-kahve",
    menuUrl: "https://example.com/liman-kahve/menu",
    openingHours: ["Her gün 08:00-22:30"],
    socialLinks: { instagram: "https://instagram.com/limankahve" },
    coverImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    gallery: [],
    features: ["Wi-Fi", "çalışma masası", "pet friendly"],
    accessibility: { wheelchair: true, childFriendly: false, parking: true, wifi: true, vegan: true },
    googleRating: 4.6,
    googleReviewCount: 391,
    openNow: true,
    status: "published"
  }
];

export const featuredEvents: EventItem[] = [
  {
    id: "may-theater-night",
    title: { tr: "Bir Yaz Gecesi Oyunu", en: "A Summer Night Play", ru: "Пьеса летней ночи", de: "Ein Sommernachtsspiel" },
    description: {
      tr: "Modern sahne diliyle sıcak, hızlı ve şehirli bir komedi.",
      en: "A warm, fast and urban comedy with a modern stage language.",
      ru: "Тёплая, быстрая и городская комедия с современным сценическим языком.",
      de: "Eine warme, schnelle urbane Komödie mit moderner Bühnensprache."
    },
    synopsis: {
      tr: "Kesişen yollar, yanlış anlamalar ve Antalya gecesinde büyüyen küçük sırlar.",
      en: "Crossing paths, misunderstandings and small secrets growing in an Antalya night.",
      ru: "Пересекающиеся пути, недоразумения и маленькие секреты анталийской ночи.",
      de: "Kreuzende Wege, Missverständnisse und kleine Geheimnisse in einer Nacht in Antalya."
    },
    type: "theater",
    district: "Muratpaşa",
    venueName: "Haşim İşcan Kültür Merkezi",
    startsAt: "2026-05-16T20:30:00+03:00",
    priceType: "paid",
    ticketUrl: "https://example.com/bilet",
    cast: ["Deniz Aral", "Mina Saygın"],
    coverImage: "https://images.unsplash.com/photo-1503095396549-807759245b35",
    status: "published",
    notificationLimit: 3,
    notificationUsed: 1
  },
  {
    id: "sunset-concert",
    title: { tr: "Gün Batımı Konseri", en: "Sunset Concert", ru: "Концерт на закате", de: "Sunset-Konzert" },
    description: {
      tr: "Sahilde akustik repertuvar ve yaz akşamı atmosferi.",
      en: "An acoustic repertoire and summer evening atmosphere by the coast.",
      ru: "Акустический репертуар и летняя вечерняя атмосфера у моря.",
      de: "Akustisches Repertoire und Sommerabendstimmung an der Küste."
    },
    type: "concert",
    district: "Konyaaltı",
    venueName: "Konyaaltı Sahil Sahnesi",
    startsAt: "2026-05-18T21:00:00+03:00",
    priceType: "free",
    cast: ["Nar Live Band"],
    coverImage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
    status: "published",
    notificationLimit: 3,
    notificationUsed: 0
  }
];

export const featuredOffers: Offer[] = [];

export const offerStories: OfferStory[] = [];

export function compactValue(value?: string | number | boolean | null) {
  if (value === undefined || value === null || value === "") return "Belirtilmemiş";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  return String(value);
}

export function createGoogleMapsDirectionsUrl(destination: GeoPoint, label?: string) {
  const params = new URLSearchParams({
    api: "1",
    destination: `${destination.lat},${destination.lng}`
  });
  if (label) params.set("destination_place_id", label);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function createStaticMapUrl(location?: GeoPoint, apiKey?: string) {
  if (!location) return "";
  const params = new URLSearchParams({
    center: `${location.lat},${location.lng}`,
    zoom: "15",
    size: "640x360",
    scale: "2",
    markers: `color:red|${location.lat},${location.lng}`
  });
  if (apiKey) params.set("key", apiKey);
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export function getPlaceById(id: string) {
  return featuredPlaces.find((place) => place.id === id);
}

export function getEventById(id: string) {
  return featuredEvents.find((event) => event.id === id);
}

export function getOfferById(id: string) {
  return featuredOffers.find((offer) => offer.id === id);
}

function normalizeCategoryText(value?: string | null) {
  return (value ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

export function getPlaceCategoryId(place: Place): (typeof placeCategoryOptions)[number]["id"] {
  const knownCategory = placeCategoryOptions.find((category) => category.id === place.categoryId);
  if (knownCategory) return knownCategory.id;

  const haystack = normalizeCategoryText(
    [place.categoryId, place.title.tr, place.description.tr, place.address, ...(place.features ?? [])].filter(Boolean).join(" ")
  );

  if (includesAny(haystack, ["kahve", "coffee", "cafe", "kafe", "espresso", "barista", "çay", "tea"])) return "coffee";
  if (includesAny(haystack, ["restaurant", "restoran", "mutfak", "yemek", "lokanta", "meyhane", "sofra", "bistro", "pizza", "burger", "grill", "steak", "kebap", "balık", "deniz ürün", "baklava"])) return "restaurants";
  if (includesAny(haystack, ["konser", "festival", "bar", "club", "kulup", "pub", "canli muzik", "performans", "hollystone", "holy stone", "gece hayatı", "night", "dj"])) return "nightlife";
  if (includesAny(haystack, ["tiyatro", "sahne", "kultur", "kültür", "sergi", "muze", "müze", "galeri", "sanat", "sinema", "opera", "bale", "konservatuar", "performans"])) return "theater";
  if (includesAny(haystack, ["antik", "tarih", "ören", "oren", "kaleiçi", "kaleici", "harabe", "ruin", "museum", "arkeo", "archae", "miras"])) return "ancient";
  if (includesAny(haystack, ["otel", "hotel", "resort", "pansiyon", "hostel", "konaklama", "tatil köyü", "tatil koyu"])) return "stay";
  if (includesAny(haystack, ["avm", "mağaza", "magaza", "shop", "market", "çarşı", "carsi", "mall", "butik", "outlet"])) return "shopping";
  if (includesAny(haystack, ["plaj", "beach", "deniz", "marina", "sahil", "koy", "liman", "yalı", "iskele"])) return "beach";
  if (includesAny(haystack, ["spa", "güzellik", "guzellik", "bakım", "bakim", "terapi", "klinik", "psikoloji", "sağlık", "saglik", "wellness", "doktor", "fitness", "gym", "pilates", "kuaför", "kuafor", "salon"])) return "wellness";
  if (includesAny(haystack, ["aile", "çocuk", "cocuk", "park", "oyun", "kid", "family", "aquapark", "hayvanat", "zoo"])) return "family";
  if (includesAny(haystack, ["konsolosluk", "hastane", "eczane", "yol yardim", "yol yardım", "servis", "banka", "noter", "belediye", "ulaşım", "ulasim", "otogar", "taksi"])) return "services";
  if (place.accessibility.childFriendly) return "family";
  return "services";
}

export function getPlaceCategory(place: Place) {
  return placeCategoryOptions.find((category) => category.id === getPlaceCategoryId(place)) ?? placeCategoryOptions[placeCategoryOptions.length - 1];
}

export function getEventTypeId(event: EventItem): EventType {
  const knownType = eventTypes.find((type) => type.id === event.type);
  if (knownType) return knownType.id;

  const haystack = normalizeCategoryText([event.title.tr, event.description.tr, event.synopsis?.tr, event.venueName].filter(Boolean).join(" "));
  if (includesAny(haystack, ["bale", "ballet"])) return "ballet";
  if (includesAny(haystack, ["muzikal", "musical"])) return "musical";
  if (includesAny(haystack, ["sinema", "film", "movie", "kino"])) return "cinema";
  if (includesAny(haystack, ["konser", "concert", "live"])) return "concert";
  if (includesAny(haystack, ["festival"])) return "festival";
  if (includesAny(haystack, ["sergi", "exhibition", "gallery"])) return "exhibition";
  if (includesAny(haystack, ["fuar", "expo", "fair"])) return "fair";
  if (includesAny(haystack, ["workshop", "atolye", "atelier"])) return "workshop";
  if (includesAny(haystack, ["cocuk", "kids", "aile"])) return "kids";
  if (includesAny(haystack, ["stand up", "standup"])) return "standup";
  if (includesAny(haystack, ["gosteri", "show"])) return "show";
  return "theater";
}

export function getEventTypeMeta(event: EventItem) {
  const typeId = getEventTypeId(event);
  return eventTypes.find((type) => type.id === typeId) ?? eventTypes[0];
}

export async function loadLegacyDiscoveryFallbacks() {
  const [placesModule, legacyEventsModule, festivalEventsModule, mayEventsModule] = await Promise.all([
    import("./legacyPlaces"),
    import("./legacyEvents"),
    import("./biletinialAutfFestivalEvents"),
    import("./antalyaMay2026Events")
  ]);

  return {
    places: placesModule.legacyPlaces,
    events: [
      ...legacyEventsModule.legacyAntalyaEvents,
      ...festivalEventsModule.biletinialAutfFestivalEvents,
      ...mayEventsModule.antalyaMay2026Events
    ]
  };
}
