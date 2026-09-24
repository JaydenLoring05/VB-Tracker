// Canonical origin used for metadata (Open Graph URLs, sitemap, robots).
// Vercel injects VERCEL_PROJECT_PRODUCTION_URL automatically, so nothing needs
// configuring in production; set NEXT_PUBLIC_SITE_URL to override (custom domain).
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "NextRep";
export const SITE_DESCRIPTION =
  "NextRep gives volleyball teams structured workouts, daily readiness monitoring, and clear progress tracking, all from one coach dashboard.";
