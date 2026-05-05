import { Pressable, Text } from "react-native";
import { getPlaceCategoryId, placeCategoryOptions } from "@nar/core";
import { FilterRow, SearchBar, Section, WideItem } from "../components/ui";
import { getMobileLocale } from "../locale";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { useEffect, useMemo, useState } from "react";
import { resolveDistanceLabel } from "../utils/location";

const placeCopy = {
  tr: { all: "Tümü", open: "Açık", popular: "Popüler", offers: "Fırsatlı", places: "Mekanlar", place: "Mekan", notFound: "Aramana uygun mekan bulunamadı.", openNow: "Açık", hoursMissing: "Saat belirtilmemiş" },
  en: { all: "All", open: "Open", popular: "Popular", offers: "With offers", places: "Places", place: "Place", notFound: "No places match your search.", openNow: "Open", hoursMissing: "Hours not specified" },
  ru: { all: "Все", open: "Открыто", popular: "Популярные", offers: "С предложениями", places: "Места", place: "Место", notFound: "Места по запросу не найдены.", openNow: "Открыто", hoursMissing: "Часы не указаны" },
  de: { all: "Alle", open: "Offen", popular: "Beliebt", offers: "Mit Angeboten", places: "Orte", place: "Ort", notFound: "Keine passenden Orte gefunden.", openNow: "Offen", hoursMissing: "Öffnungszeiten fehlen" }
} as const;

export function PlacesScreen({ feed, userLocation, onOpenPlace }: MobileScreenProps) {
  const locale = getMobileLocale();
  const c = placeCopy[locale] ?? placeCopy.tr;
  const primaryFilters = [c.all, c.open, c.popular, c.offers];
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(c.all);
  const [activeFilter, setActiveFilter] = useState<string>(c.all);
  const [renderLimit, setRenderLimit] = useState(40);

  useEffect(() => {
    setActiveCategory(c.all);
    setActiveFilter(c.all);
  }, [c.all]);

  useEffect(() => {
    setRenderLimit(40);
  }, [activeCategory, activeFilter, query]);

  const categories = useMemo(() => [
    c.all,
    ...placeCategoryOptions
      .filter((category) => feed.places.some((place) => getPlaceCategoryId(place) === category.id))
      .map((category) => pickText(category.title, locale))
  ], [c.all, feed.places, locale]);

  const filteredPlaces = useMemo(() => feed.places.filter((place) => {
    const category = placeCategoryOptions.find((item) => item.id === getPlaceCategoryId(place));
    const categoryTitle = pickText(category?.title, locale);
    const haystack = normalize([pickText(place.title, locale), pickText(place.description, locale), place.district, categoryTitle, place.address].join(" "));
    if (query.trim() && !haystack.includes(normalize(query))) return false;
    if (activeCategory !== c.all && categoryTitle !== activeCategory) return false;
    if (activeFilter === c.open && !place.openNow) return false;
    if (activeFilter === c.popular && (place.googleReviewCount ?? 0) < 100) return false;
    if (activeFilter === c.offers && !feed.offers.some((offer) => offer.placeId === place.id)) return false;
    return true;
  }), [activeCategory, activeFilter, c.all, c.offers, c.open, c.popular, feed.offers, feed.places, locale, query]);

  return (
    <>
      <SearchBar value={query} onChangeText={setQuery} />
      <FilterRow filters={categories} activeFilter={activeCategory} onSelect={setActiveCategory} />
      <FilterRow filters={primaryFilters} activeFilter={activeFilter} onSelect={setActiveFilter} />
      <Section title={`${c.places} (${filteredPlaces.length})`}>
        {filteredPlaces.length ? filteredPlaces.slice(0, renderLimit).map((place) => {
          const category = pickText(placeCategoryOptions.find((item) => item.id === getPlaceCategoryId(place))?.title, locale) || c.place;
          return (
            <WideItem
              key={place.id}
              image={place.coverImage}
              title={pickText(place.title, locale)}
              meta={`${category} · ${place.district} · ${place.openNow ? c.openNow : c.hoursMissing} · ${resolveDistanceLabel(userLocation, place)}`}
              onPress={() => onOpenPlace?.(place.id)}
            />
          );
        }) : <Text style={styles.emptyText}>{c.notFound}</Text>}
        {filteredPlaces.length > renderLimit ? (
          <Pressable accessibilityRole="button" onPress={() => setRenderLimit((current) => current + 40)} style={[styles.actionPill, styles.actionPillSecondary]}>
            <Text style={styles.actionPillTextSecondary}>Daha fazla göster</Text>
          </Pressable>
        ) : null}
      </Section>
    </>
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function pickText(value: unknown, locale: string) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const record = value as Record<string, string | undefined>;
  return record[locale] ?? record.tr ?? record.en ?? "";
}
