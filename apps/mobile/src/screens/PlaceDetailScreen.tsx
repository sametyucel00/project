import { ImageBackground, ScrollView, Share, Text, View } from "react-native";
import { compactValue, createGoogleMapsDirectionsUrl, createStaticMapUrl, getPlaceCategoryId, placeCategoryOptions } from "@nar/core";
import { ActionPill, ActionRow, DetailHeroCard, DetailLinkRow, StatStrip, SubsectionGrid } from "../components/ui";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { openAddressInMaps, openEmailAddress, openExternalUrl, openPhoneNumber } from "../utils/links";
import { toggleFavorite } from "../services";
import { useEffect, useMemo, useState } from "react";
import { hasMeaningfulMapPoint, readMapPoint, resolveDistanceLabel } from "../utils/location";
import { perfMark, perfMeasure } from "../services/perf";
import { getMobileLocale } from "../locale";

type DetailLocale = "tr" | "en" | "ru" | "de";

const placeDetailCopy = {
  tr: {
    back: "Geri",
    notFound: "Seçilen mekan bulunamadı.",
    openOnMap: "Haritada aç",
    placeInfo: "İletişim ve konum",
    rating: "Puan",
    reviews: "Yorum",
    status: "Durum",
    distance: "Mesafe",
    phone: "Telefon",
    address: "Adres",
    website: "Web sitesi",
    email: "E-posta",
    menu: "Menü",
    workingHours: "Çalışma saatleri",
    mapTitle: "Harita",
    openMap: "Haritayı aç",
    extra: "Ek bilgiler",
    socialMedia: "Sosyal medya",
    directions: "Yol tarifi",
    link: "Bağlantı",
    favorite: "Favori",
    share: "Paylaş",
    favoriteSaving: "Favori işleniyor...",
    favoriteSaved: "Mekan favorilere eklendi.",
    favoriteRemoved: "Mekan favorilerden kaldırıldı.",
    favoriteFailed: "Favori işlemi tamamlanamadı.",
    guestLocked: "Misafir oturumunda favori kaydedemezsin.",
    unspecified: "Belirtilmemiş",
    openNow: "Açık",
    closed: "Kapalı",
    clear: "Belirtilmemiş",
    mapLabel: "Bağlantı"
  },
  en: {
    back: "Back",
    notFound: "The selected place could not be found.",
    openOnMap: "Open on map",
    placeInfo: "Contact and location",
    rating: "Rating",
    reviews: "Reviews",
    status: "Status",
    distance: "Distance",
    phone: "Phone",
    address: "Address",
    website: "Website",
    email: "E-mail",
    menu: "Menu",
    workingHours: "Working hours",
    mapTitle: "Map",
    openMap: "Open map",
    extra: "Extra information",
    socialMedia: "Social media",
    directions: "Directions",
    link: "Link",
    favorite: "Favorite",
    share: "Share",
    favoriteSaving: "Processing favorite...",
    favoriteSaved: "Place added to favorites.",
    favoriteRemoved: "Place removed from favorites.",
    favoriteFailed: "Favorite action could not be completed.",
    guestLocked: "You cannot save favorites in guest mode.",
    unspecified: "Not specified",
    openNow: "Open",
    closed: "Closed",
    clear: "Not specified",
    mapLabel: "Link"
  },
  ru: {
    back: "Назад",
    notFound: "Выбранное место не найдено.",
    openOnMap: "Открыть на карте",
    placeInfo: "Контакты и местоположение",
    rating: "Рейтинг",
    reviews: "Отзывы",
    status: "Статус",
    distance: "Расстояние",
    phone: "Телефон",
    address: "Адрес",
    website: "Сайт",
    email: "E-mail",
    menu: "Меню",
    workingHours: "Часы работы",
    mapTitle: "Карта",
    openMap: "Открыть карту",
    extra: "Дополнительная информация",
    socialMedia: "Соцсети",
    directions: "Маршрут",
    link: "Ссылка",
    favorite: "Избранное",
    share: "Поделиться",
    favoriteSaving: "Избранное обрабатывается...",
    favoriteSaved: "Место добавлено в избранное.",
    favoriteRemoved: "Место удалено из избранного.",
    favoriteFailed: "Не удалось выполнить действие с избранным.",
    guestLocked: "В гостевом режиме нельзя сохранять избранное.",
    unspecified: "Не указано",
    openNow: "Открыто",
    closed: "Закрыто",
    clear: "Не указано",
    mapLabel: "Ссылка"
  },
  de: {
    back: "Zurück",
    notFound: "Der ausgewählte Ort wurde nicht gefunden.",
    openOnMap: "Auf Karte öffnen",
    placeInfo: "Kontakt und Standort",
    rating: "Bewertung",
    reviews: "Bewertungen",
    status: "Status",
    distance: "Entfernung",
    phone: "Telefon",
    address: "Adresse",
    website: "Website",
    email: "E-Mail",
    menu: "Menü",
    workingHours: "Öffnungszeiten",
    mapTitle: "Karte",
    openMap: "Karte öffnen",
    extra: "Weitere Informationen",
    socialMedia: "Soziale Medien",
    directions: "Wegbeschreibung",
    link: "Link",
    favorite: "Favorit",
    share: "Teilen",
    favoriteSaving: "Favorit wird verarbeitet...",
    favoriteSaved: "Ort zu Favoriten hinzugefügt.",
    favoriteRemoved: "Ort aus Favoriten entfernt.",
    favoriteFailed: "Favorit-Aktion konnte nicht abgeschlossen werden.",
    guestLocked: "Im Gastmodus können keine Favoriten gespeichert werden.",
    unspecified: "Nicht angegeben",
    openNow: "Geöffnet",
    closed: "Geschlossen",
    clear: "Nicht angegeben",
    mapLabel: "Link"
  }
} as const;

