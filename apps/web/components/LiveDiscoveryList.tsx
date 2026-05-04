"use client";

import { fetchLiveEvents, fetchLiveOffers, fetchLivePlaces } from "@/lib/live-data";
import { type EventItem, type Offer, type Place } from "@nar/core";
import { useEffect, useState } from "react";
import { DiscoveryList } from "./DiscoveryList";

type LiveDiscoveryKind = "places" | "events" | "offers";
type LiveItemMap = {
  places: Place;
  events: EventItem;
  offers: Offer;
};

export function LiveDiscoveryList<T extends LiveDiscoveryKind>({ type, fallback }: { type: T; fallback: LiveItemMap[T][] }) {
  const [items, setItems] = useState<LiveItemMap[T][]>(fallback);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = type === "places"
          ? await fetchLivePlaces()
          : type === "events"
            ? await fetchLiveEvents()
            : await fetchLiveOffers();
        if (!active) return;
        setItems((result.length ? result : fallback) as LiveItemMap[T][]);
      } catch {
        if (!active) return;
        setItems(fallback);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [fallback, type]);

  return (
    <div className="live-discovery">
      <DiscoveryList items={items} type={type} />
    </div>
  );
}
