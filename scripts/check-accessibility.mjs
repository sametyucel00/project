import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const css = read("apps/web/app/globals.css");
const layout = read("apps/web/app/layout.tsx");
const home = read("apps/web/app/page.tsx");
const errorBoundary = read("apps/web/app/error.tsx");
const notFound = read("apps/web/app/not-found.tsx");
const themeToggle = read("apps/web/components/ThemeToggle.tsx");
const discoveryList = read("apps/web/components/DiscoveryList.tsx");
const mobileApp = read("apps/mobile/App.tsx");
const mobileUi = read("apps/mobile/src/components/ui.tsx");
const notificationStats = read("apps/web/components/NotificationStats.tsx");
const localizationOps = read("apps/web/components/LocalizationOps.tsx");

const checks = [
  { name: "skip link", ok: layout.includes("skip-link") && layout.includes("#main-content") },
  { name: "main content target", ok: home.includes('id="main-content"') },
  { name: "focus visible", ok: css.includes(":focus-visible") },
  { name: "reduced motion", ok: css.includes("prefers-reduced-motion") || css.includes('data-a11y-motion="reduced"') },
  { name: "touch target minimum", ok: css.includes("min-height: 40px") },
  { name: "theme toggle aria", ok: themeToggle.includes("aria-label") && themeToggle.includes("title=") },
  { name: "detail actions aria", ok: discoveryList.includes("Detay aksiyonları") },
  { name: "filter aria", ok: discoveryList.includes('ariaLabel ?? "Filtreler"') && discoveryList.includes("filtresi") },
  { name: "image role labels", ok: discoveryList.includes('role="img"') && discoveryList.includes("kapak görseli") },
  { name: "map status fallback", ok: discoveryList.includes("map-frame") || (discoveryList.includes('role="status"') && discoveryList.includes("Konum belirtilmemiş")) },
  { name: "error boundary alert", ok: errorBoundary.includes('role="alert"') && errorBoundary.includes("aria-labelledby") },
  { name: "not found actions", ok: notFound.includes('aria-label="404 aksiyonları"') && notFound.includes("not-found-title") },
  { name: "system state polish", ok: errorBoundary.includes("system-state") && notFound.includes("system-state") && discoveryList.includes("EmptyState") },
  { name: "mobile pressable labels visible", ok: mobileApp.includes("Ana Sayfa") && mobileApp.includes("Mekanlar") && mobileApp.includes("Profil") },
  { name: "mobile action pressables", ok: mobileUi.includes("Pressable") && mobileUi.includes("ActionPill") },
  { name: "mobile detail readable surfaces", ok: mobileUi.includes("DetailHeroCard") && mobileUi.includes("StatStrip") && mobileUi.includes("SubsectionGrid") },
  { name: "notification labelled history", ok: notificationStats.includes('aria-label="Bildirim geçmişi"') && notificationStats.includes('aria-label="Teslim geçmişi"') },
  { name: "localization language labels", ok: localizationOps.includes('aria-label="Desteklenen diller"') && localizationOps.includes("Eksik çeviri") }
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  console.error("Accessibility kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure.name}`);
  process.exit(1);
}

console.log(`Accessibility kontrolü başarılı. Kontrol edilen madde: ${checks.length}`);
