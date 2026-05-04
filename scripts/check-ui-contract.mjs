import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const files = {
  css: read("apps/web/app/globals.css"),
  home: read("apps/web/app/page.tsx"),
  appShowcase: read("apps/web/components/AppShowcase.tsx"),
  landing: read("apps/web/components/LandingSections.tsx"),
  mobileStyles: read("apps/mobile/src/styles.ts"),
  mobileHome: read("apps/mobile/src/screens/HomeScreen.tsx"),
  mobilePlaces: read("apps/mobile/src/screens/PlacesScreen.tsx"),
  mobileEvents: read("apps/mobile/src/screens/EventsScreen.tsx"),
  mobileOffers: read("apps/mobile/src/screens/OffersScreen.tsx"),
  mobileProfile: read("apps/mobile/src/screens/ProfileScreen.tsx"),
  mobilePlaceDetail: read("apps/mobile/src/screens/PlaceDetailScreen.tsx"),
  mobileEventDetail: read("apps/mobile/src/screens/EventDetailScreen.tsx"),
  mobileOfferDetail: read("apps/mobile/src/screens/OfferDetailScreen.tsx"),
  mobileGuide: read("apps/mobile/src/screens/GuideScreen.tsx")
};

const failures = [];

const requireIncludes = (label, text, patterns) => {
  for (const pattern of patterns) {
    if (!text.includes(pattern)) failures.push(`${label}: missing ${pattern}`);
  }
};

requireIncludes("web palette", files.css, [
  "--nar:",
  "--sea:",
  "--sage:",
  "--plum:",
  "--night:",
  "color-scheme: light",
  "color-scheme: dark"
]);

requireIncludes("web accessibility", files.css, [
  "*:focus-visible",
  ".skip-link",
  ".empty-state",
  ".system-state",
  "@media (prefers-reduced-motion: reduce)",
  "min-height: 40px"
]);

requireIncludes("web premium layout", files.css, [
  ".hero",
  "min-height: calc(100vh - 68px)",
  ".phone",
  ".time-panel",
  ".stories",
  ".detail-hero",
  ".action-strip",
  ".panel-page"
]);

requireIncludes("web compact surfaces", files.css, [
  ".place-image {\n  aspect-ratio: 4 / 3;\n  border-radius: 8px;",
  ".stat-card {\n  min-height: 154px;\n  border-radius: 8px;",
  ".detail-image {\n  min-height: min(70vh, 720px);\n  border-radius: 8px;",
  ".map-image,\n.map-placeholder {\n  min-height: 320px;\n  border-radius: 8px;"
]);

requireIncludes("landing copy", files.landing, [
  "Şehri tek akışta, yorulmadan keşfet",
  "Mekan keşfi daha net, daha hızlı",
  "Etkinlikleri aya, haftaya veya ruh haline göre yakala",
  "Hesabın sana göre açılır",
  "QR ile kazan"
]);

requireIncludes("app showcase", files.appShowcase, [
  "Nar Rehberi mobil uygulama önizlemesi",
  "timeBasedDiscovery.evening",
  "offers.map",
  "featuredEvents[0]",
  "featuredPlaces"
]);

requireIncludes("mobile discovery styles", files.mobileStyles, [
  "timeCard",
  "storyRail",
  "wideItem",
  "calendarBand",
  "offerItem",
  "profilePoints",
  "detailHeroCard",
  "statStrip",
  "subsectionGrid",
  "tabBar"
]);

requireIncludes("mobile detail surfaces", Object.values(files).join("\n"), [
  "DetailHeroCard",
  "StatStrip",
  "SubsectionGrid",
  "QR işlem geçmişi",
  "Bildirim tercihleri",
  "Ayarları kaydet"
]);

requireIncludes("mobile screens", Object.values(files).join("\n"), [
  "Aylık",
  "Haftalık",
  "Harita",
  "QR",
  "500"
]);

const mobileBundle = [
  files.mobileHome,
  files.mobilePlaces,
  files.mobileEvents,
  files.mobileOffers,
  files.mobileProfile,
  files.mobilePlaceDetail,
  files.mobileEventDetail,
  files.mobileOfferDetail,
  files.mobileGuide
].join("\n");

if (!/Turist\s+Destek\s+Rehberi/i.test(mobileBundle)) {
  failures.push("mobile screens: missing Turist Destek Rehberi mini module");
}

if (!/Antik\s+Rehber/i.test(mobileBundle)) {
  failures.push("mobile screens: missing Antik Rehber mini module");
}

const forbiddenPatterns = [
  /lorem ipsum/i,
  /ai template/i,
  /gradient orb/i,
  /bokeh/i,
  /rounded-3xl/i,
  /card\s+inside\s+card/i
];

const sourceBundle = Object.entries(files)
  .map(([label, text]) => `\n--- ${label} ---\n${text}`)
  .join("\n");

for (const pattern of forbiddenPatterns) {
  if (pattern.test(sourceBundle)) failures.push(`forbidden UI/template marker: ${pattern}`);
}

const dominantColorFamilies = [
  ["purple", /--plum:[^;]+;[\s\S]*--plum:[^;]+;/i],
  ["beige", /#f8f3ec[\s\S]*#fffaf4[\s\S]*#fffaf3[\s\S]*#fff7ef/i]
];

for (const [name, pattern] of dominantColorFamilies) {
  if (pattern.test(files.css) && !files.css.includes("--sea:") && !files.css.includes("--sage:")) {
    failures.push(`palette reads as one-note ${name}`);
  }
}

if (failures.length > 0) {
  console.error("UI contract check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("UI contract check passed. Premium web/mobile design markers are present.");
