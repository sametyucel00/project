import { ImageBackground, Text, View } from "react-native";
import { ScrollView } from "react-native";
import { compactValue, createGoogleMapsDirectionsUrl } from "@nar/core";
import { ActionPill, ActionRow, DetailLinkRow, StatStrip } from "../components/ui";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { openAddressInMaps, openExternalUrl, openPhoneNumber } from "../utils/links";
import { speakText } from "../utils/speech";
import { ancientGuideDetails, touristGuideDetails } from "../data/guideData";
import { getMobileLocale } from "../locale";

type GuideLocale = "tr" | "en" | "ru" | "de";

const guideCopy = {
  tr: {
    back: "Geri",
    touristTitle: "Turist Destek Rehberi",
    record: "Kayıt",
    emergency: "Acil",
    consulate: "Konsolosluk",
    phone: "Telefon",
    address: "Adres",
    hours: "Saat",
    website: "Web",
    unspecified: "Belirtilmemiş",
    readTr: "Türkçe oku",
    readEn: "İngilizce oku",
    ancientTitle: "Antik Rehber",
    stop: "Durak",
    city: "Şehir",
    audio: "Sesli",
    district: "İlçe",
    directions: "Yol tarifi",
    link: "Bağlantı",
    trAudio: "TR ses",
    enAudio: "EN ses",
    ruAudio: "RU ses",
    deAudio: "DE ses"
  },
  en: {
    back: "Back",
    touristTitle: "Tourist Support Guide",
    record: "Entries",
    emergency: "Emergency",
    consulate: "Consulate",
    phone: "Phone",
    address: "Address",
    hours: "Hours",
    website: "Website",
    unspecified: "Not specified",
    readTr: "Read in Turkish",
    readEn: "Read in English",
    ancientTitle: "Ancient Guide",
    stop: "Stops",
    city: "City",
    audio: "Audio",
    district: "District",
    directions: "Directions",
    link: "Link",
    trAudio: "TR audio",
    enAudio: "EN audio",
    ruAudio: "RU audio",
    deAudio: "DE audio"
  },
  ru: {
    back: "Назад",
    touristTitle: "Гид помощи туристам",
    record: "Записи",
    emergency: "Экстренно",
    consulate: "Консульство",
    phone: "Телефон",
    address: "Адрес",
    hours: "Часы",
    website: "Веб",
    unspecified: "Не указано",
    readTr: "Читать по-турецки",
    readEn: "Читать по-английски",
    ancientTitle: "Античный гид",
    stop: "Остановки",
    city: "Город",
    audio: "Аудио",
    district: "Район",
    directions: "Маршрут",
    link: "Ссылка",
    trAudio: "TR аудио",
    enAudio: "EN аудио",
    ruAudio: "RU аудио",
    deAudio: "DE аудио"
  },
  de: {
    back: "Zurück",
    touristTitle: "Touristenhilfe",
    record: "Einträge",
    emergency: "Notfall",
    consulate: "Konsulat",
    phone: "Telefon",
    address: "Adresse",
    hours: "Uhrzeit",
    website: "Web",
    unspecified: "Nicht angegeben",
    readTr: "Auf Türkisch lesen",
    readEn: "Auf Englisch lesen",
    ancientTitle: "Antiker Guide",
    stop: "Stationen",
    city: "Stadt",
    audio: "Audio",
    district: "Bezirk",
    directions: "Wegbeschreibung",
    link: "Link",
    trAudio: "TR Audio",
    enAudio: "EN Audio",
    ruAudio: "RU Audio",
    deAudio: "DE Audio"
  }
} as const;

export function GuideScreen({ onBack, mode }: MobileScreenProps & { mode: "tourist" | "ancient"; onBack: () => void }) {
  const locale = (getMobileLocale() as GuideLocale) ?? "tr";
  const copy = guideCopy[locale] ?? guideCopy.tr;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
      <ActionRow>
        <ActionPill label={copy.back} variant="secondary" onPress={onBack} />
      </ActionRow>
      {mode === "tourist" ? <TouristGuide /> : <AncientGuide />}
    </ScrollView>
  );
}

