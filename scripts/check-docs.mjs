import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const packageJson = JSON.parse(read("package.json"));
const testPlan = read("docs/test-plan.md");
const backlog = read("docs/backlog.md");
const architecture = read("docs/architecture.md");
const development = read("docs/development.md");
const security = read("docs/security.md");
const importExport = read("docs/import-export-schema.md");
const liveReadiness = read("docs/live-readiness.md");

const failures = [];

const requiredScripts = [
  "check:turkish",
  "check:env",
  "check:seed",
  "check:security",
  "check:contracts",
  "check:import-export",
  "check:auth-qr",
  "check:notifications",
  "check:events",
  "check:places",
  "check:offers",
  "check:localization",
  "check:governance",
  "check:analytics",
  "check:ui",
  "check:web-inventory",
  "check:flows",
  "check:a11y",
  "check:docs",
  "check:web-live",
  "check:quality",
  "typecheck"
];

for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json script eksik: ${script}`);
  if (!testPlan.includes(`npm run ${script}`) && script !== "typecheck") {
    failures.push(`test-plan.md scripti anmıyor: ${script}`);
  }
}

if (!testPlan.includes("npm run typecheck")) failures.push("test-plan.md typecheck komutunu anmıyor.");
if (!development.includes("npm run check:web-live")) failures.push("development.md canlı web kontrolünü anmıyor.");
if (!development.includes("npm run check:quality")) failures.push("development.md kalite zincirini anmıyor.");

const requiredBacklogGroups = [
  "Grup 1: Platform Temeli",
  "Grup 2: Web Tanıtım ve Giriş Merkezi",
  "Grup 3: Rol Bazlı Paneller",
  "Grup 4: Mobil Uygulama",
  "Grup 5: Mekan, Etkinlik ve Fırsat Veri Akışları",
  "Grup 6: QR, Puan, Görev ve Rozet",
  "Grup 7: Bildirim Sistemi",
  "Grup 8: Import / Export",
  "Grup 9: Çok Dil, Tema ve Kalite",
  "Grup 10: Test Sistemi"
];

for (const group of requiredBacklogGroups) {
  if (!backlog.includes(group)) failures.push(`backlog.md grup eksik: ${group}`);
}

const requiredArchitectureNeedles = [
  "apps/web",
  "apps/mobile",
  "packages/core",
  "firebase/functions",
  "users/{uid}/fcmTokens/{token}",
  "notifications/{id}/deliveries/{deliveryId}",
  "analyticsEvents/{id}",
  "analyticsCounters/{id}",
  "approvalQueue/{id}",
  "auditLogs/{id}",
  "errorLogs/{id}",
  "npm run check:quality",
  "npm run check:web-live"
];

for (const needle of requiredArchitectureNeedles) {
  if (!architecture.includes(needle)) failures.push(`architecture.md eksik: ${needle}`);
}

const requiredDocsNeedles = [
  [security, "Admin tam erişim", "security.md admin erişim kuralını anmalı."],
  [security, "İşletme", "security.md işletme rolünü anmalı."],
  [security, "Tiyatro", "security.md tiyatro rolünü anmalı."],
  [importExport, "Desteklenen formatlar: `csv`, `json`, `xlsx`.", "import-export-schema.md format listesini anmalı."],
  [importExport, "Türkçe", "import-export-schema.md Türkçe karakter bağlamını anmalı."]
];

for (const [text, needle, message] of requiredDocsNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

const requiredLiveReadinessNeedles = [
  ["Benim Tarafımda Tamamlananlar", "live-readiness.md tamamlananlar bölümünü anmalı."],
  ["Kullanıcı Tarafında Gerekenler", "live-readiness.md kullanıcı tarafı gereksinimlerini anmalı."],
  ["npm run check:quality", "live-readiness.md kalite zincirini anmalı."],
  ["npm run check:web-live", "live-readiness.md canlı web kontrolünü anmalı."],
  ["production build almaz", "live-readiness.md build yasağını anmalı."]
];

for (const [needle, message] of requiredLiveReadinessNeedles) {
  if (!liveReadiness.includes(needle)) failures.push(message);
}

if (failures.length > 0) {
  console.error("Docs kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Docs kontrolü başarılı. Test planı, backlog, mimari ve kalite dokümanları güncel.");
