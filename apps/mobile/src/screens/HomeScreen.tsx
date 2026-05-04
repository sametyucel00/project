import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { ancientGuideStops, timeBasedDiscovery, touristSurvivalKit, type AncientGuideStop, type SurvivalKitItem } from "@nar/core";
import { SearchBar, Section, StoryRail, WideItem } from "../components/ui";
import { getMobileLocale } from "../locale";
import { fetchAncientGuideStops, fetchTouristSurvivalKit } from "../services";
import { styles } from "../styles";
import { theme } from "../theme";
import { compareDistance, resolveDistanceLabel } from "../utils/location";
import type { MobileScreenProps } from "./types";
import { useEffect, useMemo, useState } from "react";

type TimeKey = "morning" | "noon" | "evening" | "night";
type StoryKey = "Tiyatro" | "Kahve" | "Antik" | "Acil";

const timeColors: Record<TimeKey, string> = {
  morning: "#d86f3f",
  noon: "#c63f2e",
  evening: "#276b73",
  night: "#11151b"
};

const staticStoryActions: Record<StoryKey, { label: string; description: string }> = {
  Tiyatro: { label: "Etkinlikler", description: "Tiyatro ve sahne programlarını aç" },
  Kahve: { label: "Mekanlar", description: "Kahve ve mola noktalarını göster" },
  Antik: { label: "Antik Rehber", description: "Tarihi durakları aç" },
  Acil: { label: "Turist Destek Rehberi", description: "Acil ve konsolosluk bilgilerini aç" }
};

const homeLabels = {
  tr: { todayEvents: "Bugünkü etkinlikler", noTodayEvents: "Bugün için kayıtlı etkinlik bulunmuyor.", nearbyPlaces: "Yakındaki mekanlar", noPlaces: "Aramana uygun mekan bulunamadı.", paid: "Ücretli", free: "Ücretsiz", noRating: "Puan belirtilmemiş" },
  en: { todayEvents: "Today's events", noTodayEvents: "No events listed for today.", nearbyPlaces: "Nearby places", noPlaces: "No places match your search.", paid: "Paid", free: "Free", noRating: "Rating not specified" },
  ru: { todayEvents: "События сегодня", noTodayEvents: "На сегодня событий нет.", nearbyPlaces: "Места рядом", noPlaces: "Места по запросу не найдены.", paid: "Платно", free: "Бесплатно", noRating: "Рейтинг не указан" },
  de: { todayEvents: "Heutige Veranstaltungen", noTodayEvents: "Für heute sind keine Veranstaltungen gelistet.", nearbyPlaces: "Orte in der Nähe", noPlaces: "Keine passenden Orte gefunden.", paid: "Kostenpflichtig", free: "Kostenlos", noRating: "Bewertung nicht angegeben" }
} as const;

const homeStoryActions = {
  tr: staticStoryActions,
  en: {
    Tiyatro: { label: "Events", description: "Open theater and stage programs" },
    Kahve: { label: "Places", description: "Show coffee and break spots" },
    Antik: { label: "Ancient Guide", description: "Open historical stops" },
    Acil: { label: "Tourist Support", description: "Open emergency and consulate info" }
  },
  ru: {
    Tiyatro: { label: "События", description: "Открыть театры и сцены" },
    Kahve: { label: "Места", description: "Показать кофе и места для перерыва" },
    Antik: { label: "Античный гид", description: "Открыть исторические места" },
    Acil: { label: "Помощь туристу", description: "Открыть экстренные и консульские данные" }
  },
  de: {
    Tiyatro: { label: "Veranstaltungen", description: "Theater- und Bühnenprogramm öffnen" },
    Kahve: { label: "Orte", description: "Kaffee- und Pausenorte anzeigen" },
    Antik: { label: "Antiker Guide", description: "Historische Stationen öffnen" },
    Acil: { label: "Touristenhilfe", description: "Notfall- und Konsulatsinfos öffnen" }
  }
} as const;

export function getTimeDiscovery() {
  const hour = new Date().getHours();
  const key: TimeKey = hour < 11 ? "morning" : hour < 16 ? "noon" : hour < 22 ? "evening" : "night";
  return { key, ...timeBasedDiscovery[key] };
}

