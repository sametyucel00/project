import { featuredEvents, featuredOffers, featuredPlaces, type EventItem, type Offer, type Place } from "@nar/core";
import { useEffect, useState } from "react";
import { fetchEvents, fetchOffers, fetchPlaces } from "../services";

export interface DiscoveryFeedState {
  places: Place[];
  events: EventItem[];
  offers: Offer[];
  loading: boolean;
  error: string | null;
}

export function useDiscoveryFeed(): DiscoveryFeedState {
  const [state, setState] = useState<DiscoveryFeedState>({
    places: featuredPlaces,
    events: featuredEvents,
    offers: featuredOffers,
    loading: true,
    error: null
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [places, events, offers] = await Promise.all([
          fetchPlaces({ limitCount: 300 }),
          fetchEvents({ limitCount: 20 }),
          fetchOffers({ activeAt: new Date().toISOString(), limitCount: 20 })
        ]);

        if (!active) return;
        setState({
          places: places.length ? places : featuredPlaces,
          events: events.length ? events : featuredEvents,
          offers: offers.length ? offers : featuredOffers,
          loading: false,
          error: null
        });
      } catch (error) {
        if (!active) return;
        setState({
          places: featuredPlaces,
          events: featuredEvents,
          offers: featuredOffers,
          loading: false,
          error: error instanceof Error ? error.message : "Keşif verisi alınamadı."
        });
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return state;
}
