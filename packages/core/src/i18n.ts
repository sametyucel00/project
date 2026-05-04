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
    onboardingSubtitle: "Şehrini keşfetmek için dili seç, konumunu paylaş ve doğrudan başlayalım.",
    onboardingContinue: "Başla",
    onboardingAllowLocation: "Konum izni ver",
    onboardingSkipLocation: "Şimdilik atla",
    onboardingLanguage: "Dil seçimi",
    onboardingSplashTagline: "Şehir keşfi, mekanlar ve etkinlikler tek yerde.",
    onboardingLocationTitle: "Konum izni",
    onboardingLocationBody: "Yakındaki mekanlar, etkinlikler ve harita yönlendirmeleri için konum gerekiyor.",
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
    onboardingSubtitle: "Choose your language, share your location and start exploring the city.",
    onboardingContinue: "Get started",
    onboardingAllowLocation: "Allow location",
    onboardingSkipLocation: "Skip for now",
    onboardingLanguage: "Language",
    onboardingSplashTagline: "City discovery, places and events in one place.",
    onboardingLocationTitle: "Location access",
    onboardingLocationBody: "Location is needed for nearby places, events and map directions.",
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
    darkMode: "Темная тема",
    systemMode: "Системная тема",
    touristSurvivalKit: "Набор туриста",
    ancientGuide: "Античный гид",
    onboardingTitle: "Добро пожаловать в Nar Rehberi",
    onboardingSubtitle: "Выберите язык, дайте доступ к геолокации и начните изучать город.",
    onboardingContinue: "Начать",
    onboardingAllowLocation: "Разрешить геолокацию",
    onboardingSkipLocation: "Пропустить",
    onboardingLanguage: "Язык",
    onboardingSplashTagline: "Городские открытия, места и события в одном месте.",
    onboardingLocationTitle: "Доступ к геолокации",
    onboardingLocationBody: "Геолокация нужна для ближайших мест, событий и маршрутов на карте.",
    onboardingLocaleBody: "Если язык устройства поддерживается, приложение стартует на нём и его можно изменить позже.",
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
    onboardingSubtitle: "Wähle deine Sprache, teile deinen Standort und starte direkt.",
    onboardingContinue: "Los geht's",
    onboardingAllowLocation: "Standort erlauben",
    onboardingSkipLocation: "Jetzt überspringen",
    onboardingLanguage: "Sprache",
    onboardingSplashTagline: "Stadt entdecken, Orte und Events an einem Ort.",
    onboardingLocationTitle: "Standortzugriff",
    onboardingLocationBody: "Der Standort wird für nahe Orte, Events und Kartenwege benötigt.",
    onboardingLocaleBody: "Wenn deine Gerätesprache unterstützt wird, startet die App in dieser Sprache.",
    onboardingLocationGranted: "Standort erlaubt",
    onboardingLocationReady: "Standortzugriff bereit.",
    onboardingLocationPending: "Standortzugriff wird angefragt."
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
