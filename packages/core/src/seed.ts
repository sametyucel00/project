import {
  ancientGuideStops,
  badges,
  categories,
  eventTypes,
  featuredEvents,
  featuredOffers,
  featuredPlaces,
  sampleOrders,
  touristSurvivalKit,
  userTasks
} from "./index";

export const seedCollections = {
  categories,
  eventTypes,
  places: featuredPlaces,
  events: featuredEvents,
  offers: featuredOffers,
  userTasks,
  badges,
  orders: sampleOrders,
  touristSurvivalKit,
  ancientGuideStops
};

export type SeedCollectionName = keyof typeof seedCollections;

export function getSeedSummary() {
  return Object.entries(seedCollections).map(([name, rows]) => ({
    name,
    count: rows.length
  }));
}
