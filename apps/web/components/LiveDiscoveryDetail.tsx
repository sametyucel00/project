"use client";

import { fetchLiveEvent, fetchLiveOffer, fetchLivePlace } from "@/lib/live-data";
import { compactValue, deepLinks, featuredPlaces, getEventTypeMeta, getPlaceCategory, normalizeSynopsisText, translateText, type EventItem, type Offer, type Place } from "@nar/core";
import { useEffect, useState } from "react";
import { ActionStrip, createEventCalendarUrl, DetailHero, FactGrid, localizeText, MapSurface } from "./DiscoveryList";
import { useLocale } from "./LocaleProvider";

function sanitizePublicValue(value?: string | number | boolean | null) {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return "Belirtilmemiş";
    if (normalized.includes("example.com") || normalized.includes(".example") || normalized.includes("mock-google")) {
      return "Belirtilmemiş";
    }
  }
  return compactValue(value);
}

export function LivePlaceDetail({ id, fallback }: { id: string; fallback: Place | null }) {
  const [place, setPlace] = useState<Place | null>(fallback);
  const { locale, t } = useLocale();

  useEffect(() => {
    let active = true;
    fetchLivePlace(id)
      .then((livePlace) => {
        if (!active || !livePlace) return;
        setPlace(livePlace);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [id]);

  if (!place) return <MissingDetail backHref="/mekanlar" backLabel={t("nav.places")} />;

  const openingHours = place.openingHours?.length ? place.openingHours.join(" · ") : t("common.unspecified");
  const socialLinks = Object.values(place.socialLinks ?? {}).filter(Boolean);
  const title = localizeText(place.title, locale);
  const description = localizeText(place.description, locale);
  const categoryTitle = localizeText(getPlaceCategory(place).title, locale);

  return (
    <>
      <DetailHero title={title} description={description} image={place.coverImage} meta={`${categoryTitle} · ${place.district}`} />
      <ActionStrip deepLink={deepLinks.place(place.id)} />
      <FactGrid
        facts={[
          { label: "Telefon", value: sanitizePublicValue(place.phone) },
          { label: "Adres", value: sanitizePublicValue(place.address) },
          { label: "Web sitesi", value: sanitizePublicValue(place.website) },
          { label: "E-posta", value: sanitizePublicValue(place.email) },
          { label: "Menü", value: sanitizePublicValue(place.menuUrl) },
          { label: "Çalışma saatleri", value: openingHours },
          { label: "Sosyal medya", value: socialLinks.length ? socialLinks.join(" · ") : t("common.unspecified") },
          { label: "Google puanı", value: sanitizePublicValue(place.googleRating) },
          { label: "Yorum sayısı", value: sanitizePublicValue(place.googleReviewCount) },
          { label: "Açık/kapalı", value: place.openNow ? t("common.open") : t("common.unspecified") },
          { label: "Wi‑Fi", value: sanitizePublicValue(place.accessibility.wifi) },
          { label: "Engelli dostu", value: sanitizePublicValue(place.accessibility.wheelchair) }
        ]}
      />
      <section className="detail-section" aria-label="Mekan özellikleri">
        <h2>Özellikler</h2>
        <div className="detail-tags">
          {[...place.features, ...(place.accessibility.vegan ? ["Vegan seçenek"] : []), ...(place.accessibility.parking ? ["Otopark"] : []), ...(place.accessibility.childFriendly ? ["Çocuk dostu"] : [])]
            .filter(Boolean)
            .map((feature) => <span key={feature}>{feature}</span>)}
          {place.features.length === 0 && !place.accessibility.vegan && !place.accessibility.parking && !place.accessibility.childFriendly ? <span>Belirtilmemiş</span> : null}
        </div>
      </section>
      <MapSurface title={title} address={place.address} location={place.location} />
    </>
  );
}

export function LiveEventDetail({ id, fallback }: { id: string; fallback: EventItem | null }) {
  const [event, setEvent] = useState<EventItem | null>(fallback);
  const { locale, t } = useLocale();
  const [synopsisText, setSynopsisText] = useState("");

  useEffect(() => {
    let active = true;
    fetchLiveEvent(id)
      .then((liveEvent) => {
        if (!active || !liveEvent) return;
        setEvent(liveEvent);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    const source = normalizeSynopsisText(event?.synopsis?.tr ?? event?.description.tr ?? "");
    if (!source) {
      setSynopsisText("");
      return;
    }
    if (locale === "tr") {
      setSynopsisText(source);
      return;
    }
    void translateText(source, locale).then((translated) => {
      if (!active) return;
      setSynopsisText(translated || source);
    });
    return () => {
      active = false;
    };
  }, [event?.description.tr, event?.synopsis?.tr, locale]);

  if (!event) return <MissingDetail backHref="/etkinlikler" backLabel={t("nav.events")} />;

  const title = localizeText(event.title, locale);
  const description = synopsisText || localizeText(event.synopsis ?? event.description, locale);
  const relatedVenue = featuredPlaces.find((place) => place.title.tr === event.venueName || place.district === event.district);
  const eventTypeTitle = localizeText(getEventTypeMeta(event).title, locale);

  return (
    <>
      <DetailHero title={title} description={description} image={event.coverImage} meta={`${event.venueName} · ${event.district}`} />
      <ActionStrip deepLink={deepLinks.event(event.id)} calendarUrl={createEventCalendarUrl(event)} />
      <FactGrid
        facts={[
          { label: "Tarih", value: new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : locale, { dateStyle: "long", timeStyle: "short" }).format(new Date(event.startsAt)) },
          { label: "Tür", value: eventTypeTitle },
          { label: "Ücret", value: event.priceType === "paid" ? "Ücretli" : "Ücretsiz" },
          { label: "Bilet", value: sanitizePublicValue(event.ticketUrl) },
          { label: "Kadro", value: event.cast.length ? event.cast.join(", ") : t("common.unspecified") },
          { label: "Video", value: sanitizePublicValue(event.videoUrl) }
        ]}
      />
      <MapSurface title={event.venueName} address={`${event.venueName}, ${event.district}`} location={relatedVenue?.location} />
    </>
  );
}

export function LiveOfferDetail({ id, fallback }: { id: string; fallback: Offer | null }) {
  const [offer, setOffer] = useState<Offer | null>(fallback);
  const { locale, t } = useLocale();

  useEffect(() => {
    let active = true;
    fetchLiveOffer(id)
      .then((liveOffer) => {
        if (!active || !liveOffer) return;
        setOffer(liveOffer);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [id]);

  if (!offer) return <MissingDetail backHref="/firsatlar" backLabel={t("nav.offers")} />;

  const place = featuredPlaces.find((item) => item.id === offer.placeId);
  const remainingUse = offer.useLimit ? Math.max(offer.useLimit - (offer.usedCount ?? 0), 0) : null;
  const title = localizeText(offer.title, locale);
  const description = localizeText(offer.description, locale);
  const conditions = localizeText(offer.conditions, locale);

  return (
    <>
      <DetailHero title={title} description={description} image={place?.coverImage ?? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"} meta={`${offer.discountLabel} · ${place?.title.tr ?? t("common.unspecified")}`} />
      <ActionStrip deepLink={deepLinks.offer(offer.id)} />
      <FactGrid
        facts={[
          { label: "İndirim", value: offer.discountLabel },
          { label: "Başlangıç", value: new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : locale, { dateStyle: "medium" }).format(new Date(offer.startsAt)) },
          { label: "Bitiş", value: new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : locale, { dateStyle: "medium" }).format(new Date(offer.endsAt)) },
          { label: "QR kullan", value: compactValue(offer.requiresQr) },
          { label: "Puan maliyeti", value: sanitizePublicValue(offer.pointCost) },
          { label: "Kalan kullanım", value: sanitizePublicValue(remainingUse) },
          { label: "Konum", value: sanitizePublicValue(place?.district) },
          { label: "İşletme", value: sanitizePublicValue(place?.title.tr) },
          { label: "Şartlar", value: conditions }
        ]}
      />
      <MapSurface title={place?.title.tr ?? title} address={place?.address ?? place?.district ?? t("common.unspecified")} location={place?.location} />
    </>
  );
}

function MissingDetail({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  const { t } = useLocale();

  return (
    <section className="system-state">
      <p className="eyebrow">{t("detail.contentMissing")}</p>
      <h1>{t("detail.contentUnavailable")}</h1>
      <a className="nav-action" href={backHref}>{backLabel}</a>
    </section>
  );
}
