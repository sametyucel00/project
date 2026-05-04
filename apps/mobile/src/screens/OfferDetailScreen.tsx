import { ImageBackground, Text, View } from "react-native";
import { compactValue, createGoogleMapsDirectionsUrl, createStaticMapUrl } from "@nar/core";
import { ActionPill, ActionRow, DetailHeroCard, DetailLinkRow, StatStrip, SubsectionGrid } from "../components/ui";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { openAddressInMaps, openExternalUrl } from "../utils/links";
import { redeemOffer, scheduleReminder, toggleFavorite } from "../services";
import { useMemo } from "react";
import { hasMeaningfulMapPoint } from "../utils/location";

export function OfferDetailScreen({ feed, session, offerId, onBack }: MobileScreenProps & { offerId: string; onBack: () => void }) {
  const isGuest = !session || session.isAnonymous;
  const offer = useMemo(() => feed.offers.find((item) => item.id === offerId), [feed.offers, offerId]);
  const place = useMemo(() => feed.places.find((item) => item.id === offer?.placeId), [feed.places, offer?.placeId]);
  const remainingUse = offer?.useLimit ? Math.max(offer.useLimit - (offer.usedCount ?? 0), 0) : null;
  const placeLocation = place?.location;
  const mapUrl = hasMeaningfulMapPoint(placeLocation) ? createStaticMapUrl(placeLocation, process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) : "";

  if (!offer) {
    return (
      <View style={styles.profileSurface}>
        <ActionPill label="Geri" variant="secondary" onPress={onBack} />
        <Text style={styles.emptyText}>Seçilen fırsat bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View>
      <ActionRow>
        <ActionPill label="Geri" variant="secondary" onPress={onBack} />
        {!isGuest ? <ActionPill label="Kaydet" onPress={() => void toggleFavorite("offer", offer.id)} /> : null}
      </ActionRow>
      <DetailHeroCard image="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085" eyebrow="Nar fırsatı" title={offer.title.tr} subtitle={offer.description.tr} />
      <StatStrip items={[
        ["İndirim", offer.discountLabel],
        ["Kalan", compactValue(remainingUse)],
        ["Puan", compactValue(offer.pointCost)]
      ]} />
      <SubsectionGrid items={[offer.requiresQr ? "QR gerekli" : "QR gerekmez", offer.featured ? "Öne çıkan" : "Standart"]} />

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Fırsat bilgileri</Text>
        <DetailLinkRow icon="calendar-outline" label="Geçerlilik" value={`${formatDate(offer.startsAt)} - ${formatDate(offer.endsAt)}`} />
        <DetailLinkRow icon="document-text-outline" label="Şartlar" value={compactValue(offer.conditions.tr)} />
        <DetailLinkRow icon="location-outline" label="Mekan" value={place?.title.tr ?? "Belirtilmemiş"} onPress={() => place?.location ? openAddressInMaps(place.address) : place?.website ? openExternalUrl(place.website) : undefined} />
        <DetailLinkRow icon="navigate-outline" label="Yol tarifi" value="Bağlantı" onPress={() => place?.location ? openExternalUrl(createGoogleMapsDirectionsUrl(place.location, place.title.tr)) : place?.website ? openExternalUrl(place.website) : undefined} />
        <DetailLinkRow icon="pricetag-outline" label="Puan kullanımı" value={offer.pointCost ? `${offer.pointCost} puan` : "Yok"} />
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Harita</Text>
        {mapUrl ? (
          <ImageBackground source={{ uri: mapUrl }} style={{ height: 190, borderRadius: 18, overflow: "hidden" }} imageStyle={{ borderRadius: 18 }} />
        ) : (
          <ActionPill label="Haritayı aç" onPress={() => place?.location ? openAddressInMaps(place.address) : place?.website ? openExternalUrl(place.website) : undefined} />
        )}
      </View>

      <ActionRow>
        {!isGuest ? <ActionPill label="QR ile kullan" onPress={() => void redeemOffer({ offerId: offer.id, offerTitle: offer.title.tr, businessId: offer.businessId, placeId: offer.placeId, amountLabel: offer.discountLabel })} /> : null}
        {!isGuest ? <ActionPill label="Takvime ekle" variant="secondary" onPress={() => void scheduleReminder({ entityType: "offer", entityId: offer.id, remindAt: offer.endsAt })} /> : null}
        <ActionPill label="Mekan aç" variant="secondary" onPress={() => place?.website ? openExternalUrl(place.website) : undefined} />
      </ActionRow>
      {isGuest ? <Text style={styles.emptyText}>Misafir oturumunda fırsat kullanımı ve takvim işlemleri kapalıdır.</Text> : null}
    </View>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
