import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms"],
      disallow: [
        "/dashboard",
        "/workouts",
        "/workout",
        "/stats",
        "/calendar",
        "/library",
        "/coach",
        "/onboarding",
        "/auth/"
      ]
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
