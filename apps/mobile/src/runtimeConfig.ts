import Constants from "expo-constants";

type RuntimeExtra = {
  firebase?: Record<string, string | undefined>;
  auth?: Record<string, string | undefined>;
  googleMapsApiKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as RuntimeExtra;

function readValue(envName: string, extraValue?: string) {
  return (process.env[envName] || extraValue || "").trim();
}

export function getRuntimeFirebaseConfig() {
  return {
    apiKey: readValue("EXPO_PUBLIC_FIREBASE_API_KEY", extra.firebase?.apiKey),
    authDomain: readValue("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", extra.firebase?.authDomain),
    projectId: readValue("EXPO_PUBLIC_FIREBASE_PROJECT_ID", extra.firebase?.projectId),
    storageBucket: readValue("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", extra.firebase?.storageBucket),
    messagingSenderId: readValue("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", extra.firebase?.messagingSenderId),
    appId: readValue("EXPO_PUBLIC_FIREBASE_APP_ID", extra.firebase?.appId)
  };
}

export function getGoogleWebClientId() {
  return readValue("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID", extra.auth?.googleWebClientId)
    || readValue("EXPO_PUBLIC_GOOGLE_CLIENT_ID", extra.auth?.googleClientId)
    || readValue("GOOGLE_WEB_CLIENT_ID")
    || readValue("GOOGLE_CLIENT_ID");
}

export function getAppleServiceId() {
  return readValue("EXPO_PUBLIC_APPLE_SERVICE_ID", extra.auth?.appleServiceId)
    || readValue("EXPO_PUBLIC_APPLE_WEB_CLIENT_ID", extra.auth?.appleWebClientId)
    || readValue("APPLE_SERVICE_ID");
}

