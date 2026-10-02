// Sends an error caught by an error boundary to Sentry, if configured.
// Error boundaries swallow errors, so the automatic handler never sees them.
import { readSentryDsn } from "@/lib/monitoring";

export function reportError(error: unknown) {
  if (!readSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN)) return;
  import("@sentry/nextjs")
    .then((Sentry) => Sentry.captureException(error))
    .catch(() => undefined);
}
