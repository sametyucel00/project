const baseUrl = process.env.NAR_WEB_BASE_URL ?? "http://127.0.0.1:3000";
const routes = [
  "/",
  "/giris",
  "/ozellikler",
  "/isletmeler-icin",
  "/tiyatro-cozumleri",
  "/mobil-uygulama",
  "/tourist-survival-kit",
  "/antik-rehber",
  "/hakkimizda",
  "/iletisim",
  "/mekanlar",
  "/mekanlar/old-town-table",
  "/etkinlikler",
  "/etkinlikler/may-theater-night",
  "/firsatlar",
  "/firsatlar/coffee-qr-week",
  "/panel/admin",
  "/panel/isletme",
  "/panel/tiyatro",
  "/panel/bireysel",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest"
];

const failures = [];

for (const route of routes) {
  try {
    const response = await fetch(`${baseUrl}${route}`);
    if (!response.ok) failures.push(`${route}: HTTP ${response.status}`);
  } catch (error) {
    failures.push(`${route}: ${error instanceof Error ? error.message : "istek başarısız"}`);
  }
}

if (failures.length > 0) {
  console.error("Route sağlık kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Route sağlık kontrolü başarılı. Taranan rota: ${routes.length}`);
