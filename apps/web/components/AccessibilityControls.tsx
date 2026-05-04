"use client";

import { Accessibility, Check, Type, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useAccessibility } from "./AccessibilityProvider";
import { useLocale } from "./LocaleProvider";

export function AccessibilityControls() {
  const [open, setOpen] = useState(false);
  const { highContrast, reducedMotion, textScale, speechEnabled, speechSupported, isSpeaking, setHighContrast, setReducedMotion, setTextScale, toggleSpeech } = useAccessibility();
  const { locale, t } = useLocale();

  return (
    <div className="a11y-shell">
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("a11y.open")}
        className="theme-toggle"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <Accessibility size={18} />
      </button>
      {open ? (
        <div aria-label={t("a11y.panel")} className="a11y-panel" role="dialog">
          <div className="a11y-head">
            <strong>{t("a11y.title")}</strong>
            <button className="a11y-close" type="button" onClick={() => setOpen(false)}>
              {t("common.close")}
            </button>
          </div>
          <button className={`a11y-option ${highContrast ? "active" : ""}`} type="button" onClick={() => setHighContrast(!highContrast)}>
            <span>{t("a11y.contrast")}</span>
            {highContrast ? <Check size={16} /> : null}
          </button>
          <button className={`a11y-option ${reducedMotion ? "active" : ""}`} type="button" onClick={() => setReducedMotion(!reducedMotion)}>
            <span>{t("a11y.motion")}</span>
            {reducedMotion ? <Check size={16} /> : null}
          </button>
          <button
            className={`a11y-option ${speechEnabled ? "active" : ""}`}
            disabled={!speechSupported}
            type="button"
            onClick={() => toggleSpeech(locale)}
          >
            <span>{isSpeaking ? t("a11y.speechStop") : t("a11y.speechStart")}</span>
            {speechSupported ? (isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />) : <span>{t("a11y.speechUnavailable")}</span>}
          </button>
          <div className="a11y-scale">
            <span><Type size={16} /> {t("a11y.textScale")}</span>
            <div className="segmented a11y-scale-buttons">
              <button className={textScale === "normal" ? "active" : ""} type="button" onClick={() => setTextScale("normal")}>
                {t("a11y.normal")}
              </button>
              <button className={textScale === "large" ? "active" : ""} type="button" onClick={() => setTextScale("large")}>
                {t("a11y.large")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
