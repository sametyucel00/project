import { ImageBackground, ScrollView, Share, Text, View } from "react-native";
import { compactValue, createGoogleMapsDirectionsUrl, createStaticMapUrl, getPlaceCategoryId, placeCategoryOptions } from "@nar/core";
import { ActionPill, ActionRow, DetailHeroCard, DetailLinkRow, StatStrip, SubsectionGrid } from "../components/ui";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { openAddressInMaps, openEmailAddress, openExternalUrl, openPhoneNumber } from "../utils/links";
import { toggleFavorite } from "../services";
import { useEffect, useMemo } from "react";
import { hasMeaningfulMapPoint, readMapPoint, resolveDistanceLabel } from "../utils/location";
import { perfMark, perfMeasure } from "../services/perf";

export function PlaceDetailScreen({ feed, userLocation, session, placeId, onBack }: MobileScreenProps & { placeId: string; onBack: () => void }) {
  const isGuest = !session || session.isAnonymous;
  useEffect(() => {
    perfMark("placeDetail:screenMount");
    perfMeasure("placeDetail:navigationToMount", "nav:place-detail:press");
    queueMicrotask(() => {
      perfMark("placeDetail:firstPaint");
      perfMeasure("placeDetail:mountToFirstPaint", "placeDetail:screenMount");
      perfMeasure("placeDetail:navigationToFirstPaint", "nav:place-detail:press");
    });
  }, []);
  const place = useMemo(() => feed.places.find((item) => item.id === placeId), [feed.places, placeId]);
  const category = place ? placeCategoryOptions.find((item) => item.id === getPlaceCategoryId(place))?.title.tr ?? "Mekan" : "Mekan";
  const placeLocation = place;
  const mapPoint = readMapPoint(placeLocation);
  const mapUrl = mapPoint && hasMeaningfulMapPoint(mapPoint) ? createStaticMapUrl(mapPoint, process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) : "";
  const openingHours = place?.openingHours?.length ? place.openingHours.join(" · ") : "Belirtilmemiş";
  const socialLinks = Object.values(place?.socialLinks ?? {}).filter(Boolean);
  const shareText = place ? [place.title.tr, place.address, place.website].filter(Boolean).join("\n") : "";

  if (!place) {
    return (
      <View style={styles.profileSurface}>
        <ActionPill label="Geri" variant="secondary" onPress={onBack} />
        <Text style={styles.emptyText}>Seçilen mekan bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
      <ActionRow>
        <ActionPill label="Geri" variant="secondary" onPress={onBack} />
        <ActionPill label="Haritada aç" onPress={() => openAddressInMaps(place.address)} />
      </ActionRow>
      <DetailHeroCard image={place.coverImage} eyebrow={category} title={place.title.tr} subtitle={place.description.tr} />
      <StatStrip items={[
        ["Puan", compactValue(place.googleRating)],
        ["Yorum", compactValue(place.googleReviewCount)],
        ["Durum", place.openNow ? "Açık" : "Belirtilmemiş"],
        ["Mesafe", resolveDistanceLabel(userLocation, place)]
      ]} />
      <SubsectionGrid items={[...place.features.slice(0, 6), place.accessibility.wheelchair ? "Engelli dostu" : "Erişim bilgisi yok"]} />
      <ActionRow>
        <ActionPill label="Yol tarifi" variant="secondary" onPress={() => place.location ? openExternalUrl(createGoogleMapsDirectionsUrl(place.location, place.title.tr)) : openAddressInMaps(place.address)} />
        <ActionPill label="Paylaş" variant="secondary" onPress={() => void Share.share({ message: shareText || place.title.tr })} />
        {!isGuest ? <ActionPill label="Favori" variant="secondary" onPress={() => void toggleFavorite("place", place.id)} /> : null}
      </ActionRow>
      {isGuest ? <Text style={styles.emptyText}>Misafir oturumunda favori kaydedemezsin.</Text> : null}

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>İletişim ve konum</Text>
        <DetailLinkRow icon="call-outline" label="Telefon" value={compactValue(place.phone)} onPress={() => openPhoneNumber(place.phone)} />
        <DetailLinkRow icon="location-outline" label="Adres" value={compactValue(place.address)} onPress={() => openAddressInMaps(place.address)} />
        <DetailLinkRow icon="globe-outline" label="Web sitesi" value={compactValue(place.website)} onPress={() => openExternalUrl(place.website)} />
        <DetailLinkRow icon="mail-outline" label="E-posta" value={compactValue(place.email)} onPress={() => openEmailAddress(place.email)} />
        <DetailLinkRow icon="menu-outline" label="Menü" value={compactValue(place.menuUrl)} onPress={() => openExternalUrl(place.menuUrl)} />
        <DetailLinkRow icon="time-outline" label="Çalışma saatleri" value={openingHours} />
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Harita</Text>
        {mapUrl ? (
          <ImageBackground source={{ uri: mapUrl }} style={{ height: 190, borderRadius: 18, overflow: "hidden" }} imageStyle={{ borderRadius: 18 }} />
        ) : (
          <ActionPill label="Haritayı aç" onPress={() => openAddressInMaps(place.address)} />
        )}
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Ek bilgiler</Text>
        <DetailLinkRow icon="share-outline" label="Sosyal medya" value={socialLinks.length ? socialLinks.join(" · ") : "Belirtilmemiş"} />
        <DetailLinkRow icon="navigate-outline" label="Yol tarifi" value="Bağlantı" onPress={() => place.location ? openExternalUrl(createGoogleMapsDirectionsUrl(place.location, place.title.tr)) : openAddressInMaps(place.address)} />
      </View>
    </ScrollView>
  );
}
