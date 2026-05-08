import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const ignoredDirs = new Set(["node_modules", ".git", ".next", ".expo", "dist", "build", "coverage"]);
const blockedExtensions = new Set([".apk", ".aab", ".ipa", ".jks", ".keystore", ".p12", ".mobileprovision"]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".rules", ".example", ".yml", ".yaml"]);
const keyBoundary = "-----" + "BEGIN";
const secretPatterns = [
  { name: "private key", pattern: new RegExp(`${keyBoundary} (RSA |EC |OPENSSH |)?PRIVATE KEY-----`) },
  { name: "firebase service account", pattern: new RegExp(`"private_key"\\s*:\\s*"${keyBoundary} PRIVATE KEY-----`) },
  { name: "google api key literal", pattern: /AIza[0-9A-Za-z_-]{25,}/ },
  { name: "generic secret assignment", pattern: /(secret|password|token)\s*[:=]\s*["'][^"']{16,}["']/i }
];

const failures = [];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) return [];
      return walk(join(dir, entry.name));
    }
    return [join(dir, entry.name)];
  });
}

for (const file of walk(root)) {
  const rel = relative(root, file);
  const lower = rel.toLowerCase();
  const extension = lower.slice(lower.lastIndexOf("."));

  if (blockedExtensions.has(extension)) {
    failures.push(`Build/secret artefact yasak: ${rel}`);
    continue;
  }

  if (![...textExtensions].some((ext) => lower.endsWith(ext))) continue;
  if (statSync(file).size > 1_500_000) continue;
  const text = readFileSync(file, "utf8");
  for (const item of secretPatterns) {
    const allowedPublicFirebaseKeyFiles = [
      "apps/mobile/app.config.js",
      "apps/mobile/src/runtimeConfig.ts",
      "apps/web/lib/firebase.ts"
    ];
    if (
      item.name === "google api key literal" &&
      allowedPublicFirebaseKeyFiles.includes(rel.replace(/\\/g, "/"))
    ) {
      continue;
    }

    if (item.pattern.test(text) && !rel.endsWith(".env.example")) {
      failures.push(`${item.name} şüphesi: ${rel}`);
    }
  }
}

for (const required of ["firebase/firestore.rules", "firebase/storage.rules", "firebase/firebase.json", "firebase/firestore.indexes.json"]) {
  try {
    statSync(join(root, required));
  } catch {
    failures.push(`Firebase güvenlik dosyası eksik: ${required}`);
  }
}

const firestoreRules = readFileSync(join(root, "firebase", "firestore.rules"), "utf8");
const storageRules = readFileSync(join(root, "firebase", "storage.rules"), "utf8");
const indexes = JSON.parse(readFileSync(join(root, "firebase", "firestore.indexes.json"), "utf8"));

