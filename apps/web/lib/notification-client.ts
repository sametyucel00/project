"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { firebaseApp } from "./firebase";
import { saveFcmToken } from "./panel-actions";

export type WebNotificationPermissionState = "unsupported" | "default" | "denied" | "granted" | "saved";

export async function requestWebPushPermission(locale = "tr"): Promise<WebNotificationPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (!(await isSupported())) return "unsupported";

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
  if (!vapidKey) return "granted";

  const messaging = getMessaging(firebaseApp);
  const registration = "serviceWorker" in navigator
    ? await navigator.serviceWorker.register("/firebase-messaging-sw.js")
    : undefined;
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration
  });

  if (!token) return "granted";
  await saveFcmToken({ token, platform: "web", locale });
  return "saved";
}

export function getWebNotificationPermission(): WebNotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}
