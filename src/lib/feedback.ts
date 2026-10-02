// In-app feedback. Pure helpers; the route is src/app/api/feedback and the
// table is public.feedback (schema_v51).

export const FEEDBACK_MAX_LENGTH = 2000;

// Control characters except tab and newline.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function validateFeedbackMessage(
  raw: string
): { ok: true; message: string } | { ok: false; error: string } {
  const message = raw.replace(CONTROL, "").trim();
  if (!message) return { ok: false, error: "Write a message first." };
  if (message.length > FEEDBACK_MAX_LENGTH) {
    return { ok: false, error: `Keep it under ${FEEDBACK_MAX_LENGTH} characters.` };
  }
  return { ok: true, message };
}

/** The in-app page the feedback is about: a same-site path without its query string, or null. */
export function feedbackPage(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  const path = raw.split(/[?#]/)[0];
  return /^\/[A-Za-z0-9/_\-[\]]*$/.test(path) ? path.slice(0, 200) : null;
}

/** A short device summary like "iPhone · Safari". Never the full user agent. */
export function deviceLabel(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";
  const os = /iPhone/.test(userAgent)
    ? "iPhone"
    : /iPad/.test(userAgent)
      ? "iPad"
      : /Android/.test(userAgent)
        ? "Android"
        : /Macintosh|Mac OS X/.test(userAgent)
          ? "Mac"
          : /Windows/.test(userAgent)
            ? "Windows"
            : /Linux/.test(userAgent)
              ? "Linux"
              : "Other";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /CriOS|Chrome\//.test(userAgent)
      ? "Chrome"
      : /FxiOS|Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Other browser";
  return `${os} · ${browser}`;
}

/** "1.0.0+abc1234": the package version plus the deployed commit, when Vercel provides it. */
export function appVersion(packageVersion: string, commitSha: string | undefined): string {
  return commitSha ? `${packageVersion}+${commitSha.slice(0, 7)}` : packageVersion;
}

export type FeedbackContext = {
  message: string;
  page: string | null;
  role: "coach" | "athlete" | null;
  teamName: string | null;
  appVersion: string;
  device: string;
  userId: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The notification email to CONTACT_EMAIL. */
export function buildFeedbackEmail(context: FeedbackContext): { subject: string; html: string; text: string } {
  const details: [string, string][] = [
    ["Role", context.role ?? "no team yet"],
    ["Team", context.teamName ?? "none"],
    ["Page", context.page ?? "unknown"],
    ["App version", context.appVersion],
    ["Device", context.device],
    ["User ID", context.userId]
  ];
  const subject = `NextRep feedback (${context.role ?? "user"}, ${context.page ?? "unknown page"})`;
  const text = [context.message, "", ...details.map(([label, value]) => `${label}: ${value}`)].join("\n");
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;color:#1d1b16">
<p style="white-space:pre-wrap">${escapeHtml(context.message)}</p>
<table style="border-collapse:collapse;font-size:13px;color:#555">${details
    .map(([label, value]) => `<tr><td style="padding:2px 12px 2px 0">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`)
    .join("")}</table>
</div>`;
  return { subject, html, text };
}
