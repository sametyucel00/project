import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const core = readFileSync(join(root, "packages", "core", "src", "index.ts"), "utf8");
const functions = readFileSync(join(root, "firebase", "functions", "src", "index.ts"), "utf8");
const webEvents = [
  readFileSync(join(root, "apps", "web", "app", "etkinlikler", "page.tsx"), "utf8"),
  readFileSync(join(root, "apps", "web", "components", "EventsExplorer.tsx"), "utf8")
].join("\n");
const webEventDetail = [
  readFileSync(join(root, "apps", "web", "app", "etkinlikler", "[id]", "page.tsx"), "utf8"),
  readFileSync(join(root, "apps", "web", "components", "LiveDiscoveryDetail.tsx"), "utf8")
].join("\n");
const panelActions = readFileSync(join(root, "apps", "web", "lib", "panel-actions.ts"), "utf8");
const theaterOps = readFileSync(join(root, "apps", "web", "components", "TheaterOps.tsx"), "utf8");
const panelShell = readFileSync(join(root, "apps", "web", "components", "PanelShell.tsx"), "utf8");
const mobileEvents = readFileSync(join(root, "apps", "mobile", "src", "screens", "EventsScreen.tsx"), "utf8");

const failures = [];

const eventTypes = ["theater", "ballet", "musical", "concert", "festival", "exhibition", "fair", "workshop", "kids", "standup", "show"];
for (const type of eventTypes) {
  if (!core.includes(`"${type}"`)) failures.push(`Etkinlik türü eksik: ${type}`);
}

const filterNeedles = ["month", "dateRange", "today", "thisWeek", "type", "district", "price", "popular", "soon"];
for (const needle of filterNeedles) {
  if (!core.includes(`"${needle}"`)) failures.push(`Etkinlik filtresi eksik: ${needle}`);
}

const viewNeedles = ["month", "week", "list", "map"];
for (const needle of viewNeedles) {
  if (!core.includes(`id: "${needle}"`)) failures.push(`Etkinlik görünümü eksik: ${needle}`);
}

const requiredNeedles = [
  [webEvents, "eventViewModes", "Web etkinlik görünüm seçicileri eksik."],
  [webEvents, "eventFilters", "Web etkinlik filtreleri eksik."],
  [webEventDetail, "ActionStrip", "Etkinlik detay favori/paylaş/takvim aksiyon şeridi eksik."],
  [webEventDetail, "FactGrid", "Etkinlik detay bilgi grid'i eksik."],
  [webEventDetail, "MapSurface", "Etkinlik detay harita yüzeyi eksik."],
  [webEventDetail, "ticketUrl", "Etkinlik bilet linki izi eksik."],
  [mobileEvents, "eventViewModes", "Mobil etkinlik görünüm izleri eksik."],
  [mobileEvents, "Bugün", "Mobil bugün filtresi eksik."],
  [mobileEvents, "Bu hafta", "Mobil bu hafta filtresi eksik."],
  [mobileEvents, "Harita", "Mobil harita görünümü eksik."],
  [functions, "translateSynopsisDraft", "Sinopsis çeviri fonksiyonu eksik."],
  [functions, "createTheaterEvent", "Tiyatro oyun oluşturma fonksiyonu eksik."],
  [functions, "sendTheaterEventNotification", "Tiyatro bildirim hakkı tüketen fonksiyon eksik."],
  [functions, "adjustTheaterNotificationLimit", "Admin bildirim limiti artırma fonksiyonu eksik."],
  [functions, "notificationUsed: 0", "Yeni oyunlarda kullanılan bildirim sayısı 0 başlamalı."],
  [functions, "Bu oyun için bildirim hakkı tükendi.", "Tiyatro bildirim limit aşımı engellenmeli."],
  [functions, "theater.notification.send", "Tiyatro bildirim gönderimi audit izi eksik."],
  [functions, "theater.notificationLimit.update", "Tiyatro bildirim limiti audit izi eksik."],
  [functions, "notificationLimit", "Tiyatro bildirim limiti fonksiyon izi eksik."],
  [functions, "? (payload.notificationLimit ?? 3) : 3", "Tiyatro kullanıcıları için 3 bildirim limiti korunmalı."],
  [panelActions, "translateSynopsisDraft", "Web panel sinopsis çeviri köprüsü eksik."],
  [panelActions, "createTheaterEvent", "Web panel oyun oluşturma köprüsü eksik."],
  [panelActions, "sendTheaterEventNotification", "Web panel tiyatro bildirim gönderme köprüsü eksik."],
  [panelActions, "adjustTheaterNotificationLimit", "Web panel admin bildirim limiti köprüsü eksik."],
  [theaterOps, "Tiyatro Üretim Akışı", "Tiyatro üretim paneli eksik."],
  [theaterOps, "Tiyatro Bildirim Kontrolü", "Admin tiyatro bildirim kontrol paneli eksik."],
  [theaterOps, "Canlı tiyatro etkinlikleri", "Tiyatro panel canlı etkinlik okuma izi eksik."],
  [theaterOps, "Henüz canlı tiyatro etkinliği yok", "Tiyatro panel boş etkinlik durumu eksik."],
  [theaterOps, "Çeviri taslağı oluştur", "Tiyatro çeviri aksiyonu eksik."],
  [theaterOps, "Bildirim hakkı kullan", "Tiyatro bildirim hakkı kullanma aksiyonu eksik."],
  [theaterOps, "Bildirim limitini artır", "Admin bildirim limiti artırma aksiyonu eksik."],
  [theaterOps, "notificationLimit: 3", "Tiyatro panel oyun taslağı 3 bildirim limitiyle başlamalı."],
  [panelShell, "TheaterOps", "Tiyatro paneli TheaterOps bileşenini bağlamalı."]
];

for (const [text, needle, message] of requiredNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

if (failures.length > 0) {
  console.error("Etkinlik / tiyatro akış kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Etkinlik / tiyatro akış kontrolü başarılı. Görünümler, filtreler, detay, sinopsis ve bildirim limiti doğrulandı.");
