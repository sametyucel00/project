const expo = {
  name: "Nar Rehberi",
  slug: "nar-rehberi-sametycl52",
  scheme: "narrehberi",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  jsEngine: "hermes",
  plugins: []
};

const projectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  process.env.EAS_PROJECT_ID ||
  "4c24baa9-90a9-4ad9-a1ed-79dcdb26ae9b";

const publicFirebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_MOBILE_API_KEY ||
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyA9QfI2_s10k8HL-uAglDYHVqADG5wx0v0",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "nar-rehberi-pro.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "nar-rehberi-pro",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "nar-rehberi-pro.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "712568563076",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:712568563076:web:a9c6f80d4ba8f5f4fe29d1"
};

module.exports = {
  ...expo,
  name: "Nar Rehberi",
  version: "9.1.0",
  icon: "./assets/icon.png",
  splash: {
    backgroundColor: "#ffffff"
  },
  owner: process.env.EXPO_OWNER || "sametycl52",
  plugins: [
    ...(expo.plugins ?? []),
    "expo-web-browser",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Nar Rehberi, yakındaki mekan ve etkinlik mesafelerini göstermek için konumunuzu kullanır."
      }
    ]
  ],
  ios: {
    ...(expo.ios ?? {}),
    supportsTablet: true,
    bundleIdentifier: "com.narrehberi.app",
    buildNumber: "1.17",
    infoPlist: {
      ...(expo.ios?.infoPlist ?? {}),
      NSLocationWhenInUseUsageDescription:
        "Nar Rehberi, yakındaki mekan ve etkinlik mesafelerini göstermek için konumunuzu kullanır."
    }
  },
  android: {
    ...(expo.android ?? {}),
    package: "narrehberi.com",
    versionCode: 9117
  },
  extra: {
    ...(expo.extra ?? {}),
    firebase: {
      ...(expo.extra?.firebase ?? {}),
      ...publicFirebaseConfig
    },
    auth: {
      ...(expo.extra?.auth ?? {}),
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "",
      googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "",
      appleServiceId: process.env.EXPO_PUBLIC_APPLE_SERVICE_ID || "",
      appleWebClientId: process.env.EXPO_PUBLIC_APPLE_WEB_CLIENT_ID || ""
    },
    authCallbackBaseUrl: process.env.EXPO_PUBLIC_AUTH_CALLBACK_BASE_URL || "https://narrehberi.com",
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    eas: projectId ? { ...(expo.extra?.eas ?? {}), projectId } : { ...(expo.extra?.eas ?? {}) }
  }
};
