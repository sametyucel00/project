import { ImageBackground, Pressable, Text, View } from "react-native";
import { createStaticMapUrl, eventTypes, eventViewModes, getEventTypeMeta, type EventViewMode } from "@nar/core";
import { FilterRow, SearchBar, Section, WideItem } from "../components/ui";
import { getMobileLocale } from "../locale";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { useEffect, useMemo, useState } from "react";
import { resolveDistanceLabel } from "../utils/location";

const eventCopy = {
  tr: { all: "Tümü", today: "Bugün", week: "Bu hafta", free: "Ücretsiz", soon: "Yakında", events: "Etkinlikler", monthly: "Aylık etkinlikler", weekly: "Haftalık etkinlikler", mapList: "Harita listesi", noMatch: "Seçtiğin filtreye uygun etkinlik bulunamadı.", mapView: "Harita görünümü", noMap: "Bu etkinlik için harita bilgisi yok.", workshop: "Atölye" },
  en: { all: "All", today: "Today", week: "This week", free: "Free", soon: "Upcoming", events: "Events", monthly: "Monthly events", weekly: "Weekly events", mapList: "Map list", noMatch: "No events match your filters.", mapView: "Map view", noMap: "No map data for this event.", workshop: "Workshop" },
  ru: { all: "Все", today: "Сегодня", week: "На неделе", free: "Бесплатно", soon: "Скоро", events: "События", monthly: "События месяца", weekly: "События недели", mapList: "Список карты", noMatch: "События по фильтру не найдены.", mapView: "Карта", noMap: "Для этого события нет данных карты.", workshop: "Мастер-класс" },
  de: { all: "Alle", today: "Heute", week: "Diese Woche", free: "Kostenlos", soon: "Bald", events: "Veranstaltungen", monthly: "Monatliche Veranstaltungen", weekly: "Wöchentliche Veranstaltungen", mapList: "Kartenliste", noMatch: "Keine passenden Veranstaltungen gefunden.", mapView: "Kartenansicht", noMap: "Für diese Veranstaltung gibt es keine Kartendaten.", workshop: "Workshop" }
} as const;

export function EventsScreen({ feed, userLocation, onOpenEvent }: MobileScreenProps) {
  const locale = getMobileLocale();
  const c = eventCopy[locale] ?? eventCopy.tr;
  const quickFilters = [c.all, c.today, c.week, c.free, c.soon];
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<string>(c.all);
  const [activeFilter, setActiveFilter] = useState<string>(c.all);
  const [viewMode, setViewMode] = useState<EventViewMode>("list");
  const [renderLimit, setRenderLimit] = useState(35);

  useEffect(() => {
    setActiveType(c.all);
    setActiveFilter(c.all);
  }, [c.all]);

  useEffect(() => {
    setRenderLimit(35);
  }, [activeFilter, activeType, query, viewMode]);

  const typeFilters = useMemo(() => [
    c.all,
    ...eventTypes
      .filter((type) => feed.events.some((event) => getEventTypeMeta(event).id === type.id))
      .map((type) => normalizeTypeLabel(pickText(type.title, locale), c.workshop))
  ], [c.all, c.workshop, feed.events, locale]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const filteredEvents = useMemo(() => feed.events
    .filter((event) => {
      const typeLabel = normalizeTypeLabel(pickText(getEventTypeMeta(event).title, locale), c.workshop);
      const haystack = normalize([pickText(event.title, locale), pickText(event.description, locale), event.venueName, event.district, typeLabel].join(" "));
      if (query.trim() && !haystack.includes(normalize(query))) return false;
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
      const firstUpcoming = firstTime >= todayStart.getTime();
      const secondUpcoming = secondTime >= todayStart.getTime();
      if (firstUpcoming !== secondUpcoming) return firstUpcoming ? -1 : 1;
      return firstUpcoming ? firstTime - secondTime : secondTime - firstTime;
    }), [activeFilter, activeType, c.all, c.free, c.soon, c.today, c.week, c.workshop, feed.events, locale, query, todayStart, viewMode]);

  const visibleEvents = useMemo(() => filteredEvents.map((event) => {
    const venuePlace = resolveEventVenue(feed.places, event.venueName, event.district, locale);
    return {
      event,
      distance: resolveDistanceLabel(userLocation, venuePlace ?? event)
    };
  }), [feed.places, filteredEvents, locale, userLocation]);

  const sectionTitle = viewMode === "month" ? c.monthly : viewMode === "week" ? c.weekly : viewMode === "map" ? c.mapList : c.events;

  return (
    <>
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
          {resolveEventVenue(feed.places, filteredEvents[0].venueName, filteredEvents[0].district, locale)?.location ? (
            <ImageBackground
              source={{ uri: createStaticMapUrl(resolveEventVenue(feed.places, filteredEvents[0].venueName, filteredEvents[0].district, locale)?.location, process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) }}
              style={{ height: 170, borderRadius: 18, overflow: "hidden" }}
              imageStyle={{ borderRadius: 18 }}
            />
          ) : (
            <Text style={styles.emptyText}>{c.noMap}</Text>
          )}
        </View>
      ) : null}
      <Section title={`${sectionTitle} (${filteredEvents.length})`}>
        {visibleEvents.length ? visibleEvents.slice(0, renderLimit).map(({ event, distance }) => (
          <WideItem key={event.id} image={event.coverImage} title={pickText(event.title, locale)} meta={`${formatDate(event.startsAt, locale)} · ${event.venueName} · ${distance}`} onPress={() => onOpenEvent?.(event.id)} />
        )) : <Text style={styles.emptyText}>{c.noMatch}</Text>}
        {visibleEvents.length > renderLimit ? (
          <Pressable accessibilityRole="button" onPress={() => setRenderLimit((current) => current + 35)} style={[styles.actionPill, styles.actionPillSecondary]}>
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

function resolveEventVenue(places: Array<{ title: Record<string, string>; district: string; address: string; location?: { lat: number; lng: number } }>, venueName: string, district: string, locale: string) {
  const normalizedVenue = normalize(venueName);
  const normalizedDistrict = normalize(district);
  return places.find((place) => {
    const titles = [pickText(place.title, locale), place.title.tr, place.title.en, place.address].map(normalize);
    return titles.some((title) => title === normalizedVenue || title.includes(normalizedVenue) || normalizedVenue.includes(title));
  }) ?? places.find((place) => normalize(place.district) === normalizedDistrict);
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
