"use client";

import { featuredOffers, featuredPlaces, getPlaceCategoryId, placeCategoryOptions, placeFilters, type Place } from "@nar/core";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { MapPinned, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DiscoveryList, FilterPills, localizeText, type FilterOption } from "./DiscoveryList";
import { useLocale } from "./LocaleProvider";
import { fetchLivePlaces } from "@/lib/live-data";
import { SectionEyebrow } from "./SectionEyebrow";

export function PlacesExplorer() {
  const { locale, t } = useLocale();
  const searchPlaceholder = {
    tr: "Mekan, kategori, ilçe veya özellik ara",
    en: "Search venue, category, district or feature",
    ru: "Искать место, категорию, район или особенность",
    de: "Ort, Kategorie, Bezirk oder Merkmal suchen"
  }[locale];
  const filterLabels = {
    openNow: { tr: "Açık", en: "Open now", ru: "Открыто", de: "Jetzt offen" },
    rating: { tr: "4.5+", en: "4.5+", ru: "4.5+", de: "4.5+" },
    hasOffer: { tr: "Fırsat var", en: "Has offer", ru: "Есть предложение", de: "Angebot vorhanden" }
  } as const;
  const [items, setItems] = useState<Place[]>(featuredPlaces);
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [customCategories, setCustomCategories] = useState<Array<{ id: string; title: { tr: string; en?: string; ru?: string; de?: string } }>>([]);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    fetchLivePlaces(500)
      .then((result) => {
        if (!active) return;
        const merged = [...featuredPlaces];
        for (const place of result) {
          if (!merged.some((item) => item.id === place.id)) merged.push(place);
        }
        setItems(merged.length ? merged : featuredPlaces);
      })
      .catch(() => {
        if (!active) return;
        setItems(featuredPlaces);
      });

    getDocs(collection(db, "categories"))
      .then((snapshot) => {
        if (!active) return;
        const liveCategories = snapshot.docs
          .map((entry) => entry.data() as { id?: string; target?: string; status?: string; title?: { tr: string; en?: string; ru?: string; de?: string } })
          .filter((category) => category.target === "place" && category.status === "published" && category.id && category.title?.tr)
          .map((category) => ({ id: category.id as string, title: category.title as { tr: string; en?: string; ru?: string; de?: string } }));
        setCustomCategories(liveCategories);
      })
      .catch(() => {
        if (!active) return;
        setCustomCategories([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const filters = useMemo<FilterOption[]>(() => [
    { id: "all", label: t("common.explore") },
    ...placeFilters
      .filter((filter) => ["openNow", "rating", "hasOffer"].includes(filter.id))
      .map((filter) => ({
        id: filter.id,
        label: filter.id === "rating" ? filterLabels.rating[locale] : filterLabels[filter.id as keyof typeof filterLabels][locale]
      }))
  ], [filterLabels, locale, t]);

  const categoryFilters = useMemo<FilterOption[]>(() => [
    { id: "all", label: t("common.explore") },
    ...[
      ...placeCategoryOptions.map((category) => ({
        id: category.id,
        title: category.title
      })),
      ...customCategories.filter((category) => !placeCategoryOptions.some((item) => item.id === category.id))
    ].map((category) => ({
      id: category.id,
      label: localizeText(category.title, locale)
    }))
  ], [customCategories, locale, t]);

  const filteredItems = useMemo(() => {
    const offerPlaceIds = new Set(featuredOffers.map((offer) => offer.placeId));

    const nextItems = items.filter((place) => {
      const customCategoryTitle = customCategories.find((category) => category.id === place.categoryId)?.title;
      const defaultCategoryTitle = placeCategoryOptions.find((category) => category.id === getPlaceCategoryId(place))?.title;
      const searchHaystack = [
        localizeText(place.title, locale),
        place.title.en,
        place.title.ru,
        place.title.de,
        localizeText(place.description, locale),
        place.description.en,
        place.description.ru,
        place.description.de,
        place.district,
        place.address,
        place.categoryId,
        localizeText(customCategoryTitle, locale),
        localizeText(defaultCategoryTitle, locale),
        ...place.features
      ].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");

      if (searchText.trim().length > 0) {
        const query = searchText.trim().toLocaleLowerCase("tr-TR");
        if (!searchHaystack.includes(query)) return false;
      }

      if (activeCategory !== "all" && place.categoryId !== activeCategory && getPlaceCategoryId(place) !== activeCategory) {
        return false;
      }

      switch (activeFilter) {
        case "openNow":
          return place.openNow === true;
        case "rating":
          return (place.googleRating ?? 0) >= 4.5;
        case "hasOffer":
          return offerPlaceIds.has(place.id);
        default:
          return true;
      }
    });

    return [...nextItems].sort((first, second) => localizeText(first.title, locale).localeCompare(localizeText(second.title, locale), locale === "tr" ? "tr-TR" : undefined));
  }, [activeCategory, activeFilter, customCategories, items, searchText]);

  useEffect(() => {
    if (!searchText.trim()) return;
    const timer = window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 420);
    return () => window.clearTimeout(timer);
  }, [filteredItems.length, searchText]);

  return (
    <>
      <div className="section-center-column section-center-column-wide">
        <SectionEyebrow icon={MapPinned}>{t("places.eyebrow")}</SectionEyebrow>
        <h1>{t("places.title")}</h1>
        <p className="lead">{t("places.lead")}</p>
      </div>
      <label className="search-row search-row-spacious" aria-label="Mekan arama">
        <Search size={17} />
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </label>
      <FilterPills activeId={activeCategory} ariaLabel="Mekan kategorileri" onChange={setActiveCategory} options={categoryFilters} />
      <FilterPills activeId={activeFilter} ariaLabel="Mekan filtreleri" onChange={setActiveFilter} options={filters} />
      <div ref={resultsRef}>
        <DiscoveryList items={filteredItems} type="places" />
      </div>
    </>
  );
}
