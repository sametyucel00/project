import { ImageBackground, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { compactValue, createGoogleMapsDirectionsUrl, createStaticMapUrl, getEventTypeMeta, normalizeSynopsisText, translateText } from "@nar/core";
import { ActionPill, ActionRow, DetailHeroCard, DetailLinkRow, StatStrip, SubsectionGrid } from "../components/ui";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { openAddressInMaps, openExternalUrl } from "../utils/links";
import { createTicketOrder, scheduleReminder, toggleFavorite } from "../services";
import { useEffect, useMemo, useState } from "react";
import { getMobileLocale } from "../locale";
import { hasMeaningfulMapPoint, readMapPoint, resolveDistanceLabel } from "../utils/location";
import { perfMark, perfMeasure } from "../services/perf";
import { theme } from "../theme";

type DetailLocale = "tr" | "en" | "ru" | "de";

const eventDetailCopy = {
  tr: {
    back: "Geri",
    notFound: "Seçilen etkinlik bulunamadı.",
    ticketOpen: "Bilet aç",
    ticketLabel: "Bilet bağlantısı",
    eventInfo: "Etkinlik bilgileri",
    dateTime: "Tarih ve saat",
    venue: "Mekan",
    cast: "Kadro",
    synopsis: "Sinopsis",
    ticketPrice: "Bilet",
    distance: "Mesafe",
    validity: "Bilet bağlantısı",
    directions: "Yol tarifi",
    mapTitle: "Harita",
    openMap: "Haritayı aç",
    favorite: "Favori",
    reminder: "Hatırlatıcı ekle",
    buyTicket: "Bilet al",
    favoriteSaving: "Favori işleniyor...",
    favoriteSaved: "Etkinlik favorilere eklendi.",
    favoriteRemoved: "Etkinlik favorilerden kaldırıldı.",
    favoriteFailed: "Favori işlemi tamamlanamadı.",
    reminderSaving: "Hatırlatıcı kaydediliyor...",
    reminderSaved: "Hatırlatıcı kaydedildi. Profildeki Hatırlatıcılar bölümünde görünecek.",
    reminderFailed: "Hatırlatıcı kaydedilemedi.",
    guestLocked: "Misafir oturumunda favori ve hatırlatıcı işlemleri kapalıdır.",
    unspecified: "Belirtilmemiş",
    free: "Ücretsiz",
    paid: "Ücretli",
    mapValue: "Bağlantı"
  },
  en: {
    back: "Back",
    notFound: "The selected event could not be found.",
    ticketOpen: "Open ticket",
    ticketLabel: "Ticket link",
    eventInfo: "Event details",
    dateTime: "Date and time",
    venue: "Venue",
    cast: "Cast",
    synopsis: "Synopsis",
    ticketPrice: "Ticket",
    distance: "Distance",
    validity: "Ticket link",
    directions: "Directions",
    mapTitle: "Map",
    openMap: "Open map",
    favorite: "Favorite",
    reminder: "Add reminder",
    buyTicket: "Buy ticket",
    favoriteSaving: "Processing favorite...",
    favoriteSaved: "Event added to favorites.",
    favoriteRemoved: "Event removed from favorites.",
    favoriteFailed: "Favorite action could not be completed.",
    reminderSaving: "Saving reminder...",
    reminderSaved: "Reminder saved. It will appear in the Reminders section of your profile.",
    reminderFailed: "Reminder could not be saved.",
    guestLocked: "Favorites and reminders are disabled in guest mode.",
    unspecified: "Not specified",
    free: "Free",
    paid: "Paid",
    mapValue: "Link"
  },
  ru: {
    back: "Назад",
    notFound: "Выбранное событие не найдено.",
    ticketOpen: "Открыть билет",
    ticketLabel: "Ссылка на билет",
    eventInfo: "Информация о событии",
    dateTime: "Дата и время",
    venue: "Место",
    cast: "Состав",
    synopsis: "Синопсис",
    ticketPrice: "Билет",
    distance: "Расстояние",
    validity: "Ссылка на билет",
    directions: "Маршрут",
    mapTitle: "Карта",
    openMap: "Открыть карту",
    favorite: "Избранное",
    reminder: "Добавить напоминание",
    buyTicket: "Купить билет",
    favoriteSaving: "Избранное обрабатывается...",
    favoriteSaved: "Событие добавлено в избранное.",
    favoriteRemoved: "Событие удалено из избранного.",
    favoriteFailed: "Не удалось выполнить действие с избранным.",
    reminderSaving: "Напоминание сохраняется...",
    reminderSaved: "Напоминание сохранено. Оно появится в разделе «Напоминания» профиля.",
    reminderFailed: "Не удалось сохранить напоминание.",
    guestLocked: "В гостевом режиме избранное и напоминания недоступны.",
    unspecified: "Не указано",
    free: "Бесплатно",
    paid: "Платно",
    mapValue: "Ссылка"
  },
  de: {
    back: "Zurück",
    notFound: "Die ausgewählte Veranstaltung wurde nicht gefunden.",
    ticketOpen: "Ticket öffnen",
    ticketLabel: "Ticket-Link",
    eventInfo: "Veranstaltungsdetails",
    dateTime: "Datum und Uhrzeit",
    venue: "Ort",
    cast: "Besetzung",
    synopsis: "Inhaltsangabe",
    ticketPrice: "Ticket",
    distance: "Entfernung",
    validity: "Ticket-Link",
    directions: "Wegbeschreibung",
    mapTitle: "Karte",
    openMap: "Karte öffnen",
    favorite: "Favorit",
    reminder: "Erinnerung hinzufügen",
    buyTicket: "Ticket kaufen",
    favoriteSaving: "Favorit wird verarbeitet...",
    favoriteSaved: "Veranstaltung zu Favoriten hinzugefügt.",
    favoriteRemoved: "Veranstaltung aus Favoriten entfernt.",
    favoriteFailed: "Favorit-Aktion konnte nicht abgeschlossen werden.",
    reminderSaving: "Erinnerung wird gespeichert...",
    reminderSaved: "Erinnerung gespeichert. Sie erscheint im Bereich „Erinnerungen“ deines Profils.",
    reminderFailed: "Erinnerung konnte nicht gespeichert werden.",
    guestLocked: "Favoriten und Erinnerungen sind im Gastmodus deaktiviert.",
    unspecified: "Nicht angegeben",
    free: "Kostenlos",
    paid: "Kostenpflichtig",
    mapValue: "Link"
  }
} as const;

export function EventDetailScreen({ feed, userLocation, session, eventId, onBack }: MobileScreenProps & { eventId: string; onBack: () => void }) {
  const isGuest = !session || session.isAnonymous;
  const [actionStatus, setActionStatus] = useState("");
  const [pendingAction, setPendingAction] = useState<"favorite" | "calendar" | null>(null);

  useEffect(() => {
    perfMark("eventDetail:screenMount");
    perfMeasure("eventDetail:navigationToMount", "nav:event-detail:press");
    queueMicrotask(() => {
      perfMark("eventDetail:firstPaint");
      perfMeasure("eventDetail:mountToFirstPaint", "eventDetail:screenMount");
      perfMeasure("eventDetail:navigationToFirstPaint", "nav:event-detail:press");
    });
  }, []);

  const locale = getMobileLocale() as DetailLocale;
  const copy = eventDetailCopy[locale] ?? eventDetailCopy.tr;
  const event = useMemo(() => feed.events.find((item) => item.id === eventId), [eventId, feed.events]);
  const venue = useMemo(() => event ? resolveEventVenue(feed.places, event.venueName, event.district, locale) : undefined, [event, feed.places, locale]);
  const venueLocation = venue ?? event;
  const mapPoint = readMapPoint(venueLocation);
  const synopsis = normalizeSynopsisText(pickText(event?.synopsis, locale) ?? pickText(event?.description, locale));
  const [synopsisText, setSynopsisText] = useState(synopsis);
  const mapUrl = mapPoint && hasMeaningfulMapPoint(mapPoint) ? createStaticMapUrl(mapPoint, process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) : "";

  useEffect(() => {
    let active = true;
    const base = synopsis || pickText(event?.description, locale) || "";
    if (!base) {
      setSynopsisText("");
      return;
    }
    if (locale === "tr") {
      setSynopsisText(base);
      return;
    }
    void translateText(base, locale, "tr").then((value) => {
      if (!active) return;
      setSynopsisText(value || base);
    });
    return () => {
      active = false;
    };
  }, [event?.description.tr, locale, synopsis]);

  async function handleToggleFavorite() {
    if (!event || pendingAction) return;
      setPendingAction("favorite");
    setActionStatus(copy.favoriteSaving);
    try {
      const result = await toggleFavorite("event", event.id);
      setActionStatus(result.active ? copy.favoriteSaved : copy.favoriteRemoved);
    } catch {
      setActionStatus(copy.favoriteFailed);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleScheduleReminder() {
    if (!event || pendingAction) return;
    setPendingAction("calendar");
    setActionStatus(copy.reminderSaving);
    try {
      await scheduleReminder({ entityType: "event", entityId: event.id, remindAt: event.startsAt });
      setActionStatus(copy.reminderSaved);
    } catch {
      setActionStatus(copy.reminderFailed);
    } finally {
      setPendingAction(null);
    }
  }

  if (!event) {
    return (
      <View style={styles.profileSurface}>
        <ActionPill label={copy.back} variant="secondary" onPress={onBack} />
        <Text style={styles.emptyText}>{copy.notFound}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
      <ActionRow>
        <ActionPill label={copy.back} variant="secondary" onPress={onBack} />
        {event.ticketUrl ? <ActionPill label={copy.ticketOpen} onPress={() => openExternalUrl(event.ticketUrl)} /> : null}
      </ActionRow>
      <DetailHeroCard image={event.coverImage} eyebrow={pickText(getEventTypeMeta(event).title, locale)} title={pickText(event.title, locale)} />
      <StatStrip
        items={[
          [copy.dateTime, formatDate(event.startsAt, locale)],
          [copy.venue, pickText(event.venueName, locale) || copy.unspecified],
          [copy.ticketPrice, event.priceType === "free" ? copy.free : copy.paid],
          [copy.distance, resolveDistanceLabel(userLocation, venue ?? event)]
        ]}
      />
      <SubsectionGrid items={[...event.cast.slice(0, 4), event.district]} />

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>{copy.eventInfo}</Text>
        <DetailLinkRow icon="calendar-outline" label={copy.dateTime} value={formatDate(event.startsAt, locale)} />
        <DetailLinkRow icon="location-outline" label={copy.venue} value={pickText(event.venueName, locale) || copy.unspecified} onPress={() => (venue?.location ? openAddressInMaps(venue.address ?? event.venueName) : undefined)} />
        <DetailLinkRow icon="people-outline" label={copy.cast} value={compactValue(event.cast.join(", "))} />
        <View style={styles.detailSynopsisBlock}>
          <View style={styles.detailSynopsisHeader}>
            <Ionicons name="document-text-outline" size={16} color={theme.nar} />
            <Text style={styles.detailSynopsisTitle}>{copy.synopsis}</Text>
          </View>
          <Text style={styles.detailSynopsisText}>{compactValue(synopsisText) || copy.unspecified}</Text>
        </View>
        <DetailLinkRow icon="ticket-outline" label={copy.ticketLabel} value={compactValue(event.ticketUrl)} onPress={() => openExternalUrl(event.ticketUrl)} />
        <DetailLinkRow
          icon="navigate-outline"
          label={copy.directions}
          value={copy.mapValue}
          onPress={() => (venue?.location ? openExternalUrl(createGoogleMapsDirectionsUrl(venue.location, venue.title.tr)) : openAddressInMaps(venue?.address ?? event.venueName))}
        />
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>{copy.mapTitle}</Text>
        {mapUrl ? (
          <ImageBackground source={{ uri: mapUrl }} style={{ height: 190, borderRadius: 18, overflow: "hidden" }} imageStyle={{ borderRadius: 18 }} />
        ) : (
          <ActionPill label={copy.openMap} onPress={() => openAddressInMaps(venue?.address ?? event.venueName)} />
        )}
      </View>

      <ActionRow>
        {!isGuest ? <ActionPill label={copy.favorite} variant="secondary" onPress={() => void handleToggleFavorite()} disabled={pendingAction !== null} /> : null}
        {!isGuest ? <ActionPill label={copy.reminder} onPress={() => void handleScheduleReminder()} disabled={pendingAction !== null} /> : null}
        <ActionPill
          label={copy.buyTicket}
          variant="secondary"
          onPress={() => {
            void createTicketOrder({ eventId: event.id, eventTitle: pickText(event.title, locale), ticketUrl: event.ticketUrl });
            if (event.ticketUrl) openExternalUrl(event.ticketUrl);
          }}
        />
      </ActionRow>
      {actionStatus ? <Text style={styles.detailActionStatus}>{actionStatus}</Text> : null}
      {isGuest ? <Text style={styles.emptyText}>{copy.guestLocked}</Text> : null}
    </ScrollView>
  );
}

function formatDate(value: string, locale: DetailLocale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function resolveEventVenue(places: Array<{ title: Record<string, string>; district: string; address: string; location?: { lat: number; lng: number } }>, venueName: string, district: string, locale: string) {
  const normalizedVenue = normalize(venueName);
  const normalizedDistrict = normalize(district);
  return places.find((place) => {
    const titles = [pickText(place.title, locale), place.title.tr, place.title.en, place.address].map(normalize);
    return titles.some((title) => title === normalizedVenue || title.includes(normalizedVenue) || normalizedVenue.includes(title));
  }) ?? places.find((place) => normalize(place.district) === normalizedDistrict);
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

function getIntlLocale(locale: DetailLocale) {
  const labels: Record<DetailLocale, string> = {
    tr: "tr-TR",
    en: "en-US",
    ru: "ru-RU",
    de: "de-DE"
  };
  return labels[locale];
}


