import { FlatList, InteractionManager, Pressable, Text, View } from "react-native";
import { eventTypes, eventViewModes, getEventTypeId, type EventViewMode } from "@nar/core";
import { FilterRow, SearchBar, WideItem } from "../components/ui";
import { getMobileLocale } from "../locale";
import { fetchDiscoveryCategories } from "../services/discovery";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { resolveDistanceLabel } from "../utils/location";
import { perfMark, perfMeasure } from "../services/perf";

const eventCopy = {
  tr: {
    all: "Tümü",
    today: "Bugün",
    week: "Bu hafta",
    free: "Ücretsiz",
    soon: "Yakında",
    events: "Etkinlikler",
    monthly: "Aylık etkinlikler",
    weekly: "Haftalık etkinlikler",
    mapList: "Harita listesi",
    noMatch: "Seçtiğin filtreye uygun etkinlik bulunamadı.",
    mapView: "Harita görünümü",
    noMap: "Bu etkinlik için harita bilgisi yok.",
    workshop: "Atölye"
  },
  en: {
    all: "All",
    today: "Today",
    week: "This week",
    free: "Free",
    soon: "Upcoming",
    events: "Events",
    monthly: "Monthly events",
    weekly: "Weekly events",
    mapList: "Map list",
    noMatch: "No events match your filters.",
    mapView: "Map view",
    noMap: "No map data for this event.",
    workshop: "Workshop"
  },
  ru: {
    all: "Все",
    today: "Сегодня",
    week: "На этой неделе",
    free: "Бесплатно",
    soon: "Скоро",
    events: "События",
    monthly: "События за месяц",
    weekly: "События за неделю",
    mapList: "Список карты",
    noMatch: "По выбранным фильтрам событий не найдено.",
    mapView: "Вид карты",
    noMap: "Для этого события нет данных карты.",
    workshop: "Мастер-класс"
  },
  de: {
    all: "Alle",
    today: "Heute",
    week: "Diese Woche",
    free: "Kostenlos",
    soon: "Bald",
    events: "Veranstaltungen",
    monthly: "Monatliche Veranstaltungen",
    weekly: "Wöchentliche Veranstaltungen",
    mapList: "Kartenliste",
    noMatch: "Keine passenden Veranstaltungen gefunden.",
    mapView: "Kartenansicht",
    noMap: "Für diese Veranstaltung gibt es keine Kartendaten.",
    workshop: "Workshop"
  }
} as const;

type EventItemWithCategory = { categoryId?: string };