export function PlaceDetailScreen({ feed, userLocation, session, placeId, onBack }: MobileScreenProps & { placeId: string; onBack: () => void }) {
  const isGuest = !session || session.isAnonymous;
  const [actionStatus, setActionStatus] = useState("");
  const [pendingFavorite, setPendingFavorite] = useState(false);
  const locale = (getMobileLocale() as DetailLocale) ?? "tr";
  const copy = placeDetailCopy[locale] ?? placeDetailCopy.tr;

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
  const category = place ? pickText(placeCategoryOptions.find((item) => item.id === getPlaceCategoryId(place))?.title, locale) || "Mekan" : "Mekan";
  const placeLocation = place;
  const mapPoint = readMapPoint(placeLocation);
  const mapUrl = mapPoint && hasMeaningfulMapPoint(mapPoint) ? createStaticMapUrl(mapPoint, process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) : "";
  const openingHours = place?.openingHours?.length ? place.openingHours.join(" · ") : copy.unspecified;
  const socialLinks = Object.values(place?.socialLinks ?? {}).filter(Boolean);
  const shareText = place ? [pickText(place.title, locale), place.address, place.website].filter(Boolean).join("\n") : "";

  async function handleToggleFavorite() {
    if (!place || pendingFavorite) return;
    setPendingFavorite(true);
    setActionStatus(copy.favoriteSaving);
    try {
      const result = await toggleFavorite("place", place.id);
      setActionStatus(result.active ? copy.favoriteSaved : copy.favoriteRemoved);
    } catch {
      setActionStatus(copy.favoriteFailed);
    } finally {
      setPendingFavorite(false);
    }
  }

  if (!place) {
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
        <ActionPill label={copy.openOnMap} onPress={() => openAddressInMaps(place.address)} />
      </ActionRow>
      <DetailHeroCard image={place.coverImage} eyebrow={category} title={pickText(place.title, locale)} subtitle={pickText(place.description, locale)} />
      <StatStrip
        items={[
          [copy.rating, compactValue(place.googleRating)],
          [copy.reviews, compactValue(place.googleReviewCount)],
          [copy.status, place.openNow ? copy.openNow : copy.closed],
          [copy.distance, resolveDistanceLabel(userLocation, place)]
        ]}
      />
      <SubsectionGrid items={[...place.features.slice(0, 6), ...(place.accessibility.wheelchair ? [locale === "tr" ? "Engelli dostu" : locale === "ru" ? "Доступно для инвалидов" : locale === "de" ? "Barrierefrei" : "Accessible"] : [])]} />
      <ActionRow>
        <ActionPill label={copy.directions} variant="secondary" onPress={() => (place.location ? openExternalUrl(createGoogleMapsDirectionsUrl(place.location, pickText(place.title, locale))) : openAddressInMaps(place.address))} />
        <ActionPill label={copy.share} variant="secondary" onPress={() => void Share.share({ message: shareText || pickText(place.title, locale) })} />
        {!isGuest ? <ActionPill label={copy.favorite} variant="secondary" onPress={() => void handleToggleFavorite()} disabled={pendingFavorite} /> : null}
      </ActionRow>
      {actionStatus ? <Text style={styles.detailActionStatus}>{actionStatus}</Text> : null}
      {isGuest ? <Text style={styles.emptyText}>{copy.guestLocked}</Text> : null}

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>{copy.placeInfo}</Text>
        <DetailLinkRow icon="call-outline" label={copy.phone} value={compactValue(place.phone)} onPress={() => openPhoneNumber(place.phone)} />
        <DetailLinkRow icon="location-outline" label={copy.address} value={compactValue(place.address)} onPress={() => openAddressInMaps(place.address)} />
        <DetailLinkRow icon="globe-outline" label={copy.website} value={compactValue(place.website)} onPress={() => openExternalUrl(place.website)} />
        <DetailLinkRow icon="mail-outline" label={copy.email} value={compactValue(place.email)} onPress={() => openEmailAddress(place.email)} />
        <DetailLinkRow icon="menu-outline" label={copy.menu} value={compactValue(place.menuUrl)} onPress={() => openExternalUrl(place.menuUrl)} />
        <DetailLinkRow icon="time-outline" label={copy.workingHours} value={openingHours} />
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>{copy.mapTitle}</Text>
        {mapUrl ? (
          <ImageBackground source={{ uri: mapUrl }} style={{ height: 190, borderRadius: 18, overflow: "hidden" }} imageStyle={{ borderRadius: 18 }} />
        ) : (
          <ActionPill label={copy.openMap} onPress={() => openAddressInMaps(place.address)} />
        )}
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>{copy.extra}</Text>
        <DetailLinkRow icon="share-outline" label={copy.socialMedia} value={socialLinks.length ? socialLinks.join(" · ") : copy.unspecified} />
        <DetailLinkRow icon="navigate-outline" label={copy.directions} value={copy.mapLabel} onPress={() => (place.location ? openExternalUrl(createGoogleMapsDirectionsUrl(place.location, pickText(place.title, locale))) : openAddressInMaps(place.address))} />
      </View>
    </ScrollView>
  );
}

function pickText(value: unknown, locale: DetailLocale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const record = value as Record<string, string | undefined>;
  return record[locale] ?? record.tr ?? record.en ?? "";
}
