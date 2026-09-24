// Canonical public origin, used for metadata, sitemap, and robots. Set
// NEXT_PUBLIC_SITE_URL in Vercel when a custom domain is attached.
const DEFAULT_SITE_URL = "https://volleyball-tracker-beta.vercel.app";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");

export const SITE_NAME = "NextRep";
export const SITE_TAGLINE = "Know who's ready. Know who needs attention.";
export const SITE_DESCRIPTION =
  "NextRep gives volleyball teams structured workouts, daily readiness monitoring, and clear progress tracking, all from one coach dashboard.";
