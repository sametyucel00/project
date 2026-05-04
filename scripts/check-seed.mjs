import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const seedDir = join(process.cwd(), "firebase", "seed");
const manifestPath = join(seedDir, "manifest.json");
const collections = [
  "categories",
  "eventTypes",
  "places",
  "events",
  "offers",
  "userTasks",
  "badges",
  "orders",
  "touristSurvivalKit",
  "ancientGuideStops"
];
const locales = ["tr", "en", "ru", "de"];
const failures = [];

const requiredFieldsByCollection = {
  categories: ["id", "title.tr", "title.en", "title.ru", "title.de"],
  eventTypes: ["id", "title.tr", "title.en", "title.ru", "title.de"],
  places: ["id", "title.tr", "description.tr", "categoryId", "district", "address", "coverImage", "status"],
  events: ["id", "title.tr", "description.tr", "type", "district", "venueName", "startsAt", "priceType", "coverImage", "status"],
  offers: ["id", "title.tr", "description.tr", "businessId", "placeId", "discountLabel", "startsAt", "endsAt", "status"],
  userTasks: ["id", "title.tr", "description.tr", "rewardPoints", "trigger", "status"],
  badges: ["id", "title.tr", "description.tr", "icon", "level"],
  orders: ["id", "userId", "type", "status", "entityId", "entityTitle", "createdAt"],
  touristSurvivalKit: ["id", "title.tr", "description.tr", "category"],
  ancientGuideStops: ["id", "title.tr", "description.tr", "district", "era", "image"]
};

function readPath(row, path) {
  return path.split(".").reduce((value, key) => {
    if (value && typeof value === "object" && key in value) return value[key];
    return undefined;
  }, row);
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

if (!existsSync(manifestPath)) {
  failures.push("manifest.json eksik. npm run seed:export çalıştırın.");
}

const loadedCollections = new Map();

for (const collection of collections) {
  const path = join(seedDir, `${collection}.json`);
  if (!existsSync(path)) {
    failures.push(`Seed dosyası eksik: ${collection}.json`);
    continue;
  }

  const rows = JSON.parse(readFileSync(path, "utf8"));
  loadedCollections.set(collection, rows);
  if (!Array.isArray(rows)) {
    failures.push(`${collection}.json dizi olmalı.`);
    continue;
  }

  const ids = new Set();
  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    if (!row.id) failures.push(`${collection}.json satır ${rowNumber}: id eksik.`);
    if (ids.has(row.id)) failures.push(`${collection}.json satır ${rowNumber}: tekrarlı id (${row.id}).`);
    ids.add(row.id);

    for (const field of requiredFieldsByCollection[collection] ?? ["id"]) {
      const value = readPath(row, field);
      if (value === undefined || value === null || value === "") {
        failures.push(`${collection}.json satır ${rowNumber}: ${field} eksik.`);
      }
    }

    for (const field of ["title", "description"]) {
      if (row[field]) {
        for (const locale of locales) {
          if (!row[field][locale]) failures.push(`${collection}.json satır ${rowNumber}: ${field}.${locale} eksik.`);
        }
      }
    }
  });
}

if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1) failures.push("manifest.json schemaVersion 1 olmalı.");
  if (!manifest.generatedAt) failures.push("manifest.json generatedAt eksik.");
  if (!Array.isArray(manifest.collections)) failures.push("manifest.json collections dizisi eksik.");

  const manifestCollections = Array.isArray(manifest.collections) ? manifest.collections : [];
  for (const collection of collections) {
    const entry = manifestCollections.find((item) => item.name === collection);
    const rows = loadedCollections.get(collection);
    if (!entry) {
      failures.push(`manifest.json eksik koleksiyon: ${collection}`);
      continue;
    }
    if (entry.file !== `${collection}.json`) failures.push(`manifest.json ${collection}: file alanı hatalı.`);
    if (Array.isArray(rows) && entry.count !== rows.length) failures.push(`manifest.json ${collection}: count güncel değil.`);
    if (Array.isArray(rows) && entry.checksum !== checksum(rows)) failures.push(`manifest.json ${collection}: checksum güncel değil.`);
  }
}

if (failures.length > 0) {
  console.error("Seed kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Seed kontrolü başarılı. Koleksiyon: ${collections.length}`);
