"use client";

import { featuredOffers, offerStories, type Offer } from "@nar/core";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DiscoveryList, FilterPills, type FilterOption } from "./DiscoveryList";
import { OfferStoriesRail } from "./OfferStoriesRail";
import { useLocale } from "./LocaleProvider";
import { fetchLiveOffers } from "@/lib/live-data";
import { SectionEyebrow } from "./SectionEyebrow";

export function OffersExplorer() {
  const { locale, t } = useLocale();
  const filterLabels = {
    instant: { tr: "Anlık", en: "Instant", ru: "Мгновенно", de: "Sofort" },
    qr: { tr: "QR aktif", en: "QR active", ru: "QR aktiv", de: "QR aktiv" },
    points: { tr: "Puanla kullan", en: "Use points", ru: "Использовать баллы", de: "Mit Punkten nutzen" },
    stories: { tr: "Hikaye", en: "Stories", ru: "Истории", de: "Stories" }
  } as const;
  const storyLabel = {
    tr: "Hikaye tarzı fırsatlar",
    en: "Story-style offers",
    ru: "Предложения в формате историй",
    de: "Story-Angebote"
  }[locale];
  const [items, setItems] = useState<Offer[]>(featuredOffers);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    let active = true;
    fetchLiveOffers(96)
      .then((result) => {
        if (!active) return;
        setItems(result.length ? result : featuredOffers);
      })
      .catch(() => {
        if (!active) return;
        setItems(featuredOffers);
      });
    return () => {
      active = false;
    };
  }, []);

  const filters = useMemo<FilterOption[]>(() => ([
    { id: "all", label: t("common.explore") },
    { id: "instant", label: filterLabels.instant[locale] },
    { id: "qr", label: filterLabels.qr[locale] },
    { id: "points", label: filterLabels.points[locale] },
    { id: "stories", label: filterLabels.stories[locale] }
  ]), [locale, t]);

  const filteredItems = useMemo(() => {
    return items.filter((offer) => {
      switch (activeFilter) {
        case "instant":
          return true;
        case "qr":
          return offer.requiresQr;
        case "points":
          return (offer.pointCost ?? 0) > 0;
        case "stories":
          return offer.storyEnabled || offerStories.some((story) => story.offerId === offer.id);
        default:
          return true;
      }
    });
  }, [activeFilter, items]);

  return (
    <>
      <div className="section-center-column section-center-column-wide">
        <SectionEyebrow icon={Sparkles}>{t("offers.eyebrow")}</SectionEyebrow>
        <h1>{t("offers.title")}</h1>
        <p className="lead">{t("offers.lead")}</p>
      </div>
      <FilterPills activeId={activeFilter} ariaLabel="Fırsat filtreleri" onChange={setActiveFilter} options={filters} />
      <div className="section-head">
        <h2>{storyLabel}</h2>
      </div>
      <OfferStoriesRail />
      <DiscoveryList items={filteredItems} type="offers" />
    </>
  );
}
