"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type TextScale = "normal" | "large";

type AccessibilityContextValue = {
  highContrast: boolean;
  reducedMotion: boolean;
  textScale: TextScale;
  speechEnabled: boolean;
  speechSupported: boolean;
  isSpeaking: boolean;
  setHighContrast: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  setTextScale: (value: TextScale) => void;
  toggleSpeech: (locale?: string) => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

function applyAccessibilityAttributes(highContrast: boolean, reducedMotion: boolean, textScale: TextScale) {
  document.documentElement.dataset.a11yContrast = highContrast ? "high" : "normal";
  document.documentElement.dataset.a11yMotion = reducedMotion ? "reduced" : "normal";
  document.documentElement.dataset.a11yText = textScale;
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>("normal");
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance !== "undefined";

  useEffect(() => {
    const storedContrast = window.localStorage.getItem("nar-a11y-contrast") === "true";
    const storedMotion = window.localStorage.getItem("nar-a11y-motion") === "true";
    const storedText = window.localStorage.getItem("nar-a11y-text");
    const storedSpeech = window.localStorage.getItem("nar-a11y-speech") === "true";
    const nextTextScale: TextScale = storedText === "large" ? "large" : "normal";

    setHighContrast(storedContrast);
    setReducedMotion(storedMotion);
    setTextScale(nextTextScale);
    setSpeechEnabled(storedSpeech);
    applyAccessibilityAttributes(storedContrast, storedMotion, nextTextScale);
  }, []);

  useEffect(() => {
    applyAccessibilityAttributes(highContrast, reducedMotion, textScale);
    window.localStorage.setItem("nar-a11y-contrast", String(highContrast));
    window.localStorage.setItem("nar-a11y-motion", String(reducedMotion));
    window.localStorage.setItem("nar-a11y-text", textScale);
    window.localStorage.setItem("nar-a11y-speech", String(speechEnabled));
  }, [highContrast, reducedMotion, speechEnabled, textScale]);

  useEffect(() => {
    if (!speechSupported) return;
    const synth = window.speechSynthesis;
    const handleEnd = () => setIsSpeaking(false);
    synth.addEventListener?.("voiceschanged", handleEnd);
    return () => {
      synth.cancel();
      synth.removeEventListener?.("voiceschanged", handleEnd);
    };
  }, [speechSupported]);

  const toggleSpeech = useCallback((locale = "tr-TR") => {
    if (!speechSupported) return;
    const synth = window.speechSynthesis;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      setSpeechEnabled(false);
      return;
    }

    const mainContent = document.getElementById("main-content");
    const content = mainContent?.innerText?.replace(/\s+/g, " ").trim();
    if (!content) return;

    synth.cancel();
    const utterance = new window.SpeechSynthesisUtterance(content);
    utterance.lang = locale === "tr" ? "tr-TR" : locale === "en" ? "en-US" : locale === "ru" ? "ru-RU" : "de-DE";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeechEnabled(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeechEnabled(false);
    };
    setSpeechEnabled(true);
    setIsSpeaking(true);
    synth.speak(utterance);
  }, [isSpeaking, speechSupported]);

  const value = useMemo<AccessibilityContextValue>(() => ({
    highContrast,
    reducedMotion,
    textScale,
    speechEnabled,
    speechSupported,
    isSpeaking,
    setHighContrast,
    setReducedMotion,
    setTextScale,
    toggleSpeech
  }), [highContrast, reducedMotion, textScale, speechEnabled, speechSupported, isSpeaking, toggleSpeech]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const value = useContext(AccessibilityContext);
  if (!value) throw new Error("useAccessibility AccessibilityProvider içinde kullanılmalı.");
  return value;
}
