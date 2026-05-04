export interface DeviceLocation {
  latitude: number;
  longitude: number;
}

export interface MapPoint {
  lat: number;
  lng: number;
}

type FlexibleMapPoint = MapPoint | {
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  _lat?: number | string;
  _long?: number | string;
} | null | undefined;

export function hasDeviceLocation(value: unknown): value is DeviceLocation {
  return Boolean(
    value &&
      typeof value === "object" &&
      "latitude" in value &&
      "longitude" in value &&
      typeof (value as DeviceLocation).latitude === "number" &&
      typeof (value as DeviceLocation).longitude === "number"
  );
}

export function hasMeaningfulDeviceLocation(value: DeviceLocation | null | undefined) {
  return Boolean(value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude) && !(Math.abs(value.latitude) < 0.0001 && Math.abs(value.longitude) < 0.0001));
}

export function readMapPoint(value: FlexibleMapPoint): MapPoint | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Record<string, unknown>;
  const lat = normalizeCoordinate(source.lat ?? source.latitude ?? source._lat);
  const lng = normalizeCoordinate(source.lng ?? source.longitude ?? source._long);
  if (lat === null || lng === null) return null;
  return normalizeCoordinatePair(lat, lng);
}

export function hasMeaningfulMapPoint(value: FlexibleMapPoint) {
  const point = readMapPoint(value);
  return Boolean(point && Number.isFinite(point.lat) && Number.isFinite(point.lng) && !(Math.abs(point.lat) < 0.0001 && Math.abs(point.lng) < 0.0001));
}

export function resolveDistanceLabel(from?: DeviceLocation | null, to?: FlexibleMapPoint) {
  const point = readMapPoint(to);
  if (!hasMeaningfulDeviceLocation(from) || !hasMeaningfulMapPoint(point)) return "Mesafe yok";
  const { latitude, longitude } = from as DeviceLocation;
  const { lat, lng } = point as MapPoint;
  const kilometers = haversineKm(latitude, longitude, lat, lng);
  if (!Number.isFinite(kilometers)) return "Mesafe yok";
  if (kilometers < 1) return `${Math.round(kilometers * 1000)} m`;
  return `${kilometers.toFixed(kilometers < 10 ? 1 : 0)} km`;
}

export function compareDistance(from?: DeviceLocation | null, left?: FlexibleMapPoint, right?: FlexibleMapPoint) {
  if (!hasMeaningfulDeviceLocation(from)) return 0;
  const { latitude, longitude } = from as DeviceLocation;
  const leftPoint = readMapPoint(left);
  const rightPoint = readMapPoint(right);
  const leftDistance = hasMeaningfulMapPoint(leftPoint)
    ? haversineKm(latitude, longitude, leftPoint?.lat ?? 0, leftPoint?.lng ?? 0)
    : Number.POSITIVE_INFINITY;
  const rightDistance = hasMeaningfulMapPoint(rightPoint)
    ? haversineKm(latitude, longitude, rightPoint?.lat ?? 0, rightPoint?.lng ?? 0)
    : Number.POSITIVE_INFINITY;
  return leftDistance - rightDistance;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371;
  const deltaLat = toRad(lat2 - lat1);
  const deltaLon = toRad(lon2 - lon1);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2;
  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function normalizeCoordinate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeCoordinatePair(lat: number, lng: number): MapPoint | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const withinBounds = Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  if (withinBounds) return { lat, lng };

  const swappedWithinBounds = Math.abs(lng) <= 90 && Math.abs(lat) <= 180;
  if (swappedWithinBounds) return { lat: lng, lng: lat };

  return null;
}
