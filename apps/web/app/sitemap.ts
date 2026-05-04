import { seoManagedRoutes } from "@nar/core";
import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [...seoManagedRoutes, "/privacy-policy", "/hesap-silme"];
  return routes.map((route) => ({
    url: new URL(route, baseUrl).toString(),
    lastModified: new Date("2026-05-01"),
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.8
  }));
}
