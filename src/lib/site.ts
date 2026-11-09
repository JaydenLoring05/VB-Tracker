import type { Metadata } from "next";

// Canonical public origin, used for metadata, sitemap, and robots. Set
// NEXT_PUBLIC_SITE_URL in Vercel when a custom domain is attached.
const DEFAULT_SITE_URL = "https://volleyball-tracker-beta.vercel.app";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");

export const SITE_NAME = "NextRep";
export const SITE_TAGLINE = "Every volleyball player deserves a strength coach.";
export const SITE_DESCRIPTION =
  "Your personal volleyball strength and conditioning coach: a plan for your position, level and age that adjusts to practice, games and sore spots. Jump higher, move faster, get stronger.";

const SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "NextRep: every volleyball player deserves a strength coach"
};

// Per-page metadata. A page that sets openGraph or twitter replaces the layout's
// whole object (Next merges shallowly), so this repeats the share image and
// site name instead of letting them drop out.
export function pageMetadata({
  title,
  description,
  path,
  shareTitle = title,
  shareDescription = description
}: {
  title: string;
  description: string;
  path: string;
  shareTitle?: string;
  shareDescription?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: shareTitle,
      description: shareDescription,
      url: path,
      images: [SHARE_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
      images: [SHARE_IMAGE]
    }
  };
}
