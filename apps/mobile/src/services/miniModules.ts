import { ancientGuideStops, touristSurvivalKit, type AncientGuideStop, type SurvivalKitItem } from "@nar/core";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { readJsonCache, writeJsonCache } from "./cache";

const touristCacheKey = "narrehberi:mobile:tourist-survival-kit:v1";
const ancientCacheKey = "narrehberi:mobile:ancient-guide-stops:v1";

export async function fetchTouristSurvivalKit(limitCount = 24) {
  const cached = await readJsonCache<SurvivalKitItem[]>(touristCacheKey);
  if (cached?.length) {
    void fetchTouristSurvivalKitFromNetwork(limitCount).then((items) => {
      if (items.length) void writeJsonCache(touristCacheKey, items);
    });
    return cached.slice(0, limitCount);
  }

  const items = await fetchTouristSurvivalKitFromNetwork(limitCount);
  if (items.length) void writeJsonCache(touristCacheKey, items);
  return items;
}

async function fetchTouristSurvivalKitFromNetwork(limitCount = 24) {
  const snapshot = await getDocs(query(
    collection(db, "touristSurvivalKit"),
    where("status", "==", "published"),
    limit(limitCount)
  ));
  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as SurvivalKitItem);
  return items.length ? items : touristSurvivalKit;
}

export async function fetchAncientGuideStops(limitCount = 24) {
  const cached = await readJsonCache<AncientGuideStop[]>(ancientCacheKey);
  if (cached?.length) {
    void fetchAncientGuideStopsFromNetwork(limitCount).then((stops) => {
      if (stops.length) void writeJsonCache(ancientCacheKey, stops);
    });
    return cached.slice(0, limitCount);
  }

  const stops = await fetchAncientGuideStopsFromNetwork(limitCount);
  if (stops.length) void writeJsonCache(ancientCacheKey, stops);
  return stops;
}

async function fetchAncientGuideStopsFromNetwork(limitCount = 24) {
  const snapshot = await getDocs(query(
    collection(db, "ancientGuideStops"),
    where("status", "==", "published"),
    limit(limitCount)
  ));
  const stops = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AncientGuideStop);
  return stops.length ? stops : ancientGuideStops;
}
