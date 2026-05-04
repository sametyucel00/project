import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";
import { firebaseApp } from "./firebase";

const functionsRegion = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "europe-west1";
export const functions = getFunctions(firebaseApp, functionsRegion);

const emulatorState = globalThis as typeof globalThis & { __narWebFunctionsEmulator?: boolean };

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" && !emulatorState.__narWebFunctionsEmulator) {
  connectFunctionsEmulator(
    functions,
    process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1",
    Number(process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001)
  );
  emulatorState.__narWebFunctionsEmulator = true;
}

export function callable<Request, Response>(name: string) {
  return httpsCallable<Request, Response>(functions, name);
}
