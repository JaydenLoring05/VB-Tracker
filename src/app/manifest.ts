import type { MetadataRoute } from "next";

// Mirrors --bg in src/styles/tokens.css (oklch(0.12 0.008 75) = #070503) and the theme-color in
// layout.tsx, so the splash screen, title bar and app background are one color.
const BRAND_BACKGROUND = "#070503";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NextRep",
    short_name: "NextRep",
    description:
      "The athlete training and recovery operating system for volleyball teams.",
    start_url: "/",
    scope: "/",
    lang: "en",
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
