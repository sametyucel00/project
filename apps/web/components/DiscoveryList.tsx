"use client";

import type { EventItem, GeoPoint, Offer, Place } from "@nar/core";
import { createGoogleMapsDirectionsUrl } from "@nar/core";
import { CalendarDays, Gift, Heart, Map, MapPin, Navigation, QrCode, Share2, Star, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, type SiteLocale } from "./LocaleProvider";

type DiscoveryItem = Place | EventItem | Offer;

export type FilterOption = {
  id: string;
  label: string;
};

export function localizeText(text: { tr: string; en?: string; ru?: string; de?: string }, locale: SiteLocale) {
  return text[locale] || text.tr;
}

export function createEventCalendarUrl(event: EventItem) {
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt ?? new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString());
  const format = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title.tr,
    dates: `${format(start)}/${format(end)}`,
    details: event.description.tr,
    location: event.venueName
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function FilterPills({
  options,
  activeId,
  onChange,
  ariaLabel
}: {
  options: FilterOption[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="filter-pills" aria-label={ariaLabel ?? "Filtreler"}>
      {options.map((option) => (
        <button
          aria-label={`${option.label} filtresi`}
          aria-pressed={activeId === option.id}
          className={activeId === option.id ? "active" : ""}
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function DiscoveryList({ items, type }: { items: DiscoveryItem[]; type: "places" | "events" | "offers" }) {
  const { locale, t } = useLocale();

  if (items.length === 0) {
    return <EmptyState title={t("common.noContent")} description={t("common.tryOtherFilters")} />;
  }

  return (
    <div className="discovery-list" aria-label="Keşif listesi">
      {items.map((item) => {
        const href = type === "places" ? `/mekanlar/${item.id}` : type === "events" ? `/etkinlikler/${item.id}` : `/firsatlar/${item.id}`;
        const image = "coverImage" in item ? item.coverImage : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4";
        const meta = getMeta(item, type, locale, t("common.unspecified"), t("common.open"), t("common.qrActive"), t("common.qrOptional"));
        const title = localizeText(item.title, locale);
        const description = localizeText(item.description, locale);
        return (
          <a className="discovery-item" href={href} key={item.id} aria-label={`${title} detayını aç`}>
            <div className="discovery-thumb" role="img" aria-label={`${title} görseli`} style={{ backgroundImage: `url(${image}?auto=format&fit=crop&w=600&q=80)` }} />
            <div>
              <span className={`meta meta-inline ${type === "offers" ? "meta-offer" : ""}`}>{meta}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state" role="status">
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function getMeta(
  item: DiscoveryItem,
  type: "places" | "events" | "offers",
  locale: SiteLocale,
  unspecifiedLabel: string,
  openLabel: string,
  qrActiveLabel: string,
  qrOptionalLabel: string
) : React.ReactNode {
  if (type === "places" && "categoryId" in item) {
    return `${item.district} · ${item.googleRating ?? unspecifiedLabel} · ${item.openNow ? openLabel : unspecifiedLabel}`;
  }
  if (type === "events" && "venueName" in item) {
    return `${item.venueName} · ${new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : locale, { dateStyle: "medium" }).format(new Date(item.startsAt))}`;
  }
  if (type === "offers" && "discountLabel" in item) {
    return (
      <>
        <span className="meta-offer-part"><Tag size={14} /> <span>{item.discountLabel}</span></span>
        <span aria-hidden="true">·</span>
        <span className="meta-offer-part"><QrCode size={14} /> <span>{item.requiresQr ? qrActiveLabel : qrOptionalLabel}</span></span>
      </>
    );
  }
  return "Nar Rehberi";
}

export function DetailHero({ title, description, image, meta }: { title: string; description: string; image: string; meta: string }) {
  return (
    <section className="detail-hero" aria-labelledby="detail-title">
      <div className="detail-copy">
        <span className="meta">{meta}</span>
        <h1 id="detail-title">{title}</h1>
        <p className="lead">{description}</p>
      </div>
      <div className="detail-image" role="img" aria-label={`${title} kapak görseli`} style={{ backgroundImage: `url(${image}?auto=format&fit=crop&w=1200&q=80)` }} />
    </section>
  );
}

export function FactGrid({ facts }: { facts: Array<{ label: string; value: string }> }) {
  return (
    <div className="fact-grid" aria-label="Detay bilgileri">
      {facts.map((fact) => (
        <div className="fact" key={fact.label}>
          <span>{fact.label}</span>
          <strong>{fact.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function ActionStrip({
  deepLink,
  calendarUrl,
  storageKey,
  shareTitle,
  shareText
}: {
  deepLink: string;
  calendarUrl?: string;
  storageKey: string;
  shareTitle: string;
  shareText: string;
}) {
  const { t } = useLocale();
  const [isFavorite, setIsFavorite] = useState(false);
  const isMobileBrowser = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const openInAppHref = isMobileBrowser ? deepLink : "/mobil-uygulama";

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("nar-web-favorites");
      if (!saved) return;
      const parsed = JSON.parse(saved) as Array<{ key?: string }>;
      setIsFavorite(parsed.some((item) => item.key === storageKey));
    } catch {
      setIsFavorite(false);
    }
  }, [storageKey]);

  function saveFavorites(nextState: boolean) {
    try {
      const saved = window.localStorage.getItem("nar-web-favorites");
      const parsed = saved ? (JSON.parse(saved) as Array<{ key: string; href: string; title: string }>) : [];
      const next = nextState
        ? [...parsed.filter((item) => item.key !== storageKey), { key: storageKey, href: deepLink, title: shareTitle }]
        : parsed.filter((item) => item.key !== storageKey);
      window.localStorage.setItem("nar-web-favorites", JSON.stringify(next));
    } catch {
      // Yerel favori kaydı başarısız olursa akışı bozma.
    }
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : deepLink;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      } catch {
        // Kullanıcı paylaşımı iptal edebilir; sessizce clipboard'a geç.
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <div className="action-strip" aria-label="Detay aksiyonları">
      <button
        aria-pressed={isFavorite}
        aria-label={t("detail.favorite")}
        type="button"
        onClick={() => {
          const next = !isFavorite;
          setIsFavorite(next);
          saveFavorites(next);
        }}
      >
        <Heart size={18} />
        <span>{isFavorite ? `${t("detail.favorite")} ✓` : t("detail.favorite")}</span>
      </button>
      <button aria-label={t("detail.share")} type="button" onClick={() => { void handleShare(); }}>
        <Share2 size={18} />
        <span>{t("detail.share")}</span>
      </button>
      <a aria-label={t("detail.openInApp")} href={openInAppHref}><Navigation size={18} /><span>{t("detail.openInApp")}</span></a>
      {calendarUrl ? <a aria-label={t("events.addToCalendar")} href={calendarUrl} target="_blank" rel="noreferrer"><CalendarDays size={18} /><span>{t("events.addToCalendar")}</span></a> : null}
    </div>
  );
}

export function MapSurface({ location, title, address }: { location?: GeoPoint; title: string; address: string }) {
  const { t } = useLocale();
  const mapQuery = encodeURIComponent(address || title);
  const iframeUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`
    : `https://www.google.com/maps?q=${mapQuery}&z=15&output=embed`;
  const directions = location
    ? createGoogleMapsDirectionsUrl(location, title)
    : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <section className="map-surface" aria-labelledby="map-title">
      <div>
        <Map size={22} />
        <h2 id="map-title">{t("detail.map")}</h2>
        <p>{address}</p>
      </div>
      <div className="map-frame">
        <iframe
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={iframeUrl}
          title={`${title} harita`}
        />
      </div>
      <a className="directions-link" href={directions} target="_blank" rel="noreferrer">{t("detail.getDirections")}</a>
    </section>
  );
}

export const discoveryIcons = { MapPin, CalendarDays, Gift, Star };
