import type { Locale, LocalizedText } from "./index";

export const dictionary: Record<Locale, Record<string, string>> = {
  tr: {
    appName: "Nar Rehberi",
    searchPlaceholder: "Mekan, etkinlik, fırsat ara",
    login: "Tek Giriş",
    back: "Geri",
    homeTab: "Ana Sayfa",
    placesTab: "Mekanlar",
    eventsTab: "Etkinlikler",
    offersTab: "Fırsatlar",
    profileTab: "Profil",
    unspecified: "Belirtilmemiş",
    lightMode: "Açık Mod",
    darkMode: "Koyu Mod",
    systemMode: "Sistem teması",
    touristSurvivalKit: "Tourist Survival Kit",
    ancientGuide: "Antik Rehber",
    onboardingTitle: "Nar Rehberi'ne hoş geldin",
    onboardingSubtitle: "Şehrini keşfetmek için dili seç, istersen konum desteğini aç ve başlayalım.",
    onboardingContinue: "Başla",
    onboardingAllowLocation: "İleri",
    onboardingSkipLocation: "Şimdilik atla",
    onboardingLanguage: "Dil seçimi",
    onboardingSplashTagline: "Şehir keşfi, mekanlar ve etkinlikler tek yerde.",
    onboardingLocationTitle: "Konum desteği",
    onboardingLocationBody: "Yakındaki mekanlar, etkinlikler ve harita yönlendirmeleri için konum kullanılabilir.",
    onboardingLocaleBody: "Cihaz dilin uygunsa uygulama o dile göre başlar ve sonradan değiştirilebilir.",
    onboardingLocationGranted: "Konum izni verildi",
    onboardingLocationReady: "Konum izni hazır.",
    onboardingLocationPending: "Konum izni isteniyor."
  },
  en: {
    appName: "Nar Rehberi",
    searchPlaceholder: "Search places, events, offers",
    login: "Single Login",
    back: "Back",
    homeTab: "Home",
    placesTab: "Places",
    eventsTab: "Events",
    offersTab: "Offers",
    profileTab: "Profile",
    unspecified: "Not specified",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    systemMode: "System theme",
    touristSurvivalKit: "Tourist Survival Kit",
    ancientGuide: "Ancient Guide",
    onboardingTitle: "Welcome to Nar Rehberi",
    onboardingSubtitle: "Choose your language and optionally enable location support to start exploring the city.",
    onboardingContinue: "Get started",
    onboardingAllowLocation: "Next",
    onboardingSkipLocation: "Skip for now",
    onboardingLanguage: "Language",
    onboardingSplashTagline: "City discovery, places and events in one place.",
    onboardingLocationTitle: "Location support",
    onboardingLocationBody: "Location can be used for nearby places, events and map directions.",
    onboardingLocaleBody: "If your device language is supported, the app starts in that language and can be changed later.",
    onboardingLocationGranted: "Location granted",
    onboardingLocationReady: "Location permission ready.",
    onboardingLocationPending: "Location permission is being requested."
  },
  ru: {
    appName: "Nar Rehberi",
    searchPlaceholder: "Ğ˜ÑĞºĞ°Ñ‚ÑŒ Ğ¼ĞµÑÑ‚Ğ°, ÑĞ¾Ğ±Ñ‹Ñ‚Ğ¸Ñ, Ğ¿Ñ€ĞµĞ´Ğ»Ğ¾Ğ¶ĞµĞ½Ğ¸Ñ",
    login: "Ğ•Ğ´Ğ¸Ğ½Ñ‹Ğ¹ Ğ²Ñ…Ğ¾Ğ´",
    back: "ĞĞ°Ğ·Ğ°Ğ´",
    homeTab: "Ğ“Ğ»Ğ°Ğ²Ğ½Ğ°Ñ",
    placesTab: "ĞœĞµÑÑ‚Ğ°",
    eventsTab: "Ğ¡Ğ¾Ğ±Ñ‹Ñ‚Ğ¸Ñ",
    offersTab: "ĞŸÑ€ĞµĞ´Ğ»Ğ¾Ğ¶ĞµĞ½Ğ¸Ñ",
    profileTab: "ĞŸÑ€Ğ¾Ñ„Ğ¸Ğ»ÑŒ",
    unspecified: "ĞĞµ ÑƒĞºĞ°Ğ·Ğ°Ğ½Ğ¾",
    lightMode: "Ğ¡Ğ²ĞµÑ‚Ğ»Ğ°Ñ Ñ‚ĞµĞ¼Ğ°",
    darkMode: "Ğ¢ĞµĞ¼Ğ½Ğ°Ñ Ñ‚ĞµĞ¼Ğ°",
    systemMode: "Ğ¡Ğ¸ÑÑ‚ĞµĞ¼Ğ½Ğ°Ñ Ñ‚ĞµĞ¼Ğ°",
    touristSurvivalKit: "ĞĞ°Ğ±Ğ¾Ñ€ Ñ‚ÑƒÑ€Ğ¸ÑÑ‚Ğ°",
    ancientGuide: "ĞĞ½Ñ‚Ğ¸Ñ‡Ğ½Ñ‹Ğ¹ Ğ³Ğ¸Ğ´",
    onboardingTitle: "Ğ”Ğ¾Ğ±Ñ€Ğ¾ Ğ¿Ğ¾Ğ¶Ğ°Ğ»Ğ¾Ğ²Ğ°Ñ‚ÑŒ Ğ² Nar Rehberi",
    onboardingSubtitle: "Выберите язык и при желании включите поддержку геолокации, чтобы начать.",
    onboardingContinue: "Начать",
    onboardingAllowLocation: "Продолжить",
    onboardingSkipLocation: "Пропустить",
    onboardingLanguage: "Ğ¯Ğ·Ñ‹Ğº",
    onboardingSplashTagline: "Ğ“Ğ¾Ñ€Ğ¾Ğ´ÑĞºĞ¸Ğµ Ğ¾Ñ‚ĞºÑ€Ñ‹Ñ‚Ğ¸Ñ, Ğ¼ĞµÑÑ‚Ğ° Ğ¸ ÑĞ¾Ğ±Ñ‹Ñ‚Ğ¸Ñ Ğ² Ğ¾Ğ´Ğ½Ğ¾Ğ¼ Ğ¼ĞµÑÑ‚Ğµ.",
    onboardingLocationTitle: "Поддержка геолокации",
    onboardingLocationBody: "Геолокация может использоваться для ближайших мест, событий и маршрутов на карте.",
    onboardingLocaleBody: "Если язык вашего устройства поддерживается, приложение стартует на нём и его можно изменить позже.",
    onboardingLocationGranted: "Геолокация разрешена",
    onboardingLocationReady: "Геолокация готова.",
    onboardingLocationPending: "Запрашивается доступ к геолокации."
  },
  de: {
    appName: "Nar Rehberi",
    searchPlaceholder: "Orte, Events, Angebote suchen",
    login: "Ein Login",
    back: "Zurück",
    homeTab: "Startseite",
    placesTab: "Orte",
    eventsTab: "Events",
    offersTab: "Angebote",
    profileTab: "Profil",
    unspecified: "Nicht angegeben",
    lightMode: "Heller Modus",
    darkMode: "Dunkler Modus",
    systemMode: "Systemdesign",
    touristSurvivalKit: "Tourist Survival Kit",
    ancientGuide: "Antiker Guide",
    onboardingTitle: "Willkommen bei Nar Rehberi",
    onboardingSubtitle: "Wähle deine Sprache und aktiviere optional die Standortunterstützung, um direkt zu starten.",
    onboardingContinue: "Los geht's",
    onboardingAllowLocation: "Weiter",
    onboardingSkipLocation: "Jetzt überspringen",
    onboardingLanguage: "Sprache",
    onboardingSplashTagline: "Stadt entdecken, Orte und Events an einem Ort.",
    onboardingLocationTitle: "Standortunterstützung",
    onboardingLocationBody: "Der Standort kann für nahe Orte, Events und Kartenwege genutzt werden.",
    onboardingLocaleBody: "Wenn deine Gerätesprache unterstützt wird, startet die App in dieser Sprache.",
    onboardingLocationGranted: "Standort erlaubt",
    onboardingLocationReady: "Standortunterstützung bereit.",
    onboardingLocationPending: "Standort wird angefragt."
  }
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "tr" || value === "en" || value === "ru" || value === "de";
}

export function t(locale: Locale, key: keyof typeof dictionary.tr) {
  return dictionary[locale][key] ?? dictionary.tr[key];
}

export function localizeText(value: LocalizedText | undefined, locale: Locale, fallback = dictionary.tr.unspecified) {
  if (!value) return fallback;
  return value[locale] || value.tr || fallback;
}

export function missingLocales(value: Partial<LocalizedText> | undefined): Locale[] {
  const locales: Locale[] = ["tr", "en", "ru", "de"];
  if (!value) return locales;
  return locales.filter((locale) => !value[locale]?.trim());
}

export function hasCompleteTranslations(value: Partial<LocalizedText> | undefined) {
  return missingLocales(value).length === 0;
}

export function createTranslationFallbackReport(value: Partial<LocalizedText> | undefined, sourceLocale: Locale = "tr") {
  const missing = missingLocales(value);
  return {
    sourceLocale,
    missing,
    complete: missing.length === 0,
    fallbackText: value?.[sourceLocale] || value?.tr || dictionary.tr.unspecified
  };
}

