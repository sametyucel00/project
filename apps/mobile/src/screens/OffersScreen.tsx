import { Text } from "react-native";
import { compactValue } from "@nar/core";
import { FilterRow, OfferItem, SearchBar, Section, StoryRail } from "../components/ui";
import { styles } from "../styles";
import type { MobileScreenProps } from "./types";
import { useDeferredValue, useMemo, useState } from "react";

const offerFilters = ["TÃ¼mÃ¼", "QR ile", "Puanla", "SÄ±nÄ±rlÄ±", "Ã–ne Ã§Ä±kan"];

export function OffersScreen({ feed, onOpenOffer }: MobileScreenProps) {
  const [query, setQuery] = useState("");
  const [activeStory, setActiveStory] = useState<string | undefined>();
  const [activeFilter, setActiveFilter] = useState("TÃ¼mÃ¼");
  const deferredQuery = useDeferredValue(query);

  const filteredOffers = useMemo(() => feed.offers.filter((offer) => {
    const haystack = normalize([offer.title.tr, offer.description.tr, offer.conditions.tr, offer.discountLabel].join(" "));
    if (deferredQuery.trim() && !haystack.includes(normalize(deferredQuery))) return false;
    if (activeFilter === "QR ile" && !offer.requiresQr) return false;
    if (activeFilter === "Puanla" && !offer.pointCost) return false;
    if (activeFilter === "SÄ±nÄ±rlÄ±" && !offer.useLimit) return false;
    if (activeFilter === "Ã–ne Ã§Ä±kan" && !offer.featured && !offer.storyEnabled) return false;
    return true;
  }), [activeFilter, deferredQuery, feed.offers]);

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
      <Section title={`Nar fÄ±rsatlarÄ± (${filteredOffers.length})`}>
        {filteredOffers.length ? filteredOffers.map((offer) => (
          <OfferItem key={offer.id} title={offer.title.tr} discount={offer.discountLabel} meta={offer.conditions.tr} onPress={() => onOpenOffer?.(offer.id)} />
        )) : <Text style={styles.emptyText}>SeÃ§tiÄŸin filtreye uygun fÄ±rsat bulunamadÄ±.</Text>}
      </Section>
      {firstOffer ? (
        <Text style={styles.emptyText}>{`SeÃ§ili fÄ±rsat: ${firstOffer.title.tr} Â· indirim ${firstOffer.discountLabel} Â· kalan ${compactValue(remainingUse)}`}</Text>
      ) : null}
    </>
  );
}

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
