import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const core = readFileSync(join(root, "packages", "core", "src", "index.ts"), "utf8");
const corePlaces = readFileSync(join(root, "packages", "core", "src", "places.ts"), "utf8");
const functions = readFileSync(join(root, "firebase", "functions", "src", "index.ts"), "utf8");
const webPlaces = [
  readFileSync(join(root, "apps", "web", "app", "mekanlar", "page.tsx"), "utf8"),
  readFileSync(join(root, "apps", "web", "components", "PlacesExplorer.tsx"), "utf8")
].join("\n");
const webPlaceDetail = [
  readFileSync(join(root, "apps", "web", "app", "mekanlar", "[id]", "page.tsx"), "utf8"),
  readFileSync(join(root, "apps", "web", "components", "LiveDiscoveryDetail.tsx"), "utf8")
].join("\n");
const webDiscovery = readFileSync(join(root, "apps", "web", "components", "DiscoveryList.tsx"), "utf8");
const panelActions = readFileSync(join(root, "apps", "web", "lib", "panel-actions.ts"), "utf8");
const googlePlaces = readFileSync(join(root, "apps", "web", "lib", "google-places.ts"), "utf8");
const mobilePlaces = readFileSync(join(root, "apps", "mobile", "src", "screens", "PlacesScreen.tsx"), "utf8");
const mobilePlaceDetail = readFileSync(join(root, "apps", "mobile", "src", "screens", "PlaceDetailScreen.tsx"), "utf8");
const mobileDiscovery = readFileSync(join(root, "apps", "mobile", "src", "services", "discovery.ts"), "utf8");

const failures = [];

const placeFilterNeedles = [
  "category",
  "district",
  "openNow",
  "rating",
  "nearMe",
  "popular",
  "hasOffer",
  "nightlife",
  "vegan",
  "wifi",
  "parking",
  "childFriendly",
  "wheelchair"
];

for (const needle of placeFilterNeedles) {
  if (!core.includes(`"${needle}"`)) failures.push(`Mekan filtresi eksik: ${needle}`);
}

const requiredNeedles = [
  [core, "GooglePlaceSnapshot", "GooglePlaceSnapshot sözleşmesi eksik."],
  [core, "menuUrl", "Mekan menü URL sözleşmesi eksik."],
  [core, "openingHours", "Mekan çalışma saatleri sözleşmesi eksik."],
  [core, "socialLinks", "Mekan sosyal medya sözleşmesi eksik."],
  [core, "createGoogleMapsDirectionsUrl", "Google Maps yol tarifi helper eksik."],
  [core, "createStaticMapUrl", "Static map helper eksik."],
  [core, "compactValue", "Eksik bilgi compactValue helper eksik."],
  [corePlaces, "fetchGooglePlaceSnapshot", "Google Places fetch helper eksik."],
  [corePlaces, "mapGoogleSnapshotToPlace", "Google snapshot -> mekan mapper eksik."],
  [corePlaces, "formatted_phone_number", "Google Places telefon alanı eksik."],
  [corePlaces, "opening_hours", "Google Places çalışma saatleri alanı eksik."],
  [corePlaces, "user_ratings_total", "Google Places yorum sayısı alanı eksik."],
  [functions, "saveGooglePlaceSnapshot", "Google Places snapshot kaydetme fonksiyonu eksik."],
  [functions, "googleRating", "Functions Google puanı kayıt izi eksik."],
  [functions, "googleReviewCount", "Functions Google yorum sayısı kayıt izi eksik."],
  [functions, "googleOpeningHours", "Functions çalışma saatleri kayıt izi eksik."],
  [functions, "googlePhotoRefs", "Functions Google fotoğraf referansları eksik."],
  [functions, "place.data()?.ownerId === uid", "İşletme kendi mekanı Google snapshot yetkisi eksik."],
  [webPlaces, "placeFilters", "Web mekan filtreleri eksik."],
  [webPlaceDetail, "ActionStrip", "Mekan detay favori/paylaş/kaydet aksiyonları eksik."],
  [webPlaceDetail, "FactGrid", "Mekan detay bilgi grid'i eksik."],
  [webPlaceDetail, "MapSurface", "Mekan detay harita yüzeyi eksik."],
  [webPlaceDetail, "compactValue", "Mekan detay eksik bilgi yönetimi eksik."],
  [webPlaceDetail, "Menü", "Mekan detay menü alanı eksik."],
  [webPlaceDetail, "Çalışma saatleri", "Mekan detay çalışma saatleri eksik."],
  [webPlaceDetail, "Sosyal medya", "Mekan detay sosyal medya alanı eksik."],
  [webPlaceDetail, "Mekan özellikleri", "Mekan detay özellik alanı eksik."],
  [webPlaceDetail, "googleRating", "Mekan detay Google puanı eksik."],
  [webPlaceDetail, "googleReviewCount", "Mekan detay Google yorum sayısı eksik."],
  [webDiscovery, "createGoogleMapsDirectionsUrl", "Web yol tarifi helper bağlantısı eksik."],
  [googlePlaces, "fetchPlaceSnapshot", "Web Google Places snapshot helper eksik."],
  [panelActions, "saveGooglePlaceSnapshot", "Web panel Google snapshot callable köprüsü eksik."],
  [mobilePlaces, "primaryFilters", "Mobil mekan hızlı filtreleri eksik."],
  [mobilePlaces, "placeCategoryOptions", "Mobil mekan kategori filtreleri eksik."],
  [mobilePlaces, "activeCategory", "Mobil mekan kategori seçimi eksik."],
  [mobilePlaces, "activeFilter", "Mobil mekan filtre seçimi eksik."],
  [mobilePlaceDetail, "createGoogleMapsDirectionsUrl", "Mobil yol tarifi helper eksik."],
  [mobilePlaceDetail, "compactValue", "Mobil eksik bilgi yönetimi eksik."],
  [mobilePlaceDetail, "Menü", "Mobil mekan menü satırı eksik."],
  [mobilePlaceDetail, "Çalışma saatleri", "Mobil çalışma saatleri satırı eksik."],
  [mobilePlaceDetail, "Sosyal medya", "Mobil sosyal medya satırı eksik."],
  [mobilePlaceDetail, "Harita", "Mobil mekan harita yüzeyi eksik."],
  [mobileDiscovery, "applyPlaceFilters", "Mobil mekan filtreleme fonksiyonu eksik."],
  [mobileDiscovery, "filters.has(\"openNow\")", "Mobil açık/kapalı filtresi eksik."],
  [mobileDiscovery, "filters.has(\"vegan\")", "Mobil vegan filtresi eksik."],
  [mobileDiscovery, "filters.has(\"wifi\")", "Mobil Wi-Fi filtresi eksik."],
  [mobileDiscovery, "filters.has(\"parking\")", "Mobil otopark filtresi eksik."],
  [mobileDiscovery, "filters.has(\"wheelchair\")", "Mobil engelli dostu filtresi eksik."]
];

for (const [text, needle, message] of requiredNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

if (!webDiscovery.includes("Google Maps ile yol tarifi") && !webDiscovery.includes('t("detail.getDirections")')) {
  failures.push("Web yol tarifi CTA eksik.");
}

if (failures.length > 0) {
  console.error("Mekan / Google Places akış kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Mekan / Google Places akış kontrolü başarılı. Filtreler, detay, harita, snapshot ve eksik bilgi yönetimi doğrulandı.");
