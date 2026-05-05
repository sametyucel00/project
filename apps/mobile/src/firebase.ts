import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, initializeAuth } from "firebase/auth";
import * as FirebaseAuthRuntime from "@firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { getRuntimeFirebaseConfig } from "./runtimeConfig";

const firebaseConfig = getRuntimeFirebaseConfig();

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || firebaseConfig.apiKey === "demo-api-key") {
  throw new Error("Mobil Firebase ayarlari eksik. EXPO_PUBLIC_FIREBASE_* degerleri build ortaminda gorunmeli.");
}

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const isWebEnvironment = typeof window !== "undefined" && typeof document !== "undefined";
const reactNativePersistence = (FirebaseAuthRuntime as unknown as {
  getReactNativePersistence?: (storage: typeof AsyncStorage) => unknown;
}).getReactNativePersistence;

export const auth = (() => {
  if (isWebEnvironment) return getAuth(firebaseApp);
  try {
    return initializeAuth(firebaseApp, {
      persistence: reactNativePersistence ? [reactNativePersistence(AsyncStorage) as never] : undefined
    });
  } catch {
    return getAuth(firebaseApp);
  }
})();
export const db = getFirestore(firebaseApp);
export const functions = getFunctions(firebaseApp, process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION || "us-central1");
export const storage = getStorage(firebaseApp);

const emulatorState = globalThis as typeof globalThis & { __narMobileFirebaseEmulators?: boolean };

if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === "true" && !emulatorState.__narMobileFirebaseEmulators) {
  connectAuthEmulator(auth, process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099", {
    disableWarnings: true
  });
  connectFirestoreEmulator(
    db,
    process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST || "127.0.0.1",
    Number(process.env.EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT || 8080)
  );
  connectFunctionsEmulator(
    functions,
    process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1",
    Number(process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001)
  );
  connectStorageEmulator(
    storage,
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1",
    Number(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT || 9199)
  );
  emulatorState.__narMobileFirebaseEmulators = true;
}
