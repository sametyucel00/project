import Constants from "expo-constants";
import { Platform } from "react-native";

type RuntimeExtra = {
  firebase?: Record<string, string | undefined>;
  auth?: Record<string, string | undefined>;
  googleMapsApiKey?: string;
  authCallbackBaseUrl?: string;
};

const constants = Constants as typeof Constants & {
  manifest?: { extra?: RuntimeExtra };
  manifest2?: { extra?: { expoClient?: { extra?: RuntimeExtra } }; expoClient?: { extra?: RuntimeExtra } };
};

const extra = (
  Constants.expoConfig?.extra
  ?? constants.manifest2?.extra?.expoClient?.extra
  ?? constants.manifest2?.expoClient?.extra
  ?? constants.manifest?.extra
  ?? {}
) as RuntimeExtra;

const defaultFirebaseConfig = {
  apiKey: "AIzaSyA9QfI2_s10k8HL-uAglDYHVqADG5wx0v0",
  authDomain: "nar-rehberi-pro.firebaseapp.com",
  projectId: "nar-rehberi-pro",
  storageBucket: "nar-rehberi-pro.firebasestorage.app",
  messagingSenderId: "712568563076",
  appId: "1:712568563076:web:a9c6f80d4ba8f5f4fe29d1"
};

function readValue(envName: string, extraValue?: string) {
  return (process.env[envName] || extraValue || "").trim();
}

function resolveFirebaseApiKey(extraValue?: string) {
  const mobileApiKey = readValue("EXPO_PUBLIC_FIREBASE_MOBILE_API_KEY", extraValue);
  const webApiKey = readValue("EXPO_PUBLIC_FIREBASE_API_KEY", extraValue);

  if (Platform.OS === "web") {
    return webApiKey || mobileApiKey || defaultFirebaseConfig.apiKey;
  }

  return mobileApiKey || webApiKey || defaultFirebaseConfig.apiKey;
}

export function getRuntimeFirebaseConfig() {
  return {
    apiKey: resolveFirebaseApiKey(extra.firebase?.apiKey),
    authDomain: readValue("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", extra.firebase?.authDomain) || defaultFirebaseConfig.authDomain,
    projectId: readValue("EXPO_PUBLIC_FIREBASE_PROJECT_ID", extra.firebase?.projectId) || defaultFirebaseConfig.projectId,
    storageBucket: readValue("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", extra.firebase?.storageBucket) || defaultFirebaseConfig.storageBucket,
    messagingSenderId: readValue("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", extra.firebase?.messagingSenderId) || defaultFirebaseConfig.messagingSenderId,
    appId: readValue("EXPO_PUBLIC_FIREBASE_APP_ID", extra.firebase?.appId) || defaultFirebaseConfig.appId
  };
}

export function getGoogleWebClientId() {
  return readValue("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID", extra.auth?.googleWebClientId)
    || readValue("EXPO_PUBLIC_GOOGLE_CLIENT_ID", extra.auth?.googleClientId)
    || readValue("GOOGLE_WEB_CLIENT_ID")
    || readValue("GOOGLE_CLIENT_ID");
}

export function getAuthCallbackBaseUrl() {
  return readValue("EXPO_PUBLIC_AUTH_CALLBACK_BASE_URL", extra.authCallbackBaseUrl)
    || "https://narrehberi.com";
}

export function getAppleServiceId() {
  return readValue("EXPO_PUBLIC_APPLE_SERVICE_ID", extra.auth?.appleServiceId)
    || readValue("EXPO_PUBLIC_APPLE_WEB_CLIENT_ID", extra.auth?.appleWebClientId)
    || readValue("APPLE_SERVICE_ID");
}
