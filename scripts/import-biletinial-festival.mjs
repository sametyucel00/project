import { readFile, writeFile } from "node:fs/promises";

const FESTIVAL_URL = "https://biletinial.com/tr-tr/etkinlikleri/devlet-tiyatrolari-antalya-16-uluslararasi-tiyatro-festivali";
const YEAR = "2026";

function decodeEntities(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeUnicodeArtifacts(value = "") {
  return value
    .replace(/\u0007/g, "")
    .replace(/\u001f/g, "")
    .replace(/\u0091/g, "'")
    .replace(/\u0092/g, "'")
    .replace(/\u00a0/g, " ")
    .replace(/i\u0307/g, "i")
    .replace(/I\u0307/g, "İ");
}

function repairMojibake(value = "") {
  const mojibakePattern = /(?:\u00c3.|\u00c5.|\u00c4.|\u00d0.|\u00de.|â€|â€™|â€œ|â€)/;
  if (!mojibakePattern.test(value)) return normalizeUnicodeArtifacts(value);

  let candidate = value;
  for (let index = 0; index < 2; index += 1) {
    try {
      const repaired = Buffer.from(candidate, "latin1").toString("utf8");
      if (repaired === candidate) break;
      candidate = repaired;
    } catch {
      break;
    }
  }

  return normalizeUnicodeArtifacts(candidate);
}

function cleanText(value = "") {
  return repairMojibake(decodeEntities(value))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .normalize("NFC");
}

function slugify(value) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripFestivalSuffix(title) {
  return title
    .replace(/\s*-\s*16\.\s*AUTF$/i, "")
    .replace(/\s*Tiyatro Biletleri\s*$/i, "")
    .trim();
}

function inferEventType(title, synopsis) {
  const haystack = `${title} ${synopsis}`.toLocaleLowerCase("tr-TR");
  if (haystack.includes("müzikal") || haystack.includes("muzikal")) return "musical";
  if (haystack.includes("çocuk") || haystack.includes("cocuk") || haystack.includes("bebek tiyatrosu")) return "kids";
  if (haystack.includes("gösteri") || haystack.includes("gosteri")) return "show";
  return "theater";
}

function paragraphSummary(text) {
  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const content = paragraphs.find((item) => item.length > 80 && !/^oyuncular[: ]/i.test(item) && !/^yazan/i.test(item)) ?? paragraphs[0] ?? "";
  return content.length > 320 ? `${content.slice(0, 317).trim()}...` : content;
}

function extractCast(text, rawHtml = "") {
  const castHtml = rawHtml.match(/OYUNCULAR:<\/strong><\/p>\s*<p>([\s\S]*?)<\/p>/i)?.[1];
  if (castHtml) {
    return cleanText(castHtml)
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const castBlock = text.match(/OYUNCULAR:\s*([\s\S]*?)(?:\n\nDekor|\n\nSahne Amiri|Önemli not:|$)/i)?.[1] ?? "";
  return castBlock
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .flatMap((item) => item.split(/,\s*/))
    .map((item) => item.trim())
    .filter((item) => item && !/:$/.test(item));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      "accept-language": "tr-TR,tr;q=0.9,en;q=0.8"
    }
  });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  return new TextDecoder("utf-8").decode(buffer);
}

function parseFestivalLinks(html) {
  return [...new Set(
    [...html.matchAll(/href="(\/tr-tr\/tiyatro\/[^"]*16-autf[^"]*)"/g)]
      .map((match) => match[1].replace(/&amp;/g, "&"))
  )].map((path) => new URL(path, "https://biletinial.com").toString());
}

function parseSessions(html, fallbackUrl) {
  const blocks = [...html.matchAll(/<div class="ed-biletler__sehir__gun"[\s\S]*?<meta itemprop="eventStatus" content="https:\/\/schema\.org\/EventScheduled">/g)]
    .map((match) => match[0]);

  return blocks.map((block) => {
    const startAt = block.match(/itemprop="startDate" content="([^"]+)"/)?.[1] ?? "";
    const endsAt = block.match(/itemprop="endDate" content="([^"]+)"/)?.[1] ?? "";
    const venueName = cleanText(block.match(/<address itemprop="name">[\s\S]*?<\/address>/)?.[0] ?? "").replace(/^Adres/, "").trim();
    const address = repairMojibake(decodeEntities(block.match(/itemprop="address" content="([^"]+)"/)?.[1] ?? ""));
    const lat = Number(block.match(/itemprop="latitude" content="([^"]+)"/)?.[1] ?? "0");
    const lng = Number(block.match(/itemprop="longitude" content="([^"]+)"/)?.[1] ?? "0");
    const soldOut = /TÜKENDİ|TUKENDI/i.test(block);
    return { startAt, endsAt, venueName, address, lat, lng, soldOut, ticketUrl: fallbackUrl };
  }).filter((item) => item.startAt);
}