export function EventsScreen({ feed, userLocation, onOpenEvent }: MobileScreenProps) {
  const locale = getMobileLocale();
  const c = eventCopy[locale] ?? eventCopy.tr;
  const quickFilters = [c.all, c.today, c.week, c.free, c.soon];
  const [query, setQuery] = useState("");
  const [discoveryCategories, setDiscoveryCategories] = useState<Array<{ id: string; title: { tr: string; en?: string; ru?: string; de?: string } }>>([]);
  const [activeType, setActiveType] = useState<string>(c.all);
  const [activeFilter, setActiveFilter] = useState<string>(c.all);
  const [viewMode, setViewMode] = useState<EventViewMode>("list");
  const [visibleCount, setVisibleCount] = useState(12);
  const deferredQuery = useDeferredValue(query);
  const firstListPaintedRef = useRef(false);

  useEffect(() => {
    perfMark("events:screenMount");
    perfMeasure("events:navigationToMount", "nav:Etkinlikler:press", { events: feed.events.length });
    queueMicrotask(() => {
      perfMark("events:firstPaint");
      perfMeasure("events:mountToFirstPaint", "events:screenMount");
      perfMeasure("events:navigationToFirstPaint", "nav:Etkinlikler:press");
    });
  }, []);

  useEffect(() => {
    setActiveType(c.all);
    setActiveFilter(c.all);
  }, [c.all]);

  useEffect(() => {
    let active = true;
    const task = InteractionManager.runAfterInteractions(() => {
      void fetchDiscoveryCategories()
        .then((categories) => {
          if (!active) return;
          const next = categories
            .filter((category) => category.target === "event" && (category.status ?? "published") === "published")
            .map((category) => ({ id: category.id, title: category.title }));
          setDiscoveryCategories(next);
        })
        .catch(() => {
          if (active) setDiscoveryCategories([]);
        });
    });
    return () => {
      active = false;
      task.cancel();
    };
  }, []);

  const eventTypeLabels = useMemo(() => {
    const labels = new Map<string, string>();
    for (const type of eventTypes) {
      labels.set(type.id, normalizeTypeLabel(pickText(type.title, locale), c.workshop));
    }
    return labels;
  }, [c.workshop, locale]);

  const typeFilters = useMemo(
    () => [
      { id: "all", label: c.all },
      ...[
        ...eventTypes.map((type) => ({ id: type.id, title: type.title })),
        ...discoveryCategories.filter((category) => !eventTypes.some((type) => type.id === category.id))
      ]
        .map((type) => ({ id: type.id, label: eventTypeLabels.get(type.id) ?? pickText(type.title, locale) }))
    ],
    [c.all, eventTypeLabels, discoveryCategories, locale]
  );

  const todayStartTime = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return todayStart.getTime();
  }, []);

  const filteredEvents = useMemo(
    () =>
      feed.events
        .filter((event) => {
          const eventCategoryId = (event as EventItemWithCategory).categoryId ?? getEventTypeId(event);
          const customCategoryTitle = discoveryCategories.find((category) => category.id === eventCategoryId)?.title;
          const defaultTypeTitle = eventTypes.find((type) => type.id === getEventTypeId(event))?.title;
          const typeLabel = eventTypeLabels.get(getEventTypeId(event)) ?? c.workshop;
          const haystack = normalize([
            pickText(event.title, locale),
            pickText(event.description, locale),
            pickText(event.synopsis, locale),
            event.venueName,
            event.district,
            event.type,
            typeLabel,
            customCategoryTitle ? pickText(customCategoryTitle, locale) : "",
            defaultTypeTitle ? pickText(defaultTypeTitle, locale) : ""
          ].join(" "));
          if (deferredQuery.trim() && !haystack.includes(normalize(deferredQuery))) return false;
          if (activeType !== c.all && eventCategoryId !== activeType && getEventTypeId(event) !== activeType) return false;
          if (activeFilter === c.today && !isToday(event.startsAt)) return false;
          if (activeFilter === c.week && !isThisWeek(event.startsAt)) return false;
          if (activeFilter === c.free && event.priceType !== "free") return false;
          if (activeFilter === c.soon && new Date(event.startsAt).getTime() < Date.now()) return false;
          if (viewMode === "month" && !isThisMonth(event.startsAt)) return false;
          if (viewMode === "week" && !isThisWeek(event.startsAt)) return false;
          return true;
        })
        .sort((first, second) => {
          const firstTime = new Date(first.startsAt).getTime();
          const secondTime = new Date(second.startsAt).getTime();
          const firstUpcoming = firstTime >= todayStartTime;
          const secondUpcoming = secondTime >= todayStartTime;
          if (firstUpcoming !== secondUpcoming) return firstUpcoming ? -1 : 1;
          return firstUpcoming ? firstTime - secondTime : secondTime - firstTime;
        }),
    [activeFilter, activeType, c.all, c.free, c.soon, c.today, c.week, c.workshop, deferredQuery, discoveryCategories, eventTypeLabels, feed.events, todayStartTime, viewMode, locale]
  );

  const visibleEvents = useMemo(() => filteredEvents.slice(0, visibleCount), [filteredEvents, visibleCount]);
  const venueIndex = useMemo(() => buildVenueIndex(feed.places, locale), [feed.places, locale]);
  const sectionTitle = viewMode === "month" ? c.monthly : viewMode === "week" ? c.weekly : c.events;
  const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: Array<unknown> }) => {
    if (firstListPaintedRef.current || viewableItems.length === 0) return;
    firstListPaintedRef.current = true;
    perfMark("events:firstListPaint");
    perfMeasure("events:mountToFirstListPaint", "events:screenMount", { items: viewableItems.length });
    perfMeasure("events:navigationToFirstListPaint", "nav:Etkinlikler:press", { items: viewableItems.length });
  }, []);

  useEffect(() => {
    if (!filteredEvents.length) return;
    setVisibleCount((current) => {
      const seed = current > 0 ? current : 12;
      return Math.min(seed, filteredEvents.length);
    });
  }, [filteredEvents.length]);

  const sectionTitleLabel = feed.loading && filteredEvents.length === 0 ? sectionTitle : `${sectionTitle} (${filteredEvents.length})`;

  const header = useMemo(() => {
    return (
      <View style={{ paddingHorizontal: 18 }}>
        <SearchBar value={query} onChangeText={setQuery} />
        <FilterRow
          filters={typeFilters.map((filter) => filter.label)}
          activeFilter={typeFilters.find((filter) => filter.id === activeType)?.label ?? c.all}
          onSelect={(label) => {
            const selected = typeFilters.find((filter) => filter.label === label);
            setActiveType(selected?.id ?? "all");
          }}
        />
        <FilterRow filters={quickFilters} activeFilter={activeFilter} onSelect={setActiveFilter} />
        <View style={styles.calendarBand}>
          {eventViewModes.filter((mode) => mode.id !== "map").map((mode) => (
            <Pressable
              key={mode.id}
              accessibilityRole="button"
              onPress={() => setViewMode(mode.id)}
              style={[styles.calendarChipButton, viewMode === mode.id && styles.calendarChipButtonActive]}
            >
              <Text style={[styles.calendarChip, viewMode === mode.id && styles.calendarChipActive]}>
                {translateViewMode(mode.id, locale)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionTitle}>{sectionTitleLabel}</Text>
      </View>
    );
  }, [activeFilter, activeType, filteredEvents, locale, query, quickFilters, sectionTitle, sectionTitleLabel, typeFilters, viewMode]);

  return (
    <FlatList
      data={visibleEvents}
      keyExtractor={(event) => event.id}
      renderItem={({ item }) => {
        const venuePlace = resolveEventVenue(venueIndex, item.venueName, item.district);
        const distance = resolveDistanceLabel(userLocation, venuePlace ?? item);
        return (
          <WideItem
            image={item.coverImage}
            title={pickText(item.title, locale)}
            meta={`${formatDate(item.startsAt, locale)} · ${item.venueName} · ${distance}`}
            onPress={() => onOpenEvent?.(item.id)}
          />
        );
      }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<Text style={[styles.emptyText, { paddingHorizontal: 18 }]}>{feed.loading ? "Etkinlikler hazırlanıyor..." : c.noMatch}</Text>}
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 18 }}
      showsVerticalScrollIndicator={false}
      onEndReached={() => setVisibleCount((current) => Math.min(filteredEvents.length, current + 24))}
      onEndReachedThreshold={0.35}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
      onViewableItemsChanged={handleViewableItemsChanged}
    />
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function formatDate(value: string, locale: string) {
  const intlLocale = locale === "tr" ? "tr-TR" : locale === "de" ? "de-DE" : locale === "ru" ? "ru-RU" : "en-US";
  return new Intl.DateTimeFormat(intlLocale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isThisWeek(value: string) {
  const date = new Date(value).getTime();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return date >= start && date <= start + 7 * 24 * 60 * 60 * 1000;
}

function isThisMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function pickText(value: unknown, locale: string) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const record = value as Record<string, string | undefined>;
  return record[locale] ?? record.tr ?? record.en ?? "";
}

function normalizeTypeLabel(value: string, workshopLabel: string) {
  return value === "Workshop" ? workshopLabel : value;
}

function buildVenueIndex(places: Array<{ title: Record<string, string>; district: string; address: string; location?: { lat: number; lng: number } }>, locale: string) {
  const index = new Map<string, typeof places[number]>();
  for (const place of places) {
    const keys = [pickText(place.title, locale), place.title.tr, place.title.en, place.address, place.district];
    for (const key of keys) {
      const normalized = normalize(key);
      if (normalized && !index.has(normalized)) {
        index.set(normalized, place);
      }
    }
  }
  return index;
}

function resolveEventVenue(index: Map<string, { title: Record<string, string>; district: string; address: string; location?: { lat: number; lng: number } }>, venueName: string, district: string) {
  const normalizedVenue = normalize(venueName);
  const normalizedDistrict = normalize(district);
  return index.get(normalizedVenue) ?? index.get(normalizedDistrict) ?? findLooseVenue(index, normalizedVenue, normalizedDistrict);
}

function findLooseVenue(index: Map<string, { title: Record<string, string>; district: string; address: string; location?: { lat: number; lng: number } }>, normalizedVenue: string, normalizedDistrict: string) {
  for (const [key, place] of index.entries()) {
    if (key === normalizedVenue || key.includes(normalizedVenue) || normalizedVenue.includes(key)) return place;
    if (!normalizedVenue && key === normalizedDistrict) return place;
  }
  return undefined;
}

function translateViewMode(mode: EventViewMode, locale: string) {
  const labels = {
    tr: { month: "Aylık", week: "Haftalık", list: "Liste", map: "Harita" },
    en: { month: "Month", week: "Week", list: "List", map: "Map" },
    ru: { month: "Месяц", week: "Неделя", list: "Список", map: "Карта" },
    de: { month: "Monat", week: "Woche", list: "Liste", map: "Karte" }
  } as const;
  return (labels[locale as keyof typeof labels] ?? labels.tr)[mode];
}
