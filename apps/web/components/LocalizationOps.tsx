"use client";

import { fetchLiveEvents, fetchLiveOffers, fetchLivePlaces } from "@/lib/live-data";
import {
  createTranslationFallbackReport,
  featuredEvents,
  featuredOffers,
  featuredPlaces,
  localizeText,
  locales,
  type EventItem,
  type LocalizedText,
  type Offer,
  type Place
} from "@nar/core";
import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

type LocalizedSample = {
  id: string;
  type: "Mekan" | "Etkinlik" | "Fırsat";
  title: LocalizedText;
  description: LocalizedText;
};

const seedLocalizedSamples = createSamples(featuredPlaces, featuredEvents, featuredOffers);

export function LocalizationOps() {
  const [localizedSamples, setLocalizedSamples] = useState(seedLocalizedSamples);
  const [status, setStatus] = useState("Canlı çeviri raporu yükleniyor.");

  useEffect(() => {
    let active = true;

    async function loadLocalizedContent() {
      try {
        const [places, events, offers] = await Promise.all([
          fetchLivePlaces(12),
          fetchLiveEvents(12),
          fetchLiveOffers(12)
        ]);
        if (!active) return;
        const liveSamples = createSamples(places, events, offers);
        setLocalizedSamples(liveSamples.length ? liveSamples : seedLocalizedSamples);
        setStatus(liveSamples.length ? "Canlı çeviri raporu kullanılıyor." : "Henüz canlı içerik bulunamadı.");
      } catch (error) {
        if (!active) return;
        setLocalizedSamples(seedLocalizedSamples);
        setStatus(error instanceof Error ? error.message : "Çeviri raporu yüklenemedi.");
      }
    }

    void loadLocalizedContent();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="seo-ops">
      <div className="stats-head">
        <Languages size={22} />
        <div>
          <h2>Çok Dil Yönetimi</h2>
          <p>Dinamik içeriklerde Türkçe, İngilizce, Rusça ve Almanca metinlerin tamamlanma durumu izlenir.</p>
          <span className="meta" aria-live="polite">{status}</span>
        </div>
      </div>
      <div className="role-flow" aria-label="Desteklenen diller">
        {locales.map((locale) => <span key={locale}>{locale}</span>)}
      </div>
      <div className="seo-grid">
        {localizedSamples.map((item) => {
          const titleReport = createTranslationFallbackReport(item.title);
          const descriptionReport = createTranslationFallbackReport(item.description);
          const missing = [...new Set([...titleReport.missing, ...descriptionReport.missing])];
          return (
            <article key={`${item.type}-${item.id}`}>
              <strong>{item.type}: {localizeText(item.title, "tr")}</strong>
              <span>{missing.length ? `Eksik çeviri: ${missing.join(", ")}` : "Tüm çeviriler hazır"}</span>
              <small>Gösterilecek metin: {titleReport.fallbackText}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function createSamples(places: Place[], events: EventItem[], offers: Offer[]): LocalizedSample[] {
  return [
    ...places.map((item) => ({ id: item.id, type: "Mekan" as const, title: item.title, description: item.description })),
    ...events.map((item) => ({ id: item.id, type: "Etkinlik" as const, title: item.title, description: item.description })),
    ...offers.map((item) => ({ id: item.id, type: "Fırsat" as const, title: item.title, description: item.description }))
  ];
}
