import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outputDir = join(process.cwd(), "firebase", "seed");
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

mkdirSync(outputDir, { recursive: true });

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  collections: []
};

for (const collection of collections) {
  const path = join(outputDir, `${collection}.json`);
  if (!existsSync(path)) {
    writeFileSync(path, "[]\n", "utf8");
  }
  const rows = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(rows)) throw new Error(`${collection}.json dizi olmalı.`);
  manifest.collections.push({
    name: collection,
    file: `${collection}.json`,
    count: rows.length,
    checksum: checksum(rows)
  });
}

writeFileSync(join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(`Seed manifest güncellendi. Koleksiyon: ${collections.length}`);
