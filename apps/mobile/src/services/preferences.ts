import { isLocale, type Locale, type PushPreferences } from "@nar/core";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export type MobileThemeMode = "light" | "dark" | "system";

export interface MobileUserPreferences {
  preferredLocale: Locale;
  themeMode: MobileThemeMode;
  notificationPreferences: PushPreferences;
}

export const defaultMobilePreferences: MobileUserPreferences = {
  preferredLocale: "tr",
  themeMode: "system",
  notificationPreferences: {
    offers: true,
    events: true,
    theater: true,
    reminders: true,
    quietHoursStart: "23:00",
    quietHoursEnd: "08:00"
  }
};

export function normalizeLocale(locale: string | null | undefined): Locale {
  return isLocale(locale) ? locale : "tr";
}

export function normalizeThemeMode(themeMode: string | null | undefined): MobileThemeMode {
  if (themeMode === "light" || themeMode === "dark") return themeMode;
  return "system";
}

export async function saveLocalePreference(userId: string, preferredLocale: Locale) {
  await setDoc(
    doc(db, "users", userId),
    {
      preferredLocale,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveThemePreference(userId: string, themeMode: MobileThemeMode) {
  await setDoc(
    doc(db, "users", userId),
    {
      themeMode,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function saveMobilePreferences(userId: string, preferences: MobileUserPreferences) {
  await setDoc(
    doc(db, "users", userId),
    {
      preferredLocale: preferences.preferredLocale,
      themeMode: preferences.themeMode,
      notificationPreferences: preferences.notificationPreferences,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return {
    localeSaved: true,
    themeSaved: true,
    pushSaved: true
  };
}
