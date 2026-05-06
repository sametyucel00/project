import { ImageBackground, FlatList, Pressable, Text, View } from "react-native";
import { createStaticMapUrl, eventTypes, eventViewModes, type EventViewMode } from "@nar/core";
import { FilterRow, SearchBar, WideItem } from "../components/ui";
import { getMobileLocale } from "../locale";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { resolveDistanceLabel } from "../utils/location";

const eventCopy = {
  tr: { all: "TÃ¼mÃ¼", today: "BugÃ¼n", week: "Bu hafta", free: "Ãœcretsiz", soon: "YakÄ±nda", events: "Etkinlikler", monthly: "AylÄ±k etkinlikler", weekly: "HaftalÄ±k etkinlikler", mapList: "Harita listesi", noMatch: "SeÃ§tiÄŸin filtreye uygun etkinlik bulunamadÄ±.", mapView: "Harita gÃ¶rÃ¼nÃ¼mÃ¼", noMap: "Bu etkinlik iÃ§in harita bilgisi yok.", workshop: "AtÃ¶lye" },
  en: { all: "All", today: "Today", week: "This week", free: "Free", soon: "Upcoming", events: "Events", monthly: "Monthly events", weekly: "Weekly events", mapList: "Map list", noMatch: "No events match your filters.", mapView: "Map view", noMap: "No map data for this event.", workshop: "Workshop" },
  ru: { all: "Ğ’ÑĞµ", today: "Ğ¡ĞµĞ³Ğ¾Ğ´Ğ½Ñ", week: "ĞĞ° Ğ½ĞµĞ´ĞµĞ»Ğµ", free: "Ğ‘ĞµÑĞ¿Ğ»Ğ°Ñ‚Ğ½Ğ¾", soon: "Ğ¡ĞºĞ¾Ñ€Ğ¾", events: "Ğ¡Ğ¾Ğ±Ñ‹Ñ‚Ğ¸Ñ", monthly: "Ğ¡Ğ¾Ğ±Ñ‹Ñ‚Ğ¸Ñ Ğ¼ĞµÑÑÑ†Ğ°", weekly: "Ğ¡Ğ¾Ğ±Ñ‹Ñ‚Ğ¸Ñ Ğ½ĞµĞ´ĞµĞ»Ğ¸", mapList: "Ğ¡Ğ¿Ğ¸ÑĞ¾Ğº ĞºĞ°Ñ€Ñ‚Ñ‹", noMatch: "Ğ¡Ğ¾Ğ±Ñ‹Ñ‚Ğ¸Ñ Ğ¿Ğ¾ Ñ„Ğ¸Ğ»ÑŒÑ‚Ñ€Ñƒ Ğ½Ğµ Ğ½Ğ°Ğ¹Ğ´ĞµĞ½Ñ‹.", mapView: "ĞšĞ°Ñ€Ñ‚Ğ°", noMap: "Ğ”Ğ»Ñ ÑÑ‚Ğ¾Ğ³Ğ¾ ÑĞ¾Ğ±Ñ‹Ñ‚Ğ¸Ñ Ğ½ĞµÑ‚ Ğ´Ğ°Ğ½Ğ½Ñ‹Ñ… ĞºĞ°Ñ€Ñ‚Ñ‹.", workshop: "ĞœĞ°ÑÑ‚ĞµÑ€-ĞºĞ»Ğ°ÑÑ" },
  de: { all: "Alle", today: "Heute", week: "Diese Woche", free: "Kostenlos", soon: "Bald", events: "Veranstaltungen", monthly: "Monatliche Veranstaltungen", weekly: "WÃ¶chentliche Veranstaltungen", mapList: "Kartenliste", noMatch: "Keine passenden Veranstaltungen gefunden.", mapView: "Kartenansicht", noMap: "FÃ¼r diese Veranstaltung gibt es keine Kartendaten.", workshop: "Workshop" }
} as const;

