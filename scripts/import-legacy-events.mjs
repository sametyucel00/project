import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const legacyPath = resolve(root, "..", "CCCCC", "narrehberi-repo-check", "SRC", "data", "antalyaEtkinlikTakvimi2026.js");
const seedEventsPath = join(root, "firebase", "seed", "events.json");
const manifestPath = join(root, "firebase", "seed", "manifest.json");
const coreEventsPath = join(root, "packages", "core", "src", "legacyEvents.ts");

const fallbackImageByType = {
  theater: "https://images.unsplash.com/photo-1503095396549-807759245b35",
  concert: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
  festival: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3",
  exhibition: "https://images.unsplash.com/photo-1545987796-200677ee1011",
  fair: "https://images.unsplash.com/photo-1515169067865-5387ec356754",
  show: "https://images.unsplash.com/photo-1517649763962-0c623066013b",
  default: "https://images.unsplash.com/photo-1514933651103-005eec06c04b"
};

function hasEncodingIssue(value) {
  if (typeof value !== "string") return false;
  const forbiddenCodes = new Set([0x00c3, 0x00c5, 0x00c4, 0x00d0, 0x00de, 0xfffd]);
  return [...value].some((char) => forbiddenCodes.has(char.codePointAt(0) ?? 0));
}

function text(value, fallback = "Belirtilmemiş") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return hasEncodingIssue(value) ? fallback : value.trim();
}

function localized(value, fallback = "Belirtilmemiş") {
  const tr = text(value, fallback);
  return { tr, en: tr, ru: tr, de: tr };
}

function eventType(value) {
  const normalized = text(value, "Etkinlik").toLocaleLowerCase("tr-TR");
  if (normalized.includes("tiyatro")) return "theater";
  if (normalized.includes("konser")) return "concert";
  if (normalized.includes("festival")) return "festival";
  if (normalized.includes("sergi") || normalized.includes("sanat")) return "exhibition";
  if (normalized.includes("workshop")) return "workshop";
  if (normalized.includes("çocuk")) return "kids";
  if (normalized.includes("stand")) return "standup";
  if (normalized.includes("fuar")) return "fair";
  if (normalized.includes("spor") || normalized.includes("maraton") || normalized.includes("yarış")) return "show";
  return "festival";
}

function districtFromVenue(value) {
  const venue = text(value, "Antalya");
  const knownDistricts = ["Muratpaşa", "Kepez", "Konyaaltı", "Aksu", "Alanya", "Kaş", "Kemer", "Manavgat"];
  return knownDistricts.find((district) => venue.toLocaleLowerCase("tr-TR").includes(district.toLocaleLowerCase("tr-TR"))) ?? "Antalya";
}

function startsAt(event) {
  const date = text(event.sortDate, "2026-01-01");
  const rawTime = text(event.saat, "20:00");
  const time = /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : "20:00";
  return `${date}T${time}:00+03:00`;
}

function mapLegacyEvent(event) {
  const type = eventType(event.kat);
  const title = text(event.isim, "Antalya etkinliği");
  const description = text(event.aciklama, "Etkinlik açıklaması belirtilmemiş.");
  return {
    id: text(event.id, title.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9ğüşöçıİ-]+/gi, "-")),
    title: localized(title, "Antalya etkinliği"),
    description: localized(description, "Etkinlik açıklaması belirtilmemiş."),
    synopsis: localized(description, "Etkinlik açıklaması belirtilmemiş."),
    type,
    district: districtFromVenue(event.yer),
    venueName: text(event.yer, "Antalya"),
    startsAt: startsAt(event),
    priceType: "paid",
    ticketUrl: "",
    cast: [],
    coverImage: fallbackImageByType[type] ?? fallbackImageByType.default,
    status: "published",
    notificationLimit: 3,
    notificationUsed: 0
  };
}

function stableJson(value) {
  return JSON.stringify(value, Object.keys(flattenKeys(value)).sort());
}

function flattenKeys(value, keys = {}) {
  if (Array.isArray(value)) {
    value.forEach((item) => flattenKeys(item, keys));
    return keys;
  }
  if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      keys[key] = true;
      flattenKeys(value[key], keys);
    });
  }
  return keys;
}

function checksum(rows) {
  return createHash("sha256").update(stableJson(rows)).digest("hex");
}

if (!existsSync(legacyPath)) {
  throw new Error(`Eski etkinlik dosyası bulunamadı: ${legacyPath}`);
}

const legacyModule = await import(pathToFileURL(legacyPath).href);
const legacyEvents = legacyModule.ANTALYA_ETKINLIK_TAKVIMI_2026 ?? [];
if (!Array.isArray(legacyEvents) || legacyEvents.length === 0) {
  throw new Error("Eski etkinlik listesi boş veya okunamadı.");
}

const existingEvents = existsSync(seedEventsPath) ? JSON.parse(readFileSync(seedEventsPath, "utf8")) : [];
const existingById = new Map(existingEvents.map((event) => [event.id, event]));
const importedEvents = legacyEvents.map(mapLegacyEvent);
const mergedEvents = [...existingEvents];

for (const event of importedEvents) {
  if (!existingById.has(event.id)) mergedEvents.push(event);
}

mergedEvents.sort((first, second) => String(first.startsAt).localeCompare(String(second.startsAt)));
writeFileSync(seedEventsPath, `${JSON.stringify(mergedEvents, null, 2)}\n`, "utf8");

const coreFile = [
  "import type { EventItem } from \"./index\";",
  "",
  "export const legacyAntalyaEvents: EventItem[] = ",
  `${JSON.stringify(importedEvents, null, 2)};`,
  ""
].join("\n");
writeFileSync(coreEventsPath, coreFile, "utf8");

if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const entry = manifest.collections?.find((item) => item.name === "events");
  if (entry) {
    entry.count = mergedEvents.length;
    entry.checksum = checksum(mergedEvents);
  }
  manifest.generatedAt = new Date().toISOString();
  mkdirSync(join(root, "firebase", "seed"), { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

console.log(`Eski etkinlik aktarımı tamamlandı. Eski kayıt: ${legacyEvents.length}, yeni seed toplamı: ${mergedEvents.length}`);
