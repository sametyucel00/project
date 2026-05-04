"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useLocale } from "./LocaleProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { locale } = useLocale();
  const dark = theme === "dark";
  const labels = {
    tr: { dark: "Koyu moda geç", light: "Açık moda geç", titleDark: "Koyu Mod", titleLight: "Açık Mod" },
    en: { dark: "Switch to dark mode", light: "Switch to light mode", titleDark: "Dark Mode", titleLight: "Light Mode" },
    ru: { dark: "Переключить на тёмную тему", light: "Переключить на светлую тему", titleDark: "Тёмная тема", titleLight: "Светлая тема" },
    de: { dark: "Zum dunklen Modus wechseln", light: "Zum hellen Modus wechseln", titleDark: "Dunkler Modus", titleLight: "Heller Modus" }
  }[locale];

  return (
    <button className="theme-toggle" onClick={toggleTheme} aria-label={dark ? labels.light : labels.dark} title={dark ? labels.titleLight : labels.titleDark}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