function normalizeLocaleText(value) {
  return { tr: value, en: value, ru: value, de: value };
}

async function main() {
  const festivalHtml = await fetchText(FESTIVAL_URL);
  const detailUrls = parseFestivalLinks(festivalHtml);

  const rawFestival = [];
  const normalizedEvents = [];

  for (const detailUrl of detailUrls) {
    const html = await fetchText(detailUrl);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? detailUrl;
    const titleRaw = cleanText(html.match(/<h1>([^<]+)<\/h1>/)?.[1] ?? "");
    const title = stripFestivalSuffix(titleRaw);
    const image = html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? "";
    const descEncoded = html.match(/<meta itemprop="description" content="([\s\S]*?)">\s*<meta itemprop="eventAttendanceMode"/)?.[1] ?? "";
    const synopsis = cleanText(descEncoded);
    const description = paragraphSummary(synopsis);
    const cast = extractCast(synopsis, descEncoded);
    const sessions = parseSessions(html, canonical);
    const type = inferEventType(title, synopsis);
    const slug = slugify(title);

    rawFestival.push({
      title,
      canonical,
      image,
      type,
      description,
      synopsis,
      cast,
      sessions
    });

    for (const session of sessions) {
      const dateId = session.startAt.slice(0, 10);
      const timeId = session.startAt.slice(11, 16).replace(":", "");
      normalizedEvents.push({
        id: `${dateId}-${timeId}-${slug}`,
        title: normalizeLocaleText(title),
        description: normalizeLocaleText(description),
        synopsis: normalizeLocaleText(synopsis),
        type,
        district: "Antalya",
        venueName: session.venueName || "Antalya Devlet Tiyatrosu",
        startsAt: `${session.startAt}:00+03:00`.replace("T", "T").replace(":00+03:00:00+03:00", ":00+03:00"),
        endsAt: session.endsAt ? `${session.endsAt}:00+03:00`.replace(":00+03:00:00+03:00", ":00+03:00") : undefined,
        priceType: "paid",
        ticketUrl: canonical,
        cast,
        coverImage: image,
        status: "published",
        notificationLimit: 3,
        notificationUsed: 0
      });
    }
  }

  const dedupedEvents = [];
  const seen = new Set();
  for (const item of normalizedEvents.sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    dedupedEvents.push(item);
  }

  const tsBody = `import type { EventItem } from "./index";\n\nexport const biletinialAutfFestivalEvents: EventItem[] = ${JSON.stringify(dedupedEvents, null, 2)};\n`;
  await writeFile(new URL("../packages/core/src/biletinialAutfFestivalEvents.ts", import.meta.url), tsBody, "utf8");

  await writeFile(
    new URL("../docs/reports/biletinial-autf-raw.json", import.meta.url),
    `${JSON.stringify({ source: FESTIVAL_URL, fetchedAt: new Date().toISOString(), count: rawFestival.length, items: rawFestival }, null, 2)}\n`,
    "utf8"
  );

  const seedUrl = new URL("../firebase/seed/events.json", import.meta.url);
  const currentSeed = JSON.parse(await readFile(seedUrl, "utf8"));
  const mergedSeed = [...currentSeed];
  for (const event of dedupedEvents) {
    if (!mergedSeed.some((item) => item.id === event.id)) mergedSeed.push(event);
  }
  mergedSeed.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  await writeFile(seedUrl, `${JSON.stringify(mergedSeed, null, 2)}\n`, "utf8");

  console.log(`Festival oyun sayısı: ${rawFestival.length}`);
  console.log(`Festival seans sayısı: ${dedupedEvents.length}`);
}

await main();
