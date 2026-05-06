import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EventItem, Offer, Place } from "@nar/core";

export interface DiscoveryCatalogSnapshot {
  places: Place[];
  events: EventItem[];
  offers: Offer[];
  syncedAt: string;
  version: number;
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
  try {
    const manifestRaw = await AsyncStorage.getItem(catalogManifestKey);
    if (!manifestRaw) return null;
    const manifest = JSON.parse(manifestRaw) as CatalogManifest;
    if (manifest.version !== catalogVersion || !manifest.syncedAt) return null;

    const [placesRaw, eventsRaw, offersRaw] = await AsyncStorage.multiGet([catalogPlacesKey, catalogEventsKey, catalogOffersKey]);
    const places = safeParseArray<Place>(placesRaw?.[1]);
    const events = safeParseArray<EventItem>(eventsRaw?.[1]);
    const offers = safeParseArray<Offer>(offersRaw?.[1]);
    if (!places.length && !events.length && !offers.length) return null;

    return {
      places,
      events,
      offers,
      syncedAt: manifest.syncedAt,
      version: manifest.version
    } satisfies DiscoveryCatalogSnapshot;
  } catch {
    return null;
  }
}

export async function writeDiscoveryCatalogCache(snapshot: DiscoveryCatalogSnapshot) {
  try {
    const manifest: CatalogManifest = {
      version: catalogVersion,
      syncedAt: snapshot.syncedAt,
      placesCount: snapshot.places.length,
      eventsCount: snapshot.events.length,
      offersCount: snapshot.offers.length
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

function safeParseArray<T>(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
