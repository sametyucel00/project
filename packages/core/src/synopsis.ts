const castMarkers = [
  "Oyuncular",
  "Oyuncu Kadrosu",
  "Kadro",
  "Cast",
  "Performers",
  "Yönetmen",
  "Director",
  "Dramaturg",
  "Müzik",
  "Music",
  "Koreografi",
  "Choreography"
];

export function normalizeSynopsisText(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !castMarkers.some((marker) => line.startsWith(marker)))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function extractSynopsisOnly(value?: string | null) {
  const normalized = normalizeSynopsisText(value);
  return normalized || "";
}

