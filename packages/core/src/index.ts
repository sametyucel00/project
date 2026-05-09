import { legacyAntalyaEvents } from "./legacyEvents";
import { biletinialAutfFestivalEvents } from "./biletinialAutfFestivalEvents";
import { antalyaMay2026Events } from "./antalyaMay2026Events";
import { legacyPlaces } from "./legacyPlaces";

export type Locale = "tr" | "en" | "ru" | "de";
export type UserRole = "individual" | "business" | "theater" | "admin";
export type PublishStatus = "draft" | "pending" | "published" | "archived";
export type ApprovalStatus = "draft" | "pendingReview" | "approved" | "rejected";
export type PointTransactionType = "earn" | "spend" | "refund" | "adjustment";
export type ContentEntityType = "place" | "event" | "offer" | "story" | "category";
export type AnalyticsEventType =
  | "place_view"
  | "event_view"
  | "offer_view"
  | "favorite_add"
  | "ticket_click"
  | "qr_scan"
  | "notification_open"
  | "campaign_use";
export type FavoriteEntityType = "place" | "event" | "offer";
export type ReminderEntityType = "event" | "offer";
export type OrderType = "ticket" | "offer" | "points";
export type OrderStatus = "created" | "confirmed" | "used" | "cancelled" | "refunded";
export type ErrorSeverity = "info" | "warning" | "error" | "critical";
export type EventType =
  | "theater"
  | "ballet"
  | "musical"
  | "concert"
  | "festival"
  | "exhibition"
  | "fair"
  | "workshop"
  | "kids"
  | "standup"
  | "show";

export type LocalizedText = Record<Locale, string>;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MapRoute {
  id: string;
  title: string;
  destination: GeoPoint;
  address: string;
  directionsUrl: string;
}

export interface NarUser {
  id: string;
  role: UserRole;
  displayName: string;
  email: string;
  city: string;
  preferredLocale: Locale;
  points: number;
  qrCodeId: string;
  favoritePlaceIds: string[];
  favoriteEventIds: string[];
  badges: string[];
  createdAt: string;
}

export interface Place {
  id: string;
  ownerId?: string;
  googlePlaceId?: string;
  title: LocalizedText;
  description: LocalizedText;
  categoryId: string;
  district: string;
  address: string;
  location?: GeoPoint;
  phone?: string;
  website?: string;
  email?: string;
  menuUrl?: string;
  openingHours?: string[];
  socialLinks?: {
    instagram?: string;
    x?: string;
    facebook?: string;
  };
  coverImage: string;
  gallery: string[];
  features: string[];
  accessibility: {
    wheelchair: boolean;
    childFriendly: boolean;
    parking: boolean;
    wifi: boolean;
    vegan: boolean;
  };
  googleRating?: number;
  googleReviewCount?: number;
  openNow?: boolean;
  status: PublishStatus;
}

export interface GooglePlaceSnapshot {
  googlePlaceId: string;
  phone?: string;
  website?: string;
  photoRefs: string[];
  rating?: number;
  reviewCount?: number;
  address?: string;
  location?: GeoPoint;
  openingHours?: string[];
  fetchedAt: string;
}

export type PlaceFilterKey =
  | "category"
  | "district"
  | "openNow"
  | "rating"
  | "nearMe"
  | "popular"
  | "hasOffer"
  | "nightlife"
  | "vegan"
  | "wifi"
  | "parking"
  | "childFriendly"
  | "wheelchair";

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

export interface EventItem {
  id: string;
  organizerId?: string;
  categoryId?: string;
  title: LocalizedText;
  description: LocalizedText;
  synopsis?: LocalizedText;
  type: EventType;
  district: string;
  venueName: string;
  startsAt: string;
  endsAt?: string;
  priceType: "free" | "paid";
  ticketUrl?: string;
  cast: string[];
  coverImage: string;
  videoUrl?: string;
  status: PublishStatus;
  notificationLimit: number;
  notificationUsed?: number;
}

export type EventViewMode = "month" | "week" | "list" | "map";
export type EventFilterKey = "month" | "dateRange" | "today" | "thisWeek" | "type" | "district" | "price" | "popular" | "soon";

export const eventViewModes: Array<{ id: EventViewMode; label: string }> = [
  { id: "month", label: "Aylık" },
  { id: "week", label: "Haftalık" },
  { id: "list", label: "Liste" },
  { id: "map", label: "Harita" }
];

export const eventFilters: Array<{ id: EventFilterKey; label: string }> = [
  { id: "month", label: "Ay" },
  { id: "dateRange", label: "Tarih aralığı" },
  { id: "today", label: "Bugün" },
  { id: "thisWeek", label: "Bu hafta" },
  { id: "type", label: "Tür" },
  { id: "district", label: "İlçe" },
  { id: "price", label: "Ücretli/ücretsiz" },
  { id: "popular", label: "Popüler" },
  { id: "soon", label: "Yakında" }
];

export interface Offer {
  id: string;
  businessId: string;
  placeId: string;
  title: LocalizedText;
  description: LocalizedText;
  discountLabel: string;
  startsAt: string;
  endsAt: string;
  conditions: LocalizedText;
  requiresQr: boolean;
  pointCost?: number;
  storyEnabled?: boolean;
  storyPriority?: number;
  useLimit?: number;
  usedCount?: number;
  featured?: boolean;
  status: PublishStatus;
}

export interface OfferStory {
  id: string;
  offerId: string;
  title: LocalizedText;
  image: string;
  priority: number;
  status: PublishStatus;
}

export type ImportKind = "places" | "events" | "theaterPlays" | "offers" | "categories";

