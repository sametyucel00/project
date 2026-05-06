import { Text, View, FlatList } from "react-native";
import { compactValue } from "@nar/core";
import { FilterRow, OfferItem, SearchBar, StoryRail } from "../components/ui";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { useDeferredValue, useMemo, useState } from "react";

const offerFilters = ["Tümü", "QR ile", "Puanla", "Sınırlı", "Öne çıkan"];

export function OffersScreen({ feed, onOpenOffer }: MobileScreenProps) {
  const [query, setQuery] = useState("");
  const [activeStory, setActiveStory] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState("Tümü");
  const deferredQuery = useDeferredValue(query);

  const filteredOffers = useMemo(
    () =>
      feed.offers.filter((offer) => {
        const haystack = normalize([offer.title.tr, offer.description.tr, offer.conditions.tr, offer.discountLabel].join(" "));
        if (deferredQuery.trim() && !haystack.includes(normalize(deferredQuery))) return false;
        if (activeFilter === "QR ile" && !offer.requiresQr) return false;
        if (activeFilter === "Puanla" && !offer.pointCost) return false;
        if (activeFilter === "Sınırlı" && !offer.useLimit) return false;
        if (activeFilter === "Öne çıkan" && !offer.featured && !offer.storyEnabled) return false;
        return true;
      }),
    [activeFilter, deferredQuery, feed.offers]
  );

  const firstOffer = filteredOffers[0];
  const remainingUse = firstOffer?.useLimit ? Math.max(firstOffer.useLimit - (firstOffer.usedCount ?? 0), 0) : null;

  function handleStorySelect(story: string) {
    setActiveStory(story);
    onOpenOffer?.(story);
  }

  return (
    <FlatList
      data={filteredOffers}
      keyExtractor={(offer) => offer.id}
      renderItem={({ item: offer }) => (
        <OfferItem title={offer.title.tr} discount={offer.discountLabel} meta={offer.conditions.tr} onPress={() => onOpenOffer?.(offer.id)} />
      )}
      ListHeaderComponent={(
        <View style={{ paddingHorizontal: 18 }}>
          <SearchBar value={query} onChangeText={setQuery} />
          <StoryRail offers={feed.offers.slice(0, 5)} activeStory={activeStory} onSelect={handleStorySelect} />
          <FilterRow filters={offerFilters} activeFilter={activeFilter} onSelect={setActiveFilter} />
          <Text style={styles.sectionTitle}>{`Nar fırsatları (${filteredOffers.length})`}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>Seçtiğin filtreye uygun fırsat bulunamadı.</Text>}
      ListFooterComponent={firstOffer ? <Text style={[styles.emptyText, { paddingHorizontal: 18 }]}>{`Seçili fırsat: ${firstOffer.title.tr} · indirim ${firstOffer.discountLabel} · kalan ${compactValue(remainingUse)}`}</Text> : null}
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 18 }}
      showsVerticalScrollIndicator={false}
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
