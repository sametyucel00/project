import { type AnalyticsEventType, type ContentEntityType, type ErrorSeverity, type Locale } from "@nar/core";
import { callable } from "./functions";

export interface WebAnalyticsInput {
  type: AnalyticsEventType;
  entityType?: ContentEntityType;
  entityId?: string;
  city?: string;
  locale?: Locale;
}

export interface WebErrorInput {
  severity?: ErrorSeverity;
  message: string;
  context?: Record<string, string | number | boolean | null>;
}

export async function trackWebEvent(input: WebAnalyticsInput) {
  const call = callable<WebAnalyticsInput & { platform: "web" }, { id: string }>("trackAnalyticsEvent");
  return call({
    city: "Antalya",
    locale: "tr",
    ...input,
    platform: "web"
  });
}

export async function logWebError(input: WebErrorInput) {
  const call = callable<WebErrorInput & { source: "web" }, { id: string }>("logClientError");
  return call({
    severity: input.severity ?? "error",
    source: "web",
    message: input.message,
    context: input.context ?? {}
  });
}
