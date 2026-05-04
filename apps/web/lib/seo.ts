import { getSeoMeta } from "@nar/core";
import type { Metadata } from "next";

export function createMetadata(slug: string): Metadata {
  const meta = getSeoMeta(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://narrehberi.com";
  const canonical = new URL(slug, siteUrl).toString();
  return {
    metadataBase: new URL(siteUrl),
    title: meta.title,
    description: meta.description,
    icons: {
      icon: "/nar-logo.png",
      shortcut: "/nar-logo.png",
      apple: "/nar-logo.png"
    },
    keywords: meta.keywords,
    alternates: {
      canonical,
      languages: {
        "tr-TR": canonical,
        "en-US": `${canonical}?lang=en`,
        "ru-RU": `${canonical}?lang=ru`,
        "de-DE": `${canonical}?lang=de`
      }
    },
    robots: meta.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: canonical,
      siteName: "Nar Rehberi",
      type: "website",
      locale: "tr_TR",
      images: [{ url: meta.image || "/nar-logo.png" }]
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [meta.image || "/nar-logo.png"]
    }
  };
}

export function createStructuredData(slug: string) {
  const meta = getSeoMeta(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://narrehberi.com";
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nar Rehberi",
    url: new URL(slug, siteUrl).toString(),
    inLanguage: "tr-TR",
    description: meta.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/mekanlar?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}
