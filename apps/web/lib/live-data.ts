import { localizeText, mapLegacyTheatrePlayToEvent, mapLegacyVenueToPlace, type EventItem, type Offer, type Place } from "@nar/core";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";

export async function fetchLivePlaces(limitCount = 500) {
  const merged = new Map<string, Place>();

  try {
    const snapshot = await getDocs(query(
      collection(db, "places"),
      where("status", "==", "published"),
      limit(limitCount)
    ));
    snapshot.docs.forEach((entry) => {
      const place = { id: entry.id, ...entry.data() } as Place;
      merged.set(place.id, place);
    });
  } catch {
    // Yeni koleksiyon erişilemezse legacy veri aşağıda denenir.
  }

  try {
    const legacySnapshot = await getDocs(query(collection(db, "venues"), limit(limitCount)));
    legacySnapshot.docs
      .map((entry) => mapLegacyVenueToPlace(entry.id, entry.data()))
      .filter((place) => place.status === "published")
      .forEach((place) => {
        if (!merged.has(place.id)) merged.set(place.id, place);
      });
  } catch {
    // Legacy koleksiyon da erişilemezse mevcut yeni kayıtlar kullanılır.
  }

  return [...merged.values()]
    .filter((place) => place.status === "published")
    .sort((first, second) => localizeText(first.title, "tr").localeCompare(localizeText(second.title, "tr"), "tr-TR"))
    .slice(0, limitCount);
}

export async function fetchLivePlace(id: string) {
  try {
    const snapshot = await getDoc(doc(db, "places", id));
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as Place;
  } catch {
    // Yeni koleksiyon erişilemezse legacy veri aşağıda denenir.
  }
  const legacySnapshot = await getDoc(doc(db, "venues", id));
  return legacySnapshot.exists() ? mapLegacyVenueToPlace(legacySnapshot.id, legacySnapshot.data()) : null;
}

export async function fetchLiveEvents(limitCount = 500) {
  const merged = new Map<string, EventItem>();

  try {
    const snapshot = await getDocs(query(
      collection(db, "events"),
      where("status", "==", "published"),
      orderBy("startsAt", "asc"),
      limit(limitCount)
    ));
    snapshot.docs.forEach((entry) => {
      const event = { id: entry.id, ...entry.data() } as EventItem;
      merged.set(event.id, event);
    });
  } catch {
    // Yeni etkinlik sorgusu erişilemezse legacy veri aşağıda denenir.
  }

  try {
    const legacySnapshot = await getDocs(query(collection(db, "theatre_plays"), limit(limitCount)));
    legacySnapshot.docs
      .map((entry) => mapLegacyTheatrePlayToEvent(entry.id, entry.data()))
      .filter((event) => event.status === "published")
      .forEach((event) => {
        if (!merged.has(event.id)) merged.set(event.id, event);
      });
  } catch {
    // Legacy koleksiyon da erişilemezse mevcut yeni kayıtlar kullanılır.
  }

  return [...merged.values()]
    .filter((event) => event.status === "published")
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt))
    .slice(0, limitCount);
}

export async function fetchLiveEvent(id: string) {
  try {
    const snapshot = await getDoc(doc(db, "events", id));
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() } as EventItem;
  } catch {
    // Yeni koleksiyon erişilemezse legacy veri aşağıda denenir.
  }
  const legacySnapshot = await getDoc(doc(db, "theatre_plays", id));
  return legacySnapshot.exists() ? mapLegacyTheatrePlayToEvent(legacySnapshot.id, legacySnapshot.data()) : null;
}

export async function fetchLiveOffers(limitCount = 24) {
  const now = new Date().toISOString();
  const snapshot = await getDocs(query(
    collection(db, "offers"),
    where("status", "==", "published"),
    limit(limitCount)
  ));
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }) as Offer)
    .filter((offer) => offer.startsAt <= now && offer.endsAt >= now);
}

export async function fetchLiveOffer(id: string) {
  const snapshot = await getDoc(doc(db, "offers", id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Offer;
}
