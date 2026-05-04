const { expo } = require("./app.json");

const projectId =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  process.env.EAS_PROJECT_ID ||
  expo?.extra?.eas?.projectId ||
  "556d7144-5b3c-4b9f-a785-916ae5d35a28";

module.exports = {
  ...expo,
  name: "Nar Rehberi",
  version: "9.1.0",
  icon: "./assets/icon.png",
  owner: process.env.EXPO_OWNER || "simic52",
  ios: {
    ...(expo.ios ?? {}),
    supportsTablet: true,
    bundleIdentifier: "com.narrehberi.app",
    buildNumber: "1.2"
  },
  android: {
    ...(expo.android ?? {}),
    package: "narrehberi.com",
    versionCode: 9101
  },
  extra: {
    ...(expo.extra ?? {}),
    eas: { ...(expo.extra?.eas ?? {}), projectId }
  }
};
