"use client";

import { fetchLiveEvents, fetchLiveOffers, fetchLivePlaces } from "@/lib/live-data";
import { featuredEvents, featuredOffers, featuredPlaces, timeBasedDiscovery, type EventItem, type Offer, type Place } from "@nar/core";
import { MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { localizeText } from "./DiscoveryList";

export function AppShowcase() {
  const { locale } = useLocale();
  const current = {
    tr: timeBasedDiscovery.evening,
    en: { label: "Evening", title: "Stage, concerts and city lights", filters: ["theater", "concert", "exhibition"] },
    ru: { label: "Вечер", title: "Сцена, концерты и огни города", filters: ["театр", "концерт", "выставка"] },
    de: { label: "Abend", title: "Bühne, Konzerte und Stadtlichter", filters: ["Theater", "Konzert", "Ausstellung"] }
  }[locale];
  const [offers, setOffers] = useState<Offer[]>(featuredOffers.slice(0, 1));
  const [events, setEvents] = useState<EventItem[]>(featuredEvents.slice(0, 1));
  const [places, setPlaces] = useState<Place[]>(featuredPlaces.slice(0, 2));

  useEffect(() => {
    let active = true;

    async function loadShowcase() {
      try {
        const [liveOffers, liveEvents, livePlaces] = await Promise.all([
          fetchLiveOffers(1),
          fetchLiveEvents(1),
          fetchLivePlaces(2)
        ]);
        if (!active) return;
        setOffers((liveOffers.length ? liveOffers : featuredOffers).slice(0, 1));
        setEvents((liveEvents.length ? liveEvents : featuredEvents).slice(0, 1));
        setPlaces((livePlaces.length ? livePlaces : featuredPlaces).slice(0, 2));
      } catch {
        if (!active) return;
        setOffers(featuredOffers.slice(0, 1));
        setEvents(featuredEvents.slice(0, 1));
        setPlaces(featuredPlaces.slice(0, 2));
      }
    }

    void loadShowcase();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="phone" aria-label={locale === "tr" ? "Nar Rehberi mobil uygulama önizlemesi" : locale === "en" ? "Nar Rehberi mobile app preview" : locale === "ru" ? "Предпросмотр мобильного приложения Nar Rehberi" : "Vorschau der Nar Rehberi Mobile App"}>
      <div className="phone-screen">
        <div className="app-top">
          <strong>Nar Rehberi</strong>
          <div className="app-search">
            <Search size={16} />
            <span style={{ marginLeft: 8 }}>{locale === "tr" ? "Mekan, etkinlik, fırsat ara" : locale === "en" ? "Search places, events and offers" : locale === "ru" ? "Искать места, события и предложения" : "Orte, Events und Angebote suchen"}</span>
          </div>
        </div>
        <div className="time-panel">
          <span>{current.label}</span>
          <h3>{current.title}</h3>
          <p>{current.filters.join(" · ")}</p>
        </div>
        <div className="stories">
          {offers.map((offer) => (
            <div className="story" key={offer.id}>
              <div className="story-dot" />
              <span>{offer.discountLabel}</span>
            </div>
          ))}
          {(locale === "tr" ? ["Tiyatro", "Kahve", "Antik", "Acil"] : locale === "en" ? ["Theater", "Coffee", "Ancient", "Emergency"] : locale === "ru" ? ["Театр", "Кофе", "Антика", "Экстренно"] : ["Theater", "Kaffee", "Antik", "Notfall"]).slice(0, 4).map((item) => (
            <div className="story" key={item}>
              <div className="story-dot" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="app-list">
          {[events[0] ?? featuredEvents[0], ...places].filter(Boolean).map((item) => (
            <div className="app-row" key={item.id}>
              <div className="app-thumb" style={{ backgroundImage: `url(${item.coverImage}?auto=format&fit=crop&w=260&q=80)` }} />
              <div>
                <strong>{localizeText(item.title, locale as "tr" | "en" | "ru" | "de")}</strong>
                <span>
                  <MapPin size={12} /> {"venueName" in item ? item.venueName : item.district}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
