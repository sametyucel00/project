import { type DiscoveryFeedState } from "../hooks";
import { type MobileSession, type MobileTab } from "../services";
import type { DeviceLocation } from "../utils/location";

export interface MobileScreenProps {
  feed: DiscoveryFeedState;
  session: MobileSession | null;
  userLocation: DeviceLocation | null;
  onOpenPlace?: (placeId: string) => void;
  onOpenEvent?: (eventId: string) => void;
  onOpenOffer?: (offerId: string) => void;
  onOpenTouristGuide?: () => void;
  onOpenAncientGuide?: () => void;
  onOpenQr?: () => void;
  onOpenTab?: (tab: MobileTab) => void;
  onOpenAuth?: () => void;
  onOpenLegal?: (kind: "privacy" | "terms") => void;
}
