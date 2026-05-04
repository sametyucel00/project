import { type AnalyticsEventType, type ContentEntityType, type ErrorSeverity, type Locale } from "@nar/core";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

export interface MobileAnalyticsInput {
  type: AnalyticsEventType;
  entityType?: ContentEntityType;
  entityId?: string;
  city?: string;
  locale?: Locale;
  platform?: "ios" | "android" | "unknown";
}

export interface MobileErrorInput {
  severity?: ErrorSeverity;
  message: string;
  context?: Record<string, string | number | boolean | null>;
}

const trackAnalyticsEventCallable = httpsCallable<MobileAnalyticsInput, { id: string }>(functions, "trackAnalyticsEvent");
const logClientErrorCallable = httpsCallable<MobileErrorInput & { source: "mobile" }, { id: string }>(functions, "logClientError");

export async function trackMobileEvent(input: MobileAnalyticsInput) {
  const result = await trackAnalyticsEventCallable({
    city: "Antalya",
    locale: "tr",
    platform: "unknown",
    ...input
  });
  return result.data;
}

export async function logMobileError(input: MobileErrorInput) {
  const result = await logClientErrorCallable({
    severity: input.severity ?? "error",
    source: "mobile",
    message: input.message,
    context: input.context ?? {}
  });
  return result.data;
}
