import { readFile, writeFile } from "node:fs/promises";

const MAY_PREFIX = "2026-05";
const BILETINIAL_ANTALYA_MUSIC_URL = "https://biletinial.com/tr-tr/muzik/antalya";

const biletinialExtraUrls = [
  "https://biletinial.com/tr-tr/opera-bale/anna-karenina-antalya-dob",
  "https://biletinial.com/tr-tr/opera-bale/gec-romantizm-aksami-antalya-dob",
  "https://biletinial.com/tr-tr/opera-bale/saraydan-kiz-kacirma-antalya-dob"
];

const manualEvents = [
  {
    id: "2026-05-01-1100-antalya-coffee-festival-2026",
    title: "Antalya Coffee Festival 2026",
    description: "Antalya Coffee Festival 2026, kahve, konser, seminer ve atölyeleri aynı çatı altında buluşturan üç günlük bir şehir festivali.",
    synopsis:
      "Festival 1-3 Mayıs 2026 tarihlerinde Cam Piramit'te düzenleniyor. Programda tadımlar, atölyeler, kahve konuşmaları ve canlı performanslar yer alıyor. Kaynakta alanın tekerlekli sandalye erişimine uygun olduğu belirtiliyor.",
    type: "festival",
    district: "Muratpaşa",
    venueName: "Cam Piramit",
    startsAt: "2026-05-01T11:00:00+03:00",
    endsAt: "2026-05-01T20:00:00+03:00",
    priceType: "paid",
    ticketUrl: "https://dsmbilet.com/etkinlikler/antalya-coffee-festival-2026/01-mayis-cuma-tam-gun",
    coverSource: "https://dsmbilet.com/etkinlikler/antalya-coffee-festival-2026/01-mayis-cuma-tam-gun",
    sourceUrl: "https://dsmbilet.com/etkinlikler/antalya-coffee-festival-2026/01-mayis-cuma-tam-gun"
  },
  {
    id: "2026-05-02-1100-antalya-coffee-festival-2026",
    title: "Antalya Coffee Festival 2026",
    description: "Antalya Coffee Festival 2026'nın ikinci günü; kahve deneyimleri, sahne performansları ve atölyelerle devam ediyor.",
    synopsis:
      "Cam Piramit'teki festivalin ikinci gününde gün boyu kahve tadımları, konuşmalar ve sahne akışı yer alıyor. Festival Biletino sayfasında 2 Mayıs için ayrı seanslar yayınlanmış durumda.",
    type: "festival",
    district: "Muratpaşa",
    venueName: "Cam Piramit",
    startsAt: "2026-05-02T11:00:00+03:00",
    endsAt: "2026-05-02T20:00:00+03:00",
    priceType: "paid",
    ticketUrl: "https://biletino.com/tr/e-18pe/antalya-coffee-festival-2026/",
    coverSource: "https://dsmbilet.com/etkinlikler/antalya-coffee-festival-2026/01-mayis-cuma-tam-gun",
    sourceUrl: "https://biletino.com/tr/e-18pe/antalya-coffee-festival-2026/"
  },
  {
    id: "2026-05-03-1100-antalya-coffee-festival-2026",
    title: "Antalya Coffee Festival 2026",
    description: "Antalya Coffee Festival 2026'nın kapanış günü; kahve, müzik ve şehir buluşması aynı akışta sürüyor.",
    synopsis:
      "Festival 3 Mayıs 2026 tarihinde de Cam Piramit'te sürüyor. Festival sayfasında gün içi seanslar, tadımlar ve canlı performanslar yer alıyor.",
    type: "festival",
    district: "Muratpaşa",
    venueName: "Cam Piramit",
    startsAt: "2026-05-03T11:00:00+03:00",
    endsAt: "2026-05-03T20:00:00+03:00",
    priceType: "paid",
    ticketUrl: "https://biletino.com/tr/e-18pe/antalya-coffee-festival-2026/",
    coverSource: "https://dsmbilet.com/etkinlikler/antalya-coffee-festival-2026/01-mayis-cuma-tam-gun",
    sourceUrl: "https://biletino.com/tr/e-18pe/antalya-coffee-festival-2026/"
  },
  {
    id: "2026-05-08-0000-antalya-foodfest-2026",
    title: "Antalya Foodfest",
    description: "Antalya Foodfest, Akdeniz mutfağı, yerel üreticiler ve ünlü şefleri bir araya getiren gastronomi festivali.",
    synopsis:
      "Etkinlik 8-10 Mayıs 2026 tarihlerinde Karaalioğlu Parkı'nda düzenleniyor. Kaynaklarda tadımlar, atölyeler ve etkileşimli sahne akışları vurgulanıyor.",
    type: "festival",
    district: "Muratpaşa",
    venueName: "Karaalioğlu Parkı",
    startsAt: "2026-05-08T00:00:00+03:00",
    endsAt: "2026-05-10T23:59:00+03:00",
    priceType: "free",
    ticketUrl: "https://antalyafoodfest.com/",
    coverSource: "https://antalyafoodfest.com/",
    sourceUrl: "https://antalya.tc/etkinlikler/festivaller/antalya-foodfest"
  },
  {
    id: "2026-05-08-0000-tahtali-run-to-sky-2026",
    title: "Tahtalı Run to Sky",
    description: "Tahtalı Run to Sky, Toroslar'ın zirvesine uzanan parkurlarıyla Antalya'nın öne çıkan dayanıklılık koşularından biri.",
    synopsis:
      "8-10 Mayıs 2026 tarihlerindeki organizasyon, Tahtalı Dağı çevresinde koşuluyor. Kaynakta Rossist Event iletişim bilgisi ve resmi etkinlik sitesi yer alıyor.",
    type: "show",
    district: "Kemer",
    venueName: "Tahtalı Dağı",
    startsAt: "2026-05-08T00:00:00+03:00",
    endsAt: "2026-05-10T23:59:00+03:00",
    priceType: "free",
    ticketUrl: "https://event.tahtaliruntosky.com/",
    coverSource: "https://antalya.tc/events/sports-events/tahtali-run-to-sky",
    sourceUrl: "https://antalya.tc/events/sports-events/tahtali-run-to-sky"
  },
  {
    id: "2026-05-29-0000-antalya-yoruk-turkmen-festivali-2026",
    title: "Antalya Yörük Türkmen Festivali",
    description: "Yörük ve Türkmen kültürünü müzik, dans, kortej ve oba kurulumlarıyla görünür kılan çok günlük kültür festivali.",
    synopsis:
      "Festival 29-31 Mayıs 2026 tarihlerinde Döşemealtı'nda düzenleniyor. Kaynakta geleneksel el sanatları, halk oyunları ve göçebe kültür vurgusu öne çıkıyor.",
    type: "festival",
    district: "Döşemealtı",
    venueName: "Döşemealtı Festival Alanı",
    startsAt: "2026-05-29T00:00:00+03:00",
    endsAt: "2026-05-31T23:59:00+03:00",
    priceType: "free",
    ticketUrl: "https://yorukturkmenfestivali.com/",
    coverSource: "https://antalya.tc/etkinlikler/festivaller/antalya-yoruk-turkmen-festivali",
    sourceUrl: "https://antalya.tc/etkinlikler/festivaller/antalya-yoruk-turkmen-festivali"
  },
  {
    id: "2026-05-01-0000-cumhurbaskanligi-turkiye-bisiklet-turu-antalya-etaplari-2026",
    title: "Cumhurbaşkanlığı Türkiye Bisiklet Turu - Antalya Etapları",
    description: "Cumhurbaşkanlığı Türkiye Bisiklet Turu'nun Antalya bağlantılı etapları Mayıs başında Akdeniz kıyısı ve Feslikan hattında devam ediyor.",
    synopsis:
      "Antalya Rehberi sayfasında etkinlik tarihi 26 Nisan - 3 Mayıs 2026 olarak geçiyor. Antalya etabının Akdeniz kıyısı ve Toros manzaralarıyla öne çıktığı belirtiliyor.",
    type: "show",
    district: "Muratpaşa",
    venueName: "Antalya Şehir Etapları",
    startsAt: "2026-05-01T00:00:00+03:00",
    endsAt: "2026-05-03T23:59:00+03:00",
    priceType: "free",
    ticketUrl: "https://antalya.tc/events/sports-events/the-presidential-cycling-tour-of-turkey",
    coverSource: "https://antalya.tc/events/sports-events/the-presidential-cycling-tour-of-turkey",
    sourceUrl: "https://antalya.tc/events/sports-events/the-presidential-cycling-tour-of-turkey"
  }
];

