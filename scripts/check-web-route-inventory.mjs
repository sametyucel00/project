import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");
const exists = (path) => existsSync(join(root, path));

const core = read("packages/core/src/index.ts");
const sitemap = read("apps/web/app/sitemap.ts");
const robots = read("apps/web/app/robots.ts");
const manifest = read("apps/web/app/manifest.ts");
const routesLib = read("apps/web/lib/routes.ts");
const seoLib = read("apps/web/lib/seo.ts");
const layout = read("apps/web/app/layout.tsx");
const home = read("apps/web/app/page.tsx");
const homeHero = read("apps/web/components/HomeHero.tsx");
const landingSections = read("apps/web/components/LandingSections.tsx");
const appShowcase = read("apps/web/components/AppShowcase.tsx");

const failures = [];

const routeBlock = core.match(/export const seoManagedRoutes = \[([\s\S]*?)\];/);
const seoManagedRoutes = routeBlock
  ? [...routeBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1])
  : [];

const seoMetaBlock = core.match(/export const seoMeta: SeoMeta\[] = \[([\s\S]*?)\];/);
const seoMetaSlugs = seoMetaBlock
  ? [...seoMetaBlock[1].matchAll(/slug: "([^"]+)"/g)].map((match) => match[1])
  : [];

const routeToPageFile = (route) => {
  if (route === "/") return "apps/web/app/page.tsx";
  return `apps/web/app${route}/page.tsx`;
};

if (seoManagedRoutes.length === 0) failures.push("seoManagedRoutes listesi okunamadı.");

for (const route of seoManagedRoutes) {
  const pageFile = routeToPageFile(route);
  if (!exists(pageFile)) failures.push(`${route}: sayfa dosyası eksik (${pageFile})`);
  if (!seoMetaSlugs.includes(route)) failures.push(`${route}: seoMeta kaydı eksik.`);

  const text = exists(pageFile) ? read(pageFile) : "";
  if (route !== "/" && !text.includes(`createMetadata("${route}")`)) {
    failures.push(`${route}: sayfa seviyesinde createMetadata bağı eksik.`);
  }
}

for (const slug of seoMetaSlugs) {
  if (!seoManagedRoutes.includes(slug)) failures.push(`${slug}: seoMeta var ama seoManagedRoutes içinde yok.`);
}

const requiredRuntimeRoutes = [
  "/mekanlar/old-town-table",
  "/etkinlikler/may-theater-night",
  "/firsatlar/coffee-qr-week",
  "/panel/admin",
  "/panel/isletme",
  "/panel/tiyatro",
  "/panel/bireysel",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest"
];

for (const route of requiredRuntimeRoutes) {
  const pagePath = route.endsWith(".xml") || route.endsWith(".txt") || route.endsWith(".webmanifest")
    ? null
    : routeToPageFile(route.replace(/\/(old-town-table|may-theater-night|coffee-qr-week)$/, "/[id]"));
  if (pagePath && !exists(pagePath)) failures.push(`${route}: runtime sayfa dosyası eksik (${pagePath})`);
}

const requiredNeedles = [
  [sitemap, "seoManagedRoutes", "sitemap seoManagedRoutes kullanmalı."],
  [sitemap, "NEXT_PUBLIC_SITE_URL", "sitemap site URL env desteği eksik."],
  [robots, "disallow: [\"/panel/\"]", "robots panel dizinini indeks dışı bırakmalı."],
  [robots, "sitemap:", "robots sitemap referansı içermeli."],
  [manifest, "webManifest.shortcuts.map", "manifest shortcutları core modelinden üretmeli."],
  [manifest, "display: \"standalone\"", "manifest standalone display eksik."],
  [seoLib, "createStructuredData", "structured data helper eksik."],
  [seoLib, "alternates", "canonical metadata eksik."],
  [seoLib, "twitter", "twitter card metadata eksik."],
  [layout, "application/ld+json", "layout JSON-LD structured data script eksik."],
  [routesLib, "roleHome", "rol yönlendirme route helperı roleHome kullanmalı."],
  [homeHero, "href=\"/mobil-uygulama\"", "ana sayfa mobil CTA gerçek mobil uygulama rotasına gitmeli."],
  [landingSections, "fetchLivePlaces(6)", "landing canlı vitrin veri akışı eksik."],
  [landingSections, "setPlaces((livePlaces.length ? livePlaces : featuredPlaces).slice(0, 6))", "landing fallback vitrin izi eksik."],
  [appShowcase, "fetchLiveOffers(1)", "mobil showcase canlı veri izi eksik."],
  [appShowcase, "setOffers(featuredOffers.slice(0, 1))", "mobil showcase fallback izi eksik."]
];

for (const [text, needle, message] of requiredNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

const hrefs = [...home.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
const sectionIds = new Set([...home.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
for (const href of hrefs) {
  if (!href.startsWith("#") || href === "#") continue;
  const id = href.slice(1);
  if (!sectionIds.has(id) && !landingSections.includes(`id="${id}"`)) {
    failures.push(`ana sayfa: ${href} hedefli bölüm bulunamadı.`);
  }
}

if (failures.length > 0) {
  console.error("Web route inventory kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Web route inventory kontrolü başarılı. SEO rota: ${seoManagedRoutes.length}, runtime rota: ${requiredRuntimeRoutes.length}`);
