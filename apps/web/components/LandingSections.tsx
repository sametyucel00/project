"use client";

import { fetchLiveEvents, fetchLiveOffers, fetchLivePlaces } from "@/lib/live-data";
import { categories, featuredEvents, featuredOffers, featuredPlaces, type EventItem, type Offer, type Place } from "@nar/core";
import { Bell, CalendarDays, Gift, Languages, QrCode, ShieldCheck, Sparkles, Tag, Theater, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

const features = [
  { icon: Sparkles, key: "cityDiscovery" },
  { icon: Gift, key: "offers" },
  { icon: Theater, key: "stageAgenda" },
  { icon: QrCode, key: "qrEarn" },
  { icon: Languages, key: "fourLanguages" },
  { icon: ShieldCheck, key: "personalArea" }
] as const;

const copy = {
  tr: {
    title: "Şehri tek akışta, yorulmadan keşfet.",
    lead: "Mekanlar, etkinlikler ve fırsatlar birbirini tamamlayan sakin bir deneyimde buluşur.",
    accountTitle: "Hesabın sana göre açılır.",
    accountLead: "Bireysel kullanıcılar, işletmeler ve tiyatrolar kendi ihtiyaçlarına uygun alana geçer.",
    groupTitle: "İştah açan rotalar, sakin molalar ve kültür durakları.",
    sections: {
      cityDiscovery: ["Şehir keşfi", "Günün saatine ve ilgine göre mekan, rota ve etkinlik önerileri."],
      offers: ["Nar Fırsatları", "Hızlı kampanyalar, hikaye tadında öneriler ve puanla avantajlar."],
      stageAgenda: ["Sahne ajandası", "Tiyatro, konser, festival ve sergiler için temiz bir etkinlik takvimi."],
      qrEarn: ["QR ile kazan", "Katıldıkça puan kazan, fırsatları daha kolay kullan."],
      fourLanguages: ["Dört dil", "Türkçe, İngilizce, Rusça ve Almanca deneyim."],
      personalArea: ["Kişisel alan", "Favorilerin, puanların ve tercihlerin hesabında saklanır."]
    },
    panelCards: [
      ["Bireysel", "Puan, QR, favoriler, hatırlatıcılar ve şehir görevleri."],
      ["İşletme", "Mekanını tanıt, kampanya oluştur ve QR ile sadakat akışını yönet."],
      ["Tiyatro", "Oyunlarını, kadronu, bilet bağlantılarını ve duyurularını düzenle."],
      ["Yönetim", "İçerikleri, üyeleri ve kampanyaları tek merkezden takip et."]
    ] as Array<[string, string]>,
    categoryLead: categories.map((category) => category.title.tr).join(" · ")
  },
  en: {
    title: "Discover the city in one calm flow.",
    lead: "Places, events and offers come together in a composed experience.",
    accountTitle: "Your account opens your way.",
    accountLead: "Individual users, businesses and theaters move to the space they need.",
    groupTitle: "Appetizing routes, calm pauses and cultural stops.",
    sections: {
      cityDiscovery: ["City discovery", "Venue, route and event suggestions based on time of day and interest."],
      offers: ["Nar Offers", "Fast campaigns, story-like suggestions and point perks."],
      stageAgenda: ["Stage agenda", "A clean event calendar for theater, concerts, festivals and exhibitions."],
      qrEarn: ["Earn with QR", "Earn points as you go and use offers more easily."],
      fourLanguages: ["Four languages", "Turkish, English, Russian and German experience."],
      personalArea: ["Personal area", "Favorites, points and preferences are stored in your account."]
    },
    panelCards: [
      ["Individual", "Points, QR, favorites, reminders and city tasks."],
      ["Business", "Promote your venue, create campaigns and manage loyalty via QR."],
      ["Theater", "Manage plays, cast, ticket links and announcements."],
      ["Management", "Track content, members and campaigns from one center."]
    ] as Array<[string, string]>,
    categoryLead: categories.map((category) => category.title.en).join(" · ")
  },
  ru: {
    title: "Открывайте город в одном спокойном потоке.",
    lead: "Места, события и предложения объединяются в цельный опыт.",
    accountTitle: "Аккаунт открывается под вас.",
    accountLead: "Частные пользователи, бизнес и театры переходят в нужный им раздел.",
    groupTitle: "Аппетитные маршруты, спокойные паузы и культурные остановки.",
    sections: {
      cityDiscovery: ["Открытие города", "Рекомендации мест, маршрутов и событий по времени суток и интересам."],
      offers: ["Предложения Nar", "Быстрые кампании, истории и бонусы за баллы."],
      stageAgenda: ["Афиша сцены", "Чистый календарь для театра, концертов, фестивалей и выставок."],
      qrEarn: ["Зарабатывайте с QR", "Получайте баллы по мере использования и легче пользуйтесь предложениями."],
      fourLanguages: ["Четыре языка", "Опыт на турецком, английском, русском и немецком."],
      personalArea: ["Личный кабинет", "Избранное, баллы и настройки хранятся в аккаунте."]
    },
    panelCards: [
      ["Личный", "Баллы, QR, избранное, напоминания и городские задания."],
      ["Бизнес", "Продвигайте место, создавайте кампании и управляйте лояльностью через QR."],
      ["Театр", "Управляйте постановками, составом, ссылками на билеты и объявлениями."],
      ["Управление", "Отслеживайте контент, участников и кампании из одного центра."]
    ] as Array<[string, string]>,
    categoryLead: categories.map((category) => category.title.ru).join(" · ")
  },
  de: {
    title: "Entdecke die Stadt in einem ruhigen Fluss.",
    lead: "Orte, Events und Angebote greifen in einem klaren Erlebnis ineinander.",
    accountTitle: "Dein Konto öffnet deinen Weg.",
    accountLead: "Private Nutzer, Unternehmen und Theater wechseln in ihren passenden Bereich.",
    groupTitle: "Appetitliche Routen, ruhige Pausen und Kulturstopps.",
    sections: {
      cityDiscovery: ["Stadtentdeckung", "Ort-, Routen- und Eventempfehlungen nach Tageszeit und Interesse."],
      offers: ["Nar Angebote", "Schnelle Kampagnen, Story-Empfehlungen und Punktvorteile."],
      stageAgenda: ["Bühnenagenda", "Ein klarer Kalender für Theater, Konzerte, Festivals und Ausstellungen."],
      qrEarn: ["Mit QR verdienen", "Sammle Punkte unterwegs und nutze Angebote leichter."],
      fourLanguages: ["Vier Sprachen", "Türkisch, Englisch, Russisch und Deutsch."],
      personalArea: ["Persönlicher Bereich", "Favoriten, Punkte und Einstellungen bleiben im Konto gespeichert."]
    },
    panelCards: [
      ["Persönlich", "Punkte, QR, Favoriten, Erinnerungen und Stadtaufgaben."],
      ["Business", "Bewerbe deinen Ort, erstelle Kampagnen und steuere Loyalty via QR."],
      ["Theater", "Verwalte Stücke, Cast, Ticketlinks und Ankündigungen."],
      ["Verwaltung", "Verfolge Inhalte, Mitglieder und Kampagnen von einer Stelle aus."]
    ] as Array<[string, string]>,
    categoryLead: categories.map((category) => category.title.de).join(" · ")
  }
} as const;

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
  const { locale } = useLocale();
  const text = copy[locale];
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
          <h2>{text.title}</h2>
          <p>{text.lead}</p>
        </div>
        <div className="rail">
          {features.map((feature) => (
            <div className="feature" key={feature.key}>
              <feature.icon size={22} />
              <h3>{text.sections[feature.key][0]}</h3>
              <p>{text.sections[feature.key][1]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section dark" id="paneller">
        <div className="section-head">
          <h2>{text.accountTitle}</h2>
          <p>{text.accountLead}</p>
        </div>
        <div className="panel-grid">
          {text.panelCards.map(([title, description]) => (
            <div className="panel" key={title}>
              {title === (locale === "tr" ? "Yönetim" : locale === "en" ? "Management" : locale === "ru" ? "Управление" : "Verwaltung") ? <ShieldCheck size={22} /> : title === (locale === "tr" ? "Bireysel" : locale === "en" ? "Individual" : locale === "ru" ? "Личный" : "Persönlich") ? <Users size={22} /> : <Bell size={22} />}
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="kategoriler">
        <div className="section-head">
          <h2>{text.groupTitle}</h2>
          <p>{text.categoryLead}</p>
        </div>
      </section>
    </>
  );
}
