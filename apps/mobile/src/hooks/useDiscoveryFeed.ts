import { featuredEvents, featuredOffers, featuredPlaces, type EventItem, type Offer, type Place } from "@nar/core";
import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import { fetchEvents, fetchOffers, fetchPlaces } from "../services";

export interface DiscoveryFeedState {
  places: Place[];
  events: EventItem[];
  offers: Offer[];
  loading: boolean;
  error: string | null;
}

export function useDiscoveryFeed(enabled = true): DiscoveryFeedState {
  const [state, setState] = useState<DiscoveryFeedState>({
    places: featuredPlaces,
    events: featuredEvents,
    offers: featuredOffers,
    loading: enabled,
    error: null
  });

  useEffect(() => {
    if (!enabled) {
      setState((current) => ({ ...current, loading: false }));
      return;
    }

    let active = true;
    let fullLoadTimer: ReturnType<typeof setTimeout> | undefined;
    let interactionTask: { cancel?: () => void } | undefined;

    async function load(limitSet: { places: number; events: number; offers: number }, quiet = false) {
      try {
        const [places, events, offers] = await Promise.all([
          fetchPlaces({ limitCount: limitSet.places }),
          fetchEvents({ limitCount: limitSet.events }),
          fetchOffers({ activeAt: new Date().toISOString(), limitCount: limitSet.offers })
        ]);

        if (!active) return;
        setState((current) => ({
          places: places.length ? places : current.places.length ? current.places : featuredPlaces,
          events: events.length ? events : current.events.length ? current.events : featuredEvents,
          offers: offers.length ? offers : current.offers.length ? current.offers : featuredOffers,
          loading: false,
          error: null
        }));
      } catch (error) {
        if (!active) return;
        if (quiet) return;
        setState((current) => ({
          places: current.places.length ? current.places : featuredPlaces,
          events: current.events.length ? current.events : featuredEvents,
          offers: current.offers.length ? current.offers : featuredOffers,
          loading: false,
          error: error instanceof Error ? error.message : "Keşif verisi alınamadı."
        }));
      }
    }

    interactionTask = InteractionManager.runAfterInteractions(() => {
      void load({ places: 48, events: 24, offers: 10 });
      fullLoadTimer = setTimeout(() => {
        void load({ places: 220, events: 80, offers: 24 }, true);
      }, 6500);
    });

    return () => {
      active = false;
      interactionTask?.cancel?.();
      if (fullLoadTimer) clearTimeout(fullLoadTimer);
    };
  }, [enabled]);

  return state;
}
