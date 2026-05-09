import type { Locale, LocalizedText } from "./index";

export const dictionary: Record<Locale, Record<string, string>> = {
  tr: {
    appName: "Nar Rehberi",
    searchPlaceholder: "Mekan, etkinlik, fırsat ara",
    login: "Tek giriş",
    back: "Geri",
    homeTab: "Ana sayfa",
    placesTab: "Mekanlar",
    eventsTab: "Etkinlikler",
    offersTab: "Fırsatlar",
    profileTab: "Profil",
    unspecified: "Belirtilmemiş",
    lightMode: "Açık mod",
    darkMode: "Koyu mod",
    systemMode: "Sistem teması",
    touristSurvivalKit: "Turist Destek Rehberi",
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
    login: "Single login",
    back: "Back",
    homeTab: "Home",
    placesTab: "Places",
    eventsTab: "Events",
    offersTab: "Offers",
    profileTab: "Profile",
    unspecified: "Not specified",
    lightMode: "Light mode",
    darkMode: "Dark mode",
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
    searchPlaceholder: "Искать места, события, предложения",
    login: "Единый вход",
    back: "Назад",
    homeTab: "Главная",
    placesTab: "Места",
    eventsTab: "События",
    offersTab: "Предложения",
    profileTab: "Профиль",
    unspecified: "Не указано",
    lightMode: "Светлая тема",
    darkMode: "Тёмная тема",
    systemMode: "Системная тема",
    touristSurvivalKit: "Путеводитель для туриста",
    ancientGuide: "Античный гид",
    onboardingTitle: "Добро пожаловать в Nar Rehberi",
    onboardingSubtitle: "Выберите язык и при желании включите доступ к геолокации, чтобы начать.",
    onboardingContinue: "Начать",
    onboardingAllowLocation: "Далее",
    onboardingSkipLocation: "Пропустить",
    onboardingLanguage: "Язык",
    onboardingSplashTagline: "Открытия города, места и события в одном месте.",
    onboardingLocationTitle: "Поддержка геолокации",
    onboardingLocationBody: "Геолокация может использоваться для ближайших мест, событий и маршрутов.",
    onboardingLocaleBody: "Если язык устройства поддерживается, приложение стартует на нём и его можно изменить позже.",
    onboardingLocationGranted: "Геолокация разрешена",
    onboardingLocationReady: "Доступ к геолокации готов.",
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
