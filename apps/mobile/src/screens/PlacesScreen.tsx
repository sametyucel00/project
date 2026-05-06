import { FlatList, Text, View } from "react-native";
import { getPlaceCategoryId, placeCategoryOptions } from "@nar/core";
import { FilterRow, SearchBar, WideItem } from "../components/ui";
import { getMobileLocale } from "../locale";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { InteractionManager } from "react-native";
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
  const [visibleCount, setVisibleCount] = useState(12);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setActiveCategory(c.all);
    setActiveFilter(c.all);
  }, [c.all]);

  const categoryTitleById = useMemo(() => {
    const titles = new Map<string, string>();
    for (const category of placeCategoryOptions) {
      titles.set(category.id, pickText(category.title, locale));
    }
    return titles;
  }, [locale]);

  const availableCategoryIds = useMemo(() => new Set(feed.places.map((place) => getPlaceCategoryId(place))), [feed.places]);
  const offerPlaceIds = useMemo(() => new Set(feed.offers.map((offer) => offer.placeId)), [feed.offers]);
  const categoryTitleByPlaceId = useMemo(() => {
    const titles = new Map<string, string>();
    for (const place of feed.places) {
      const categoryId = getPlaceCategoryId(place);
      titles.set(place.id, categoryTitleById.get(categoryId) ?? c.place);
    }
    return titles;
  }, [c.place, categoryTitleById, feed.places]);

  const categories = useMemo(() => [
    c.all,
    ...placeCategoryOptions
      .filter((category) => availableCategoryIds.has(category.id))
      .map((category) => categoryTitleById.get(category.id) ?? c.place)
  ], [availableCategoryIds, c.all, c.place, categoryTitleById]);

  const filteredPlaces = useMemo(() => feed.places.filter((place) => {
    const categoryTitle = categoryTitleByPlaceId.get(place.id) ?? c.place;
    const haystack = normalize([pickText(place.title, locale), pickText(place.description, locale), place.district, categoryTitle, place.address].join(" "));
    if (deferredQuery.trim() && !haystack.includes(normalize(deferredQuery))) return false;
    if (activeCategory !== c.all && categoryTitle !== activeCategory) return false;
    if (activeFilter === c.open && !place.openNow) return false;
    if (activeFilter === c.popular && (place.googleReviewCount ?? 0) < 100) return false;
    if (activeFilter === c.offers && !offerPlaceIds.has(place.id)) return false;
    return true;
  }), [activeCategory, activeFilter, c.all, c.offers, c.open, c.popular, categoryTitleByPlaceId, deferredQuery, feed.places, offerPlaceIds, locale]);
  const visiblePlaces = useMemo(() => filteredPlaces.slice(0, visibleCount), [filteredPlaces, visibleCount]);

  useEffect(() => {
    setVisibleCount(Math.min(12, filteredPlaces.length));
    const task = InteractionManager.runAfterInteractions(() => {
      const timer = setTimeout(() => setVisibleCount(filteredPlaces.length), 4500);
      return { cancel: () => clearTimeout(timer) };
    });
    return () => {
      task.cancel();
    };
  }, [filteredPlaces.length]);

  return (
    <FlatList
      data={visiblePlaces}
      keyExtractor={(place) => place.id}
      renderItem={({ item: place }) => {
        const category = categoryTitleByPlaceId.get(place.id) || c.place;
        return (
          <WideItem
            image={place.coverImage}
            title={pickText(place.title, locale)}
            meta={`${category} · ${place.district} · ${place.openNow ? c.openNow : c.hoursMissing} · ${resolveDistanceLabel(userLocation, place)}`}
            onPress={() => onOpenPlace?.(place.id)}
          />
        );
      }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={(
        <View style={{ paddingHorizontal: 18 }}>
          <SearchBar value={query} onChangeText={setQuery} />
          <FilterRow filters={categories} activeFilter={activeCategory} onSelect={setActiveCategory} />
          <FilterRow filters={primaryFilters} activeFilter={activeFilter} onSelect={setActiveFilter} />
      <Text style={styles.sectionTitle}>{`${c.places} (${filteredPlaces.length})`}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>{c.notFound}</Text>}
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 18 }}
      showsVerticalScrollIndicator={false}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
    />
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
