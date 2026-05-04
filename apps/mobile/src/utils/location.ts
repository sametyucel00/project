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
  location?: FlexibleMapPoint;
  coordinates?: FlexibleMapPoint | Array<number | string>;
  geo?: FlexibleMapPoint;
  geopoint?: FlexibleMapPoint;
  position?: FlexibleMapPoint;
  mapPoint?: FlexibleMapPoint;
  district?: string;
  address?: string;
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
  if (Array.isArray(value)) return normalizeCoordinatePair(normalizeCoordinate(value[1]) ?? Number.NaN, normalizeCoordinate(value[0]) ?? Number.NaN);
  const source = value as Record<string, unknown>;
  const direct = readDirectMapPoint(source);
  if (direct) return direct;

  const nestedKeys = ["location", "coordinates", "geo", "geopoint", "position", "mapPoint"];
  for (const key of nestedKeys) {
    const nested = readMapPoint(source[key] as FlexibleMapPoint);
    if (nested) return nested;
  }

  return resolveAntalyaFallbackPoint(source.district, source.address);
}

export function hasMeaningfulMapPoint(value: FlexibleMapPoint) {
  const point = readMapPoint(value);
  return Boolean(point && Number.isFinite(point.lat) && Number.isFinite(point.lng) && !(Math.abs(point.lat) < 0.0001 && Math.abs(point.lng) < 0.0001));
}

export function resolveDistanceLabel(from?: DeviceLocation | null, to?: FlexibleMapPoint) {
  const point = readMapPoint(to);
  if (!hasMeaningfulDeviceLocation(from) || !hasMeaningfulMapPoint(point)) return "Mesafe yok";
  const { latitude, longitude } = normalizeDeviceLocation(from as DeviceLocation);
  const { lat, lng } = point as MapPoint;
  const kilometers = haversineKm(latitude, longitude, lat, lng);
  if (!Number.isFinite(kilometers)) return "Mesafe yok";
  if (kilometers < 1) return `${Math.round(kilometers * 1000)} m`;
  return `${kilometers.toFixed(kilometers < 10 ? 1 : 0)} km`;
}

export function compareDistance(from?: DeviceLocation | null, left?: FlexibleMapPoint, right?: FlexibleMapPoint) {
  if (!hasMeaningfulDeviceLocation(from)) return 0;
  const { latitude, longitude } = normalizeDeviceLocation(from as DeviceLocation);
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

export function resolveDistanceKm(from?: DeviceLocation | null, to?: FlexibleMapPoint) {
  const point = readMapPoint(to);
  if (!hasMeaningfulDeviceLocation(from) || !hasMeaningfulMapPoint(point)) return Number.POSITIVE_INFINITY;
  const { latitude, longitude } = normalizeDeviceLocation(from as DeviceLocation);
  return haversineKm(latitude, longitude, point?.lat ?? 0, point?.lng ?? 0);
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

function readDirectMapPoint(source: Record<string, unknown>) {
  const lat = normalizeCoordinate(source.lat ?? source.latitude ?? source._lat);
  const lng = normalizeCoordinate(source.lng ?? source.longitude ?? source._long);
  if (lat === null || lng === null) return null;
  return normalizeCoordinatePair(lat, lng);
}

function normalizeCoordinatePair(lat: number, lng: number): MapPoint | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const candidates = [
    { lat, lng },
    { lat: lng, lng: lat },
    ...scaledCoordinateCandidates(lat, lng),
    ...scaledCoordinateCandidates(lng, lat)
  ].filter((point, index, list) =>
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180 &&
    list.findIndex((other) => other.lat === point.lat && other.lng === point.lng) === index
  );

  if (!candidates.length) return null;
  return candidates.find(isAntalyaAreaPoint) ?? candidates.find(isTurkeyAreaPoint) ?? candidates[0] ?? null;
}

function scaledCoordinateCandidates(lat: number, lng: number) {
  const divisors = [10, 100, 1000, 10000, 100000, 1000000];
  return divisors.map((divisor) => ({ lat: lat / divisor, lng: lng / divisor }));
}

function normalizeDeviceLocation(location: DeviceLocation): DeviceLocation {
  const direct = { lat: location.latitude, lng: location.longitude };
  const swapped = { lat: location.longitude, lng: location.latitude };
  const directLooksRight = isTurkeyAreaPoint(direct) || Math.abs(direct.lat) <= 90 && Math.abs(direct.lng) <= 180;
  const swappedLooksBetter = !isTurkeyAreaPoint(direct) && isTurkeyAreaPoint(swapped);
  return swappedLooksBetter || !directLooksRight
    ? { latitude: swapped.lat, longitude: swapped.lng }
    : location;
}

function isTurkeyAreaPoint(point: MapPoint) {
  return point.lat >= 35 && point.lat <= 43 && point.lng >= 25 && point.lng <= 45;
}

function isAntalyaAreaPoint(point: MapPoint) {
  return point.lat >= 35.7 && point.lat <= 37.6 && point.lng >= 29.0 && point.lng <= 32.6;
}

const antalyaDistrictCenters: Record<string, MapPoint> = {
  akseki: { lat: 37.0486, lng: 31.7908 },
  aksu: { lat: 36.9537, lng: 30.8472 },
  alanya: { lat: 36.5444, lng: 31.9954 },
  demre: { lat: 36.2444, lng: 29.985 },
  dosemealti: { lat: 37.0239, lng: 30.6024 },
  elmali: { lat: 36.7358, lng: 29.9176 },
  finike: { lat: 36.295, lng: 30.1406 },
  gazipasa: { lat: 36.2694, lng: 32.3179 },
  gundogmus: { lat: 36.8135, lng: 31.9957 },
  ibradi: { lat: 37.0969, lng: 31.5994 },
  kas: { lat: 36.1996, lng: 29.6414 },
  kemer: { lat: 36.6014, lng: 30.5583 },
  kepez: { lat: 36.9179, lng: 30.7133 },
  konyaalti: { lat: 36.862, lng: 30.6346 },
  korkuteli: { lat: 37.065, lng: 30.1956 },
  kumluca: { lat: 36.365, lng: 30.2863 },
  manavgat: { lat: 36.7867, lng: 31.4431 },
  muratpasa: { lat: 36.8841, lng: 30.7056 },
  serik: { lat: 36.9169, lng: 31.0989 }
};

function resolveAntalyaFallbackPoint(district: unknown, address: unknown) {
  const key = normalizeDistrictKey(typeof district === "string" ? district : "");
  if (key && antalyaDistrictCenters[key]) return antalyaDistrictCenters[key];
  const text = `${typeof address === "string" ? address : ""} ${typeof district === "string" ? district : ""}`;
  const haystack = normalizeDistrictKey(text);
  const matchedKey = Object.keys(antalyaDistrictCenters).find((districtKey) => haystack.includes(districtKey));
  return matchedKey ? antalyaDistrictCenters[matchedKey] : null;
}

function normalizeDistrictKey(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]/g, "");
}
