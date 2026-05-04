import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const envExample = readFileSync(join(root, ".env.example"), "utf8");
const envFile = (() => {
  try {
    return readFileSync(join(root, ".env"), "utf8");
  } catch {
    return "";
  }
})();
const firebaseJson = readFileSync(join(root, "firebase", "firebase.json"), "utf8");
const firebaseRc = readFileSync(join(root, "firebase", ".firebaserc"), "utf8");
const webFirebase = readFileSync(join(root, "apps", "web", "lib", "firebase.ts"), "utf8");
const webFunctions = readFileSync(join(root, "apps", "web", "lib", "functions.ts"), "utf8");
const mobileFirebase = readFileSync(join(root, "apps", "mobile", "src", "firebase.ts"), "utf8");
const mobileApp = readFileSync(join(root, "apps", "mobile", "app.json"), "utf8");
const seedImport = readFileSync(join(root, "scripts", "import-seed-firestore.mjs"), "utf8");

const failures = [];
const requiredEnv = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_USE_FIREBASE_EMULATORS",
  "EXPO_PUBLIC_USE_FIREBASE_EMULATORS",
  "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL",
  "EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL",
  "NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST",
  "EXPO_PUBLIC_FIRESTORE_EMULATOR_HOST",
  "NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST",
  "EXPO_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST",
  "NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST",
  "EXPO_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_FCM_VAPID_KEY"
];

for (const key of requiredEnv) {
  if (!envExample.includes(`${key}=`)) failures.push(`.env.example eksik: ${key}`);
}

const forbiddenRootScripts = ["build", "build:web", "build:android", "build:ios", "build:windows"];
for (const script of forbiddenRootScripts) {
  if (packageJson.scripts?.[script]) failures.push(`Kök package.json build script içermemeli: ${script}`);
}

for (const needle of ["demo-api-key", "demo-nar-rehberi"]) {
  if (!webFirebase.includes(needle)) failures.push(`Web Firebase fallback eksik: ${needle}`);
  if (!mobileFirebase.includes(needle)) failures.push(`Mobil Firebase fallback eksik: ${needle}`);
}

for (const emulator of ["auth", "firestore", "functions", "storage", "ui"]) {
  if (!firebaseJson.includes(`"${emulator}"`)) failures.push(`Firebase emulator eksik: ${emulator}`);
}

if (!firebaseRc.includes("demo-nar-rehberi")) failures.push(".firebaserc demo proje koruması eksik.");

const emulatorNeedles = [
  [webFirebase, "connectAuthEmulator", "Web Auth emulator bağlantısı eksik."],
  [webFirebase, "connectFirestoreEmulator", "Web Firestore emulator bağlantısı eksik."],
  [webFirebase, "connectStorageEmulator", "Web Storage emulator bağlantısı eksik."],
  [webFirebase, "NEXT_PUBLIC_USE_FIREBASE_EMULATORS", "Web emulator env bayrağı eksik."],
  [webFunctions, "connectFunctionsEmulator", "Web Functions emulator bağlantısı eksik."],
  [webFunctions, "NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST", "Web Functions emulator host env eksik."],
  [mobileFirebase, "connectAuthEmulator", "Mobil Auth emulator bağlantısı eksik."],
  [mobileFirebase, "connectFirestoreEmulator", "Mobil Firestore emulator bağlantısı eksik."],
  [mobileFirebase, "connectFunctionsEmulator", "Mobil Functions emulator bağlantısı eksik."],
  [mobileFirebase, "connectStorageEmulator", "Mobil Storage emulator bağlantısı eksik."],
  [mobileFirebase, "EXPO_PUBLIC_USE_FIREBASE_EMULATORS", "Mobil emulator env bayrağı eksik."],
  [mobileApp, "\"scheme\": \"narrehberi\"", "Mobil deep link scheme eksik."],
  [mobileApp, "\"userInterfaceStyle\": \"automatic\"", "Mobil açık/koyu mod config eksik."]
];

for (const [text, needle, message] of emulatorNeedles) {
  if (!text.includes(needle)) failures.push(message);
}

if (!packageJson.scripts?.["seed:firestore"]) failures.push("seed:firestore scripti eksik.");
if (!packageJson.scripts?.["check:legacy-live"]) failures.push("check:legacy-live scripti eksik.");
if (!packageJson.scripts?.["legacy:normalized-preview"]) failures.push("legacy:normalized-preview scripti eksik.");
if (!packageJson.scripts?.["check:google-apis"]) failures.push("check:google-apis scripti eksik.");
if (!seedImport.includes("FIRESTORE_EMULATOR_HOST")) failures.push("Seed import emulator güvenlik kontrolü eksik.");
if (!seedImport.includes("process.exit(1)")) failures.push("Seed import güvenli çıkış kontrolü eksik.");

if (envFile) {
  const vapidLine = envFile.split(/\r?\n/).find((line) => line.startsWith("NEXT_PUBLIC_FCM_VAPID_KEY="));
  const vapidPublicKey = vapidLine?.split("=").slice(1).join("=").trim() ?? "";
  if (!vapidPublicKey) failures.push(".env VAPID public key eksik.");
  if (vapidPublicKey && !vapidPublicKey.startsWith("B")) failures.push(".env VAPID public key beklenen formatta değil.");
  if (/VAPID_PRIVATE|PRIVATE_VAPID|FCM_PRIVATE/i.test(envFile)) {
    failures.push("VAPID private key client/public env içine yazılmamalı.");
  }
}

if (failures.length > 0) {
  console.error("Environment kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Environment kontrolü başarılı.");
