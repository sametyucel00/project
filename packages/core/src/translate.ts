type Locale = "tr" | "en" | "ru" | "de";

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
const cache = new Map<string, string>();

function getApiKey() {
  return process.env.EXPO_PUBLIC_GROQ_API_KEY
    ?? process.env.NEXT_PUBLIC_GROQ_API_KEY
    ?? process.env.GROQ_API_KEY
    ?? "";
}

export async function translateText(text: string, targetLocale: Locale, sourceLocale: Locale = "tr") {
  const normalized = text.trim();
  if (!normalized || targetLocale === sourceLocale) return normalized;
  const apiKey = getApiKey();
  if (!apiKey) return normalized;
  const cacheKey = `${sourceLocale}:${targetLocale}:${normalized}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(groqEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.15,
        messages: [
          {
            role: "system",
            content: "You translate concise app text. Preserve proper nouns, event titles, venue names, and line breaks only if needed."
          },
          {
            role: "user",
            content: `Translate this ${sourceLocale} text into ${targetLocale}. Return only the translated text.\n\n${normalized}`
          }
        ]
      })
    });

    if (!response.ok) return normalized;
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const translated = payload.choices?.[0]?.message?.content?.trim();
    if (!translated) return normalized;
    cache.set(cacheKey, translated);
    return translated;
  } catch {
    return normalized;
  }
}
