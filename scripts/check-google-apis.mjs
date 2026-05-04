import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function loadEnv() {
  const envPath = join(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const failures = [];

if (!key) {
  failures.push("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY eksik.");
}

if (key && !key.startsWith("AIza")) {
  failures.push("Google Maps API key beklenen public key formatında değil.");
}

if (key) {
  const params = new URLSearchParams({
    input: "Hadrian Kapısı Antalya",
    inputtype: "textquery",
    fields: "place_id,name,formatted_address,geometry,rating,user_ratings_total",
    language: "tr",
    key
  });

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params.toString()}`);
    if (!response.ok) {
      failures.push(`Google Places HTTP hatası: ${response.status}`);
    } else {
      const payload = await response.json();
      if (payload.status !== "OK" || !Array.isArray(payload.candidates) || payload.candidates.length === 0) {
        failures.push(`Google Places yanıtı başarısız: ${payload.status ?? "status yok"} ${payload.error_message ?? ""}`.trim());
      }
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.message : "Google Places isteği başarısız.");
  }
}

if (failures.length > 0) {
  console.error("Google API canlı kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Google API canlı kontrolü başarılı. Places API key okuma isteğine yanıt verdi.");
