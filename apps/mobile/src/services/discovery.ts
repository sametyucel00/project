import {
  type EventItem,
  type EventType,
  mapLegacyTheatrePlayToEvent,
  mapLegacyVenueToPlace,
  type Offer,
  type Place,
  type PlaceFilterKey,
  type PublishStatus
} from "@nar/core";
import { collection, getDocs, limit, orderBy, query, where, type QueryConstraint } from "firebase/firestore";
import { db } from "../firebase";

export interface PlaceSearchInput {
  categoryId?: string;
  district?: string;
  filters?: PlaceFilterKey[];
  minRating?: number;
  limitCount?: number;
}

export interface EventSearchInput {
  type?: EventType;
  district?: string;
  startsAfter?: string;
  startsBefore?: string;
  freeOnly?: boolean;
  limitCount?: number;
}

export interface OfferSearchInput {
  placeId?: string;
  businessId?: string;
  activeAt?: string;
  limitCount?: number;
}

export interface DiscoveryCategoryItem {
  id: string;
  target: "place" | "event";
  title: Record<"tr" | "en" | "ru" | "de", string>;
  status?: string;
  sortOrder?: number;
}

function withPublished(status?: PublishStatus) {
  return status === "published";
}

export async function fetchPlaces(input: PlaceSearchInput = {}) {
  const constraints: QueryConstraint[] = [where("status", "==", "published"), limit(input.limitCount ?? 300)];
  if (input.categoryId) constraints.unshift(where("categoryId", "==", input.categoryId));
  if (input.district) constraints.unshift(where("district", "==", input.district));

  try {
    const snapshot = await getDocs(query(collection(db, "places"), ...constraints));
    const places = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as Place)
      .filter((place) => applyPlaceFilters(place, input));
    if (places.length) return places;
  } catch {
    // Eski Firebase projesinde yeni places sorgusu hazır değilse legacy koleksiyona düş.
  }

  const legacySnapshot = await getDocs(query(collection(db, "venues"), limit(input.limitCount ?? 300)));
  return legacySnapshot.docs
    .map((doc) => mapLegacyVenueToPlace(doc.id, doc.data()))
    .filter((place) => applyPlaceFilters(place, input));
}

export async function fetchEvents(input: EventSearchInput = {}) {
  const constraints: QueryConstraint[] = [where("status", "==", "published"), orderBy("startsAt", "asc"), limit(input.limitCount ?? 300)];
  if (input.type) constraints.unshift(where("type", "==", input.type));
  if (input.district) constraints.unshift(where("district", "==", input.district));

  try {
    const snapshot = await getDocs(query(collection(db, "events"), ...constraints));
    const events = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as EventItem)
      .filter((event) => applyEventFilters(event, input));
    if (events.length) return events;
  } catch {
    // Eski Firebase projesinde yeni events sorgusu hazır değilse legacy tiyatro koleksiyonuna düş.
  }

  const legacySnapshot = await getDocs(query(collection(db, "theatre_plays"), limit(input.limitCount ?? 300)));
  return legacySnapshot.docs
    .map((doc) => mapLegacyTheatrePlayToEvent(doc.id, doc.data()))
    .filter((event) => applyEventFilters(event, input))
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

export async function fetchOffers(input: OfferSearchInput = {}) {
  const constraints: QueryConstraint[] = [where("status", "==", "published"), limit(input.limitCount ?? 30)];
  if (input.placeId) constraints.unshift(where("placeId", "==", input.placeId));
  if (input.businessId) constraints.unshift(where("businessId", "==", input.businessId));

  const snapshot = await getDocs(query(collection(db, "offers"), ...constraints));
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Offer)
    .filter((offer) => applyOfferFilters(offer, input));
}

export async function fetchDiscoveryCategories() {
  const snapshot = await getDocs(collection(db, "categories"));
  const categories = snapshot.docs
    .map((entry) => ({ id: entry.id, ...(entry.data() as Partial<DiscoveryCategoryItem>) }) as DiscoveryCategoryItem)
    .sort((first, second) => {
      if (first.target !== second.target) return first.target.localeCompare(second.target);
      return (first.sortOrder ?? 0) - (second.sortOrder ?? 0) || pickCategoryTitle(first).localeCompare(pickCategoryTitle(second), "tr-TR");
    });
  return categories;
}

export function applyPlaceFilters(place: Place, input: PlaceSearchInput = {}) {
  if (!withPublished(place.status)) return false;
  if (input.minRating && (place.googleRating ?? 0) < input.minRating) return false;

  const filters = new Set(input.filters ?? []);
  if (filters.has("openNow") && !place.openNow) return false;
  if (filters.has("vegan") && !place.accessibility.vegan) return false;
  if (filters.has("wifi") && !place.accessibility.wifi) return false;
  if (filters.has("parking") && !place.accessibility.parking) return false;
  if (filters.has("childFriendly") && !place.accessibility.childFriendly) return false;
  if (filters.has("wheelchair") && !place.accessibility.wheelchair) return false;
  if (filters.has("popular") && (place.googleReviewCount ?? 0) < 100) return false;

  return true;
}

export function applyEventFilters(event: EventItem, input: EventSearchInput = {}) {
  if (!withPublished(event.status)) return false;
  if (input.freeOnly && event.priceType !== "free") return false;
  if (input.startsAfter && event.startsAt < input.startsAfter) return false;
  if (input.startsBefore && event.startsAt > input.startsBefore) return false;
  return true;
}

export function applyOfferFilters(offer: Offer, input: OfferSearchInput = {}) {
  if (!withPublished(offer.status)) return false;
  if (!input.activeAt) return true;
  return offer.startsAt <= input.activeAt && offer.endsAt >= input.activeAt;
}

function pickCategoryTitle(category: DiscoveryCategoryItem) {
  return category.title.tr ?? category.title.en ?? category.title.ru ?? category.title.de ?? "";
}
