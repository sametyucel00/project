import { FlatList, Text, View } from "react-native";
import { getPlaceCategoryId, placeCategoryOptions } from "@nar/core";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { FilterRow, SearchBar, WideItem } from "../components/ui";
import { getMobileLocale } from "../locale";
import { perfCount, perfFlag, perfMark, perfMeasure } from "../services/perf";
import { styles } from "../styles";
import { resolveDistanceLabel } from "../utils/location";
import type { MobileScreenProps } from "./types";

const placeCopy = {
  tr: { all: "Tümü", open: "Açık", popular: "Popüler", offers: "Fırsatlı", places: "Mekanlar", place: "Mekan", notFound: "Aramana uygun mekan bulunamadı.", openNow: "Açık", hoursMissing: "Saat belirtilmemiş" },
  en: { all: "All", open: "Open", popular: "Popular", offers: "With offers", places: "Places", place: "Place", notFound: "No places match your search.", openNow: "Open", hoursMissing: "Hours not specified" },
  ru: { all: "Все", open: "Открыто", popular: "Популярные", offers: "С предложениями", places: "Места", place: "Место", notFound: "Места по запросу не найдены.", openNow: "Открыто", hoursMissing: "Часы не указаны" },
  de: { all: "Alle", open: "Offen", popular: "Beliebt", offers: "Mit Angeboten", places: "Orte", place: "Ort", notFound: "Keine passenden Orte gefunden.", openNow: "Offen", hoursMissing: "Öffnungszeiten fehlen" }
} as const;

export function PlacesScreen({ feed, userLocation, onOpenPlace }: MobileScreenProps) {
  const locale = getMobileLocale();
  const c = placeCopy[locale] ?? placeCopy.tr;
  const disableDistance = perfFlag("nodistance");
  const disableImage = perfFlag("noimage");
  const disableHeavyCompute = perfFlag("nocompute");
  const primaryFilters = [c.all, c.open, c.popular, c.offers];
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(c.all);
  const [activeFilter, setActiveFilter] = useState<string>(c.all);
  const [visibleCount, setVisibleCount] = useState(12);
  const deferredQuery = useDeferredValue(query);
  const firstListPaintLogged = useRef(false);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 20 });

  perfCount("places:render", { places: feed.places.length, visibleCount });

  useEffect(() => {
    setActiveCategory(c.all);
    setActiveFilter(c.all);
  }, [c.all]);

  useEffect(() => {
    perfMark("places:screenMount");
    perfMeasure("places:navigationToMount", "nav:Mekanlar:press", { places: feed.places.length });
    const frame = requestAnimationFrame(() => {
      perfMark("places:firstPaint");
      perfMeasure("places:mountToFirstPaint", "places:screenMount");
      perfMeasure("places:navigationToFirstPaint", "nav:Mekanlar:press");
    });
    return () => cancelAnimationFrame(frame);
  }, [feed.places.length]);

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

  const categories = useMemo(
    () => [
      c.all,
      ...placeCategoryOptions
        .filter((category) => availableCategoryIds.has(category.id))
        .map((category) => categoryTitleById.get(category.id) ?? c.place)
    ],
    [availableCategoryIds, c.all, c.place, categoryTitleById]
  );

  const filteredPlaces = useMemo(() => {
    perfMark("places:heavyCompute:start", {
      feedPlaces: feed.places.length,
      query: deferredQuery.length,
      mode: disableHeavyCompute ? "bypass" : "full"
    });

    if (disableHeavyCompute) {
      const quick = feed.places.slice(0, 12);
      perfMeasure("places:heavyCompute:end", "places:heavyCompute:start", { result: quick.length });
      return quick;
    }

    const next = feed.places.filter((place) => {
      const categoryTitle = categoryTitleByPlaceId.get(place.id) ?? c.place;
      const haystack = normalize([pickText(place.title, locale), pickText(place.description, locale), place.district, categoryTitle, place.address].join(" "));
      if (deferredQuery.trim() && !haystack.includes(normalize(deferredQuery))) return false;
      if (activeCategory !== c.all && categoryTitle !== activeCategory) return false;
      if (activeFilter === c.open && !place.openNow) return false;
      if (activeFilter === c.popular && (place.googleReviewCount ?? 0) < 100) return false;
      if (activeFilter === c.offers && !offerPlaceIds.has(place.id)) return false;
      return true;
    });

    perfMeasure("places:heavyCompute:end", "places:heavyCompute:start", { result: next.length });
    return next;
  }, [activeCategory, activeFilter, c.all, c.offers, c.open, c.place, c.popular, categoryTitleByPlaceId, deferredQuery, disableHeavyCompute, feed.places, offerPlaceIds, locale]);

  const visiblePlaces = useMemo(() => filteredPlaces.slice(0, visibleCount), [filteredPlaces, visibleCount]);
  const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<unknown> }) => {
    if (firstListPaintLogged.current || !viewableItems.length) return;
    firstListPaintLogged.current = true;
    perfMark("places:firstListPaint");
    perfMeasure("places:mountToFirstListPaint", "places:screenMount", { items: viewableItems.length });
    perfMeasure("places:navigationToFirstListPaint", "nav:Mekanlar:press", { items: viewableItems.length });
  }, []);

  useEffect(() => {
    if (!filteredPlaces.length) return;
    setVisibleCount((current) => {
      const seed = current > 0 ? current : 12;
      return Math.min(seed, filteredPlaces.length);
    });
  }, [filteredPlaces.length]);

  const sectionTitle = feed.loading && filteredPlaces.length === 0 ? c.places : `${c.places} (${filteredPlaces.length})`;

  return (
    <FlatList
      data={visiblePlaces}
      keyExtractor={(place) => place.id}
      viewabilityConfig={viewabilityConfigRef.current}
      onViewableItemsChanged={handleViewableItemsChanged}
      renderItem={({ item: place }) => {
        const category = categoryTitleByPlaceId.get(place.id) ?? c.place;
        const distance = disableDistance ? null : resolveDistanceLabel(userLocation, place);
        const meta = `${category} · ${place.district} · ${place.openNow ? c.openNow : c.hoursMissing}${distance ? ` · ${distance}` : ""}`;
        return (
          <WideItem
            image={place.coverImage}
            disableImage={disableImage}
            title={pickText(place.title, locale)}
            meta={meta}
            onPress={() => onOpenPlace?.(place.id)}
          />
        );
      }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 18 }}>
          <SearchBar value={query} onChangeText={setQuery} />
          <FilterRow filters={categories} activeFilter={activeCategory} onSelect={setActiveCategory} />
          <FilterRow filters={primaryFilters} activeFilter={activeFilter} onSelect={setActiveFilter} />
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.emptyText}>{feed.loading ? "Mekanlar hazırlanıyor..." : c.notFound}</Text>}
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 18 }}
      showsVerticalScrollIndicator={false}
      onEndReached={() => setVisibleCount((current) => Math.min(filteredPlaces.length, current + 24))}
      onEndReachedThreshold={0.35}
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