export const importKinds: Array<{ id: ImportKind; label: string; requiredFields: string[] }> = [
  { id: "places", label: "Mekanlar", requiredFields: ["title.tr", "description.tr", "categoryId", "district", "address"] },
  { id: "events", label: "Etkinlikler", requiredFields: ["title.tr", "description.tr", "type", "district", "venueName", "startsAt"] },
  { id: "theaterPlays", label: "Tiyatro Oyunları", requiredFields: ["title.tr", "synopsis.tr", "venueName", "startsAt", "ticketUrl"] },
  { id: "offers", label: "Fırsatlar", requiredFields: ["title.tr", "description.tr", "discountLabel", "startsAt", "endsAt"] },
  { id: "categories", label: "Kategoriler", requiredFields: ["id", "title.tr", "title.en", "title.ru", "title.de"] }
];

export interface NotificationTarget {
  kind: "all" | "role" | "city" | "event" | "favorites" | "manual";
  role?: UserRole;
  city?: string;
  eventId?: string;
  userIds?: string[];
}

export interface NotificationDraft {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
  target: NotificationTarget;
  scheduledAt?: string;
  sentAt?: string;
  status: "draft" | "scheduled" | "sent" | "failed";
}

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  userId?: string;
  token?: string;
  status: "queued" | "sent" | "opened" | "failed";
  errorMessage?: string;
  sentAt?: string;
  openedAt?: string;
}

export interface NotificationAudiencePreview {
  target: NotificationTarget;
  estimatedUsers: number;
  estimatedTokens: number;
  detail: string;
}

export interface QrTransaction {
  id: string;
  userId: string;
  businessId: string;
  placeId: string;
  offerId?: string | null;
  type: PointTransactionType;
  pointsDelta: number;
  balanceAfter?: number;
  note?: string;
  createdAt: string;
}

export interface UserTask {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  rewardPoints: number;
  badgeId?: string;
  trigger: "visitPlace" | "favoriteEvent" | "useOffer" | "scanQr" | "completeProfile";
  status: PublishStatus;
}

export interface Badge {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  level: "bronze" | "silver" | "gold" | "city";
}

export interface ApprovalQueueItem {
  id: string;
  entityType: ContentEntityType;
  entityId: string;
  ownerId: string;
  status: ApprovalStatus;
  title: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  note?: string;
  rejectionReason?: string;
}

export interface SeoMeta {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  image?: string;
  noIndex?: boolean;
  alternateLocales?: Partial<Record<Locale, string>>;
}

export interface WebManifestShortcut {
  name: string;
  url: string;
  description: string;
}

export interface SurvivalKitItem {
  id: string;
  category: "emergency" | "consulate" | "hospital" | "pharmacy" | "transport" | "touristInfo";
  title: LocalizedText;
  description: LocalizedText;
  phone?: string;
  address?: string;
  location?: GeoPoint;
}

export interface AncientGuideStop {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  district: string;
  era: string;
  location?: GeoPoint;
  image: string;
}

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  entityType?: ContentEntityType;
  entityId?: string;
  userId?: string;
  city?: string;
  locale?: Locale;
  platform: "web" | "ios" | "android" | "unknown";
  createdAt: string;
}

export interface UserFavorite {
  id: string;
  userId: string;
  entityType: FavoriteEntityType;
  entityId: string;
  createdAt: string;
}

export interface UserReminder {
  id: string;
  userId: string;
  entityType: ReminderEntityType;
  entityId: string;
  remindAt: string;
  channel: "push" | "email";
  status: "scheduled" | "sent" | "cancelled";
}

