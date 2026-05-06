import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AncientGuideStop, SurvivalKitItem } from "@nar/core";

export interface MiniModulesSnapshot {
  tourist: SurvivalKitItem[];
  ancient: AncientGuideStop[];
  syncedAt: string;
  version: number;
}

const version = 1;
const touristManifestKey = "narrehberi:mobile:mini:tourist:manifest:v1";
const touristDataKey = "narrehberi:mobile:mini:tourist:data:v1";
const ancientManifestKey = "narrehberi:mobile:mini:ancient:manifest:v1";
const ancientDataKey = "narrehberi:mobile:mini:ancient:data:v1";
const ttlMs = 24 * 60 * 60 * 1000;

interface Manifest {
  version: number;
  syncedAt: string;
  count: number;
}

export async function readCachedTouristItems() {
  return readCachedArray<SurvivalKitItem>(touristManifestKey, touristDataKey);
}

export async function readCachedAncientStops() {
  return readCachedArray<AncientGuideStop>(ancientManifestKey, ancientDataKey);
}

export async function writeCachedTouristItems(items: SurvivalKitItem[]) {
  await writeCachedArray(touristManifestKey, touristDataKey, items);
}

export async function writeCachedAncientStops(items: AncientGuideStop[]) {
  await writeCachedArray(ancientManifestKey, ancientDataKey, items);
}

export function isMiniCacheFresh(snapshot: { syncedAt: string } | null) {
  if (!snapshot?.syncedAt) return false;
  const age = Date.now() - new Date(snapshot.syncedAt).getTime();
  return Number.isFinite(age) && age >= 0 && age < ttlMs;
}

async function readCachedArray<T>(manifestKey: string, dataKey: string) {
  try {
    const [manifestRaw, dataRaw] = await AsyncStorage.multiGet([manifestKey, dataKey]);
    const manifest = manifestRaw?.[1] ? (JSON.parse(manifestRaw[1]) as Manifest) : null;
    if (!manifest || manifest.version !== version || !manifest.syncedAt) return null;
    if (!dataRaw?.[1]) return null;
    const parsed = JSON.parse(dataRaw[1]);
    if (!Array.isArray(parsed)) return null;
    return {
      items: parsed as T[],
      syncedAt: manifest.syncedAt,
      fresh: isMiniCacheFresh(manifest)
    };
  } catch {
    return null;
  }
}

async function writeCachedArray<T>(manifestKey: string, dataKey: string, items: T[]) {
  try {
    const payload = JSON.stringify(items);
    const manifest: Manifest = {
      version,
      syncedAt: new Date().toISOString(),
      count: items.length
    };
    await AsyncStorage.multiSet([
      [dataKey, payload],
      [manifestKey, JSON.stringify(manifest)]
    ]);
  } catch {
    // Best effort only.
  }
}
