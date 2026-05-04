import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, limit, query } from "firebase/firestore";

const root = process.cwd();
const reportDir = join(root, "docs", "reports");
const reportPath = join(reportDir, "legacy-live-report.json");

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function requiredEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Eksik environment değeri: ${key}`);
  return value;
}

function asText(value, fallback = "") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return hasEncodingIssue(value) ? "[Türkçe karakter bozulması]" : value.trim();
}

function hasEncodingIssue(value) {
  if (typeof value !== "string") return false;
  const forbiddenCodes = new Set([0x00c3, 0x00c5, 0x00c4, 0x00d0, 0x00de, 0xfffd]);
  return [...value].some((char) => forbiddenCodes.has(char.codePointAt(0) ?? 0));
}

function isPublished(value) {
  const status = asText(value, "YAYINDA").toLocaleUpperCase("tr-TR");
  return ["YAYINDA", "AKTIF", "AKTİF", "APPROVED"].includes(status);
}

function collectVenueIssues(id, data) {
  const issues = [];
  if (!asText(data.ad)) issues.push("ad eksik");
  if (hasEncodingIssue(data.ad) || hasEncodingIssue(data.aciklama) || hasEncodingIssue(data.adres)) issues.push("Türkçe karakter bozulması");
  if (!asText(data.aciklama)) issues.push("açıklama eksik");
  if (!asText(data.kategori)) issues.push("kategori eksik");
  if (!asText(data.adres)) issues.push("adres eksik");
  if (!asText(data.fotoUrl) && !(Array.isArray(data.fotolar) && data.fotolar.length)) issues.push("kapak görseli eksik");
  if (!asText(data.onay_durumu)) issues.push("yayın durumu eksik");
  return { id, title: asText(data.ad, "İsimsiz mekan"), status: asText(data.onay_durumu, "Belirtilmemiş"), issues };
}

function collectPlayIssues(id, data) {
  const issues = [];
  if (!asText(data.ad)) issues.push("oyun adı eksik");
  if (hasEncodingIssue(data.ad)) issues.push("Türkçe karakter bozulması");
  if (!asText(data.afis)) issues.push("afiş eksik");
  if (!asText(data.biletLink)) issues.push("bilet linki eksik");
  if (!asText(data.durum)) issues.push("yayın durumu eksik");
  const synopsis = data.sinopsis?.TR;
  if (!asText(synopsis?.perde1) && !asText(synopsis?.perde2)) issues.push("Türkçe sinopsis eksik");
  return { id, title: asText(data.ad, "İsimsiz oyun"), status: asText(data.durum, "Belirtilmemiş"), issues };
}

function collectUserIssues(id, data) {
  const role = asText(data.role ?? data.rol, "");
  const issues = [];
  if (!role) issues.push("rol eksik");
  if (hasEncodingIssue(data.displayName) || hasEncodingIssue(data.ad_soyad) || hasEncodingIssue(data.firma_adi)) issues.push("Türkçe karakter bozulması");
  if (role && !["individual", "business", "theater", "admin", "USER", "ISLETME", "TIYATRO", "ADMIN"].includes(role)) {
    issues.push(`rol eşleşmesi belirsiz: ${role}`);
  }
  if (data.points === undefined && data.puan === undefined) issues.push("puan alanı eksik");
  return { id, title: asText(data.displayName ?? data.ad_soyad ?? data.firma_adi, "İsimsiz kullanıcı"), role: role || "Belirtilmemiş", issues };
}

async function readCollection(db, name, max = 100) {
  const snapshot = await getDocs(query(collection(db, name), limit(max)));
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
}

loadEnv();

const firebaseConfig = {
  apiKey: requiredEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: requiredEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: requiredEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requiredEnv("NEXT_PUBLIC_FIREBASE_APP_ID")
};

const app = initializeApp(firebaseConfig, "legacy-live-check");
const db = getFirestore(app);

const [venues, plays, users, qrLogs, notifications] = await Promise.all([
  readCollection(db, "venues"),
  readCollection(db, "theatre_plays"),
  readCollection(db, "users"),
  readCollection(db, "qr_logs"),
  readCollection(db, "notifications")
]);

const venueIssues = venues.map((item) => collectVenueIssues(item.id, item.data));
const playIssues = plays.map((item) => collectPlayIssues(item.id, item.data));
const userIssues = users.map((item) => collectUserIssues(item.id, item.data));

const report = {
  checkedAt: new Date().toISOString(),
  projectId: firebaseConfig.projectId,
  collections: {
    venues: {
      count: venues.length,
      publishedCount: venues.filter((item) => isPublished(item.data.onay_durumu)).length,
      issueCount: venueIssues.reduce((total, item) => total + item.issues.length, 0),
      samplesWithIssues: venueIssues.filter((item) => item.issues.length).slice(0, 20)
    },
    theatre_plays: {
      count: plays.length,
      publishedCount: plays.filter((item) => isPublished(item.data.durum)).length,
      issueCount: playIssues.reduce((total, item) => total + item.issues.length, 0),
      samplesWithIssues: playIssues.filter((item) => item.issues.length).slice(0, 20)
    },
    users: {
      count: users.length,
      issueCount: userIssues.reduce((total, item) => total + item.issues.length, 0),
      samplesWithIssues: userIssues.filter((item) => item.issues.length).slice(0, 20)
    },
    qr_logs: {
      count: qrLogs.length,
      issueCount: qrLogs.filter((item) => !item.data.userId && !item.data.uid && !item.data.kullaniciId).length
    },
    notifications: {
      count: notifications.length,
      issueCount: notifications.filter((item) => !item.data.title && !item.data.baslik).length
    }
  }
};

mkdirSync(reportDir, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Eski Firebase canlı veri kontrolü başarılı. Rapor: ${reportPath}`);
console.log(`venues: ${report.collections.venues.count}, theatre_plays: ${report.collections.theatre_plays.count}, users: ${report.collections.users.count}, qr_logs: ${report.collections.qr_logs.count}`);
