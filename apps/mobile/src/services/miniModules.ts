import { ancientGuideStops, touristSurvivalKit, type AncientGuideStop, type SurvivalKitItem } from "@nar/core";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase";

export async function fetchTouristSurvivalKit(limitCount = 24) {
  const snapshot = await getDocs(query(
    collection(db, "touristSurvivalKit"),
    where("status", "==", "published"),
    limit(limitCount)
  ));
  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as SurvivalKitItem);
  return items.length ? items : touristSurvivalKit;
}

export async function fetchAncientGuideStops(limitCount = 24) {
  const snapshot = await getDocs(query(
    collection(db, "ancientGuideStops"),
    where("status", "==", "published"),
    limit(limitCount)
  ));
  const stops = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AncientGuideStop);
  return stops.length ? stops : ancientGuideStops;
}
