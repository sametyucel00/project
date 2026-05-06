import { featuredEvents, featuredOffers, featuredPlaces, type EventItem, type Offer, type Place } from "@nar/core";
import { startTransition, useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import { fetchEvents, fetchOffers, fetchPlaces } from "../services";
import { readJsonCache, removeCache, writeJsonCache } from "../services/cache";

export interface DiscoveryFeedState {
  places: Place[];
  events: EventItem[];
  offers: Offer[];
  loading: boolean;
  error: string | null;
}

let cachedFeed: DiscoveryFeedState | null = null;
const feedCacheKey = "narrehberi:mobile:discovery-feed:v3";
const feedCacheLimits = {
  places: 36,
  events: 18,
  offers: 8
} as const;

export function useDiscoveryFeed(enabled = true): DiscoveryFeedState {
  const [state, setState] = useState<DiscoveryFeedState>({
    places: cachedFeed?.places ?? featuredPlaces,
    events: cachedFeed?.events ?? featuredEvents,
    offers: cachedFeed?.offers ?? featuredOffers,
    loading: enabled,
    error: null
  });

  useEffect(() => {
    if (!enabled) {
      startTransition(() => {
        setState((current) => ({ ...current, loading: false }));
      });
      return;
    }

    let active = true;
    let fullLoadTimer: ReturnType<typeof setTimeout> | undefined;
    let interactionTask: { cancel?: () => void } | undefined;

    void readJsonCache<DiscoveryFeedState>(feedCacheKey).then((cached) => {
      if (!active || !cached) return;
      const normalized = normalizeCachedFeed(cached);
      if (!normalized) {
        void removeCache(feedCacheKey);
        return;
      }

      startTransition(() => {
        setState((current) => {
          const nextState = {
            places: normalized.places.length ? normalized.places : current.places,
            events: normalized.events.length ? normalized.events : current.events,
            offers: normalized.offers.length ? normalized.offers : current.offers,
            loading: current.loading,
            error: current.error
          };
          cachedFeed = nextState;
          return sameDiscoveryFeedState(current, nextState) ? current : nextState;
        });
      });
    });

    async function load(limitSet: { places: number; events: number; offers: number }, quiet = false) {
      try {
        const [places, events, offers] = await Promise.all([
          fetchPlaces({ limitCount: limitSet.places }),
          fetchEvents({ limitCount: limitSet.events }),
          fetchOffers({ activeAt: new Date().toISOString(), limitCount: limitSet.offers })
        ]);

        if (!active) return;
        startTransition(() => {
          setState((current) => {
            const nextState = commitFeed({
              places: places.length ? places : current.places,
              events: events.length ? events : current.events,
              offers: offers.length ? offers : current.offers,
              loading: false,
              error: null
            });
            if (sameDiscoveryFeedState(current, nextState)) return current;
            void writeJsonCache(feedCacheKey, trimFeedForCache(nextState));
            return nextState;
          });
        });
      } catch (error) {
        if (!active || quiet) return;
        startTransition(() => {
          setState((current) => {
            const nextState = commitFeed({
              places: current.places.length ? current.places : featuredPlaces,
              events: current.events.length ? current.events : featuredEvents,
              offers: current.offers.length ? current.offers : featuredOffers,
              loading: false,
              error: error instanceof Error ? error.message : "Keşif verisi alınamadı."
            });
            if (sameDiscoveryFeedState(current, nextState)) return current;
            void writeJsonCache(feedCacheKey, trimFeedForCache(nextState));
            return nextState;
          });
        });
      }
    }

    function commitFeed(next: DiscoveryFeedState) {
      cachedFeed = next;
      return next;
    }

    interactionTask = InteractionManager.runAfterInteractions(() => {
      void load({ places: 36, events: 18, offers: 8 });
      fullLoadTimer = setTimeout(() => {
        void load({ places: 72, events: 30, offers: 12 }, true);
      }, 8500);
    });

    return () => {
      active = false;
      interactionTask?.cancel?.();
      if (fullLoadTimer) clearTimeout(fullLoadTimer);
    };
  }, [enabled]);

  return state;
}

function normalizeCachedFeed(cached: DiscoveryFeedState | null): DiscoveryFeedState | null {
  if (!cached) return null;
  const places = Array.isArray(cached.places) ? cached.places.slice(0, feedCacheLimits.places) : [];
  const events = Array.isArray(cached.events) ? cached.events.slice(0, feedCacheLimits.events) : [];
  const offers = Array.isArray(cached.offers) ? cached.offers.slice(0, feedCacheLimits.offers) : [];
  if (!places.length && !events.length && !offers.length) return null;
  return {
    places,
    events,
    offers,
    loading: Boolean(cached.loading),
    error: typeof cached.error === "string" ? cached.error : null
  };
}

function trimFeedForCache(nextState: DiscoveryFeedState): DiscoveryFeedState {
  return {
    places: nextState.places.slice(0, feedCacheLimits.places),
    events: nextState.events.slice(0, feedCacheLimits.events),
    offers: nextState.offers.slice(0, feedCacheLimits.offers),
    loading: nextState.loading,
    error: nextState.error
  };
}

function sameDiscoveryFeedState(current: DiscoveryFeedState, next: DiscoveryFeedState) {
  return (
    current.loading === next.loading &&
    current.error === next.error &&
    sameIdList(current.places, next.places) &&
    sameIdList(current.events, next.events) &&
    sameIdList(current.offers, next.offers)
  );
}

function sameIdList<T extends { id: string }>(first: T[], second: T[]) {
  if (first === second) return true;
  if (first.length !== second.length) return false;
  for (let index = 0; index < first.length; index += 1) {
    if (first[index]?.id !== second[index]?.id) return false;
  }
  return true;
}