const requiredRuleNeedles = [
  [firestoreRules, "function isAdmin()", "Firestore admin helper eksik."],
  [firestoreRules, "function isOwner(ownerId)", "Firestore owner helper eksik."],
  [firestoreRules, "request.resource.data.points == 500", "Yeni kullanıcı 500 puan kuralı eksik."],
  [firestoreRules, "role() == \"business\"", "İşletme rol kuralı eksik."],
  [firestoreRules, "role() == \"theater\"", "Tiyatro rol kuralı eksik."],
  [firestoreRules, "request.resource.data.notificationLimit <= 3", "Tiyatro 3 bildirim limiti kuralı eksik."],
  [firestoreRules, "match /fcmTokens/{tokenId}", "FCM token kullanıcı alt koleksiyonu kuralı eksik."],
  [firestoreRules, "match /favorites/{favoriteId}", "Favori kullanıcı alt koleksiyonu kuralı eksik."],
  [firestoreRules, "match /notifications/{notificationId}", "Bildirim koleksiyonu kuralı eksik."],
  [firestoreRules, "match /deliveries/{deliveryId}", "Bildirim delivery kuralı eksik."],
  [firestoreRules, "match /analyticsEvents/{eventId}", "Analytics event kuralı eksik."],
  [firestoreRules, "allow read: if isAdmin();\n      allow write: if false;", "Analytics counter salt okunur admin kuralı eksik."],
  [firestoreRules, "match /approvalQueue/{approvalId}", "Onay kuyruğu kuralı eksik."],
  [firestoreRules, "match /auditLogs/{logId}", "Audit log kuralı eksik."],
  [firestoreRules, "match /errorLogs/{logId}", "Error log kuralı eksik."],
  [firestoreRules, "match /touristSurvivalKit/{itemId}", "Tourist Survival Kit kuralı eksik."],
  [firestoreRules, "match /ancientGuideStops/{stopId}", "Antik Rehber kuralı eksik."],
  [firestoreRules, "match /seoMeta/{metaId}", "SEO meta kuralı eksik."],
  [firestoreRules, "match /rateLimits/{limitId}", "Rate limit kuralı eksik."],
  [storageRules, "match /places/{ownerId}/{allPaths=**}", "Storage işletme mekan yolu eksik."],
  [storageRules, "match /events/{organizerId}/{allPaths=**}", "Storage tiyatro etkinlik yolu eksik."],
  [storageRules, "match /imports/{allPaths=**}", "Storage import yolu eksik."],
  [storageRules, "match /users/{uid}/{allPaths=**}", "Storage kullanıcı yolu eksik."]
];

for (const [text, needle, message] of requiredRuleNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

const functionsText = readFileSync(join(root, "firebase", "functions", "src", "index.ts"), "utf8");
const requiredFunctionSecurity = [
  [functionsText, "assertRateLimit", "Cloud Functions rate limit helper eksik."],
  [functionsText, "resource-exhausted", "Rate limit hata kodu eksik."],
  [functionsText, "notification.send", "Bildirim gönderimi rate limit izi eksik."],
  [functionsText, "notification.schedule", "Bildirim zamanlama rate limit izi eksik."],
  [functionsText, "qr.transaction", "QR işlem rate limit izi eksik."],
  [functionsText, "import.commit", "Import commit rate limit izi eksik."],
  [functionsText, "offer.redeem", "Fırsat kullanım rate limit izi eksik."],
  [functionsText, "order.ticket.create", "Bilet yönlendirme audit/rate izi eksik."],
  [functionsText, "auditLogs", "Function audit log kapsamı eksik."]
];

for (const [text, needle, message] of requiredFunctionSecurity) {
  if (!text.includes(needle)) failures.push(message);
}

const requiredIndexes = [
  ["places", ["status", "categoryId", "district", "googleRating"]],
  ["events", ["status", "type", "district", "startsAt"]],
  ["offers", ["status", "placeId", "endsAt"]],
  ["offers", ["status", "businessId", "endsAt"]],
  ["qrTransactions", ["businessId", "createdAt"]],
  ["notifications", ["status", "scheduledAt"]],
  ["favorites", ["entityType", "entityId", "createdAt"]],
  ["analyticsCounters", ["type", "updatedAt"]],
  ["imports", ["status", "createdAt"]],
  ["exportManifests", ["status", "requestedAt"]],
  ["orders", ["userId", "createdAt"]],
  ["orders", ["businessId", "usedAt"]],
  ["ancientGuideStops", ["status", "district"]]
];

function hasIndex(collectionGroup, fieldPaths) {
  return indexes.indexes?.some((index) => {
    const actualFields = index.fields?.map((field) => field.fieldPath) ?? [];
    return index.collectionGroup === collectionGroup && fieldPaths.every((field) => actualFields.includes(field));
  });
}

for (const [collectionGroup, fields] of requiredIndexes) {
  if (!hasIndex(collectionGroup, fields)) {
    failures.push(`Firestore index eksik: ${collectionGroup} (${fields.join(", ")})`);
  }
}

if (failures.length > 0) {
  console.error("Security kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Security kontrolü başarılı. Secret taraması, Firebase rules ve index sözleşmesi doğrulandı.");
