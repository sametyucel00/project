import type { GooglePlaceSnapshot, Place } from "./index";

export interface GooglePlaceDetailsInput {
  googlePlaceId: string;
  apiKey?: string;
  language?: string;
}

export function mapGoogleSnapshotToPlace(place: Place, snapshot: GooglePlaceSnapshot): Place {
  return {
    ...place,
    googlePlaceId: snapshot.googlePlaceId,
    phone: snapshot.phone ?? place.phone,
    website: snapshot.website ?? place.website,
    address: snapshot.address ?? place.address,
    location: snapshot.location ?? place.location,
    googleRating: snapshot.rating ?? place.googleRating,
    googleReviewCount: snapshot.reviewCount ?? place.googleReviewCount,
    openingHours: snapshot.openingHours?.length ? snapshot.openingHours : place.openingHours,
    gallery: snapshot.photoRefs.length ? snapshot.photoRefs : place.gallery
  };
}

export async function fetchGooglePlaceSnapshot(input: GooglePlaceDetailsInput): Promise<GooglePlaceSnapshot> {
  if (!input.apiKey) {
    return {
      googlePlaceId: input.googlePlaceId,
      photoRefs: [],
      fetchedAt: new Date().toISOString()
    };
  }

  const params = new URLSearchParams({
    place_id: input.googlePlaceId,
    language: input.language ?? "tr",
    fields: "formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos,geometry",
    key: input.apiKey
  });
  const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
  if (!response.ok) throw new Error("Google Places isteği başarısız.");
  const payload = await response.json();
  const result = payload.result ?? {};

  return {
    googlePlaceId: input.googlePlaceId,
    phone: result.formatted_phone_number,
    website: result.website,
    photoRefs: Array.isArray(result.photos) ? result.photos.map((photo: { photo_reference: string }) => photo.photo_reference).filter(Boolean) : [],
    rating: result.rating,
    reviewCount: result.user_ratings_total,
    address: result.formatted_address,
    location: result.geometry?.location ? { lat: result.geometry.location.lat, lng: result.geometry.location.lng } : undefined,
    openingHours: result.opening_hours?.weekday_text ?? [],
    fetchedAt: new Date().toISOString()
  };
}
