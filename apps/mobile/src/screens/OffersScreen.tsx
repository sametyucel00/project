import { compactValue, featuredOffers } from "@nar/core";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { FilterRow, OfferItem, SearchBar, StoryRail } from "../components/ui";
import { getMobileLocale } from "../locale";
import { perfMark, perfMeasure } from "../services/perf";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";

const hiddenOfferIds = new Set(["coffee-qr-week"]);

type OfferFilterId = "all" | "qr" | "points" | "limited" | "featured";

const offerCopy = {
  tr: {
    filters: [
      { id: "all" as const, label: "Tümü" },
      { id: "qr" as const, label: "QR ile" },
      { id: "points" as const, label: "Puanla" },
      { id: "limited" as const, label: "Sınırlı" },
      { id: "featured" as const, label: "Öne çıkan" }
    ],
    title: "Nar fırsatları",
    empty: "Seçtiğin filtreye uygun fırsat bulunamadı.",
    selected: "Seçili fırsat",
    discount: "indirim",
    remaining: "kalan",
    featured: "Öne çıkan",
    standard: "Standart"
  },
  en: {
    filters: [
      { id: "all" as const, label: "All" },
      { id: "qr" as const, label: "QR" },
      { id: "points" as const, label: "By points" },
      { id: "limited" as const, label: "Limited" },
      { id: "featured" as const, label: "Featured" }
    ],
    title: "Nar offers",
    empty: "No offers match your filters.",
    selected: "Selected offer",
    discount: "discount",
    remaining: "remaining",
    featured: "Featured",
    standard: "Standard"
  },
  ru: {
    filters: [
      { id: "all" as const, label: "Все" },
      { id: "qr" as const, label: "QR" },
      { id: "points" as const, label: "За баллы" },
      { id: "limited" as const, label: "Ограниченные" },
      { id: "featured" as const, label: "Рекомендуемые" }
    ],
    title: "Предложения Nar",
    empty: "По выбранным фильтрам предложения не найдены.",
    selected: "Выбранное предложение",
    discount: "скидка",
    remaining: "осталось",
    featured: "Рекомендуется",
    standard: "Обычное"
  },
  de: {
    filters: [
      { id: "all" as const, label: "Alle" },
      { id: "qr" as const, label: "QR" },
      { id: "points" as const, label: "Mit Punkten" },
      { id: "limited" as const, label: "Begrenzt" },
      { id: "featured" as const, label: "Empfohlen" }
    ],
    title: "Nar-Angebote",
    empty: "Keine Angebote passen zu deinen Filtern.",
    selected: "Ausgewähltes Angebot",
    discount: "Rabatt",
    remaining: "übrig",
    featured: "Empfohlen",
    standard: "Standard"
  }
} as const;

export function OffersScreen({ feed, onOpenOffer, onOpenTab, onOpenAncientGuide, onOpenTouristGuide }: MobileScreenProps) {
  const locale = getMobileLocale();
  const copy = offerCopy[locale] ?? offerCopy.tr;
  const [query, setQuery] = useState("");
  const [activeStory, setActiveStory] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState<OfferFilterId>("all");
  const [visibleCount, setVisibleCount] = useState(10);
  const deferredQuery = useDeferredValue(query);

  const mergedOffers = useMemo(
    () => mergeOffers(feed.offers.filter((offer) => !hiddenOfferIds.has(offer.id)), featuredOffers.filter((offer) => !hiddenOfferIds.has(offer.id))),
    [feed.offers]
  );

  const filteredOffers = useMemo(
    () =>
      mergedOffers.filter((offer) => {
        const haystack = normalize([offer.title.tr, offer.description.tr, offer.conditions.tr, offer.discountLabel].join(" "));
        if (deferredQuery.trim() && !haystack.includes(normalize(deferredQuery))) return false;
        if (activeFilter === "qr" && !offer.requiresQr) return false;
        if (activeFilter === "points" && !offer.pointCost) return false;
        if (activeFilter === "limited" && !offer.useLimit) return false;
        if (activeFilter === "featured" && !offer.featured && !offer.storyEnabled) return false;
        return true;
      }),
    [activeFilter, deferredQuery, mergedOffers]
  );

  const firstOffer = filteredOffers[0];
  const remainingUse = firstOffer?.useLimit ? Math.max(firstOffer.useLimit - (firstOffer.usedCount ?? 0), 0) : null;
  const visibleOffers = useMemo(() => filteredOffers.slice(0, visibleCount), [filteredOffers, visibleCount]);

  useEffect(() => {
    setActiveFilter("all");
  }, [locale]);

  useEffect(() => {
    perfMark("offers:screenMount");
    perfMeasure("offers:navigationToMount", "nav:Fırsatlar:press");
    queueMicrotask(() => {
      perfMark("offers:firstPaint");
      perfMeasure("offers:mountToFirstPaint", "offers:screenMount");
      perfMeasure("offers:navigationToFirstPaint", "nav:Fırsatlar:press");
    });
  }, []);

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

  useEffect(() => {
    setVisibleCount(Math.min(10, filteredOffers.length));
  }, [filteredOffers.length]);

  return (
    <FlatList
      data={visibleOffers}
      keyExtractor={(offer) => offer.id}
      renderItem={({ item: offer }) => (
        <OfferItem title={offer.title.tr} discount={offer.discountLabel} meta={offer.conditions.tr} onPress={() => onOpenOffer?.(offer.id)} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 18 }}>
          <SearchBar value={query} onChangeText={setQuery} />
          <StoryRail offers={mergedOffers.slice(0, 5)} activeStory={activeStory} onSelect={handleStorySelect} />
          <FilterRow filters={copy.filters.map((filter) => filter.label)} activeFilter={(copy.filters.find((filter) => filter.id === activeFilter)?.label ?? copy.filters[0].label)} onSelect={(label) => {
            const next = copy.filters.find((filter) => filter.label === label)?.id ?? "all";
            setActiveFilter(next);
          }} />
          <Text style={styles.sectionTitle}>{`${copy.title} (${filteredOffers.length})`}</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.emptyText}>{copy.empty}</Text>}
      ListFooterComponent={
        firstOffer ? (
          <Text style={[styles.emptyText, { paddingHorizontal: 18 }]}>
            {`${copy.selected}: ${firstOffer.title.tr} · ${copy.discount} ${firstOffer.discountLabel} · ${copy.remaining} ${compactValue(remainingUse)}`}
          </Text>
        ) : null
      }
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 18 }}
      showsVerticalScrollIndicator={false}
      onEndReached={() => setVisibleCount((current) => Math.min(filteredOffers.length, current + 24))}
      onEndReachedThreshold={0.35}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function mergeOffers(first: typeof featuredOffers, second: typeof featuredOffers) {
  const seen = new Set<string>();
  const merged: typeof featuredOffers = [];
  for (const item of [...first, ...second]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}
