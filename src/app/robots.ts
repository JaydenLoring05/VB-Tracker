import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pilot", "/privacy", "/terms"],
        // Signed-in app screens and the API hold private team data.
        disallow: [
          "/api/",
          "/auth/",
          "/login",
          "/dashboard",
          "/coach",
          "/workout",
          "/workouts",
          "/stats",
          "/calendar",
          "/library",
          "/onboarding"
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
