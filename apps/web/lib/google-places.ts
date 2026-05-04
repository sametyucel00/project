import { fetchGooglePlaceSnapshot } from "@nar/core";

export async function fetchPlaceSnapshot(googlePlaceId: string) {
  return fetchGooglePlaceSnapshot({
    googlePlaceId,
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    language: "tr"
  });
}
