import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const core = read("packages/core/src/index.ts");
const i18n = read("packages/core/src/i18n.ts");
const seoLib = read("apps/web/lib/seo.ts");
const panelShell = read("apps/web/components/PanelShell.tsx");
const localizationOps = read("apps/web/components/LocalizationOps.tsx");
const webThemeProvider = read("apps/web/components/ThemeProvider.tsx");
const webThemeToggle = read("apps/web/components/ThemeToggle.tsx");
const webTourist = read("apps/web/app/tourist-survival-kit/page.tsx");
const webAncient = read("apps/web/app/antik-rehber/page.tsx");
const webMiniModules = read("apps/web/components/LiveMiniModules.tsx");
const mobileHome = read("apps/mobile/src/screens/HomeScreen.tsx");
const mobilePreferences = read("apps/mobile/src/services/preferences.ts");
const seedTourist = read("firebase/seed/touristSurvivalKit.json");
const seedAncient = read("firebase/seed/ancientGuideStops.json");

const failures = [];
const locales = ["tr", "en", "ru", "de"];

for (const locale of locales) {
  if (!core.includes(`"${locale}"`)) failures.push(`Core locale eksik: ${locale}`);
  if (!i18n.includes(`${locale}: {`)) failures.push(`i18n sözlüğünde locale eksik: ${locale}`);
  if (!seedTourist.includes(`"${locale}"`)) failures.push(`Tourist seed locale eksik: ${locale}`);
  if (!seedAncient.includes(`"${locale}"`)) failures.push(`Antik rehber seed locale eksik: ${locale}`);
}

const requiredNeedles = [
  [core, "LocalizedText", "LocalizedText sözleşmesi eksik."],
  [core, "alternateLocales", "SEO dil alternates sözleşmesi eksik."],
  [core, "missingLocales", "Eksik çeviri helper export'u eksik."],
  [core, "createTranslationFallbackReport", "Fallback raporu export'u eksik."],
  [core, "touristSurvivalKit", "Tourist Survival Kit core verisi eksik."],
  [core, "ancientGuideStops", "Antik Rehber core verisi eksik."],
  [core, "SurvivalKitItem", "SurvivalKitItem sözleşmesi eksik."],
  [core, "AncientGuideStop", "AncientGuideStop sözleşmesi eksik."],
  [i18n, "isLocale", "isLocale helper eksik."],
  [i18n, "localizeText", "localizeText helper eksik."],
  [i18n, "missingLocales", "Eksik çeviri tespit helper'ı eksik."],
  [i18n, "hasCompleteTranslations", "Tam çeviri kontrol helper'ı eksik."],
  [i18n, "createTranslationFallbackReport", "Fallback raporu helper'ı eksik."],
  [i18n, "searchPlaceholder", "Çok dil arama metni eksik."],
  [i18n, "touristSurvivalKit", "Tourist sözlük anahtarı eksik."],
  [i18n, "ancientGuide", "Antik Rehber sözlük anahtarı eksik."],
  [seoLib, "languages", "SEO alternate language metadata eksik."],
  [seoLib, "en-US", "SEO İngilizce alternate eksik."],
  [seoLib, "ru-RU", "SEO Rusça alternate eksik."],
  [seoLib, "de-DE", "SEO Almanca alternate eksik."],
  [localizationOps, "Çok Dil Yönetimi", "Admin çok dil yönetimi paneli eksik."],
  [localizationOps, "Canlı çeviri raporu", "Admin çok dil canlı raporu eksik."],
  [localizationOps, "Henüz canlı içerik bulunamadı", "Admin çok dil boş durum izi eksik."],
  [localizationOps, "Eksik çeviri", "Eksik çeviri uyarısı panelde görünmeli."],
  [localizationOps, "Gösterilecek metin", "Dil fallback metni panelde görünmeli."],
  [panelShell, "LocalizationOps", "Admin panel LocalizationOps bileşenini bağlamalı."],
  [webThemeProvider, "nar-theme", "Web tema localStorage anahtarı eksik."],
  [webThemeProvider, "prefers-color-scheme", "Web sistem tema tercihi eksik."],
  [webThemeProvider, "document.documentElement.dataset.theme", "Web data-theme uygulaması eksik."],
  [webThemeToggle, "Açık moda geç", "Web açık mod erişilebilir adı eksik."],
  [webThemeToggle, "Koyu moda geç", "Web koyu mod erişilebilir adı eksik."],
  [mobilePreferences, "MobileThemeMode", "Mobil tema modu tipi eksik."],
  [mobilePreferences, "system", "Mobil sistem teması eksik."],
  [mobilePreferences, "saveThemePreference", "Mobil tema kaydetme servisi eksik."],
  [mobilePreferences, "saveLocalePreference", "Mobil dil kaydetme servisi eksik."],
  [mobilePreferences, "isLocale", "Mobil locale normalize core helper kullanmalı."],
  [webTourist, "LiveTouristSurvivalKit", "Web Tourist Survival Kit canlı bileşen bağlantısı eksik."],
  [webMiniModules, "touristSurvivalKit", "Web Tourist Survival Kit veri bağlantısı eksik."],
  [webMiniModules, "Güncel turist destek bilgileri", "Web turist destek güncel içerik izi eksik."],
  [webMiniModules, "Varsayılan turist destek bilgileri", "Web turist destek varsayılan içerik izi eksik."],
  [webMiniModules, "tel:", "Tourist telefon aksiyonu eksik."],
  [webAncient, "LiveAncientGuide", "Web Antik Rehber canlı bileşen bağlantısı eksik."],
  [webMiniModules, "ancientGuideStops", "Web Antik Rehber veri bağlantısı eksik."],
  [webMiniModules, "Güncel Antik Rehber", "Web Antik Rehber güncel içerik izi eksik."],
  [webMiniModules, "Varsayılan Antik Rehber", "Web Antik Rehber varsayılan içerik izi eksik."],
  [webMiniModules, "MapSurface", "Antik Rehber harita yüzeyi eksik."],
  [mobileHome, "touristSurvivalKit", "Mobil Tourist mini modül eksik."],
  [mobileHome, "ancientGuideStops", "Mobil Antik Rehber mini modül eksik."],
  [mobileHome, "setTouristItems(liveTouristItems.length ? liveTouristItems : touristSurvivalKit)", "Mobil turist destek canlı/yerel içerik yönetimi eksik."],
  [mobileHome, "setAncientStops(liveAncientStops.length ? liveAncientStops : ancientGuideStops)", "Mobil Antik Rehber canlı/yerel içerik yönetimi eksik."],
  [mobileHome, "fetchTouristSurvivalKit", "Mobil Tourist canlı servis bağlantısı eksik."],
  [mobileHome, "fetchAncientGuideStops", "Mobil Antik Rehber canlı servis bağlantısı eksik."],
  [mobileHome, "getTimeDiscovery", "Mobil saat bazlı keşif helper eksik."]
];

for (const [text, needle, message] of requiredNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

if (failures.length > 0) {
  console.error("Çok dil / tema / mini modül kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Çok dil / tema / mini modül kontrolü başarılı. Locale, fallback, SEO alternates, tema, Tourist ve Antik Rehber izleri doğrulandı.");
