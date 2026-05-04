import { ImageBackground, Text, View } from "react-native";
import { compactValue, createGoogleMapsDirectionsUrl } from "@nar/core";
import { ActionPill, ActionRow, DetailLinkRow, StatStrip } from "../components/ui";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { openAddressInMaps, openExternalUrl, openPhoneNumber } from "../utils/links";
import { speakText } from "../utils/speech";
import { ancientGuideDetails, touristGuideDetails } from "../data/guideData";

export function GuideScreen({ onBack, mode }: MobileScreenProps & { mode: "tourist" | "ancient"; onBack: () => void }) {
  return (
    <View>
      <ActionRow>
        <ActionPill label="Geri" variant="secondary" onPress={onBack} />
      </ActionRow>
      {mode === "tourist" ? <TouristGuide /> : <AncientGuide />}
    </View>
  );
}

function TouristGuide() {
  const visibleItems = touristGuideDetails.filter((item) => item.category === "emergency" || item.category === "consulate");
  return (
    <View>
      <Text style={styles.sectionTitle}>Turist Destek Rehberi</Text>
      <StatStrip items={[
        ["Kayıt", String(visibleItems.length)],
        ["Acil", "112"],
        ["Konsolosluk", "Resmi iletişim"]
      ]} />
      {visibleItems.map((item) => (
        <View key={item.id} style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{item.title.tr}</Text>
          <Text style={styles.profileText}>{item.description.tr}</Text>
          <Text style={styles.profileText}>{item.info.tr}</Text>
          <DetailLinkRow icon="call-outline" label="Telefon" value={compactValue(item.phone)} onPress={() => openPhoneNumber(item.phone)} />
          <DetailLinkRow icon="location-outline" label="Adres" value={compactValue(item.address)} onPress={() => openAddressInMaps(item.address)} />
          <DetailLinkRow icon="time-outline" label="Saat" value={item.hours ?? "Belirtilmemiş"} />
          <DetailLinkRow icon="globe-outline" label="Web" value={item.website ?? "Belirtilmemiş"} onPress={() => openExternalUrl(item.website)} />
          <ActionRow>
            <ActionPill label="Türkçe oku" variant="secondary" onPress={() => speakText(`${item.title.tr}. ${item.description.tr}. ${item.info.tr}`, "tr-TR")} />
            <ActionPill label="İngilizce oku" variant="secondary" onPress={() => speakText(`${item.title.en}. ${item.description.en}. ${item.info.en}`, "en-US")} />
          </ActionRow>
        </View>
      ))}
    </View>
  );
}

function AncientGuide() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Antik Rehber</Text>
      <StatStrip items={[
        ["Durak", String(ancientGuideDetails.length)],
        ["Şehir", "Antalya"],
        ["Sesli", "TR / EN / RU / DE"]
      ]} />
      {ancientGuideDetails.map((item) => {
        const mapUrl = item.location ? createGoogleMapsDirectionsUrl(item.location, item.title.tr) : "";
        return (
          <View key={item.id} style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>{item.title.tr}</Text>
            <Text style={styles.profileText}>{item.description.tr}</Text>
            <Text style={styles.profileText}>{item.history.tr}</Text>
            <DetailLinkRow icon="location-outline" label="Adres" value={item.address} onPress={() => openAddressInMaps(item.address)} />
            <DetailLinkRow icon="business-outline" label="İlçe" value={`${item.district} · ${item.era}`} />
            <DetailLinkRow icon="navigate-outline" label="Yol tarifi" value="Bağlantı" onPress={() => mapUrl ? openExternalUrl(mapUrl) : openAddressInMaps(item.address)} />
            {item.image ? (
              <ImageBackground source={{ uri: item.image }} style={{ height: 170, borderRadius: 18, overflow: "hidden", marginTop: 6 }} imageStyle={{ borderRadius: 18 }} />
            ) : null}
            <Text style={styles.profileText}>{item.visitingTip.tr}</Text>
            <ActionRow>
              <ActionPill label="TR ses" variant="secondary" onPress={() => speakText(`${item.title.tr}. ${item.history.tr}. ${item.visitingTip.tr}`, "tr-TR")} />
              <ActionPill label="EN ses" variant="secondary" onPress={() => speakText(`${item.title.en}. ${item.history.en}. ${item.visitingTip.en}`, "en-US")} />
              <ActionPill label="RU ses" variant="secondary" onPress={() => speakText(`${item.title.ru}. ${item.history.ru}. ${item.visitingTip.ru}`, "ru-RU")} />
              <ActionPill label="DE ses" variant="secondary" onPress={() => speakText(`${item.title.de}. ${item.history.de}. ${item.visitingTip.de}`, "de-DE")} />
            </ActionRow>
          </View>
        );
      })}
    </View>
  );
}
