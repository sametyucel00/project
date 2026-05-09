import { ImageBackground, ScrollView, Text, View } from "react-native";
import { compactValue, createGoogleMapsDirectionsUrl, createStaticMapUrl, getOfferById, getPlaceById } from "@nar/core";
import { ActionPill, ActionRow, DetailHeroCard, DetailLinkRow, StatStrip, SubsectionGrid } from "../components/ui";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { openAddressInMaps, openExternalUrl } from "../utils/links";
import { redeemOffer, scheduleReminder, toggleFavorite } from "../services";
import { useMemo, useState } from "react";
import { hasMeaningfulMapPoint } from "../utils/location";
import { getMobileLocale } from "../locale";

type DetailLocale = "tr" | "en" | "ru" | "de";

const offerDetailCopy = {
  tr: {
    back: "Geri",
    notFound: "Seçilen fırsat bulunamadı.",
    heroEyebrow: "Nar fırsatı",
    info: "Fırsat bilgileri",
    validity: "Geçerlilik",
    conditions: "Şartlar",
    venue: "Mekan",
    directions: "Yol tarifi",
    pointsUsage: "Puan kullanımı",
    mapTitle: "Harita",
    openMap: "Haritayı aç",
    save: "Kaydet",
    useQr: "QR ile kullan",
    reminder: "Hatırlatıcı ekle",
    openPlace: "Mekan aç",
    reminderSaving: "Hatırlatıcı kaydediliyor...",
    reminderSaved: "Hatırlatıcı kaydedildi. Profildeki Hatırlatıcılar bölümünde görünecek.",
    reminderFailed: "Hatırlatıcı kaydedilemedi.",
    guestLocked: "Misafir oturumunda fırsat kullanımı ve hatırlatıcı işlemleri kapalıdır.",
    unspecified: "Belirtilmemiş",
    yes: "Var",
    no: "Yok",
    link: "Bağlantı"
  },
  en: {
    back: "Back",
    notFound: "The selected offer could not be found.",
    heroEyebrow: "Nar offer",
    info: "Offer details",
    validity: "Validity",
    conditions: "Conditions",
    venue: "Venue",
    directions: "Directions",
    pointsUsage: "Points use",
    mapTitle: "Map",
    openMap: "Open map",
    save: "Save",
    useQr: "Use QR",
    reminder: "Add reminder",
    openPlace: "Open place",
    reminderSaving: "Saving reminder...",
    reminderSaved: "Reminder saved. It will appear in the Reminders section of your profile.",
    reminderFailed: "Reminder could not be saved.",
    guestLocked: "Offer usage and reminders are disabled in guest mode.",
    unspecified: "Not specified",
    yes: "Yes",
    no: "No",
    link: "Link"
  },
  ru: {
    back: "Назад",
    notFound: "Выбранное предложение не найдено.",
    heroEyebrow: "Предложение Nar",
    info: "Информация о предложении",
    validity: "Срок действия",
    conditions: "Условия",
    venue: "Место",
    directions: "Маршрут",
    pointsUsage: "Использование баллов",
    mapTitle: "Карта",
    openMap: "Открыть карту",
    save: "Сохранить",
    useQr: "Использовать QR",
    reminder: "Добавить напоминание",
    openPlace: "Открыть место",
    reminderSaving: "Напоминание сохраняется...",
    reminderSaved: "Напоминание сохранено. Оно появится в разделе «Напоминания» профиля.",
    reminderFailed: "Не удалось сохранить напоминание.",
    guestLocked: "Использование предложений и напоминания недоступны в гостевом режиме.",
    unspecified: "Не указано",
    yes: "Да",
    no: "Нет",
    link: "Ссылка"
  },
  de: {
    back: "Zurück",
    notFound: "Das ausgewählte Angebot wurde nicht gefunden.",
    heroEyebrow: "Nar-Angebot",
    info: "Angebotsdetails",
    validity: "Gültigkeit",
    conditions: "Bedingungen",
    venue: "Ort",
    directions: "Wegbeschreibung",
    pointsUsage: "Punkteverwendung",
    mapTitle: "Karte",
    openMap: "Karte öffnen",
    save: "Speichern",
    useQr: "Mit QR nutzen",
    reminder: "Erinnerung hinzufügen",
    openPlace: "Ort öffnen",
    reminderSaving: "Erinnerung wird gespeichert...",
    reminderSaved: "Erinnerung gespeichert. Sie erscheint im Bereich „Erinnerungen“ deines Profils.",
    reminderFailed: "Erinnerung konnte nicht gespeichert werden.",
    guestLocked: "Angebotsnutzung und Erinnerungen sind im Gastmodus deaktiviert.",
    unspecified: "Nicht angegeben",
    yes: "Ja",
    no: "Nein",
    link: "Link"
  }
} as const;

