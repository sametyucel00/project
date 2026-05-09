import { compactValue, featuredOffers } from "@nar/core";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { FilterRow, OfferItem, SearchBar, StoryRail } from "../components/ui";
import { perfMark, perfMeasure } from "../services/perf";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";

const offerFilters = ["Tümü", "QR ile", "Puanla", "Sınırlı", "Öne çıkan"];

export function OffersScreen({ feed, onOpenOffer, onOpenTab, onOpenAncientGuide, onOpenTouristGuide }: MobileScreenProps) {
  const [query, setQuery] = useState("");
  const [activeStory, setActiveStory] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState("Tümü");
  const [visibleCount, setVisibleCount] = useState(10);
  const deferredQuery = useDeferredValue(query);

  const mergedOffers = useMemo(() => mergeOffers(feed.offers, featuredOffers), [feed.offers]);

  const filteredOffers = useMemo(
    () =>
      mergedOffers.filter((offer) => {
        const haystack = normalize([offer.title.tr, offer.description.tr, offer.conditions.tr, offer.discountLabel].join(" "));
        if (deferredQuery.trim() && !haystack.includes(normalize(deferredQuery))) return false;
        if (activeFilter === "QR ile" && !offer.requiresQr) return false;
        if (activeFilter === "Puanla" && !offer.pointCost) return false;
        if (activeFilter === "Sınırlı" && !offer.useLimit) return false;
        if (activeFilter === "Öne çıkan" && !offer.featured && !offer.storyEnabled) return false;
        return true;
      }),
    [activeFilter, deferredQuery, mergedOffers]
  );

  const firstOffer = filteredOffers[0];
  const remainingUse = firstOffer?.useLimit ? Math.max(firstOffer.useLimit - (firstOffer.usedCount ?? 0), 0) : null;
  const visibleOffers = useMemo(() => filteredOffers.slice(0, visibleCount), [filteredOffers, visibleCount]);

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
          <FilterRow filters={offerFilters} activeFilter={activeFilter} onSelect={setActiveFilter} />
          <Text style={styles.sectionTitle}>{`Nar fırsatları (${filteredOffers.length})`}</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.emptyText}>Seçtiğin filtreye uygun fırsat bulunamadı.</Text>}
      ListFooterComponent={
        firstOffer ? (
          <Text style={[styles.emptyText, { paddingHorizontal: 18 }]}>
            {`Seçili fırsat: ${firstOffer.title.tr} · indirim ${firstOffer.discountLabel} · kalan ${compactValue(remainingUse)}`}
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