export interface PushPreferences {
  offers: boolean;
  events: boolean;
  theater: boolean;
  reminders: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface NarOrder {
  id: string;
  userId: string;
  type: OrderType;
  status: OrderStatus;
  entityId: string;
  entityTitle: string;
  businessId?: string;
  placeId?: string;
  pointsDelta?: number;
  amountLabel?: string;
  createdAt: string;
  usedAt?: string;
}

export interface ErrorLog {
  id: string;
  severity: ErrorSeverity;
  source: "web" | "mobile" | "functions" | "import" | "firebase";
  message: string;
  context?: Record<string, string | number | boolean | null>;
  userId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface ExportManifest {
  id: string;
  kind: ImportKind;
  format: "csv" | "json" | "xlsx";
  status: "requested" | "ready" | "failed";
  requestedAt: string;
  requestedBy: string;
}

export interface DashboardStat {
  id: string;
  label: string;
  value: string;
  trend: string;
  tone: "nar" | "sea" | "sage" | "plum";
}

export const notificationTargets: Array<{ id: NotificationTarget["kind"]; label: string }> = [
  { id: "all", label: "Herkese" },
  { id: "role", label: "Role göre" },
  { id: "city", label: "Şehre göre" },
  { id: "event", label: "Etkinliğe göre" },
  { id: "favorites", label: "Favorilere göre" },
  { id: "manual", label: "Manuel kullanıcı seçimi" }
];

export const notificationPerformance = [
  { id: "sent", label: "Gönderilen", value: "18.240", detail: "Son 30 gün" },
  { id: "opened", label: "Açılan", value: "%41", detail: "Ortalama açılma" },
  { id: "scheduled", label: "Zamanlanmış", value: "12", detail: "Sıradaki 7 gün" },
  { id: "failed", label: "Başarısız", value: "%1.8", detail: "Geçersiz token ağırlıklı" }
];

export const scheduledNotificationSamples: NotificationDraft[] = [
  {
    id: "notif-weekend-events",
    title: {
      tr: "Hafta sonu sahneleri hazır",
      en: "Weekend stages are ready",
      ru: "Сцены выходных готовы",
      de: "Wochenendbühnen sind bereit"
    },
    body: {
      tr: "Yakındaki tiyatro ve konserleri keşfet.",
      en: "Discover nearby theater and concerts.",
      ru: "Откройте для себя театр и концерты рядом.",
      de: "Entdecke Theater und Konzerte in deiner Nähe."
    },
    target: { kind: "role", role: "individual" },
    scheduledAt: "2026-05-02T10:00:00+03:00",
    status: "scheduled"
  }
];

export const notificationHistorySamples: NotificationDraft[] = [
  {
    id: "notif-coffee-offer",
    title: {
      tr: "Liman Kahve fırsatı yayında",
      en: "Harbor Coffee offer is live",
      ru: "Предложение Harbor Coffee активно",
      de: "Harbor Coffee Angebot ist live"
    },
    body: {
      tr: "QR ile ikinci kahvede avantajı kaçırma.",
      en: "Do not miss the second-coffee QR advantage.",
      ru: "Не пропустите QR-преимущество на второй кофе.",
      de: "Verpasse den QR-Vorteil für den zweiten Kaffee nicht."
    },
    target: { kind: "city", city: "Antalya" },
    sentAt: "2026-05-01T14:00:00+03:00",
    status: "sent"
  }
];

export const notificationDeliverySamples: NotificationDelivery[] = [
  {
    id: "delivery-demo-sent",
    notificationId: "notif-coffee-offer",
    userId: "demo-user",
    status: "opened",
    sentAt: "2026-05-01T14:00:10+03:00",
    openedAt: "2026-05-01T14:04:20+03:00"
  },
  {
    id: "delivery-demo-failed",
    notificationId: "notif-coffee-offer",
    token: "expired-token",
    status: "failed",
    errorMessage: "Geçersiz FCM token",
    sentAt: "2026-05-01T14:00:10+03:00"
  }
];

export const notificationAudiencePreviews: NotificationAudiencePreview[] = [
  { target: { kind: "all" }, estimatedUsers: 12400, estimatedTokens: 18240, detail: "Tüm aktif kullanıcılar" },
  { target: { kind: "role", role: "individual" }, estimatedUsers: 10850, estimatedTokens: 15900, detail: "Bireysel kullanıcılar" },
  { target: { kind: "city", city: "Antalya" }, estimatedUsers: 9300, estimatedTokens: 13820, detail: "Antalya şehir segmenti" }
];

export const userTasks: UserTask[] = [
  {
    id: "first-qr-scan",
    title: { tr: "İlk QR", en: "First QR", ru: "Первый QR", de: "Erster QR" },
    description: {
      tr: "İlk QR işlemini yap ve puan akışını başlat.",
      en: "Complete your first QR action and start earning points.",
      ru: "Выполните первое QR-действие и начните получать баллы.",
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
    title: { tr: "Meraklı Yerel", en: "Curious Local", ru: "Любознательный местный", de: "Neugieriger Local" },
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

export const approvalQueue: ApprovalQueueItem[] = [
  {
    id: "approval-place-old-town-table",
    entityType: "place",
    entityId: "old-town-table",
    ownerId: "business-demo",
    status: "pendingReview",
    title: "Kaleiçi Sofrası mekan güncellemesi",
    submittedAt: "2026-05-01T09:30:00+03:00",
    note: "Yeni kapak görseli ve vegan özelliği eklendi."
  },
  {
    id: "approval-event-may-theater-night",
    entityType: "event",
    entityId: "may-theater-night",
    ownerId: "theater-demo",
    status: "pendingReview",
    title: "Bir Yaz Gecesi Oyunu yayın onayı",
    submittedAt: "2026-05-01T10:15:00+03:00",
    note: "Sinopsis çevirileri kontrol bekliyor."
  }
];

export const contentLifecycleStates = [
  { id: "draft", label: "Taslak", description: "İşletme veya tiyatro panelinde düzenleniyor." },
  { id: "pendingReview", label: "Onay bekliyor", description: "Admin incelemesine gönderildi." },
  { id: "approved", label: "Yayınlandı", description: "İçerik discovery yüzeylerinde görünür." },
  { id: "rejected", label: "Reddedildi", description: "Red sebebiyle birlikte sahibine geri döner." }
] as const;

export const businessDraftTemplates = [
  { id: "place", title: "Mekan Taslağı", fields: ["Başlık", "Kategori", "İlçe", "Adres", "Google Place ID", "Özellikler"] },
  { id: "offer", title: "Fırsat Taslağı", fields: ["Başlık", "İndirim", "Tarih aralığı", "QR şartı", "Puan maliyeti"] }
];

export const theaterDraftTemplates = [
  { id: "play", title: "Oyun Taslağı", fields: ["Başlık", "Tür", "Tarih", "Yer", "Kadro", "Bilet linki"] },
  { id: "synopsis", title: "Sinopsis Çeviri", fields: ["Türkçe", "İngilizce", "Rusça", "Almanca"] }
];

export interface MarketingPageContent {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{
    title: string;
    text: string;
  }>;
}

export const marketingPages: MarketingPageContent[] = [
  {
    slug: "ozellikler",
    eyebrow: "Özellikler",
    title: "Şehir keşfini mekan, etkinlik ve fırsatlarla bir araya getiren deneyim.",
    description: "Nar Rehberi; bireysel kullanıcıları, işletmeleri ve tiyatroları aynı şehir akışında buluşturur.",
    sections: [
      { title: "Keşif akışı", text: "Saat, konum, ilgi alanı ve popülerliğe göre şekillenen öneriler." },
      { title: "Kişisel alanlar", text: "İşletme, tiyatro ve bireysel kullanıcılar için ayrı ama tutarlı alanlar." },
      { title: "QR ve puan", text: "Katıldıkça puan kazan, avantajları daha rahat kullan." }
    ]
  },
  {
    slug: "isletmeler-icin",
    eyebrow: "İşletmeler İçin",
    title: "Mekan görünürlüğü, fırsatlar ve QR sadakat tek panelde.",
    description: "İşletmeler mekanlarını yönetebilir, kampanya oluşturabilir, QR okutabilir ve puan hareketlerini izleyebilir.",
    sections: [
      { title: "Mekan yönetimi", text: "Görseller, çalışma saatleri, özellikler ve görünürlük ayarları." },
      { title: "Fırsat vitrini", text: "Anlık kampanyalar, hikaye tarzı öneriler, tarih aralığı ve kullanım şartları." },
      { title: "Sadakat", text: "QR ile puan işlemleri ve kampanya kullanımı." }
    ]
  },
  {
    slug: "tiyatro-cozumleri",
    eyebrow: "Tiyatro Çözümleri",
    title: "Oyun, kadro, sinopsis, bilet ve bildirim akışı sahneye göre tasarlandı.",
    description: "Tiyatro ekipleri oyunlarını yayınlayabilir, sinopsis çevirilerini düzenleyebilir ve bildirim haklarını yönetebilir.",
    sections: [
      { title: "Oyun yönetimi", text: "Kapak, tarih, saat, yer, kadro, sinopsis, video, galeri ve bilet linki." },
      { title: "Çok dilli sinopsis", text: "İngilizce, Rusça ve Almanca içeriklerle farklı kitlelere daha rahat ulaş." },
      { title: "Bildirim planı", text: "Duyurularını sakin ve kontrollü biçimde planla." }
    ]
  },
  {
    slug: "mobil-uygulama",
    eyebrow: "Mobil Uygulama",
    title: "Ana ekranı şehir ritmine göre değişen mobil keşif deneyimi.",
    description: "Ana Sayfa, Mekanlar, Etkinlikler, Fırsatlar ve Profil sekmeleriyle hızlı, mobil öncelikli bir yapı.",
    sections: [
      { title: "Saat kartı", text: "Sabah, öğle, akşam ve geceye göre restoran, kahve, tiyatro veya gece rotaları." },
      { title: "Mini modüller", text: "Tourist Survival Kit ve Antik Rehber keşif akışına doğal biçimde eşlik eder." },
      { title: "Profil", text: "QR, 500 başlangıç puanı, görevler, rozetler, favoriler ve bildirim tercihleri." }
    ]
  },
  {
    slug: "hakkimizda",
    eyebrow: "Hakkımızda",
    title: "Nar Rehberi, şehrin iyi anlarını daha kolay bulunur kılmak için tasarlanıyor.",
    description: "Platform; yerel keşfi, kültür-sanat akışını, işletme görünürlüğünü ve sadakat deneyimini tek yerde toplar.",
    sections: [
      { title: "Yaklaşım", text: "Kart kalabalığından uzak, hızlı taranan, premium ve mobil öncelikli bir şehir rehberi." },
      { title: "Kapsam", text: "Mekanlar, etkinlikler, tiyatro, fırsatlar ve şehir deneyimini güçlendiren araçlar." },
      { title: "Kalite", text: "Akıcı, tutarlı ve özenli bir şehir rehberi deneyimi." }
    ]
  },
  {
    slug: "iletisim",
    eyebrow: "İletişim",
    title: "İşletme, tiyatro veya şehir iş birliği için Nar Rehberi ekibine ulaş.",
    description: "İşletme, tiyatro veya şehir ortaklığı için doğru ekibe hızlıca ulaş.",
    sections: [
      { title: "İşletmeler", text: "Mekan yönetimi, fırsat vitrini ve QR sadakat akışları için görüşme." },
      { title: "Tiyatrolar", text: "Oyun yönetimi, sinopsis çevirisi, bilet linki ve bildirim planı." },
      { title: "Şehir ortaklıkları", text: "Turist modülleri, etkinlik takvimi, kültür rotaları ve veri ortaklıkları." }
    ]
  }
];

export const seoMeta: SeoMeta[] = [
  {
    slug: "/",
    title: "Nar Rehberi | Şehri daha iyi keşfet",
    description: "Mekan, etkinlik, tiyatro, fırsat ve QR sadakat deneyimlerini bir araya getiren premium şehir rehberi.",
    keywords: ["Nar Rehberi", "şehir rehberi", "mekan keşfi", "etkinlik", "fırsat"]
  },
  {
    slug: "/ozellikler",
    title: "Özellikler | Nar Rehberi",
    description: "Şehir keşfi, mekanlar, etkinlikler, fırsatlar, QR sadakat, puan ve rol bazlı panelleri tek platformda incele.",
    keywords: ["Nar Rehberi özellikler", "şehir keşif uygulaması", "QR sadakat", "puan sistemi"]
  },
  {
    slug: "/mekanlar",
    title: "Mekanlar | Nar Rehberi",
    description: "Google Places ile zenginleşen restoran, kahve, gece hayatı ve şehir rotalarını keşfet.",
    keywords: ["mekanlar", "Google Places", "restoran", "kahve", "Antalya"]
  },
  {
    slug: "/etkinlikler",
    title: "Etkinlikler | Nar Rehberi",
    description: "Tiyatro, konser, festival, sergi, workshop ve çocuk etkinliklerini aylık veya haftalık keşfet.",
    keywords: ["etkinlik", "tiyatro", "konser", "festival", "Antalya etkinlik"]
  },
  {
    slug: "/firsatlar",
    title: "Nar Fırsatları | Nar Rehberi",
    description: "QR sadakat, puan kullanımı ve anlık kampanyalarla şehirde daha avantajlı keşif.",
    keywords: ["fırsat", "kampanya", "QR", "puan", "sadakat"]
  },
  {
    slug: "/isletmeler-icin",
    title: "İşletmeler İçin | Nar Rehberi",
    description: "Mekan yönetimi, kampanya vitrini, QR okutma, puan işlemleri ve analytics için modern işletme paneli.",
    keywords: ["işletme paneli", "mekan yönetimi", "QR kampanya", "sadakat sistemi"]
  },
  {
    slug: "/tiyatro-cozumleri",
    title: "Tiyatro Çözümleri | Nar Rehberi",
    description: "Oyun, kadro, sinopsis çevirisi, bilet, bildirim limiti ve analitik yönetimi için tiyatro paneli.",
    keywords: ["tiyatro paneli", "sinopsis çevirisi", "bilet yönetimi", "etkinlik bildirimi"]
  },
  {
    slug: "/mobil-uygulama",
    title: "Mobil Uygulama | Nar Rehberi",
    description: "Saat bazlı keşif, stories fırsatlar, yakındaki mekanlar, etkinlikler, QR ve puan deneyimini mobilde gör.",
    keywords: ["Nar Rehberi mobil", "şehir rehberi uygulaması", "mobil keşif", "QR puan"]
  },
  {
    slug: "/tourist-survival-kit",
    title: "Tourist Survival Kit | Nar Rehberi",
    description: "Acil numaralar, eczaneler, hastaneler, ulaşım ve turist bilgilerini kompakt şehir modülüyle sun.",
    keywords: ["tourist survival kit", "turist rehberi", "acil numaralar", "şehir bilgileri"]
  },
  {
    slug: "/antik-rehber",
    title: "Antik Rehber | Nar Rehberi",
    description: "Antik şehir duraklarını, kültür rotalarını ve harita destekli mini keşif alanlarını yönet.",
    keywords: ["antik rehber", "kültür rotası", "antik şehir", "şehir keşfi"]
  },
  {
    slug: "/hakkimizda",
    title: "Hakkımızda | Nar Rehberi",
    description: "Nar Rehberi'nin şehir keşfi, etkinlik, fırsat, sadakat ve yerel işletme vizyonunu öğren.",
    keywords: ["Nar Rehberi hakkında", "şehir platformu", "yerel keşif"]
  },
  {
    slug: "/iletisim",
    title: "İletişim | Nar Rehberi",
    description: "Nar Rehberi ekibiyle işletme, tiyatro, reklam ve platform iş birlikleri için iletişime geç.",
    keywords: ["Nar Rehberi iletişim", "iş birliği", "işletme başvurusu", "tiyatro başvurusu"]
  },
  {
    slug: "/giris",
    title: "Tek Giriş | Nar Rehberi",
    description: "Bireysel, işletme, tiyatro ve admin rollerini tek üyelik sistemiyle doğru panele yönlendir.",
    keywords: ["Nar Rehberi giriş", "tek üyelik", "Firebase Auth", "rol bazlı panel"]
  }
];

export const webManifest = {
  name: "Nar Rehberi",
  shortName: "Nar",
  description: "Mekan, etkinlik, fırsat ve QR sadakat deneyimlerini birleştiren modern şehir rehberi.",
  startUrl: "/",
  themeColor: "#c63f2e",
  backgroundColor: "#f8f3ec",
  shortcuts: [
    { name: "Mekanlar", url: "/mekanlar", description: "Yakındaki mekanları keşfet." },
    { name: "Etkinlikler", url: "/etkinlikler", description: "Şehirdeki etkinlikleri görüntüle." },
    { name: "Nar Fırsatları", url: "/firsatlar", description: "QR ve puan avantajlarını keşfet." },
    { name: "Antik Rehber", url: "/antik-rehber", description: "Antik şehir rotalarını keşfet." },
    { name: "Tek Giriş", url: "/giris", description: "Hesabına giriş yap." }
  ] satisfies WebManifestShortcut[]
};

export const touristSurvivalKit: SurvivalKitItem[] = [
  {
    id: "emergency-112",
    category: "emergency",
    title: { tr: "Acil Çağrı 112", en: "Emergency 112", ru: "Экстренный номер 112", de: "Notruf 112" },
    description: {
      tr: "Sağlık, polis, itfaiye ve acil durumlar için tek numara.",
      en: "Single number for health, police, fire and emergencies.",
      ru: "Единый номер для скорой, полиции, пожарной службы и экстренных случаев.",
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
    id: "airport-transfer",
    category: "transport",
    title: { tr: "Havalimanı Ulaşımı", en: "Airport Transport", ru: "Транспорт из аэропорта", de: "Flughafentransfer" },
    description: {
      tr: "Tramvay, otobüs, taksi ve transfer seçenekleri için kısa rehber.",
      en: "Short guide for tram, bus, taxi and transfer options.",
      ru: "Краткий гид по трамваю, автобусу, такси и трансферам.",
      de: "Kurzer Guide für Tram, Bus, Taxi und Transferoptionen."
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
      ru: "Городской символ римской эпохи у входа в Калеичи.",
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
      ru: "Важный античный маршрут с колоннадной улицей, театром и стадионом.",
      de: "Eine starke antike Route mit Säulenstraße, Theater und Stadion."
    },
    district: "Aksu",
    era: "Pamfilya",
    location: { lat: 36.9588, lng: 30.8522 },
    image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb"
  }
];

export const seoManagedRoutes = [
  "/",
  "/ozellikler",
  "/mekanlar",
  "/etkinlikler",
  "/firsatlar",
  "/isletmeler-icin",
  "/tiyatro-cozumleri",
  "/mobil-uygulama",
  "/tourist-survival-kit",
  "/antik-rehber",
  "/hakkimizda",
  "/iletisim",
  "/giris"
];

export const adminStats: DashboardStat[] = [
  { id: "active-users", label: "Aktif kullanıcı", value: "12.4K", trend: "+%18", tone: "nar" },
  { id: "popular-places", label: "Popüler mekan", value: "Kaleiçi Sofrası", trend: "842 yorum", tone: "sea" },
  { id: "qr-usage", label: "QR kullanımı", value: "8.921", trend: "+%27", tone: "sage" },
  { id: "campaign-use", label: "Kampanya kullanımı", value: "2.340", trend: "+%12", tone: "plum" },
  { id: "notification-open", label: "Bildirim açılma", value: "%41", trend: "+%6", tone: "sea" },
  { id: "language-use", label: "Dil kullanımı", value: "TR %78", trend: "EN %12 · RU %6 · DE %4", tone: "nar" },
  { id: "platform-use", label: "Platform", value: "Mobil %64", trend: "Web %36", tone: "sage" }
];

export const deepLinks = {
  place: (id: string) => `narrehberi://place/${id}`,
  event: (id: string) => `narrehberi://event/${id}`,
  offer: (id: string) => `narrehberi://offer/${id}`,
  profile: () => "narrehberi://profile",
  qr: () => "narrehberi://qr"
};

export const defaultPushPreferences: PushPreferences = {
  offers: true,
  events: true,
  theater: true,
  reminders: true,
  quietHoursStart: "23:00",
  quietHoursEnd: "08:00"
};

export const sampleOrders: NarOrder[] = [
  {
    id: "order-ticket-may-theater-night",
    userId: "demo-user",
    type: "ticket",
    status: "created",
    entityId: "may-theater-night",
    entityTitle: "Bir Yaz Gecesi Oyunu",
    amountLabel: "Bilet yönlendirmesi",
    createdAt: "2026-05-01T11:00:00+03:00"
  },
  {
    id: "order-offer-coffee-qr-week",
    userId: "demo-user",
    type: "offer",
    status: "used",
    entityId: "coffee-qr-week",
    entityTitle: "QR ile ikinci kahve %50",
    businessId: "business-harbor",
    placeId: "harbor-coffee",
    pointsDelta: 0,
    amountLabel: "%50",
    createdAt: "2026-05-01T12:30:00+03:00",
    usedAt: "2026-05-01T12:35:00+03:00"
  }
];

export const sampleQrTransactions: QrTransaction[] = [
  {
    id: "qr-demo-earn",
    userId: "demo-user",
    businessId: "business-harbor",
    placeId: "harbor-coffee",
    offerId: null,
    type: "earn",
    pointsDelta: 75,
    balanceAfter: 575,
    note: "İlk QR ziyaret puanı",
    createdAt: "2026-05-01T12:20:00+03:00"
  },
  {
    id: "qr-demo-offer",
    userId: "demo-user",
    businessId: "business-harbor",
    placeId: "harbor-coffee",
    offerId: "coffee-qr-week",
    type: "spend",
    pointsDelta: 0,
    balanceAfter: 575,
    note: "QR kampanya kullanımı",
    createdAt: "2026-05-01T12:35:00+03:00"
  }
];

export const sampleErrorLogs: ErrorLog[] = [
  {
    id: "err-import-missing-title",
    severity: "warning",
    source: "import",
    message: "Import önizlemede Türkçe başlık eksik satır bulundu.",
    context: { kind: "places", row: 3 },
    createdAt: "2026-05-01T12:45:00+03:00"
  },
  {
    id: "err-notification-token",
    severity: "info",
    source: "functions",
    message: "Bildirim gönderiminde geçersiz FCM token atlandı.",
    context: { target: "role", role: "individual" },
    createdAt: "2026-05-01T13:05:00+03:00"
  }
];

export const sampleAuditLogs: AuditLog[] = [
  {
    id: "audit-approval-submit",
    actorId: "theater-demo",
    action: "approval.submit",
    entityType: "event",
    entityId: "may-theater-night",
    createdAt: "2026-05-01T10:15:00+03:00"
  },
  {
    id: "audit-import-commit",
    actorId: "admin-demo",
    action: "import.commit",
    entityType: "places",
    entityId: "import-demo",
    createdAt: "2026-05-01T12:00:00+03:00"
  }
];

export const sampleExportManifests: ExportManifest[] = [
  {
    id: "export-places-demo",
    kind: "places",
    format: "csv",
    status: "requested",
    requestedAt: "2026-05-01T13:20:00+03:00",
    requestedBy: "admin-demo"
  },
  {
    id: "export-offers-demo",
    kind: "offers",
    format: "xlsx",
    status: "ready",
    requestedAt: "2026-05-01T13:40:00+03:00",
    requestedBy: "admin-demo"
  }
];

export function getMarketingPage(slug: string) {
  return marketingPages.find((page) => page.slug === slug);
}

export function getSeoMeta(slug: string) {
  return seoMeta.find((item) => item.slug === slug) ?? seoMeta[0];
}

export function createGoogleMapsDirectionsUrl(destination: GeoPoint, label?: string) {
  const query = encodeURIComponent(label ? `${label} ${destination.lat},${destination.lng}` : `${destination.lat},${destination.lng}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export function createStaticMapUrl(location?: GeoPoint, apiKey?: string) {
  if (!location || !apiKey) return "";
  const params = new URLSearchParams({
    center: `${location.lat},${location.lng}`,
    zoom: "15",
    size: "900x520",
    scale: "2",
    markers: `color:red|${location.lat},${location.lng}`,
    key: apiKey
  });
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export const defaultUserPoints = 500;

export const locales: Locale[] = ["tr", "en", "ru", "de"];

export const roleHome: Record<UserRole, string> = {
  individual: "/panel/bireysel",
  business: "/panel/isletme",
  theater: "/panel/tiyatro",
  admin: "/panel/admin"
};

export interface PanelMenuItem {
  id: string;
  title: string;
  description: string;
}

export const panelMenus: Record<UserRole, PanelMenuItem[]> = {
  admin: [
    { id: "overview", title: "Genel", description: "Platform sağlığı, onay bekleyenler ve hızlı aksiyonlar." },
    { id: "members", title: "Üyeler", description: "Kullanıcılar, roller, manuel admin atamaları ve hesap durumu." },
    { id: "orders", title: "Siparişler", description: "Fırsat, bilet ve puan kullanımından doğan sipariş kayıtları." },
    { id: "places", title: "Mekanlar", description: "Google Places eşleşmeleri, içerik onayı ve vitrin yönetimi." },
    { id: "events", title: "Etkinlikler", description: "Takvim, tür, ilçe, yayın ve öne çıkarma yönetimi." },
    { id: "offers", title: "Fırsatlar", description: "Kampanyalar, stories önerileri, süre ve QR şartları." },
    { id: "qr", title: "QR Akış", description: "Puan ekleme, puan düşme, kampanya kullanımı ve audit izi." },
    { id: "dt", title: "DT Kontrol", description: "Tiyatro içerikleri, oyun bildirim hakları ve yayın önizleme." },
    { id: "notifications", title: "Bildirimler", description: "FCM hedefleme, zamanlama, geçmiş ve performans." },
    { id: "stats", title: "İstatistikler", description: "Aktif kullanıcı, popüler mekan, QR, kampanya, dil ve platform kullanımı." },
    { id: "settings", title: "Ayarlar", description: "SEO, tema, import/export ve sistem tercihleri." }
  ],
  business: [
    { id: "places", title: "Mekanlar", description: "Sahip olunan mekanlar, Google bilgileri ve yayın durumu." },
    { id: "loyalty", title: "Sadakat", description: "Puan kuralları, QR kazanımı ve kampanya bağları." },
    { id: "new", title: "Yeni Ekle", description: "Mekan ve kampanya ekleme akışı." },
    { id: "qr", title: "QR İşlem", description: "Kullanıcı QR kodu okuma, puan ekleme/düşme ve fırsat kullanımı." },
    { id: "offers", title: "Fırsatlar", description: "Anlık fırsatlar, süre, şartlar ve stories vitrini." },
    { id: "settings", title: "Ayarlar", description: "İşletme profili, bildirim tercihleri ve ekip ayarları." }
  ],
  theater: [
    { id: "list", title: "Liste", description: "Oyunlar, gösterimler ve yayın durumları." },
    { id: "play", title: "Oyun", description: "Kapak, tür, tarih, yer, bilet ve medya bilgileri." },
    { id: "cast", title: "Kadro", description: "Oyuncu ve ekip bilgileri." },
    { id: "synopsis", title: "Sinopsis", description: "Türkçe metin ve İngilizce, Rusça, Almanca çeviriler." },
    { id: "ticket", title: "Bilet", description: "Bilet linki, fiyat tipi ve satış yönlendirmesi." },
    { id: "preview", title: "Önizleme", description: "Mobil etkinlik detay görünümü kontrolü." },
    { id: "notifications", title: "Bildirimler", description: "Oyun başına en fazla 3 bildirim hakkı." },
    { id: "analytics", title: "Analitik", description: "Görüntülenme, favori, bilet tıklaması ve bildirim etkisi." },
    { id: "settings", title: "Ayarlar", description: "Tiyatro profili, ekip ve içerik tercihleri." }
  ],
  individual: [
    { id: "points", title: "Puan ve QR", description: "500 başlangıç puanı, QR kimliği ve hareket geçmişi." },
    { id: "tasks", title: "Görevler", description: "Keşif, etkinlik ve fırsat görevleri." },
    { id: "badges", title: "Rozetler", description: "Kazanımlar ve şehir içi başarılar." },
    { id: "orders", title: "Siparişler", description: "Bilet, fırsat ve puan kullanımı kayıtları." },
    { id: "favorites", title: "Favoriler", description: "Kaydedilen mekanlar, etkinlikler ve fırsatlar." },
    { id: "settings", title: "Ayarlar", description: "Dil, tema, bildirim ve güvenlik tercihleri." }
  ]
};

export const dashboardMetrics = {
  admin: [
    { label: "Aktif kullanıcı", value: "12.4K" },
    { label: "QR kullanımı", value: "8.921" },
    { label: "Bildirim açılma", value: "%41" }
  ],
  business: [
    { label: "Bu ay QR", value: "684" },
    { label: "Aktif fırsat", value: "7" },
    { label: "Ortalama puan", value: "4.7" }
  ],
  theater: [
    { label: "Yayındaki oyun", value: "9" },
    { label: "Kalan bildirim", value: "3" },
    { label: "Bilet tıklaması", value: "1.284" }
  ],
  individual: [
    { label: "Puan", value: "500" },
    { label: "Görev", value: "4" },
    { label: "Favori", value: "18" }
  ]
} satisfies Record<UserRole, Array<{ label: string; value: string }>>;

export const categories = [
  { id: "restaurants", icon: "utensils", title: { tr: "Restoran", en: "Restaurant", ru: "Ресторан", de: "Restaurant" } },
  { id: "coffee", icon: "coffee", title: { tr: "Kahve", en: "Coffee", ru: "Кофе", de: "Kaffee" } },
  { id: "nightlife", icon: "music", title: { tr: "Gece Hayatı", en: "Nightlife", ru: "Ночная жизнь", de: "Nachtleben" } },
  { id: "theater", icon: "drama", title: { tr: "Tiyatro", en: "Theater", ru: "Театр", de: "Theater" } },
  { id: "ancient", icon: "landmark", title: { tr: "Antik Rota", en: "Ancient Route", ru: "Античный маршрут", de: "Antike Route" } },
  { id: "family", icon: "sparkles", title: { tr: "Aile", en: "Family", ru: "Семья", de: "Familie" } }
] as const;

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

export const eventTypes: Array<{ id: EventType; title: LocalizedText }> = [
  { id: "theater", title: { tr: "Tiyatro", en: "Theater", ru: "Театр", de: "Theater" } },
  { id: "ballet", title: { tr: "Bale", en: "Ballet", ru: "Балет", de: "Ballett" } },
  { id: "musical", title: { tr: "Müzikal", en: "Musical", ru: "Мюзикл", de: "Musical" } },
  { id: "concert", title: { tr: "Konser", en: "Concert", ru: "Концерт", de: "Konzert" } },
  { id: "festival", title: { tr: "Festival", en: "Festival", ru: "Фестиваль", de: "Festival" } },
  { id: "exhibition", title: { tr: "Sergi", en: "Exhibition", ru: "Выставка", de: "Ausstellung" } },
  { id: "fair", title: { tr: "Fuar", en: "Fair", ru: "Ярмарка", de: "Messe" } },
  { id: "workshop", title: { tr: "Workshop", en: "Workshop", ru: "Мастер-класс", de: "Workshop" } },
  { id: "kids", title: { tr: "Çocuk Etkinliği", en: "Kids Event", ru: "Детское событие", de: "Kinderveranstaltung" } },
  { id: "standup", title: { tr: "Stand-up", en: "Stand-up", ru: "Стендап", de: "Stand-up" } },
  { id: "show", title: { tr: "Gösteri", en: "Show", ru: "Шоу", de: "Show" } }
];

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

  const haystack = normalizeCategoryText([
    place.categoryId,
    place.title.tr,
    place.description.tr,
    place.address,
    ...place.features
  ].filter(Boolean).join(" "));

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

  const haystack = normalizeCategoryText([
    event.title.tr,
    event.description.tr,
    event.synopsis?.tr,
    event.venueName
  ].filter(Boolean).join(" "));

  if (includesAny(haystack, ["bale", "ballet"])) return "ballet";
  if (includesAny(haystack, ["muzikal", "musical"])) return "musical";
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
  return {
    places: legacyPlaces,
    events: [...legacyAntalyaEvents, ...biletinialAutfFestivalEvents, ...antalyaMay2026Events]
  };
}

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

const curatedFeaturedPlaces: Place[] = [
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
      ru: "Минималистичный кофе-бар и морской бриз после утренней прогулки.",
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

export const featuredPlaces: Place[] = [
  ...curatedFeaturedPlaces,
  ...legacyPlaces.filter((place) => !curatedFeaturedPlaces.some((curated) => curated.id === place.id))
];

const curatedFeaturedEvents: EventItem[] = [
  {
    id: "may-theater-night",
    title: { tr: "Bir Yaz Gecesi Oyunu", en: "A Summer Night Play", ru: "Пьеса летней ночи", de: "Ein Sommernachtsspiel" },
    description: {
      tr: "Modern sahne diliyle sıcak, hızlı ve şehirli bir komedi.",
      en: "A warm, fast and urban comedy with a modern stage language.",
      ru: "Теплая, быстрая городская комедия с современным сценическим языком.",
      de: "Eine warme, schnelle urbane Komödie mit moderner Bühnensprache."
    },
    synopsis: {
      tr: "Kesişen yollar, yanlış anlaşılmalar ve Antalya gecesinde büyüyen küçük sırlar.",
      en: "Crossing paths, misunderstandings and small secrets growing in an Antalya night.",
      ru: "Пересекающиеся пути, недоразумения и маленькие тайны ночной Анталии.",
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
  }
];

export const featuredEvents: EventItem[] = [...curatedFeaturedEvents, ...legacyAntalyaEvents, ...biletinialAutfFestivalEvents, ...antalyaMay2026Events];

export const featuredOffers: Offer[] = [
  {
    id: "coffee-qr-week",
    businessId: "business-harbor",
    placeId: "harbor-coffee",
    title: { tr: "QR ile ikinci kahve %50", en: "Second coffee 50% with QR", ru: "Второй кофе -50% с QR", de: "Zweiter Kaffee 50% mit QR" },
    description: {
      tr: "Nar QR kodunu göster, günün ikinci kahvesini yarı fiyatına al.",
      en: "Show your Nar QR code and get the second coffee of the day half price.",
      ru: "Покажите QR Nar и получите второй кофе дня за полцены.",
      de: "Zeige deinen Nar-QR-Code und erhalte den zweiten Kaffee zum halben Preis."
    },
    discountLabel: "%50",
    startsAt: "2026-05-01T00:00:00+03:00",
    endsAt: "2026-05-31T23:59:00+03:00",
    conditions: {
      tr: "Günde bir kez kullanılabilir. Paket servis dahil değildir.",
      en: "Can be used once per day. Takeaway is not included.",
      ru: "Можно использовать один раз в день. Еда навынос не включена.",
      de: "Einmal pro Tag nutzbar. Take-away ist nicht enthalten."
    },
    requiresQr: true,
    pointCost: 0,
    storyEnabled: true,
    storyPriority: 1,
    useLimit: 500,
    usedCount: 128,
    featured: true,
    status: "published"
  }
];

export const offerStories: OfferStory[] = [
  {
    id: "story-coffee-qr-week",
    offerId: "coffee-qr-week",
    title: { tr: "Kahve molası", en: "Coffee break", ru: "Кофейная пауза", de: "Kaffeepause" },
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    priority: 1,
    status: "published"
  }
];

export function compactValue(value?: string | number | boolean | null) {
  if (value === undefined || value === null || value === "") return "Belirtilmemiş";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  return String(value);
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

export { createTranslationFallbackReport, dictionary, hasCompleteTranslations, isLocale, localizeText, missingLocales, t } from "./i18n";
export { extractSynopsisOnly, normalizeSynopsisText } from "./synopsis";
export { translateText } from "./translate";
export { mapLegacyTheatrePlayToEvent, mapLegacyVenueToPlace } from "./legacy";
export { fetchGooglePlaceSnapshot, mapGoogleSnapshotToPlace, type GooglePlaceDetailsInput } from "./places";
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
  writePath,
  type ImportExportFormat,
  type ImportPreviewRow
} from "./importExport";
