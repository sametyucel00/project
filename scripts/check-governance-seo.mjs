import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const core = readFileSync(join(root, "packages", "core", "src", "index.ts"), "utf8");
const functions = readFileSync(join(root, "firebase", "functions", "src", "index.ts"), "utf8");
const panelActions = readFileSync(join(root, "apps", "web", "lib", "panel-actions.ts"), "utf8");
const workflowOps = readFileSync(join(root, "apps", "web", "components", "WorkflowOps.tsx"), "utf8");
const systemLogs = readFileSync(join(root, "apps", "web", "components", "SystemLogs.tsx"), "utf8");
const seoOps = readFileSync(join(root, "apps", "web", "components", "SeoOps.tsx"), "utf8");
const seoLib = readFileSync(join(root, "apps", "web", "lib", "seo.ts"), "utf8");
const sitemap = readFileSync(join(root, "apps", "web", "app", "sitemap.ts"), "utf8");
const robots = readFileSync(join(root, "apps", "web", "app", "robots.ts"), "utf8");
const manifest = readFileSync(join(root, "apps", "web", "app", "manifest.ts"), "utf8");
const webDiscovery = readFileSync(join(root, "apps", "web", "components", "DiscoveryList.tsx"), "utf8");
const mobileProfile = readFileSync(join(root, "apps", "mobile", "src", "screens", "ProfileScreen.tsx"), "utf8");
const rules = readFileSync(join(root, "firebase", "firestore.rules"), "utf8");

const failures = [];

const requiredNeedles = [
  [core, "ApprovalQueueItem", "ApprovalQueueItem sözleşmesi eksik."],
  [core, "ApprovalStatus", "ApprovalStatus tipi eksik."],
  [core, "approvalQueue", "Örnek approval queue eksik."],
  [core, "contentLifecycleStates", "İçerik yaşam döngüsü sözleşmesi eksik."],
  [core, "rejectionReason", "Approval red sebebi sözleşmesi eksik."],
  [core, "AuditLog", "AuditLog sözleşmesi eksik."],
  [core, "ErrorLog", "ErrorLog sözleşmesi eksik."],
  [core, "sampleAuditLogs", "Audit örnekleri eksik."],
  [core, "sampleErrorLogs", "Hata log örnekleri eksik."],
  [core, "SeoMeta", "SEO meta sözleşmesi eksik."],
  [core, "seoMeta", "SEO meta verisi eksik."],
  [core, "seoManagedRoutes", "SEO yönetilebilir rota listesi eksik."],
  [core, "webManifest", "Web manifest sözleşmesi eksik."],
  [core, "deepLinks", "Deep link helperları eksik."],
  [functions, "submitForApproval", "Approval submit fonksiyonu eksik."],
  [functions, "reviewApproval", "Approval review fonksiyonu eksik."],
  [functions, "approval.submit", "Approval submit audit izi eksik."],
  [functions, "approval.${decision}", "Approval decision audit izi eksik."],
  [functions, "status: decision", "Approval karar status güncellemesi eksik."],
  [functions, "approvalStatus: \"pendingReview\"", "Onaya gönderilen içerik pendingReview olarak işaretlenmeli."],
  [functions, "approvalStatus: \"rejected\"", "Reddedilen içerik rejected olarak işaretlenmeli."],
  [functions, "rejectionReason", "Approval red sebebi fonksiyon izi eksik."],
  [functions, "status: \"published\"", "Approval sonrası yayınlama izi eksik."],
  [functions, "auditLogs", "Functions audit log yazımı eksik."],
  [functions, "logClientError", "Client hata log fonksiyonu eksik."],
  [panelActions, "submitForApproval", "Web panel approval submit köprüsü eksik."],
  [panelActions, "reviewApproval", "Web panel approval review köprüsü eksik."],
  [workflowOps, "İçerik Onay Kuyruğu", "Admin onay kuyruğu UI eksik."],
  [workflowOps, "Canlı onay kuyruğu", "Admin onay kuyruğu canlı okuma izi eksik."],
  [workflowOps, "Onay kuyruğunda bekleyen kayıt yok", "Admin onay kuyruğu boş durum izi eksik."],
  [workflowOps, "İçerik yaşam döngüsü", "Onay UI yaşam döngüsü görünümü eksik."],
  [workflowOps, "Red sebebi", "Onay UI red sebebi alanı eksik."],
  [workflowOps, "Onaya gönder", "Business/theater onaya gönder UI eksik."],
  [systemLogs, "Hata Kayıtları", "Hata kayıt panel yüzeyi eksik."],
  [systemLogs, "İşlem Geçmişi", "İşlem geçmişi panel yüzeyi eksik."],
  [systemLogs, "Canlı işlem kayıtları", "İşlem kayıtları canlı okuma izi eksik."],
  [systemLogs, "Henüz işlem kaydı yok", "İşlem kayıtları boş durum izi eksik."],
  [seoOps, "SEO Meta Yönetimi", "SEO panel yüzeyi eksik."],
  [seoOps, "Canlı SEO kayıtları", "SEO panel canlı kayıt okuma izi eksik."],
  [seoOps, "varsayılan sayfa bilgileri", "SEO panel varsayılan kayıt izi eksik."],
  [seoOps, "seoManagedRoutes", "SEO route listesi panelde kullanılmalı."],
  [seoOps, "webManifest", "Manifest bilgisi SEO panelinde kullanılmalı."],
  [seoOps, "Paylaşım ve arama ayarları", "SEO panel paylaşım ve arama ayarı izini göstermeli."],
  [seoOps, "Aramaya açık", "SEO panel arama görünürlüğü izini göstermeli."],
  [seoLib, "createMetadata", "Next metadata helper eksik."],
  [seoLib, "createStructuredData", "Structured data helper eksik."],
  [seoLib, "alternates", "Canonical metadata eksik."],
  [seoLib, "openGraph", "OpenGraph metadata eksik."],
  [seoLib, "twitter", "Twitter card metadata eksik."],
  [sitemap, "seoManagedRoutes", "Sitemap yönetilebilir route listesini kullanmalı."],
  [robots, "rules", "Robots kuralları eksik."],
  [manifest, "webManifest", "Manifest route core manifest kullanmalı."],
  [webDiscovery, "deepLink", "Web detay deep link aksiyonları eksik."],
  [mobileProfile, "Kişisel bilgiler", "Mobil profil kişisel bilgi yüzeyi eksik."],
  [mobileProfile, "QR puan işle", "Mobil QR profil aksiyonu eksik."],
  [rules, "approvalQueue", "Firestore approvalQueue rule izi eksik."],
  [rules, "auditLogs", "Firestore auditLogs rule izi eksik."],
  [rules, "errorLogs", "Firestore errorLogs rule izi eksik."]
];

for (const [text, needle, message] of requiredNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

if (failures.length > 0) {
  console.error("Governance / SEO / audit kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Governance / SEO / audit kontrolü başarılı. Onay, audit, error log, SEO ve deep link izleri doğrulandı.");
