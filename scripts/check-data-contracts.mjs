import { readFileSync } from "node:fs";
import { join } from "node:path";

const corePath = join(process.cwd(), "packages", "core", "src", "index.ts");
const importExportPath = join(process.cwd(), "packages", "core", "src", "importExport.ts");
const functionsPath = join(process.cwd(), "firebase", "functions", "src", "index.ts");
const text = readFileSync(corePath, "utf8");
const importExportText = readFileSync(importExportPath, "utf8");
const functionsText = readFileSync(functionsPath, "utf8");
const seedText = readFileSync(join(process.cwd(), "packages", "core", "src", "seed.ts"), "utf8");
const requiredLocales = ["tr", "en", "ru", "de"];
const collections = ["featuredPlaces", "featuredEvents", "featuredOffers", "userTasks", "badges"];
const failures = [];

for (const collection of collections) {
  if (!text.includes(`export const ${collection}`)) {
    failures.push(`${collection} dışa aktarımı bulunamadı.`);
  }
}

for (const locale of requiredLocales) {
  const titleNeedle = `${locale}:`;
  if (!text.includes(titleNeedle)) {
    failures.push(`${locale} dil alanı core seed içinde bulunamadı.`);
  }
}

const requiredBusinessRules = [
  "defaultUserPoints = 500",
  "notificationLimit: 3",
  "title: LocalizedText",
  "description: LocalizedText",
  "compactValue"
];

for (const rule of requiredBusinessRules) {
  if (!text.includes(rule)) failures.push(`Sözleşme izi eksik: ${rule}`);
}

const importExportRules = [
  "parseJsonRows",
  "parseCsvRows",
  "parseRowsByFormat",
  "parseXlsxMatrixRows",
  "exportRowsToCsv",
  "exportRowsByFormat",
  "previewRows"
];

for (const rule of importExportRules) {
  if (!importExportText.includes(rule)) failures.push(`Import/export yardımcı izi eksik: ${rule}`);
}

const functionRules = [
  "updateUserRole",
  "listAdminUsers",
  "setUserDisabled",
  "previewImport",
  "previewXlsxImport",
  "commitImport",
  "createExportManifest",
  "logClientError",
  "processScheduledNotifications",
  "collectTargetTokens"
];

for (const rule of functionRules) {
  if (!functionsText.includes(rule)) failures.push(`Cloud Function izi eksik: ${rule}`);
}

const roleManagementRules = [
  [functionsText, "user.role.update", "Rol güncelleme audit izi eksik."],
  [functionsText, "user.disable", "Kullanıcı pasifleştirme audit izi eksik."],
  [functionsText, "user.enable", "Kullanıcı aktifleştirme audit izi eksik."],
  [functionsText, "allowedRoles", "Rol güncelleme geçerli rol listesi eksik."],
  [functionsText, "await assertAdmin(request.auth?.uid)", "Rol güncelleme admin yetki kontrolü eksik."],
  [readFileSync(join(process.cwd(), "apps", "web", "lib", "panel-actions.ts"), "utf8"), "updateUserRole", "Web rol güncelleme callable köprüsü eksik."],
  [readFileSync(join(process.cwd(), "apps", "web", "lib", "panel-actions.ts"), "utf8"), "listAdminUsers", "Web üye listeleme callable köprüsü eksik."],
  [readFileSync(join(process.cwd(), "apps", "web", "lib", "panel-actions.ts"), "utf8"), "setUserDisabled", "Web hesap durumu callable köprüsü eksik."],
  [readFileSync(join(process.cwd(), "apps", "web", "components", "RoleOps.tsx"), "utf8"), "Üye ve Rol Yönetimi", "Admin rol yönetimi panel yüzeyi eksik."]
];

for (const [source, needle, message] of roleManagementRules) {
  if (!source.includes(needle)) failures.push(message);
}

const observabilityRules = [
  "ErrorLog",
  "AuditLog",
  "sampleErrorLogs",
  "sampleAuditLogs"
];

for (const rule of observabilityRules) {
  if (!text.includes(rule)) failures.push(`Gözlemlenebilirlik sözleşmesi eksik: ${rule}`);
}

const notificationRules = [
  "NotificationDelivery",
  "notificationPerformance",
  "scheduledNotificationSamples"
];

for (const rule of notificationRules) {
  if (!text.includes(rule)) failures.push(`Bildirim sözleşmesi eksik: ${rule}`);
}

const seoRules = [
  "SeoMeta",
  "webManifest",
  "seoManagedRoutes",
  "getSeoMeta"
];

for (const rule of seoRules) {
  if (!text.includes(rule)) failures.push(`SEO sözleşmesi eksik: ${rule}`);
}

const seedRules = [
  "seedCollections",
  "getSeedSummary",
  "touristSurvivalKit",
  "ancientGuideStops"
];

for (const rule of seedRules) {
  if (!seedText.includes(rule)) failures.push(`Seed sözleşmesi eksik: ${rule}`);
}

if (failures.length > 0) {
  console.error("Veri sözleşmesi kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Veri sözleşmesi kontrolü başarılı.");
