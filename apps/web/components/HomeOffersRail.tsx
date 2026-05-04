"use client";

import { fetchLiveOffers } from "@/lib/live-data";
import { featuredOffers, localizeText, type Offer } from "@nar/core";
import { BadgePercent, Clock3, QrCode, TicketPercent } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";

function dedupeOffers(items: Offer[]) {
  const merged = new Map<string, Offer>();
  for (const offer of items) merged.set(offer.id, offer);
  return [...merged.values()];
}

function formatRemaining(endsAt: string, locale: string) {
  const endMs = new Date(endsAt).getTime();
  const diff = endMs - Date.now();
  if (diff <= 0) return locale === "tr" ? "Süre doldu" : "Expired";
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;
  if (days > 0) return locale === "tr" ? `${days}g ${hours}s kaldı` : `${days}d ${hours}h left`;
  if (hours > 0) return locale === "tr" ? `${hours}s ${mins}dk kaldı` : `${hours}h ${mins}m left`;
  return locale === "tr" ? `${Math.max(mins, 1)}dk kaldı` : `${Math.max(mins, 1)}m left`;
}

export function HomeOffersRail() {
  const { locale } = useLocale();
  const copy = {
    tr: { label: "Fırsatlar", viewAll: "Tümünü gör", activeQr: "QR aktif", optionalQr: "QR opsiyonel", unlimited: "Sınırsız", uses: "kullanım", aria: "Öne çıkan fırsatlar" },
    en: { label: "Offers", viewAll: "View all", activeQr: "QR active", optionalQr: "QR optional", unlimited: "Unlimited", uses: "uses", aria: "Featured offers" },
    ru: { label: "Предложения", viewAll: "Смотреть все", activeQr: "QR активен", optionalQr: "QR не обязателен", unlimited: "Без лимита", uses: "исп.", aria: "Рекомендуемые предложения" },
    de: { label: "Angebote", viewAll: "Alle ansehen", activeQr: "QR aktiv", optionalQr: "QR optional", unlimited: "Unbegrenzt", uses: "Nutzung", aria: "Hervorgehobene Angebote" }
  }[locale];
  const [items, setItems] = useState<Offer[]>(featuredOffers);
  const [paused, setPaused] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    fetchLiveOffers(48)
      .then((liveOffers) => {
        if (!active) return;
        const merged = dedupeOffers([...liveOffers, ...featuredOffers]);
        setItems(merged.length ? merged : featuredOffers);
      })
      .catch(() => {
        if (!active) return;
        setItems(featuredOffers);
      });

    return () => {
      active = false;
    };
  }, []);

  const spotlight = useMemo(() => {
    return [...items]
      .filter((offer) => offer.status === "published")
      .filter((offer) => offer.storyEnabled || offer.featured)
      .sort((first, second) => {
        const firstPriority = first.storyPriority ?? 999;
        const secondPriority = second.storyPriority ?? 999;
        if (firstPriority !== secondPriority) return firstPriority - secondPriority;
        return first.endsAt.localeCompare(second.endsAt);
      })
      .slice(0, 12);
  }, [items]);

  if (!spotlight.length) return null;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || paused) return;

    const tick = window.setInterval(() => {
      const maxLeft = rail.scrollWidth - rail.clientWidth;
      if (maxLeft <= 0) return;
      const nextLeft = rail.scrollLeft + Math.min(rail.clientWidth * 0.72, 320);
      rail.scrollTo({
        left: nextLeft >= maxLeft - 4 ? 0 : nextLeft,
        behavior: "smooth"
      });
    }, 3600);

    return () => window.clearInterval(tick);
  }, [paused, spotlight.length]);

  return (
    <section className="home-offers-rail" aria-label={copy.aria}>
      <div className="home-offers-head">
        <span className="home-offers-kicker"><TicketPercent size={15} /> {copy.label}</span>
        <a href="/firsatlar">{copy.viewAll}</a>
      </div>
      <div
        className="home-offers-scroll"
        ref={railRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
      >
        {spotlight.map((offer) => {
          const remainingUse = offer.useLimit ? Math.max((offer.useLimit ?? 0) - (offer.usedCount ?? 0), 0) : null;
          const remainingTime = formatRemaining(offer.endsAt, locale);
          return (
            <a className="home-offer-card" href={`/firsatlar/${offer.id}`} key={offer.id}>
              <div className="home-offer-topline">
                <span className="home-offer-badge"><BadgePercent size={14} /> {offer.discountLabel}</span>
                <span><Clock3 size={14} /> {remainingTime}</span>
              </div>
              <strong>{localizeText(offer.title, locale)}</strong>
              <p>{localizeText(offer.description, locale)}</p>
              <div className="home-offer-foot">
                <span><QrCode size={13} /> {offer.requiresQr ? copy.activeQr : copy.optionalQr}</span>
                <span>{remainingUse === null ? copy.unlimited : `${remainingUse} ${copy.uses}`}</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
