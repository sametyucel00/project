import { ancientGuideStops, touristSurvivalKit, type AncientGuideStop, type SurvivalKitItem } from "@nar/core";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { readCachedAncientStops, readCachedTouristItems, writeCachedAncientStops, writeCachedTouristItems } from "./miniModulesCache";

export async function fetchTouristSurvivalKit(limitCount = 24) {
  const cached = await readCachedTouristItems();
  if (cached?.items?.length) {
    if (!cached.fresh) {
      void fetchTouristSurvivalKitFromNetwork(limitCount).then((items) => {
        if (items.length) void writeCachedTouristItems(items);
      });
    }
    return cached.items.slice(0, limitCount);
  }

  const items = await fetchTouristSurvivalKitFromNetwork(limitCount);
  if (items.length) void writeCachedTouristItems(items);
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
  const cached = await readCachedAncientStops();
  if (cached?.items?.length) {
    if (!cached.fresh) {
      void fetchAncientGuideStopsFromNetwork(limitCount).then((stops) => {
        if (stops.length) void writeCachedAncientStops(stops);
      });
    }
    return cached.items.slice(0, limitCount);
  }

  const stops = await fetchAncientGuideStopsFromNetwork(limitCount);
  if (stops.length) void writeCachedAncientStops(stops);
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
