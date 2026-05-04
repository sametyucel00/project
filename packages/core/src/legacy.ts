import type { EventItem, EventType, LocalizedText, Place, PublishStatus } from "./index";

type LegacyRecord = Record<string, unknown>;

const fallbackImage = "https://images.unsplash.com/photo-1514933651103-005eec06c04b";

function text(value: unknown, fallback = "Belirtilmemiş") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function localized(value: unknown, fallback = "Belirtilmemiş"): LocalizedText {
  const tr = text(value, fallback);
  return { tr, en: tr, ru: tr, de: tr };
}

function statusFromLegacy(value: unknown): PublishStatus {
  const status = text(value, "YAYINDA").toLocaleUpperCase("tr-TR");
  if (["YAYINDA", "AKTIF", "AKTİF", "APPROVED"].includes(status)) return "published";
  if (["ONAY_BEKLIYOR", "ONAY BEKLIYOR", "PENDING"].includes(status)) return "pending";
  if (["ARSIV", "ARŞİV", "ARCHIVED"].includes(status)) return "archived";
  return "draft";
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function coordinateValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function imageList(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => text(item, "")).filter(Boolean);
  return text(value, "")
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function eventTypeFromLegacy(value: unknown): EventType {
  const normalized = text(value, "theater").toLocaleLowerCase("tr-TR");
  if (normalized.includes("konser")) return "concert";
  if (normalized.includes("festival")) return "festival";
  if (normalized.includes("sergi")) return "exhibition";
  if (normalized.includes("workshop")) return "workshop";
  if (normalized.includes("stand")) return "standup";
  if (normalized.includes("çocuk")) return "kids";
  if (normalized.includes("müzikal")) return "musical";
  if (normalized.includes("bale")) return "ballet";
  return "theater";
}

function synopsisText(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const record = value as LegacyRecord;
    const parts = [
      text(record.konu, ""),
      text(record.synopsis, ""),
      text(record.synopsisTr, ""),
      text(record.perde1, ""),
      text(record.perde2, "")
    ].filter(Boolean);
    if (parts.length) return parts.join(" ").trim();
  }
  return "";
}

function extractCastFromSynopsisBlock(value: string) {
  const markers = ["Oyuncular // Performers", "Oyuncular", "Performers", "Cast"];
  const marker = markers.find((item) => value.includes(item));
  if (!marker) return [];
  const tail = value.split(marker)[1] ?? "";
  return tail
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.includes("//"))
    .filter((line) => !/^(yönetmen|director|dramaturg|müzik|music|koreografi|choreography|ışık|light|proje|project|kostüm|set designer|decor|asistan|assistant)/i.test(line));
}

export function mapLegacyVenueToPlace(id: string, data: LegacyRecord): Place {
  const gallery = imageList(data.fotolar);
  const coverImage = text(data.fotoUrl, gallery[0] ?? fallbackImage);
  const lat = coordinateValue(data.lat ?? data.latitude ?? data.enlem ?? data._lat);
  const lng = coordinateValue(data.lng ?? data.longitude ?? data.boylam ?? data._long);

  return {
    id,
    ownerId: text(data.ownerId ?? data.isletmeId, ""),
    googlePlaceId: text(data.google_place_id ?? data.place_id, ""),
    title: localized(data.ad ?? data.name, "Mekan"),
    description: localized(data.aciklama ?? data.description, "Mekan açıklaması belirtilmemiş."),
    categoryId: text(data.kategori ?? data.categoryId, "city"),
    district: text(data.ilce ?? data.district, "Antalya"),
    address: text(data.adres ?? data.address, "Belirtilmemiş"),
    location: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    phone: text(data.telefon ?? data.phone, ""),
    website: text(data.web ?? data.website, ""),
    email: text(data.email, ""),
    menuUrl: text(data.menuUrl, ""),
    openingHours: imageList(data.calisma_saatleri ?? data.openingHours),
    coverImage,
    gallery: gallery.length ? gallery : [coverImage],
    features: imageList(data.ozellikler ?? data.features),
    accessibility: {
      wheelchair: Boolean(data.engelli_dostu ?? data.wheelchair),
      childFriendly: Boolean(data.cocuk_dostu ?? data.childFriendly),
      parking: Boolean(data.otopark ?? data.parking),
      wifi: Boolean(data.wifi),
      vegan: Boolean(data.vegan)
    },
    googleRating: numberValue(data.google_rating ?? data.rating),
    googleReviewCount: numberValue(data.google_ratings_total ?? data.reviewCount),
    openNow: data.acik === undefined ? undefined : Boolean(data.acik),
    status: statusFromLegacy(data.onay_durumu ?? data.status)
  };
}

export function mapLegacyTheatrePlayToEvent(id: string, data: LegacyRecord): EventItem {
  const program = Array.isArray((data.tarihler as LegacyRecord | undefined)?.program)
    ? ((data.tarihler as LegacyRecord).program as LegacyRecord[])
    : [];
  const firstProgram = program[0] ?? {};
  const date = text(firstProgram.tarih ?? (data.tarihler as LegacyRecord | undefined)?.promiyer, new Date().toISOString().slice(0, 10));
  const time = text(firstProgram.saat, "20:00");
  const synopsis = data.sinopsis as LegacyRecord | undefined;
  const synopsisTr = typeof synopsis?.TR === "object"
    ? `${text((synopsis.TR as LegacyRecord).perde1, "")} ${text((synopsis.TR as LegacyRecord).perde2, "")}`.trim()
    : synopsisText(data.sinopsis) || text(data.synopsis ?? data.aciklama, "Sinopsis belirtilmemiş.");
  const descriptionTr = text(data.konu ?? data.aciklama ?? data.description, synopsisTr || "Sinopsis belirtilmemiş.");
  const castFromSynopsis = extractCastFromSynopsisBlock(synopsisTr);
  const castFromLegacy = Array.isArray(data.kadro)
    ? (data.kadro as LegacyRecord[]).map((item) => text(item.oyuncu ?? item.ad, "")).filter(Boolean)
    : [];

  return {
    id,
    organizerId: text(data.organizerId ?? data.tiyatroId, ""),
    title: localized(data.ad ?? data.title, "Tiyatro oyunu"),
    description: localized(descriptionTr, "Sinopsis belirtilmemiş."),
    synopsis: localized(synopsisTr, "Sinopsis belirtilmemiş."),
    type: eventTypeFromLegacy(data.tur ?? data.type),
    district: text(data.ilce ?? data.district, "Antalya"),
    venueName: text(data.salon ?? data.venueName, "Belirtilmemiş"),
    startsAt: `${date}T${time}:00+03:00`,
    priceType: data.ucretsiz ? "free" : "paid",
    ticketUrl: text(data.biletLink ?? data.ticketUrl, ""),
    cast: castFromLegacy.length ? castFromLegacy : castFromSynopsis,
    coverImage: text(data.afis ?? data.coverImage, "https://images.unsplash.com/photo-1503095396549-807759245b35"),
    videoUrl: text(data.videoUrl, ""),
    status: statusFromLegacy(data.durum ?? data.status),
    notificationLimit: 3,
    notificationUsed: Array.isArray(data.bildirimler)
      ? (data.bildirimler as LegacyRecord[]).filter((item) => item.gonderildi === true).length
      : 0
  };
}
