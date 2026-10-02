// Browser error monitoring. Sentry is only downloaded and started when
// NEXT_PUBLIC_SENTRY_DSN is set; without it nothing is loaded or sent.
import { readSentryDsn, scrubEvent } from "@/lib/monitoring";

const dsn = readSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);

if (dsn) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
      // Errors only: no performance tracing, no session replay, no PII.
      tracesSampleRate: 0,
      // Sentry 11 collects all of this by default; collect none of it.
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: { request: { allow: ["user-agent"] }, response: false },
        httpBodies: [],
        urlQueryParams: false
      },
      beforeSend: (event) => scrubEvent(event),
      beforeBreadcrumb: (crumb) => (crumb.category?.startsWith("ui.input") ? null : crumb)
    });
  });
}