function decodeEntities(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value = "") {
  return decodeEntities(value)
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

function normalizeLocaleText(value) {
  return { tr: value, en: value, ru: value, de: value };
}

function paragraphSummary(text) {
  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const content = paragraphs.find((item) => item.length > 80) ?? paragraphs[0] ?? "";
  return content.length > 320 ? `${content.slice(0, 317).trim()}...` : content;
}

function inferBiletinialType(url, title, synopsis) {
  const haystack = `${url} ${title} ${synopsis}`.toLocaleLowerCase("tr-TR");
  if (haystack.includes("bale")) return "ballet";
  if (haystack.includes("müzikal") || haystack.includes("muzikal")) return "musical";
  if (haystack.includes("çocuk") || haystack.includes("cocuk")) return "kids";
  if (haystack.includes("resital") || haystack.includes("konser") || haystack.includes("/muzik/")) return "concert";
  if (haystack.includes("anadolu ateşi") || haystack.includes("fire of anatolia")) return "show";
  return "theater";
}

function parseBiletinialSessions(html, fallbackUrl) {
  const blocks = [...html.matchAll(/<div class="ed-biletler__sehir__gun"[\s\S]*?<meta itemprop="eventStatus" content="https:\/\/schema\.org\/EventScheduled">/g)]
    .map((match) => match[0]);

  return blocks.map((block) => {
    const startAt = block.match(/itemprop="startDate" content="([^"]+)"/)?.[1] ?? "";
    const endsAt = block.match(/itemprop="endDate" content="([^"]+)"/)?.[1] ?? "";
    const venueName = cleanText(block.match(/<address itemprop="name">[\s\S]*?<\/address>/)?.[0] ?? "").replace(/^Adres/, "").trim();
    const address = cleanText(block.match(/itemprop="address" content="([^"]+)"/)?.[1] ?? "");
    const lat = Number(block.match(/itemprop="latitude" content="([^"]+)"/)?.[1] ?? "0");
    const lng = Number(block.match(/itemprop="longitude" content="([^"]+)"/)?.[1] ?? "0");
    return { startAt, endsAt, venueName, address, lat, lng, ticketUrl: fallbackUrl };
  }).filter((item) => item.startAt);
}