export function EventsScreen({ feed, userLocation, onOpenEvent }: MobileScreenProps) {
  const locale = getMobileLocale();
  const c = eventCopy[locale] ?? eventCopy.tr;
  const quickFilters = [c.all, c.today, c.week, c.free, c.soon];
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<string>(c.all);
  const [activeFilter, setActiveFilter] = useState<string>(c.all);
  const [viewMode, setViewMode] = useState<EventViewMode>("list");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setActiveType(c.all);
    setActiveFilter(c.all);
  }, [c.all]);

  const eventTypeLabels = useMemo(() => {
    const labels = new Map<string, string>();
    for (const type of eventTypes) {
      labels.set(type.id, normalizeTypeLabel(pickText(type.title, locale), c.workshop));
    }
    return labels;
  }, [c.workshop, locale]);

  const eventTypeIds = useMemo(() => new Set(feed.events.map((event) => event.type)), [feed.events]);

  const typeFilters = useMemo(() => [
    c.all,
    ...eventTypes
      .filter((type) => eventTypeIds.has(type.id))
      .map((type) => eventTypeLabels.get(type.id) ?? c.workshop)
  ], [c.all, c.workshop, eventTypeIds, eventTypeLabels]);

  const todayStartTime = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return todayStart.getTime();
  }, []);

  const filteredEvents = useMemo(() => feed.events
    .filter((event) => {
      const typeLabel = eventTypeLabels.get(event.type) ?? c.workshop;
      const haystack = normalize([pickText(event.title, locale), pickText(event.description, locale), event.venueName, event.district, typeLabel].join(" "));
      if (deferredQuery.trim() && !haystack.includes(normalize(deferredQuery))) return false;
      if (activeType !== c.all && typeLabel !== activeType) return false;
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
    }), [activeFilter, activeType, c.all, c.free, c.soon, c.today, c.week, c.workshop, deferredQuery, eventTypeLabels, feed.events, todayStartTime, viewMode]);

  const venueIndex = useMemo(() => buildVenueIndex(feed.places, locale), [feed.places, locale]);
  const sectionTitle = viewMode === "month" ? c.monthly : viewMode === "week" ? c.weekly : viewMode === "map" ? c.mapList : c.events;

  const listHeader = useMemo(() => (
    <View>
      <SearchBar value={query} onChangeText={setQuery} />
      <FilterRow filters={typeFilters} activeFilter={activeType} onSelect={setActiveType} />
      <FilterRow filters={quickFilters} activeFilter={activeFilter} onSelect={setActiveFilter} />
      <View style={styles.calendarBand}>
        {eventViewModes.map((mode) => (
          <Pressable key={mode.id} accessibilityRole="button" onPress={() => setViewMode(mode.id)} style={[styles.calendarChipButton, viewMode === mode.id && styles.calendarChipButtonActive]}>
            <Text style={[styles.calendarChip, viewMode === mode.id && styles.calendarChipActive]}>{translateViewMode(mode.id, locale)}</Text>
          </Pressable>
        ))}
      </View>
      {viewMode === "map" && filteredEvents[0] ? (
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{c.mapView}</Text>
          <Text style={styles.profileText}>{filteredEvents[0].venueName}</Text>
          {resolveEventVenue(venueIndex, filteredEvents[0].venueName, filteredEvents[0].district)?.location ? (
            <ImageBackground
              source={{ uri: createStaticMapUrl(resolveEventVenue(venueIndex, filteredEvents[0].venueName, filteredEvents[0].district)!.location!, process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) }}
              style={{ height: 170, borderRadius: 18, overflow: "hidden" }}
              imageStyle={{ borderRadius: 18 }}
            />
          ) : (
            <Text style={styles.emptyText}>{c.noMap}</Text>
          )}
        </View>
      ) : null}
      <Text style={styles.sectionTitle}>{`${sectionTitle} (${filteredEvents.length})`}</Text>
    </View>
  ), [activeFilter, activeType, c.mapView, c.noMap, filteredEvents, locale, query, sectionTitle, typeFilters, viewMode, quickFilters, venueIndex]);

  return (
    <FlatList
      data={filteredEvents}
      keyExtractor={(event) => event.id}
      renderItem={({ item }) => {
        const venuePlace = resolveEventVenue(venueIndex, item.venueName, item.district);
        const distance = resolveDistanceLabel(userLocation, venuePlace ?? item);
        return <WideItem image={item.coverImage} title={pickText(item.title, locale)} meta={`${formatDate(item.startsAt, locale)} · ${item.venueName} · ${distance}`} onPress={() => onOpenEvent?.(item.id)} />;
      }}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={<Text style={styles.emptyText}>{c.noMatch}</Text>}
      contentContainerStyle={{ paddingBottom: 120 }}
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
    const keys = [
      pickText(place.title, locale),
      place.title.tr,
      place.title.en,
      place.address,
      place.district
    ];
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
    tr: { month: "AylÄ±k", week: "HaftalÄ±k", list: "Liste", map: "Harita" },
    en: { month: "Month", week: "Week", list: "List", map: "Map" },
    ru: { month: "ĞœĞµÑÑÑ†", week: "ĞĞµĞ´ĞµĞ»Ñ", list: "Ğ¡Ğ¿Ğ¸ÑĞ¾Ğº", map: "ĞšĞ°Ñ€Ñ‚Ğ°" },
    de: { month: "Monat", week: "Woche", list: "Liste", map: "Karte" }
  } as const;
  return (labels[locale as keyof typeof labels] ?? labels.tr)[mode];
}
