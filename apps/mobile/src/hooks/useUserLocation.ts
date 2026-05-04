import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import type { DeviceLocation } from "../utils/location";

export interface UserLocationState {
  location: DeviceLocation | null;
  permissionGranted: boolean;
  loading: boolean;
  error: string | null;
  requestAccess: () => Promise<void>;
}

export function useUserLocation(autoRequest = true): UserLocationState {
  const [location, setLocation] = useState<DeviceLocation | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchState] = useState<{ stop?: () => void }>({});

  const requestAccess = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      watchState.stop?.();
      watchState.stop = undefined;

      const currentPermission = await Location.getForegroundPermissionsAsync();
      const permission = currentPermission.status === "granted"
        ? currentPermission
        : await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setPermissionGranted(false);
        setLocation(null);
        setError("Konum izni verilmedi.");
        return;
      }

      setPermissionGranted(true);

      const current = await tryGetCurrentPosition();
      if (current) {
        setLocation(current);
        startWatchingLocation(setLocation, watchState);
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown?.coords && Number.isFinite(lastKnown.coords.latitude) && Number.isFinite(lastKnown.coords.longitude)) {
        setLocation({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude
        });
        startWatchingLocation(setLocation, watchState);
        return;
      }

      const browserLocation = await tryBrowserGeolocation();
      if (browserLocation) {
        setLocation(browserLocation);
        startWatchingLocation(setLocation, watchState);
        return;
      }

      setLocation(null);
      setError("Konum alınamadı.");
    } catch (requestError) {
      setLocation(null);
      setPermissionGranted(false);
      setError(requestError instanceof Error ? requestError.message : "Konum alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [watchState]);

  useEffect(() => {
    if (!autoRequest) {
      setLoading(false);
      return;
    }
    void requestAccess();
  }, [autoRequest, requestAccess]);

  useEffect(() => {
    return () => {
      watchState.stop?.();
      watchState.stop = undefined;
    };
  }, [watchState]);

  return { location, permissionGranted, loading, error, requestAccess };
}

async function tryGetCurrentPosition() {
  try {
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest
    });
    if (!Number.isFinite(current.coords.latitude) || !Number.isFinite(current.coords.longitude)) return null;
    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude
    };
  } catch {
    return null;
  }
}

async function tryBrowserGeolocation() {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return await new Promise<DeviceLocation | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          resolve(null);
          return;
        }
        resolve({ latitude, longitude });
      },
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 }
    );
  });
}

function startWatchingLocation(setLocation: (value: DeviceLocation) => void, watchState: { stop?: () => void }) {
  void Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Highest,
      timeInterval: 15_000,
      distanceInterval: 5
    },
    (current) => {
      if (!Number.isFinite(current.coords.latitude) || !Number.isFinite(current.coords.longitude)) return;
      setLocation({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude
      });
    }
  )
    .then((subscription) => {
      watchState.stop = () => subscription.remove();
    })
    .catch(() => undefined);
}
