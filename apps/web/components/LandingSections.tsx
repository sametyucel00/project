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

function getAutfHighlights(items: EventItem[]) {
  return uniqueEventsByTitle(
    items
      .filter((item) => String(item.ticketUrl ?? "").includes("16-autf"))
      .sort((first, second) => first.startsAt.localeCompare(second.startsAt))
  ).slice(0, 4);
}

function getMayHighlights(items: EventItem[]) {
  return uniqueEventsByTitle(
    items
      .filter((item) => item.startsAt.startsWith("2026-05"))
      .sort((first, second) => first.startsAt.localeCompare(second.startsAt))
  ).slice(0, 8);
}

export function LandingSections() {
  const [places, setPlaces] = useState<Place[]>(featuredPlaces.slice(0, 6));
  const [events, setEvents] = useState<EventItem[]>(featuredEvents.slice(0, 5));
  const [offers, setOffers] = useState<Offer[]>(featuredOffers.slice(0, 3));
  const [autfHighlights, setAutfHighlights] = useState<EventItem[]>(getAutfHighlights(featuredEvents));
  const [mayHighlights, setMayHighlights] = useState<EventItem[]>(getMayHighlights(featuredEvents));

  useEffect(() => {
    let active = true;

    async function loadLandingContent() {
      try {
        const [livePlaces, liveEvents, liveOffers] = await Promise.all([
          fetchLivePlaces(6),
          fetchLiveEvents(48),
          fetchLiveOffers(3)
        ]);
        if (!active) return;

        const mergedEvents = [...featuredEvents];
        for (const event of liveEvents) {
          if (!mergedEvents.some((item) => item.id === event.id)) mergedEvents.push(event);
        }

        const sortedEvents = [...mergedEvents].sort((first, second) => first.startsAt.localeCompare(second.startsAt));

        setPlaces((livePlaces.length ? livePlaces : featuredPlaces).slice(0, 6));
        setEvents(sortedEvents.slice(0, 5));
        setAutfHighlights(getAutfHighlights(sortedEvents));
        setMayHighlights(getMayHighlights(sortedEvents));
        setOffers((liveOffers.length ? liveOffers : featuredOffers).slice(0, 3));
      } catch {
        if (!active) return;
        setPlaces(featuredPlaces.slice(0, 6));
        setEvents(featuredEvents.slice(0, 5));
        setAutfHighlights(getAutfHighlights(featuredEvents));
        setMayHighlights(getMayHighlights(featuredEvents));
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

      <section className="section dark" id="mekanlar">
        <div className="section-head">
          <h2>Mekan keşfi daha net, daha hızlı.</h2>
          <p>Adres, yol tarifi, puan, yorum ve açık/kapalı bilgileriyle karar vermek kolaylaşır.</p>
        </div>
        <div className="rail">
          {places.map((place) => (
            <article className="place" key={place.id}>
              <div className="place-image" style={{ backgroundImage: `url(${place.coverImage}?auto=format&fit=crop&w=900&q=80)` }} />
              <span className="meta">{place.district} · {place.googleRating ?? "Belirtilmemiş"} · {place.openNow ? "Açık" : "Belirtilmemiş"}</span>
              <h3>{place.title.tr}</h3>
              <p>{place.description.tr}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="etkinlikler">
        <div className="section-head">
          <h2>Etkinlikleri aya, haftaya veya ruh haline göre yakala.</h2>
          <p>Tiyatrodan konsere, festivalden sergiye şehirde ne varsa tek yerde.</p>
        </div>
        <div className="rail">
          {events.map((event) => (
            <article className="feature" key={event.id}>
              <span className="event-meta"><CalendarDays size={18} /> {new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date(event.startsAt))}</span>
              <h3>{event.title.tr}</h3>
              <p>{event.synopsis?.tr ?? event.description.tr}</p>
            </article>
          ))}
          {offers.map((offer) => (
            <article className="feature" key={offer.id}>
              <Gift size={22} />
              <span className="meta meta-inline">
                <span className="meta-offer-part"><Tag size={14} /><span>{offer.discountLabel}</span></span>
                <span aria-hidden="true">·</span>
                <span className="meta-offer-part"><QrCode size={14} /><span>QR aktif</span></span>
              </span>
              <h3>{offer.title.tr}</h3>
              <p>{offer.description.tr}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section dark" id="festival-vitrini">
        <div className="section-head">
          <h2>16. Antalya Uluslararası Tiyatro Festivali artık akışta.</h2>
          <p>Festival oyunları, seansları ve kapak görselleri yeni etkinlik akışına işlendi.</p>
        </div>
        <div className="rail">
          {autfHighlights.map((event) => (
            <article className="feature" key={event.id}>
              <span className="event-meta"><CalendarDays size={18} /> {new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date(event.startsAt))}</span>
              <h3>{event.title.tr}</h3>
              <p>{event.venueName}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="mayis-ajandasi">
        <div className="section-head">
          <h2>Mayıs'ta Antalya'da öne çıkan etkinlikler.</h2>
          <p>Festival, konser, bale ve şehir ajandasından derlenmiş güncel Mayıs seçkisi.</p>
        </div>
        <div className="rail">
          {mayHighlights.map((event) => (
            <article className="feature" key={event.id}>
              <span className="event-meta"><CalendarDays size={18} /> {new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date(event.startsAt))}</span>
              <h3>{event.title.tr}</h3>
              <p>{event.venueName} · {event.district}</p>
            </article>
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
