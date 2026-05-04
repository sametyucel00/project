import type { Locale } from "@nar/core";

export function getDeviceLocale(): Locale {
  const candidates = [
    typeof navigator !== "undefined" ? navigator.language : undefined,
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().locale : undefined
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    if (normalized.startsWith("en")) return "en";
    if (normalized.startsWith("ru")) return "ru";
    if (normalized.startsWith("de")) return "de";
    if (normalized.startsWith("tr")) return "tr";
  }
  return "tr";
}

let activeLocale: Locale = getDeviceLocale();
const listeners = new Set<() => void>();

export function getMobileLocale() {
  return activeLocale;
}

export function setMobileLocale(locale: Locale) {
  if (activeLocale === locale) return;
  activeLocale = locale;
  listeners.forEach((listener) => listener());
}

export function subscribeMobileLocale(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
