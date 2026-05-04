import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultPushPreferences, type Locale, type PushPreferences } from "@nar/core";
import type { MobileThemeMode } from "./preferences";

const localeKey = "narrehberi:mobile:locale";
const themeKey = "narrehberi:mobile:theme";
const notificationsKey = "narrehberi:mobile:notifications";
const keys = [localeKey, themeKey, notificationsKey];

export interface StoredAppSettings {
  preferredLocale: Locale | null;
  themeMode: MobileThemeMode | null;
  notificationPreferences: PushPreferences | null;
}

export async function loadStoredAppSettings(): Promise<StoredAppSettings> {
  const [preferredLocale, themeMode, notificationPreferences] = await Promise.all([
    AsyncStorage.getItem(localeKey),
    AsyncStorage.getItem(themeKey),
    AsyncStorage.getItem(notificationsKey)
  ]);

  return {
    preferredLocale: normalizeLocaleValue(preferredLocale),
    themeMode: normalizeThemeModeValue(themeMode),
    notificationPreferences: normalizeNotificationPreferences(notificationPreferences)
  };
}

export async function saveStoredAppSettings(settings: {
  preferredLocale?: Locale;
  themeMode?: MobileThemeMode;
  notificationPreferences?: PushPreferences;
}) {
  const writes: Promise<void>[] = [];
  if (settings.preferredLocale) writes.push(AsyncStorage.setItem(localeKey, settings.preferredLocale));
  if (settings.themeMode) writes.push(AsyncStorage.setItem(themeKey, settings.themeMode));
  if (settings.notificationPreferences) {
    writes.push(AsyncStorage.setItem(notificationsKey, JSON.stringify(settings.notificationPreferences)));
  }
  await Promise.all(writes);
}

export async function resetStoredAppSettings() {
  await AsyncStorage.multiRemove(keys);
}

function normalizeLocaleValue(value: string | null): Locale | null {
  if (value === "tr" || value === "en" || value === "ru" || value === "de") return value;
  return null;
}

function normalizeThemeModeValue(value: string | null): MobileThemeMode | null {
  if (value === "light" || value === "dark" || value === "system") return value;
  return null;
}

function normalizeNotificationPreferences(value: string | null): PushPreferences | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<PushPreferences>;
    return {
      ...defaultPushPreferences,
      ...(typeof parsed === "object" && parsed ? parsed : {})
    };
  } catch {
    return null;
  }
}
