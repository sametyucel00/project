import { Pressable, Text } from "react-native";
import { compactValue } from "@nar/core";
import { FilterRow, OfferItem, SearchBar, Section, StoryRail } from "../components/ui";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { useEffect, useMemo, useState } from "react";

const offerFilters = ["Tümü", "QR ile", "Puanla", "Sınırlı", "Öne çıkan"];

export function OffersScreen({ feed, onOpenOffer }: MobileScreenProps) {
  const [query, setQuery] = useState("");
  const [activeStory, setActiveStory] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState("Tümü");
  const [renderLimit, setRenderLimit] = useState(24);

  const filteredOffers = useMemo(() => feed.offers.filter((offer) => {
    const haystack = normalize([offer.title.tr, offer.description.tr, offer.conditions.tr, offer.discountLabel].join(" "));
    if (query.trim() && !haystack.includes(normalize(query))) return false;
    if (activeFilter === "QR ile" && !offer.requiresQr) return false;
    if (activeFilter === "Puanla" && !offer.pointCost) return false;
    if (activeFilter === "Sınırlı" && !offer.useLimit) return false;
    if (activeFilter === "Öne çıkan" && !offer.featured && !offer.storyEnabled) return false;
    return true;
  }), [activeFilter, feed.offers, query]);

  useEffect(() => {
    setRenderLimit(24);
  }, [activeFilter, query]);

  const firstOffer = filteredOffers[0];
  const remainingUse = firstOffer?.useLimit ? Math.max(firstOffer.useLimit - (firstOffer.usedCount ?? 0), 0) : null;

  function handleStorySelect(story: string) {
    setActiveStory(story);
    onOpenOffer?.(story);
  }

  return (
    <>
      <SearchBar value={query} onChangeText={setQuery} />
      <StoryRail offers={feed.offers.slice(0, 5)} activeStory={activeStory} onSelect={handleStorySelect} />
      <FilterRow filters={offerFilters} activeFilter={activeFilter} onSelect={setActiveFilter} />
      <Section title={`Nar fırsatları (${filteredOffers.length})`}>
        {filteredOffers.length ? filteredOffers.slice(0, renderLimit).map((offer) => (
          <OfferItem key={offer.id} title={offer.title.tr} discount={offer.discountLabel} meta={offer.conditions.tr} onPress={() => onOpenOffer?.(offer.id)} />
        )) : <Text style={styles.emptyText}>Seçtiğin filtreye uygun fırsat bulunamadı.</Text>}
        {filteredOffers.length > renderLimit ? (
          <Pressable accessibilityRole="button" onPress={() => setRenderLimit((current) => current + 24)} style={[styles.actionPill, styles.actionPillSecondary]}>
            <Text style={styles.actionPillTextSecondary}>Daha fazla göster</Text>
          </Pressable>
        ) : null}
      </Section>
      {firstOffer ? (
        <Text style={styles.emptyText}>{`Seçili fırsat: ${firstOffer.title.tr} · indirim ${firstOffer.discountLabel} · kalan ${compactValue(remainingUse)}`}</Text>
      ) : null}
    </>
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
