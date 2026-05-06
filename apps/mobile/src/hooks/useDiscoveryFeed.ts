import { featuredEvents, featuredOffers, featuredPlaces, type EventItem, type Offer, type Place } from "@nar/core";
import { startTransition, useEffect, useState } from "react";
import { InteractionManager } from "react-native";
import { fetchEvents, fetchOffers, fetchPlaces } from "../services";
import { isDiscoveryCatalogComplete, isDiscoveryCatalogFresh, readDiscoveryCatalogCache, writeDiscoveryCatalogCache } from "../services/catalogCache";
import { readJsonCache, removeCache, writeJsonCache } from "../services/cache";
import { perfCount, perfFlag, perfMark, perfMeasure } from "../services/perf";

export interface DiscoveryFeedState {
  places: Place[];
  events: EventItem[];
  offers: Offer[];
  loading: boolean;
  error: string | null;
}

export type DiscoveryFeedPriority = "home" | "catalog";

let cachedFeed: DiscoveryFeedState | null = null;
const homePreviewCacheKey = "narrehberi:mobile:discovery-home:v1";
const feedCacheLimits = {
  places: 300,
  events: 300,
  offers: 30
} as const;

export function useDiscoveryFeed(enabled = true, priority: DiscoveryFeedPriority = "home"): DiscoveryFeedState {
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
    let legacyMergeStarted = false;
    let skippedCatalogLoad = false;
    const cacheDisabled = perfFlag("nocache");
    const firebaseDisabled = perfFlag("nofirebase");

    if (priority === "home" && !cacheDisabled) {
      perfMark(`feed:${priority}:cacheRead:start`);
      void readJsonCache<DiscoveryFeedState>(homePreviewCacheKey).then((cached) => {
        perfMeasure(`feed:${priority}:cacheRead:end`, `feed:${priority}:cacheRead:start`, {
          places: cached?.places?.length ?? 0,
          events: cached?.events?.length ?? 0,
          offers: cached?.offers?.length ?? 0
        });
        if (!active || !cached) return;
        const normalized = normalizeCachedFeed(cached);
        if (!normalized) {
          void removeCache(homePreviewCacheKey);
          return;
        }

        startTransition(() => {
          setState((current) => {
            const nextState = commitFeed({
              places: normalized.places.length ? normalized.places : current.places,
              events: normalized.events.length ? normalized.events : current.events,
              offers: normalized.offers.length ? normalized.offers : current.offers,
              loading: current.loading,
              error: current.error
            });
            cachedFeed = nextState;
            return sameDiscoveryFeedState(current, nextState) ? current : nextState;
          });
        });
      });
    } else if (!cacheDisabled) {
      perfMark(`feed:${priority}:cacheRead:start`);
      void readDiscoveryCatalogCache().then((cachedCatalog) => {
        perfMeasure(`feed:${priority}:cacheRead:end`, `feed:${priority}:cacheRead:start`, {
          places: cachedCatalog?.places?.length ?? 0,
          events: cachedCatalog?.events?.length ?? 0,
          offers: cachedCatalog?.offers?.length ?? 0
        });
        if (!active || !cachedCatalog) return;
        startTransition(() => {
          setState((current) => {
            const nextState = commitFeed({
              places: cachedCatalog.places.length ? cachedCatalog.places : current.places,
              events: cachedCatalog.events.length ? cachedCatalog.events : current.events,
              offers: cachedCatalog.offers.length ? cachedCatalog.offers : current.offers,
              loading: current.loading,
              error: current.error
            });
            cachedFeed = nextState;
            return sameDiscoveryFeedState(current, nextState) ? current : nextState;
          });
        });

        if (isDiscoveryCatalogFresh(cachedCatalog) && isDiscoveryCatalogComplete(cachedCatalog)) {
          skippedCatalogLoad = true;
          startTransition(() => {
            setState((current) => (current.loading ? { ...current, loading: false } : current));
          });
        }
      });
    }

    if (priority === "catalog") {
      void mergeLegacyFallbacks();
    }

    async function load(limitSet: { places: number; events: number; offers: number }, quiet = false) {
      if (firebaseDisabled) {
        perfCount(`feed:${priority}:firebase:skipped`, limitSet);
        if (!quiet) {
          startTransition(() => {
            setState((current) => (current.loading ? { ...current, loading: false } : current));
          });
        }
        return;
      }

      perfMark(`feed:${priority}:firebase:start`, limitSet);
      try {
        const [places, events, offers] = await Promise.all([
          fetchPlaces({ limitCount: limitSet.places }),
          fetchEvents({ limitCount: limitSet.events }),
          fetchOffers({ activeAt: new Date().toISOString(), limitCount: limitSet.offers })
        ]);
        perfMeasure(`feed:${priority}:firebase:end`, `feed:${priority}:firebase:start`, {
          places: places.length,
          events: events.length,
          offers: offers.length
        });

        if (!active) return;
        startTransition(() => {
          setState((current) => {
            const nextState = commitFeed({
              places: mergeUniqueById(places.length ? places : current.places, current.places, feedCacheLimits.places),
              events: mergeUniqueById(events.length ? events : current.events, current.events, feedCacheLimits.events),
              offers: mergeUniqueById(offers.length ? offers : current.offers, current.offers, feedCacheLimits.offers),
              loading: false,
              error: null
            });
            if (sameDiscoveryFeedState(current, nextState)) return current;
            if (!cacheDisabled) {
              void writeJsonCache(homePreviewCacheKey, trimFeedForCache(nextState));
              void writeDiscoveryCatalogCache({
                places: nextState.places,
                events: nextState.events,
                offers: nextState.offers,
                syncedAt: new Date().toISOString(),
                version: 1
              });
            }
            return nextState;
          });
        });
      } catch (error) {
        perfMeasure(`feed:${priority}:firebase:error`, `feed:${priority}:firebase:start`);
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
            if (!cacheDisabled) {
              void writeJsonCache(homePreviewCacheKey, trimFeedForCache(nextState));
              void writeDiscoveryCatalogCache({
                places: nextState.places,
                events: nextState.events,
                offers: nextState.offers,
                syncedAt: new Date().toISOString(),
                version: 1
              });
            }
            return nextState;
          });
        });
      }
    }

    function mergeLegacyFallbacks() {
      if (legacyMergeStarted || skippedCatalogLoad) return;
      legacyMergeStarted = true;
      void import("@nar/core")
        .then(({ loadLegacyDiscoveryFallbacks }) => loadLegacyDiscoveryFallbacks())
        .then((legacy) => {
          if (!active) return;
          startTransition(() => {
            setState((current) => {
              const merged = commitFeed({
                places: mergeUniqueById(legacy.places, current.places, feedCacheLimits.places),
                events: mergeUniqueById(legacy.events, current.events, feedCacheLimits.events),
                offers: current.offers,
                loading: false,
                error: current.error
              });
              if (sameDiscoveryFeedState(current, merged)) return current;
              if (!cacheDisabled) {
                void writeJsonCache(homePreviewCacheKey, trimFeedForCache(merged));
                void writeDiscoveryCatalogCache({
                  places: merged.places,
                  events: merged.events,
                  offers: merged.offers,
                  syncedAt: new Date().toISOString(),
                  version: 1
                });
              }
              return merged;
            });
          });
        });
    }

    function commitFeed(next: DiscoveryFeedState) {
      cachedFeed = next;
      return next;
    }

    interactionTask = InteractionManager.runAfterInteractions(() => {
      if (priority === "home") {
        void load({ places: 24, events: 12, offers: 6 }, true);
        return;
      }

      if (skippedCatalogLoad) return;

      void load({ places: 48, events: 24, offers: 8 });
      fullLoadTimer = setTimeout(() => {
        void load({ places: 300, events: 300, offers: 30 }, true);
      }, 7500);
    });

    return () => {
      active = false;
      interactionTask?.cancel?.();
      if (fullLoadTimer) clearTimeout(fullLoadTimer);
    };
  }, [enabled, priority]);

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

function mergeUniqueById<T extends { id: string }>(first: T[], second: T[], limit: number) {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const item of [...first, ...second]) {
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
    if (merged.length >= limit) break;
  }
  return merged;
}
