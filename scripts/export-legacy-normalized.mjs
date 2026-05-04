import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, limit, query } from "firebase/firestore";

const root = process.cwd();
const outputDir = join(root, "docs", "reports");
const outputPath = join(outputDir, "legacy-normalized-preview.json");

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function env(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Eksik environment değeri: ${key}`);
  return value;
}

function text(value, fallback = "Belirtilmemiş") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return hasEncodingIssue(value) ? fallback : value.trim();
}

function hasEncodingIssue(value) {
  if (typeof value !== "string") return false;
  const forbiddenCodes = new Set([0x00c3, 0x00c5, 0x00c4, 0x00d0, 0x00de, 0xfffd]);
  return [...value].some((char) => forbiddenCodes.has(char.codePointAt(0) ?? 0));
}

function localized(value, fallback = "Belirtilmemiş") {
  const tr = text(value, fallback);
  return { tr, en: tr, ru: tr, de: tr };
}

function list(value) {
  if (Array.isArray(value)) return value.map((item) => text(item, "")).filter(Boolean);
  return text(value, "").split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
}

function status(value) {
  const normalized = text(value, "YAYINDA").toLocaleUpperCase("tr-TR");
  if (["YAYINDA", "AKTIF", "AKTİF", "APPROVED"].includes(normalized)) return "published";
  if (["ONAY_BEKLIYOR", "ONAY BEKLIYOR", "PENDING"].includes(normalized)) return "pending";
  if (["ARSIV", "ARŞİV", "ARCHIVED"].includes(normalized)) return "archived";
  return "draft";
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapVenue(id, data) {
  const gallery = list(data.fotolar);
  const coverImage = text(data.fotoUrl, gallery[0] ?? "https://images.unsplash.com/photo-1514933651103-005eec06c04b");
  const lat = numberValue(data.lat);
  const lng = numberValue(data.lng);
  return {
    id,
    title: localized(data.ad, "Mekan"),
    description: localized(data.aciklama, "Mekan açıklaması belirtilmemiş."),
    categoryId: text(data.kategori, "city"),
    district: text(data.ilce, "Antalya"),
    address: text(data.adres),
    location: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    phone: text(data.telefon, ""),
    website: text(data.web, ""),
    coverImage,
    gallery: gallery.length ? gallery : [coverImage],
    features: list(data.ozellikler),
    accessibility: {
      wheelchair: Boolean(data.engelli_dostu),
      childFriendly: Boolean(data.cocuk_dostu),
      parking: Boolean(data.otopark),
      wifi: Boolean(data.wifi),
      vegan: Boolean(data.vegan)
    },
    googleRating: numberValue(data.google_rating),
    googleReviewCount: numberValue(data.google_ratings_total),
    status: status(data.onay_durumu)
  };
}

function mapPlay(id, data) {
  const program = Array.isArray(data.tarihler?.program) ? data.tarihler.program : [];
  const firstProgram = program[0] ?? {};
  const date = text(firstProgram.tarih ?? data.tarihler?.promiyer, new Date().toISOString().slice(0, 10));
  const time = text(firstProgram.saat, "20:00");
  const synopsis = `${text(data.sinopsis?.TR?.perde1, "")} ${text(data.sinopsis?.TR?.perde2, "")}`.trim();
  return {
    id,
    title: localized(data.ad, "Tiyatro oyunu"),
    description: localized(synopsis, "Sinopsis belirtilmemiş."),
    synopsis: localized(synopsis, "Sinopsis belirtilmemiş."),
    type: "theater",
    district: text(data.ilce, "Antalya"),
    venueName: text(data.salon),
    startsAt: `${date}T${time}:00+03:00`,
    priceType: data.ucretsiz ? "free" : "paid",
    ticketUrl: text(data.biletLink, ""),
    cast: Array.isArray(data.kadro) ? data.kadro.map((item) => text(item.oyuncu ?? item.ad, "")).filter(Boolean) : [],
    coverImage: text(data.afis, "https://images.unsplash.com/photo-1503095396549-807759245b35"),
    status: status(data.durum),
    notificationLimit: 3,
    notificationUsed: Array.isArray(data.bildirimler) ? data.bildirimler.filter((item) => item.gonderildi === true).length : 0
  };
}

function mapRole(value) {
  const role = text(value, "USER").toLocaleUpperCase("tr-TR");
  if (["MASTER", "ADMIN"].includes(role)) return "admin";
  if (["ISLETME", "İŞLETME", "KURUMSAL", "BUSINESS"].includes(role)) return "business";
  if (["TIYATRO", "THEATER", "DT_ADMIN"].includes(role)) return "theater";
  return "individual";
}

function mapUser(id, data) {
  const displayName = text(data.displayName ?? data.ad_soyad ?? data.firma_adi, "Nar kullanıcısı");
  const points = Number(data.points ?? data.puan ?? 500);
  return {
    id,
    displayName,
    email: text(data.email, ""),
    role: mapRole(data.role ?? data.rol),
    legacyRole: text(data.role ?? data.rol, "USER"),
    city: text(data.city ?? data.sehir, "Antalya"),
    points: Number.isFinite(points) ? points : 500,
    qrCodeId: text(data.qrCodeId ?? data.qr_kod, `nar-${id}`),
    disabled: data.aktif === false,
    preferredLocale: "tr"
  };
}

loadEnv();

const app = initializeApp({
  apiKey: env("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: env("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: env("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: env("NEXT_PUBLIC_FIREBASE_APP_ID")
}, "legacy-normalized-preview");
const db = getFirestore(app);

const [venues, plays, users] = await Promise.all([
  getDocs(query(collection(db, "venues"), limit(250))),
  getDocs(query(collection(db, "theatre_plays"), limit(250))),
  getDocs(query(collection(db, "users"), limit(250)))
]);

const payload = {
  exportedAt: new Date().toISOString(),
  sourceProjectId: env("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  writeMode: "preview-only",
  places: venues.docs.map((doc) => mapVenue(doc.id, doc.data())),
  events: plays.docs.map((doc) => mapPlay(doc.id, doc.data())),
  users: users.docs.map((doc) => mapUser(doc.id, doc.data()))
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Normalize migration önizlemesi hazır: ${outputPath}`);
console.log(`places: ${payload.places.length}, events: ${payload.events.length}, users: ${payload.users.length}`);