export function OfferDetailScreen({ feed, session, offerId, onBack }: MobileScreenProps & { offerId: string; onBack: () => void }) {
  const isGuest = !session || session.isAnonymous;
  const [actionStatus, setActionStatus] = useState("");
  const locale = (getMobileLocale() as DetailLocale) ?? "tr";
  const copy = offerDetailCopy[locale] ?? offerDetailCopy.tr;
  const offer = useMemo(() => feed.offers.find((item) => item.id === offerId) ?? getOfferById(offerId), [feed.offers, offerId]);
  const place = useMemo(() => feed.places.find((item) => item.id === offer?.placeId) ?? (offer?.placeId ? getPlaceById(offer.placeId) : undefined), [feed.places, offer?.placeId]);
  const remainingUse = offer?.useLimit ? Math.max(offer.useLimit - (offer.usedCount ?? 0), 0) : null;
  const placeLocation = place?.location;
  const mapUrl = hasMeaningfulMapPoint(placeLocation) ? createStaticMapUrl(placeLocation, process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) : "";

  if (!offer) {
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
        {!isGuest ? <ActionPill label={copy.save} onPress={() => void toggleFavorite("offer", offer.id)} /> : null}
      </ActionRow>
      <DetailHeroCard image="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085" eyebrow={copy.heroEyebrow} title={pickText(offer.title, locale)} subtitle={pickText(offer.description, locale)} />
      <StatStrip items={[
        [locale === "tr" ? "İndirim" : locale === "ru" ? "Скидка" : locale === "de" ? "Rabatt" : "Discount", offer.discountLabel],
        [locale === "tr" ? "Kalan" : locale === "ru" ? "Осталось" : locale === "de" ? "Übrig" : "Remaining", compactValue(remainingUse)],
        [locale === "tr" ? "Puan" : locale === "ru" ? "Баллы" : locale === "de" ? "Punkte" : "Points", compactValue(offer.pointCost)]
      ]} />
      <SubsectionGrid items={[offer.requiresQr ? copy.yes : copy.no, offer.featured ? (locale === "tr" ? "Öne çıkan" : locale === "ru" ? "Рекомендуется" : locale === "de" ? "Empfohlen" : "Featured") : (locale === "tr" ? "Standart" : locale === "ru" ? "Обычное" : locale === "de" ? "Standard" : "Standard")]} />

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>{copy.info}</Text>
        <DetailLinkRow icon="calendar-outline" label={copy.validity} value={`${formatDate(offer.startsAt, locale)} - ${formatDate(offer.endsAt, locale)}`} />
        <DetailLinkRow icon="document-text-outline" label={copy.conditions} value={compactValue(pickText(offer.conditions, locale))} />
        <DetailLinkRow icon="location-outline" label={copy.venue} value={pickText(place?.title, locale) ?? copy.unspecified} onPress={() => place?.location ? openAddressInMaps(place.address) : place?.website ? openExternalUrl(place.website) : undefined} />
        <DetailLinkRow icon="navigate-outline" label={copy.directions} value={copy.link} onPress={() => place?.location ? openExternalUrl(createGoogleMapsDirectionsUrl(place.location, pickText(place.title, locale))) : place?.website ? openExternalUrl(place.website) : undefined} />
        <DetailLinkRow icon="pricetag-outline" label={copy.pointsUsage} value={offer.pointCost ? `${offer.pointCost} puan` : copy.unspecified} />
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>{copy.mapTitle}</Text>
        {mapUrl ? (
          <ImageBackground source={{ uri: mapUrl }} style={{ height: 190, borderRadius: 18, overflow: "hidden" }} imageStyle={{ borderRadius: 18 }} />
        ) : (
          <ActionPill label={copy.openMap} onPress={() => place?.location ? openAddressInMaps(place.address) : place?.website ? openExternalUrl(place.website) : undefined} />
        )}
      </View>

      <ActionRow>
        {!isGuest ? <ActionPill label={copy.useQr} onPress={() => void redeemOffer({ offerId: offer.id, offerTitle: pickText(offer.title, locale), businessId: offer.businessId, placeId: offer.placeId, amountLabel: offer.discountLabel })} /> : null}
        {!isGuest ? <ActionPill label={copy.reminder} variant="secondary" onPress={async () => {
          setActionStatus(copy.reminderSaving);
          try {
            await scheduleReminder({ entityType: "offer", entityId: offer.id, remindAt: offer.endsAt });
            setActionStatus(copy.reminderSaved);
          } catch {
            setActionStatus(copy.reminderFailed);
          }
        }} /> : null}
        <ActionPill label={copy.openPlace} variant="secondary" onPress={() => place?.website ? openExternalUrl(place.website) : undefined} />
      </ActionRow>
      {actionStatus ? <Text style={styles.detailActionStatus}>{actionStatus}</Text> : null}
      {isGuest ? <Text style={styles.emptyText}>{copy.guestLocked}</Text> : null}
    </ScrollView>
  );
}

function formatDate(value: string, locale: DetailLocale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function pickText(value: unknown, locale: DetailLocale) {
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

