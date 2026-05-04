const baseUrl = process.env.NAR_WEB_BASE_URL ?? "http://127.0.0.1:3000";
const routes = ["/", "/mekanlar", "/etkinlikler", "/firsatlar", "/panel/admin", "/giris"];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 1000 }
];

const failures = [];

for (const route of routes) {
  for (const viewport of viewports) {
    const url = new URL(route, baseUrl);
    url.searchParams.set("qaViewport", `${viewport.width}x${viewport.height}`);
    try {
      const response = await fetch(url);
      const html = await response.text();
      if (!response.ok) failures.push(`${route} ${viewport.name}: HTTP ${response.status}`);
      if (!html.includes("Nar Rehberi")) failures.push(`${route} ${viewport.name}: temel marka metni yok`);
      if (html.length < 1000) failures.push(`${route} ${viewport.name}: HTML beklenenden kısa`);
    } catch (error) {
      failures.push(`${route} ${viewport.name}: ${error instanceof Error ? error.message : "istek başarısız"}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Responsive sağlık kontrolü başarısız:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Responsive sağlık kontrolü başarılı. Rota: ${routes.length}, viewport: ${viewports.length}`);