function inferDistrict(address, venueName) {
  const haystack = `${address} ${venueName}`.toLocaleLowerCase("tr-TR");
  if (haystack.includes("döşemealtı")) return "Döşemealtı";
  if (haystack.includes("konyaaltı")) return "Konyaaltı";
  if (haystack.includes("kemer")) return "Kemer";
  if (haystack.includes("lara")) return "Muratpaşa";
  if (haystack.includes("muratpaşa")) return "Muratpaşa";
  if (haystack.includes("kepez")) return "Kepez";
  if (haystack.includes("manavgat")) return "Manavgat";
  return "Antalya";
}

function isAntalyaMaySession(session) {
  if (!session.startAt.startsWith(MAY_PREFIX)) return false;
  const haystack = `${session.venueName} ${session.address}`.toLocaleLowerCase("tr-TR");
  return [
    "antalya",
    "muratpaşa",
    "konyaaltı",
    "kemer",
    "döşemealtı",
    "cam piramit",
    "aspendos",
    "holly stone",
    "mall of antalya",
    "açıkhava",
    "gaga club",
    "sponge pub",
    "nazım hikmet",
    "the bar",
    "re22",
    "haşim işcan kültür merkezi"
  ].some((entry) => haystack.includes(entry));
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

async function fetchMeta(url) {
  try {
    const html = await fetchText(url);
    return {
      html,
      title: cleanText(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""),
      description: cleanText(html.match(/<meta(?: name| property)="(?:description|og:description)" content="([\s\S]*?)"/)?.[1] ?? ""),
      image: html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? ""
    };
  } catch {
    return { html: "", title: "", description: "", image: "" };
  }
}

async function extractBiletinialAntalyaUrls() {
  const html = await fetchText(BILETINIAL_ANTALYA_MUSIC_URL);
  const urls = [...new Set(
    [...html.matchAll(/<h3><a href="(\/tr-tr\/muzik\/[^"]+)"/g)]
      .map((match) => new URL(match[1], "https://biletinial.com").toString())
  )];
  return [...urls, ...biletinialExtraUrls];
}

async function importBiletinialMayEvents() {
  const urls = await extractBiletinialAntalyaUrls();
  const imported = [];
  const raw = [];

  for (const url of urls) {
    const html = await fetchText(url);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? url;
    const title = cleanText(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? "");
    const image = html.match(/property="og:image" content="([^"]+)"/)?.[1] ?? "";
    const synopsis = cleanText(html.match(/<meta itemprop="description" content="([\s\S]*?)">\s*<meta itemprop="eventAttendanceMode"/)?.[1] ?? "");
    const description = paragraphSummary(synopsis);
    const sessions = parseBiletinialSessions(html, canonical).filter(isAntalyaMaySession);

    if (!sessions.length) continue;

    const type = inferBiletinialType(canonical, title, synopsis);
    const cast = cleanText(
      html.match(/<p><strong>OYUNCULAR:<\/strong><\/p>\s*<p>([\s\S]*?)<\/p>/i)?.[1] ?? ""
    )
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);

    raw.push({ source: canonical, title, type, sessionCount: sessions.length });

    for (const session of sessions) {
      const slug = slugify(title);
      const timeId = session.startAt.slice(11, 16).replace(":", "");
      imported.push({
        id: `${session.startAt.slice(0, 10)}-${timeId}-${slug}`,
        title: normalizeLocaleText(title),
        description: normalizeLocaleText(description),
        synopsis: normalizeLocaleText(synopsis || description),
        type,
        district: inferDistrict(session.address, session.venueName),
        venueName: session.venueName,
        startsAt: `${session.startAt}:00+03:00`,
        endsAt: session.endsAt ? `${session.endsAt}:00+03:00` : undefined,
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

  return { imported, raw };
}

async function importManualEvents() {
  const imported = [];
  const raw = [];

  for (const event of manualEvents) {
    const meta = await fetchMeta(event.coverSource ?? event.sourceUrl);
    raw.push({ source: event.sourceUrl, title: event.title, type: event.type });
    imported.push({
      id: event.id,
      title: normalizeLocaleText(event.title),
      description: normalizeLocaleText(event.description),
      synopsis: normalizeLocaleText(event.synopsis),
      type: event.type,
      district: event.district,
      venueName: event.venueName,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      priceType: event.priceType,
      ticketUrl: event.ticketUrl,
      cast: [],
      coverImage: meta.image,
      status: "published",
      notificationLimit: 3,
      notificationUsed: 0
    });
  }

  return { imported, raw };
}

async function main() {
  const [biletinial, manual] = await Promise.all([
    importBiletinialMayEvents(),
    importManualEvents()
  ]);

  const merged = [];
  const seen = new Set();

  for (const item of [...biletinial.imported, ...manual.imported].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }

  const tsBody = `import type { EventItem } from "./index";\n\nexport const antalyaMay2026Events: EventItem[] = ${JSON.stringify(merged, null, 2)};\n`;
  await writeFile(new URL("../packages/core/src/antalyaMay2026Events.ts", import.meta.url), tsBody, "utf8");

  await writeFile(
    new URL("../docs/reports/antalya-may-2026-events.json", import.meta.url),
    `${JSON.stringify({ fetchedAt: new Date().toISOString(), count: merged.length, sources: [...biletinial.raw, ...manual.raw] }, null, 2)}\n`,
    "utf8"
  );

  const seedUrl = new URL("../firebase/seed/events.json", import.meta.url);
  const currentSeed = JSON.parse(await readFile(seedUrl, "utf8"));
  const nextSeed = [...currentSeed];

  for (const event of merged) {
    if (!nextSeed.some((item) => item.id === event.id)) {
      nextSeed.push(event);
    }
  }

  nextSeed.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  await writeFile(seedUrl, `${JSON.stringify(nextSeed, null, 2)}\n`, "utf8");

  console.log(`Mayıs Antalya etkinlik sayısı: ${merged.length}`);
  console.log(`Biletinial kaynaklı kayıt: ${biletinial.imported.length}`);
  console.log(`Manuel kaynaklı kayıt: ${manual.imported.length}`);
}

await main();