function TouristGuide() {
  const locale = (getMobileLocale() as GuideLocale) ?? "tr";
  const copy = guideCopy[locale] ?? guideCopy.tr;
  const visibleItems = touristGuideDetails.filter((item) => item.category === "emergency" || item.category === "consulate");
  return (
    <View>
      <Text style={styles.sectionTitle}>{copy.touristTitle}</Text>
      <StatStrip items={[
        [copy.record, String(visibleItems.length)],
        [copy.emergency, "112"],
        [copy.consulate, copy.link]
      ]} />
      {visibleItems.map((item) => (
        <View key={item.id} style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{pickText(item.title, locale)}</Text>
          <Text style={styles.profileText}>{pickText(item.description, locale)}</Text>
          <Text style={styles.profileText}>{pickText(item.info, locale)}</Text>
          <DetailLinkRow icon="call-outline" label={copy.phone} value={compactValue(item.phone)} onPress={() => openPhoneNumber(item.phone)} />
          <DetailLinkRow icon="location-outline" label={copy.address} value={compactValue(item.address)} onPress={() => openAddressInMaps(item.address)} />
          <DetailLinkRow icon="time-outline" label={copy.hours} value={item.hours ?? copy.unspecified} />
          <DetailLinkRow icon="globe-outline" label={copy.website} value={item.website ?? copy.unspecified} onPress={() => openExternalUrl(item.website)} />
          <ActionRow>
            <ActionPill label={copy.readTr} variant="secondary" onPress={() => speakText(`${pickText(item.title, "tr")}. ${pickText(item.description, "tr")}. ${pickText(item.info, "tr")}`, "tr-TR")} />
            <ActionPill label={copy.readEn} variant="secondary" onPress={() => speakText(`${pickText(item.title, "en")}. ${pickText(item.description, "en")}. ${pickText(item.info, "en")}`, "en-US")} />
          </ActionRow>
        </View>
      ))}
    </View>
  );
}

function AncientGuide() {
  const locale = (getMobileLocale() as GuideLocale) ?? "tr";
  const copy = guideCopy[locale] ?? guideCopy.tr;
  return (
    <View>
      <Text style={styles.sectionTitle}>{copy.ancientTitle}</Text>
      <StatStrip items={[
        [copy.stop, String(ancientGuideDetails.length)],
        [copy.city, "Antalya"],
        [copy.audio, "TR / EN / RU / DE"]
      ]} />
      {ancientGuideDetails.map((item) => {
        const mapUrl = item.location ? createGoogleMapsDirectionsUrl(item.location, item.title.tr) : "";
        return (
          <View key={item.id} style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>{pickText(item.title, locale)}</Text>
            <Text style={styles.profileText}>{pickText(item.description, locale)}</Text>
            <Text style={styles.profileText}>{pickText(item.history, locale)}</Text>
            <DetailLinkRow icon="location-outline" label={copy.address} value={item.address} onPress={() => openAddressInMaps(item.address)} />
            <DetailLinkRow icon="business-outline" label={copy.district} value={`${item.district} · ${item.era}`} />
            <DetailLinkRow icon="navigate-outline" label={copy.directions} value={copy.link} onPress={() => mapUrl ? openExternalUrl(mapUrl) : openAddressInMaps(item.address)} />
            {item.image ? (
              <ImageBackground source={{ uri: item.image }} style={{ height: 170, borderRadius: 18, overflow: "hidden", marginTop: 6 }} imageStyle={{ borderRadius: 18 }} />
            ) : null}
            <Text style={styles.profileText}>{pickText(item.visitingTip, locale)}</Text>
            <ActionRow>
              <ActionPill label={copy.trAudio} variant="secondary" onPress={() => speakText(`${pickText(item.title, "tr")}. ${pickText(item.history, "tr")}. ${pickText(item.visitingTip, "tr")}`, "tr-TR")} />
              <ActionPill label={copy.enAudio} variant="secondary" onPress={() => speakText(`${pickText(item.title, "en")}. ${pickText(item.history, "en")}. ${pickText(item.visitingTip, "en")}`, "en-US")} />
              <ActionPill label={copy.ruAudio} variant="secondary" onPress={() => speakText(`${pickText(item.title, "ru")}. ${pickText(item.history, "ru")}. ${pickText(item.visitingTip, "ru")}`, "ru-RU")} />
              <ActionPill label={copy.deAudio} variant="secondary" onPress={() => speakText(`${pickText(item.title, "de")}. ${pickText(item.history, "de")}. ${pickText(item.visitingTip, "de")}`, "de-DE")} />
            </ActionRow>
          </View>
        );
      })}
    </View>
  );
}

function pickText(value: unknown, locale: GuideLocale) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const record = value as Record<string, string | undefined>;
  return record[locale] ?? record.tr ?? record.en ?? "";
}
