"use client";

import { Analytics } from "@vercel/analytics/next";

import { isAnalyticsEnabled, redactAnalyticsUrl } from "@/lib/monitoring";

/**
 * Vercel Analytics page views, off unless NEXT_PUBLIC_ANALYTICS_ENABLED=true.
 * Cookieless; URLs are sent without query strings, invite codes or record ids.
 */
export function AnalyticsGate() {
  if (!isAnalyticsEnabled(process.env.NEXT_PUBLIC_ANALYTICS_ENABLED)) return null;
  return <Analytics beforeSend={(event) => ({ ...event, url: redactAnalyticsUrl(event.url) })} />;
}