export function HomeScreen({ feed, userLocation, onOpenPlace, onOpenEvent, onOpenTab, onOpenTouristGuide, onOpenAncientGuide, onOpenOffer }: MobileScreenProps) {
  const locale = getMobileLocale();
  const labels = homeLabels[locale] ?? homeLabels.tr;
  const discovery = getTimeDiscovery();
  const [query, setQuery] = useState("");
  const [activeStory, setActiveStory] = useState<string | undefined>();
  const [touristItems, setTouristItems] = useState<SurvivalKitItem[]>(touristSurvivalKit);
  const [ancientStops, setAncientStops] = useState<AncientGuideStop[]>(ancientGuideStops);

  useEffect(() => {
    let active = true;

    async function loadMiniModules() {
      try {
        const [liveTouristItems, liveAncientStops] = await Promise.all([
          fetchTouristSurvivalKit(12),
          fetchAncientGuideStops(12)
        ]);
        if (!active) return;
        setTouristItems(liveTouristItems.length ? liveTouristItems : touristSurvivalKit);
        setAncientStops(liveAncientStops.length ? liveAncientStops : ancientGuideStops);
      } catch {
        if (!active) return;
        setTouristItems(touristSurvivalKit);
        setAncientStops(ancientGuideStops);
      }
    }

    void loadMiniModules();

    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = normalize(query);
  const todayEvents = useMemo(() => feed.events
    .filter((event) => isToday(event.startsAt))
    .filter((event) => matchesText([pickText(event.title, locale), pickText(event.description, locale), event.venueName, event.district], normalizedQuery))
    .slice(0, 8), [feed.events, locale, normalizedQuery]);

  const nearbyPlaces = useMemo(() => feed.places
    .filter((place) => matchesText([pickText(place.title, locale), pickText(place.description, locale), place.district, place.categoryId], normalizedQuery))
    .sort((left, right) => compareDistance(userLocation, left, right))
    .slice(0, 5), [feed.places, locale, normalizedQuery, userLocation]);

  const selectedStory = isStoryKey(activeStory) ? (homeStoryActions[locale] ?? homeStoryActions.tr)[activeStory] : null;

  function handleStorySelect(story: string) {
    setActiveStory(story);
    if (story === "Antik") {
      onOpenAncientGuide?.();
      return;
    }
    if (story === "Acil") {
      onOpenTouristGuide?.();
      return;
    }
    if (story === "Tiyatro") {
      onOpenTab?.("Etkinlikler");
      return;
    }
    if (story === "Kahve") {
      onOpenTab?.("Mekanlar");
      return;
    }
    onOpenOffer?.(story);
  }

  return (
    <>
      <SearchBar value={query} onChangeText={setQuery} />
      <View style={[styles.timeCard, { backgroundColor: timeColors[discovery.key] }]}>
        <Ionicons
          name={discovery.key === "morning" ? "sunny-outline" : discovery.key === "noon" ? "partly-sunny-outline" : discovery.key === "evening" ? "sunny-outline" : "moon-outline"}
          size={24}
          color={theme.coloredText}
        />
        <Text style={styles.timeLabel}>{discovery.label}</Text>
        <Text style={styles.timeTitle}>{discovery.title}</Text>
        <Text style={styles.timeFilters}>{discovery.filters.join(" · ")}</Text>
      </View>
      <StoryRail offers={feed.offers.slice(0, 2)} activeStory={activeStory} onSelect={handleStorySelect} />
      {selectedStory ? (
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>{selectedStory.label}</Text>
          <Text style={styles.profileText}>{selectedStory.description}</Text>
        </View>
      ) : null}
      <Section title={labels.todayEvents}>
        {todayEvents.length ? todayEvents.map((event) => (
          <WideItem key={event.id} image={event.coverImage} title={pickText(event.title, locale)} meta={`${event.venueName} · ${event.priceType === "paid" ? labels.paid : labels.free}`} onPress={() => onOpenEvent?.(event.id)} />
        )) : <Text style={styles.emptyText}>{labels.noTodayEvents}</Text>}
      </Section>
      <Section title={labels.nearbyPlaces}>
        {nearbyPlaces.length ? nearbyPlaces.map((place) => (
          <WideItem key={place.id} image={place.coverImage} title={pickText(place.title, locale)} meta={`${place.district} · ${place.googleRating ?? labels.noRating} · ${resolveDistanceLabel(userLocation, place)}`} onPress={() => onOpenPlace?.(place.id)} />
        )) : <Text style={styles.emptyText}>{labels.noPlaces}</Text>}
      </Section>
    </>
  );
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchesText(values: string[], query: string) {
  if (!query.trim()) return true;
  return normalize(values.join(" ")).includes(query);
}

function isStoryKey(value: string | undefined): value is StoryKey {
  return value === "Tiyatro" || value === "Kahve" || value === "Antik" || value === "Acil";
}

function pickText(value: unknown, locale: string) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const record = value as Record<string, string | undefined>;
  return record[locale] ?? record.tr ?? record.en ?? "";
}
