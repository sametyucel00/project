import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EventItem, Offer, Place } from "@nar/core";
import { perfFlag, perfMark, perfMeasure } from "./perf";

export interface DiscoveryCatalogSnapshot {
  places: Place[];
  events: EventItem[];
  offers: Offer[];
  syncedAt: string;
  version: number;
  placesCount?: number;
  eventsCount?: number;
  offersCount?: number;
}

const catalogVersion = 1;
const catalogManifestKey = "narrehberi:mobile:catalog:manifest:v1";
const catalogPlacesKey = "narrehberi:mobile:catalog:places:v1";
const catalogEventsKey = "narrehberi:mobile:catalog:events:v1";
const catalogOffersKey = "narrehberi:mobile:catalog:offers:v1";
const catalogTtlMs = 12 * 60 * 60 * 1000;

interface CatalogManifest {
  version: number;
  syncedAt: string;
  placesCount: number;
  eventsCount: number;
  offersCount: number;
}

export async function readDiscoveryCatalogCache() {
  const diagnosticsDisabled = perfFlag("nocache");
  if (diagnosticsDisabled) return null;
  try {
    perfMark("catalogCache:read:start");
    const manifestRaw = await AsyncStorage.getItem(catalogManifestKey);
    if (!manifestRaw) {
      perfMeasure("catalogCache:read:end", "catalogCache:read:start", { hit: false });
      return null;
    }
    const manifest = JSON.parse(manifestRaw) as CatalogManifest;
    if (manifest.version !== catalogVersion || !manifest.syncedAt) {
      perfMeasure("catalogCache:read:end", "catalogCache:read:start", { hit: false, invalid: true });
      return null;
    }

    const [placesRaw, eventsRaw, offersRaw] = await AsyncStorage.multiGet([catalogPlacesKey, catalogEventsKey, catalogOffersKey]);
    const places = safeParseArray<Place>(placesRaw?.[1]);
    const events = safeParseArray<EventItem>(eventsRaw?.[1]);
    const offers = safeParseArray<Offer>(offersRaw?.[1]);
    if (!places.length && !events.length && !offers.length) {
      perfMeasure("catalogCache:read:end", "catalogCache:read:start", { hit: false, empty: true });
      return null;
    }

    perfMeasure("catalogCache:read:end", "catalogCache:read:start", {
      hit: true,
      places: places.length,
      events: events.length,
      offers: offers.length,
      bytes:
        (manifestRaw?.length ?? 0) +
        (placesRaw?.[1]?.length ?? 0) +
        (eventsRaw?.[1]?.length ?? 0) +
        (offersRaw?.[1]?.length ?? 0)
    });

    return {
      places,
      events,
      offers,
      syncedAt: manifest.syncedAt,
      version: manifest.version,
      placesCount: manifest.placesCount,
      eventsCount: manifest.eventsCount,
      offersCount: manifest.offersCount
    } satisfies DiscoveryCatalogSnapshot;
  } catch {
    perfMeasure("catalogCache:read:error", "catalogCache:read:start");
    return null;
  }
}

export async function writeDiscoveryCatalogCache(snapshot: DiscoveryCatalogSnapshot) {
  try {
    const manifest: CatalogManifest = {
      version: catalogVersion,
      syncedAt: snapshot.syncedAt,
      placesCount: snapshot.placesCount ?? snapshot.places.length,
      eventsCount: snapshot.eventsCount ?? snapshot.events.length,
      offersCount: snapshot.offersCount ?? snapshot.offers.length
    };
    await AsyncStorage.multiSet([
      [catalogPlacesKey, JSON.stringify(snapshot.places)],
      [catalogEventsKey, JSON.stringify(snapshot.events)],
      [catalogOffersKey, JSON.stringify(snapshot.offers)],
      [catalogManifestKey, JSON.stringify(manifest)]
    ]);
  } catch {
    // Best effort only.
  }
}

export async function clearDiscoveryCatalogCache() {
  try {
    await AsyncStorage.multiRemove([catalogManifestKey, catalogPlacesKey, catalogEventsKey, catalogOffersKey]);
  } catch {
    // Best effort only.
  }
}

export function isDiscoveryCatalogFresh(snapshot: DiscoveryCatalogSnapshot | null) {
  if (!snapshot?.syncedAt) return false;
  const age = Date.now() - new Date(snapshot.syncedAt).getTime();
  return Number.isFinite(age) && age >= 0 && age < catalogTtlMs;
}

export function isDiscoveryCatalogComplete(snapshot: DiscoveryCatalogSnapshot | null) {
  if (!snapshot) return false;
  return (
    (snapshot.placesCount ?? snapshot.places.length) >= 100 &&
    (snapshot.eventsCount ?? snapshot.events.length) >= 50 &&
    (snapshot.offersCount ?? snapshot.offers.length) >= 10
  );
}

function safeParseArray<T>(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
