import { webManifest } from "@nar/core";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: webManifest.name,
    short_name: webManifest.shortName,
    description: webManifest.description,
    start_url: webManifest.startUrl,
    display: "standalone",
    background_color: webManifest.backgroundColor,
    theme_color: webManifest.themeColor,
    icons: [
      {
        src: "/nar-logo.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    shortcuts: webManifest.shortcuts.map((shortcut) => ({
      name: shortcut.name,
      url: shortcut.url,
      description: shortcut.description
    }))
  };
}
