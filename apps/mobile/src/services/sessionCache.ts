import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MobileSession } from "./auth";

const sessionCacheKey = "narrehberi:mobile:session-cache";

export async function readCachedMobileSession() {
  try {
    const raw = await AsyncStorage.getItem(sessionCacheKey);
    if (!raw) return null;
    return JSON.parse(raw) as MobileSession;
  } catch {
    return null;
  }
}

export async function writeCachedMobileSession(session: MobileSession) {
  try {
    await AsyncStorage.setItem(sessionCacheKey, JSON.stringify(session));
  } catch {
    return;
  }
}

export async function clearCachedMobileSession() {
  try {
    await AsyncStorage.removeItem(sessionCacheKey);
  } catch {
    return;
  }
}
