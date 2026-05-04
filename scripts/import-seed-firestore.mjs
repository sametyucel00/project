import { readFileSync } from "node:fs";
import { join } from "node:path";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

if (!emulatorHost) {
  console.error("Seed import sadece Firestore emulator ile çalışır. Önce FIRESTORE_EMULATOR_HOST ayarlayın.");
  console.error("Örnek: $env:FIRESTORE_EMULATOR_HOST='127.0.0.1:8080'");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "demo-nar-rehberi" });
}

const db = getFirestore();
const seedDir = join(process.cwd(), "firebase", "seed");
const manifest = JSON.parse(readFileSync(join(seedDir, "manifest.json"), "utf8"));
const entries = Array.isArray(manifest) ? manifest : manifest.collections;
const batchLimit = 450;

if (!Array.isArray(entries)) {
  console.error("Seed manifest geçersiz. Önce npm run seed:export çalıştırın.");
  process.exit(1);
}

let total = 0;
let batch = db.batch();
let pending = 0;

async function commitIfNeeded(force = false) {
  if (pending === 0) return;
  if (force || pending >= batchLimit) {
    await batch.commit();
    batch = db.batch();
    pending = 0;
  }
}

for (const entry of entries) {
  const file = entry.file ?? `${entry.name}.json`;
  const rows = JSON.parse(readFileSync(join(seedDir, file), "utf8"));
  if (!Array.isArray(rows)) throw new Error(`${file} dizi olmalı.`);
  if (typeof entry.count === "number" && entry.count !== rows.length) {
    throw new Error(`${entry.name} manifest count ile dosya satır sayısı eşleşmiyor.`);
  }

  for (const row of rows) {
    const id = row.id;
    if (!id) throw new Error(`${entry.name} satırında id eksik.`);
    batch.set(db.collection(entry.name).doc(id), row, { merge: true });
    pending += 1;
    total += 1;
    await commitIfNeeded();
  }
}

await commitIfNeeded(true);

console.log(`Firestore emulator seed import tamamlandı. Yazılan doküman: ${total}`);
