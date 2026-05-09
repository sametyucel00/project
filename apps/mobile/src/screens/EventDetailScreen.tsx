import { ImageBackground, ScrollView, Text, View } from "react-native";
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

  const locale = getMobileLocale();
  const event = useMemo(() => feed.events.find((item) => item.id === eventId), [eventId, feed.events]);
  const venue = useMemo(() => event ? resolveEventVenue(feed.places, event.venueName, event.district, locale) : undefined, [event, feed.places, locale]);
  const venueLocation = venue ?? event;
  const mapPoint = readMapPoint(venueLocation);
  const synopsis = normalizeSynopsisText(event?.synopsis?.tr ?? event?.description.tr);
  const [synopsisText, setSynopsisText] = useState(synopsis);
  const mapUrl = mapPoint && hasMeaningfulMapPoint(mapPoint) ? createStaticMapUrl(mapPoint, process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) : "";

  useEffect(() => {
    let active = true;
    const base = synopsis || event?.description.tr || "";
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
    setActionStatus("Favori işleniyor...");
    try {
      const result = await toggleFavorite("event", event.id);
      setActionStatus(result.active ? "Etkinlik favorilere eklendi." : "Etkinlik favorilerden kaldırıldı.");
    } catch {
      setActionStatus("Favori işlemi tamamlanamadı.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleScheduleReminder() {
    if (!event || pendingAction) return;
    setPendingAction("calendar");
    setActionStatus("Takvim işleniyor...");
    try {
      await scheduleReminder({ entityType: "event", entityId: event.id, remindAt: event.startsAt });
      setActionStatus("Etkinlik takvime eklendi.");
    } catch {
      setActionStatus("Takvime ekleme tamamlanamadı.");
    } finally {
      setPendingAction(null);
    }
  }

  if (!event) {
    return (
      <View style={styles.profileSurface}>
        <ActionPill label="Geri" variant="secondary" onPress={onBack} />
        <Text style={styles.emptyText}>Seçilen etkinlik bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
      <ActionRow>
        <ActionPill label="Geri" variant="secondary" onPress={onBack} />
        {event.ticketUrl ? <ActionPill label="Bilet aç" onPress={() => openExternalUrl(event.ticketUrl)} /> : null}
      </ActionRow>
      <DetailHeroCard image={event.coverImage} eyebrow={getEventTypeMeta(event).title.tr} title={event.title.tr} />
      <StatStrip
        items={[
          ["Tarih", formatDate(event.startsAt)],
          ["Yer", event.venueName],
          ["Bilet", event.priceType === "free" ? "Ücretsiz" : "Ücretli"],
          ["Mesafe", resolveDistanceLabel(userLocation, venue ?? event)]
        ]}
      />
      <SubsectionGrid items={[...event.cast.slice(0, 4), event.district]} />

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Etkinlik bilgileri</Text>
        <DetailLinkRow icon="calendar-outline" label="Tarih ve saat" value={formatDate(event.startsAt)} />
        <DetailLinkRow icon="location-outline" label="Mekan" value={event.venueName} onPress={() => (venue?.location ? openAddressInMaps(venue.address ?? event.venueName) : undefined)} />
        <DetailLinkRow icon="people-outline" label="Kadro" value={compactValue(event.cast.join(", "))} />
        <View style={styles.detailSynopsisBlock}>
          <View style={styles.detailSynopsisHeader}>
            <Text style={styles.detailSynopsisIcon}>⟡</Text>
            <Text style={styles.detailSynopsisTitle}>Sinopsis</Text>
          </View>
          <Text style={styles.detailSynopsisText}>{compactValue(synopsisText) || "Belirtilmemiş"}</Text>
        </View>
        <DetailLinkRow icon="ticket-outline" label="Bilet bağlantısı" value={compactValue(event.ticketUrl)} onPress={() => openExternalUrl(event.ticketUrl)} />
        <DetailLinkRow
          icon="navigate-outline"
          label="Yol tarifi"
          value="Bağlantı"
          onPress={() => (venue?.location ? openExternalUrl(createGoogleMapsDirectionsUrl(venue.location, venue.title.tr)) : openAddressInMaps(venue?.address ?? event.venueName))}
        />
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Harita</Text>
        {mapUrl ? (
          <ImageBackground source={{ uri: mapUrl }} style={{ height: 190, borderRadius: 18, overflow: "hidden" }} imageStyle={{ borderRadius: 18 }} />
        ) : (
          <ActionPill label="Haritayı aç" onPress={() => openAddressInMaps(venue?.address ?? event.venueName)} />
        )}
      </View>

      <ActionRow>
        {!isGuest ? <ActionPill label="Favori" variant="secondary" onPress={() => void handleToggleFavorite()} disabled={pendingAction !== null} /> : null}
        {!isGuest ? <ActionPill label="Takvime ekle" onPress={() => void handleScheduleReminder()} disabled={pendingAction !== null} /> : null}
        <ActionPill
          label="Bilet al"
          variant="secondary"
          onPress={() => {
            void createTicketOrder({ eventId: event.id, eventTitle: event.title.tr, ticketUrl: event.ticketUrl });
            if (event.ticketUrl) openExternalUrl(event.ticketUrl);
          }}
        />
      </ActionRow>
      {actionStatus ? <Text style={styles.detailActionStatus}>{actionStatus}</Text> : null}
      {isGuest ? <Text style={styles.emptyText}>Misafir oturumunda favori ve takvim işlemleri kapalıdır.</Text> : null}
    </ScrollView>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
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
