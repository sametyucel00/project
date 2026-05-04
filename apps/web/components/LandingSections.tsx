"use client";

import { fetchLiveEvents, fetchLiveOffers, fetchLivePlaces } from "@/lib/live-data";
import { categories, featuredEvents, featuredOffers, featuredPlaces, type EventItem, type Offer, type Place } from "@nar/core";
import { Bell, CalendarDays, Gift, Languages, QrCode, ShieldCheck, Sparkles, Tag, Theater, Users } from "lucide-react";
import { useEffect, useState } from "react";

const features = [
  { icon: Sparkles, title: "Şehir keşfi", text: "Günün saatine ve ilgine göre mekan, rota ve etkinlik önerileri." },
  { icon: Gift, title: "Nar Fırsatları", text: "Hızlı kampanyalar, hikaye tadında öneriler ve puanla avantajlar." },
  { icon: Theater, title: "Sahne ajandası", text: "Tiyatro, konser, festival ve sergiler için temiz bir etkinlik takvimi." },
  { icon: QrCode, title: "QR ile kazan", text: "Katıldıkça puan kazan, fırsatları daha kolay kullan." },
  { icon: Languages, title: "Dört dil", text: "Türkçe, İngilizce, Rusça ve Almanca deneyim." },
  { icon: ShieldCheck, title: "Kişisel alan", text: "Favorilerin, puanların ve tercihlerin hesabında saklanır." }
];

function uniqueEventsByTitle(items: EventItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.tr;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ğüşöçıİ\s]/g, " ");
}

function haversineMeters(first: { lat: number; lng: number }, second: { lat: number; lng: number }) {
  const earthRadius = 6371000;
  const dLat = ((second.lat - first.lat) * Math.PI) / 180;
  const dLng = ((second.lng - first.lng) * Math.PI) / 180;
  const lat1 = (first.lat * Math.PI) / 180;
  const lat2 = (second.lat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceLabel(distanceMeters?: number | null) {
  if (distanceMeters === undefined || distanceMeters === null || Number.isNaN(distanceMeters)) return "Mesafe yok";
  if (distanceMeters < 1000) return `${Math.round(distanceMeters)} m`;
  return `${(distanceMeters / 1000).toFixed(distanceMeters >= 10000 ? 0 : 1)} km`;
}

function resolveNearbyEvents(items: EventItem[], places: Place[], location?: { lat: number; lng: number } | null) {
  return uniqueEventsByTitle(items.map((event) => event))
    .map((event) => {
      const normalizedVenue = normalizeText(event.venueName);
      const place = places.find((item) => {
        const title = normalizeText(item.title.tr);
        const address = normalizeText(item.address);
        return title.includes(normalizedVenue) || normalizedVenue.includes(title) || address.includes(normalizedVenue);
      });

      const distance = location && place?.location ? haversineMeters(location, place.location) : null;
      return { event, place, distance };
    })
    .sort((first, second) => {
      const firstDistance = first.distance ?? Number.POSITIVE_INFINITY;
      const secondDistance = second.distance ?? Number.POSITIVE_INFINITY;
      if (firstDistance !== secondDistance) return firstDistance - secondDistance;
      return first.event.startsAt.localeCompare(second.event.startsAt);
    })
    .slice(0, 6);
}

export function LandingSections() {
  const [places, setPlaces] = useState<Place[]>(featuredPlaces.slice(0, 6));
  const [events, setEvents] = useState<EventItem[]>(featuredEvents.slice(0, 6));
  const [offers, setOffers] = useState<Offer[]>(featuredOffers.slice(0, 3));
  const [nearbyEvents, setNearbyEvents] = useState<Array<{ event: EventItem; place?: Place; distance: number | null }>>([]);

  useEffect(() => {
    let active = true;

    async function loadLandingContent() {
      try {
        const [livePlaces, liveEvents, liveOffers] = await Promise.all([
          fetchLivePlaces(80),
          fetchLiveEvents(48),
          fetchLiveOffers(3)
        ]);
        if (!active) return;

        const mergedEvents = [...featuredEvents];
        for (const event of liveEvents) {
          if (!mergedEvents.some((item) => item.id === event.id)) mergedEvents.push(event);
        }

        const sortedEvents = [...mergedEvents].sort((first, second) => first.startsAt.localeCompare(second.startsAt));
        const resolvedPlaces = livePlaces.length ? livePlaces : featuredPlaces;

        setPlaces(resolvedPlaces.slice(0, 6));
        setEvents(sortedEvents.slice(0, 6));
        setOffers((liveOffers.length ? liveOffers : featuredOffers).slice(0, 3));

        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!active) return;
              const nextLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
              setNearbyEvents(resolveNearbyEvents(sortedEvents, resolvedPlaces, nextLocation));
            },
            () => {
              if (!active) return;
              setNearbyEvents(resolveNearbyEvents(sortedEvents, resolvedPlaces, null));
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
          );
        } else {
          setNearbyEvents(resolveNearbyEvents(sortedEvents, resolvedPlaces, null));
        }
      } catch {
        if (!active) return;
        setPlaces(featuredPlaces.slice(0, 6));
        setEvents(featuredEvents.slice(0, 6));
        setNearbyEvents(resolveNearbyEvents(featuredEvents, featuredPlaces, null));
        setOffers(featuredOffers.slice(0, 3));
      }
    }

    void loadLandingContent();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="section" id="ozellikler">
        <div className="section-head">
          <h2>Şehri tek akışta, yorulmadan keşfet.</h2>
          <p>Mekanlar, etkinlikler ve fırsatlar birbirini tamamlayan sakin bir deneyimde buluşur.</p>
        </div>
        <div className="rail">
          {features.map((feature) => (
            <div className="feature" key={feature.title}>
              <feature.icon size={22} />
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section dark" id="paneller">
        <div className="section-head">
          <h2>Hesabın sana göre açılır.</h2>
          <p>Bireysel kullanıcılar, işletmeler ve tiyatrolar kendi ihtiyaçlarına uygun alana geçer.</p>
        </div>
        <div className="panel-grid">
          {[
            ["Bireysel", "Puan, QR, favoriler, hatırlatıcılar ve şehir görevleri."],
            ["İşletme", "Mekanını tanıt, kampanya oluştur ve QR ile sadakat akışını yönet."],
            ["Tiyatro", "Oyunlarını, kadronu, bilet bağlantılarını ve duyurularını düzenle."],
            ["Yönetim", "İçerikleri, üyeleri ve kampanyaları tek merkezden takip et."]
          ].map(([title, text]) => (
            <div className="panel" key={title}>
              {title === "Yönetim" ? <ShieldCheck size={22} /> : title === "Bireysel" ? <Users size={22} /> : <Bell size={22} />}
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="kategoriler">
        <div className="section-head">
          <h2>İştah açan rotalar, sakin molalar ve kültür durakları.</h2>
          <p>{categories.map((category) => category.title.tr).join(" · ")}</p>
        </div>
      </section>
    </>
  );
}
