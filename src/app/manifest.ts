import type { MetadataRoute } from "next";

// Colors mirror --bg in src/styles/base.css so the splash screen and
// browser chrome match the app's dark theme.
const BRAND_BACKGROUND = "#05070a";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NextRep",
    short_name: "NextRep",
    description:
      "The athlete training and recovery operating system for volleyball teams.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BRAND_BACKGROUND,
    theme_color: BRAND_BACKGROUND,
    categories: ["sports", "health", "fitness"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
