"use client";

import { useLocale } from "./LocaleProvider";

const languages = [
  { code: "tr", label: "TR" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "de", label: "DE" }
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="language-switcher" aria-label="Dil seçimi">
      {languages.map((language) => (
        <button
          key={language.code}
          className={locale === language.code ? "active" : ""}
          type="button"
          aria-pressed={locale === language.code}
          onClick={() => setLocale(language.code as "tr" | "en" | "ru" | "de")}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}
