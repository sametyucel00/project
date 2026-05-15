import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@nar/core", "@nar/ui"],
  turbopack: {
    root: path.join(__dirname, "../.."),
    resolveAlias: {
      "@": path.join(__dirname, "."),
      "@nar/core": path.join(__dirname, "../../packages/core/src"),
      "@nar/ui": path.join(__dirname, "../../packages/ui/src")
    }
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      }
    ]
  }
};

export default nextConfig;
