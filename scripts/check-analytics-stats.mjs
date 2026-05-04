import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const core = readFileSync(join(root, "packages", "core", "src", "index.ts"), "utf8");
const functions = readFileSync(join(root, "firebase", "functions", "src", "index.ts"), "utf8");
const adminStats = readFileSync(join(root, "apps", "web", "components", "AdminStats.tsx"), "utf8");
const notificationStats = readFileSync(join(root, "apps", "web", "components", "NotificationStats.tsx"), "utf8");
const webObservability = readFileSync(join(root, "apps", "web", "lib", "observability-actions.ts"), "utf8");
const mobileObservability = readFileSync(join(root, "apps", "mobile", "src", "services", "observability.ts"), "utf8");
const rules = readFileSync(join(root, "firebase", "firestore.rules"), "utf8");

const failures = [];

const analyticsTypes = [
  "place_view",
  "event_view",
  "offer_view",
  "favorite_add",
  "ticket_click",
  "qr_scan",
  "notification_open",
  "campaign_use"
];

for (const type of analyticsTypes) {
  if (!core.includes(`"${type}"`)) failures.push(`Analytics event tipi eksik: ${type}`);
}

const statIds = [
  "active-users",
  "popular-places",
  "qr-usage",
  "campaign-use",
  "notification-open",
  "language-use",
  "platform-use"
];

for (const id of statIds) {
  if (!core.includes(`id: "${id}"`)) failures.push(`Admin stat eksik: ${id}`);
}

const requiredNeedles = [
  [core, "AnalyticsEvent", "AnalyticsEvent sözleşmesi eksik."],
  [core, "DashboardStat", "DashboardStat sözleşmesi eksik."],
  [core, "adminStats", "Admin istatistik verisi eksik."],
  [core, "dashboardMetrics", "Rol bazlı dashboard metrics eksik."],
  [core, "notificationPerformance", "Bildirim performans metrikleri eksik."],
  [functions, "recordAnalyticsEvent", "Ortak analytics kayıt helperı eksik."],
  [functions, "analyticsEvents", "Analytics event koleksiyonu yazımı eksik."],
  [functions, "analyticsCounters", "Analytics counter koleksiyonu eksik."],
  [functions, "FieldValue.increment(1)", "Analytics counter increment eksik."],
  [functions, "city", "Analytics şehir boyutu eksik."],
  [functions, "locale", "Analytics dil boyutu eksik."],
  [functions, "platform", "Analytics platform boyutu eksik."],
  [functions, "type: \"ticket_click\"", "Bilet tıklama analytics izi eksik."],
  [functions, "type: \"campaign_use\"", "Kampanya kullanım analytics izi eksik."],
  [functions, "type: \"qr_scan\"", "QR scan analytics izi eksik."],
  [adminStats, "İstatistikler", "Admin stats panel başlığı eksik."],
  [adminStats, "adminStats.map", "Admin stats panel veri map'i eksik."],
  [notificationStats, "Bildirim Performansı", "Bildirim performans paneli eksik."],
  [notificationStats, "livePerformance.map", "Bildirim performans veri map'i eksik."],
  [webObservability, "trackWebEvent", "Web analytics callable köprüsü eksik."],
  [webObservability, "logWebError", "Web hata log callable köprüsü eksik."],
  [mobileObservability, "trackMobileEvent", "Mobil analytics callable köprüsü eksik."],
  [mobileObservability, "logMobileError", "Mobil hata log callable köprüsü eksik."],
  [rules, "analyticsEvents", "Firestore analyticsEvents rule izi eksik."],
  [rules, "analyticsCounters", "Firestore analyticsCounters rule izi eksik."]
];

for (const [text, needle, message] of requiredNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

if (failures.length > 0) {
  console.error("Analytics / istatistik kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Analytics / istatistik kontrolü başarılı. Event, sayaç, dashboard, bildirim, dil ve platform izleri doğrulandı.");
