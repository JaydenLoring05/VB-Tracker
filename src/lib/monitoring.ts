// Error monitoring (Sentry) and page-view analytics (Vercel Analytics). Both
// are off until their environment variables are set. Pure helpers: the env
// checks, the event scrubber that keeps athlete health values out of error
// reports, and the page-view URL redaction.

export function readSentryDsn(value: string | undefined): string | null {
  const dsn = value?.trim();
  return dsn ? dsn : null;
}

export function isAnalyticsEnabled(flag: string | undefined): boolean {
  return flag?.trim().toLowerCase() === "true";
}

const REDACTED = "[redacted]";

// Field names (camelCase and snake_case) that can hold check-in or health
// data, plus free-text notes. Matched case-insensitively, anywhere in an event.
const HEALTH_KEY = /sleep|energy|stress|soreness|motivation|pain|recovery|readiness|vertical|approach|weight|pullups|rpe|note|discomfort|injur|guardian/i;

function redactHealth(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redactHealth(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    out[key] = HEALTH_KEY.test(key) ? REDACTED : redactHealth(inner, depth + 1);
  }
  return out;
}

function stripQuery(url: string): string {
  return url.split(/[?#]/)[0];
}

/** Invite codes and record ids out of paths. */
function redactPath(path: string): string {
  return path
    .replace(/\/join\/[^/?#]+/, "/join/[code]")
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$|\?|#)/gi, "/[id]");
}

type Crumb = { category?: string; message?: string; data?: Record<string, unknown> };
type ScrubbableEvent = {
  user?: Record<string, unknown>;
  request?: Record<string, unknown> & { headers?: Record<string, string>; url?: string };
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  breadcrumbs?: Crumb[];
  [key: string]: unknown;
};

/**
 * Sentry beforeSend. Drops identity beyond the user id, cookies, auth headers,
 * request bodies and query strings; redacts health fields anywhere in
 * extra/contexts/breadcrumbs; removes breadcrumbs of typed input.
 */
export function scrubEvent<T extends object>(input: T): T {
  const event = input as ScrubbableEvent;
  if (event.user) event.user = event.user.id ? { id: event.user.id } : {};

  if (event.request) {
    const headers = event.request.headers ?? {};
    const safeHeaders = Object.fromEntries(
      Object.entries(headers).filter(([name]) => !/cookie|authorization|apikey/i.test(name))
    );
    event.request = {
      ...(event.request.url ? { url: redactPath(stripQuery(String(event.request.url))) } : {}),
      ...(Object.keys(safeHeaders).length ? { headers: safeHeaders } : {})
    };
  }

  if (event.extra) event.extra = redactHealth(event.extra) as Record<string, unknown>;
  if (event.contexts) event.contexts = redactHealth(event.contexts) as Record<string, unknown>;

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs
      .filter((crumb) => !crumb.category?.startsWith("ui.input"))
      .map((crumb) => {
        if (!crumb.data) return crumb;
        const data = redactHealth(crumb.data) as Record<string, unknown>;
        for (const key of ["url", "from", "to"]) {
          if (typeof data[key] === "string") data[key] = redactPath(stripQuery(data[key] as string));
        }
        return { ...crumb, data };
      });
  }

  return input;
}

/** Vercel Analytics beforeSend: page views without query strings, invite codes or record ids. */
export function redactAnalyticsUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${redactPath(parsed.pathname)}`;
  } catch {
    return redactPath(stripQuery(url));
  }
}
