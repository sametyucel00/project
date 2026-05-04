"use client";

import { firebaseApp } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(firebaseApp);

export async function logClientError(message: string, context: Record<string, string | number | boolean | null> = {}) {
  try {
    const call = httpsCallable(functions, "logClientError");
    await call({
      severity: "error",
      source: "web",
      message,
      context
    });
  } catch {
    // Logging must never break the user-facing recovery path.
  }
}
