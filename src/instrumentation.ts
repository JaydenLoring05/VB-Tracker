// Server and edge error monitoring. Off unless NEXT_PUBLIC_SENTRY_DSN is set.
import { readSentryDsn, scrubEvent } from "@/lib/monitoring";

const dsn = readSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);

export async function register() {
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? "development",
    tracesSampleRate: 0,
    // Sentry 11 collects all of this by default; collect none of it.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { allow: ["user-agent"] }, response: false },
      httpBodies: [],
      urlQueryParams: false
    },
    beforeSend: (event) => scrubEvent(event)
  });
}

// Errors thrown while rendering or in route handlers.
export async function onRequestError(...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>) {
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
