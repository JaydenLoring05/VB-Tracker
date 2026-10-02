// Athlete check-in reminder emails. Pure helpers; the hourly job is
// src/app/api/checkin-reminders and the data comes from
// public.checkin_reminder_recipients() (schema_v50). Sending reuses the daily
// coach summary's Resend setup (src/lib/dailySummary.ts).

export type ReminderRecipient = {
  display_name: string | null;
  team_name: string;
  unsubscribe_token: string;
};

/** Time zones a coach can pick, US-first since the pilot teams are in the US. */
export const REMINDER_TIME_ZONES: { id: string; label: string }[] = [
  { id: "America/New_York", label: "Eastern" },
  { id: "America/Chicago", label: "Central" },
  { id: "America/Denver", label: "Mountain" },
  { id: "America/Phoenix", label: "Arizona" },
  { id: "America/Los_Angeles", label: "Pacific" },
  { id: "America/Anchorage", label: "Alaska" },
  { id: "Pacific/Honolulu", label: "Hawaii" }
];

export function isReminderTimeZone(id: string): boolean {
  return REMINDER_TIME_ZONES.some((zone) => zone.id === id);
}

export function formatReminderHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 === 0 ? 12 : h % 12} ${suffix}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function parseUnsubscribeToken(raw: string | null | undefined): string | null {
  const token = raw?.trim().toLowerCase() ?? "";
  return UUID.test(token) ? token : null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(displayName: string | null): string | null {
  const first = displayName?.trim().split(/\s+/)[0]?.replace(/[<>]/g, "");
  return first ? first : null;
}

/**
 * The reminder email. It says only that today's check-in is open: no
 * readiness, pain or other health values, since it can land on a shared or
 * family inbox.
 */
export function buildReminderEmail(
  recipient: ReminderRecipient,
  siteUrl: string
): { subject: string; html: string; text: string; headers: Record<string, string> } {
  const base = siteUrl.replace(/\/+$/, "");
  const checkInUrl = `${base}/check-in`;
  const unsubscribeUrl = `${base}/unsubscribe?t=${recipient.unsubscribe_token}`;
  const oneClickUrl = `${base}/api/reminders/unsubscribe?t=${recipient.unsubscribe_token}`;
  const name = firstName(recipient.display_name);
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const subject = `Quick check-in for ${recipient.team_name}`;
  const text = [
    greeting,
    "",
    `You haven't logged today's check-in for ${recipient.team_name} yet. It takes about 30 seconds and helps your coach plan practice.`,
    "",
    `Check in: ${checkInUrl}`,
    "",
    `Don't want these reminders? Unsubscribe: ${unsubscribeUrl}`
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f5f2;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1d1b16">
<table role="presentation" style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border-collapse:separate">
<tr><td>
<p style="margin:0 0 12px;font-size:16px">${escapeHtml(greeting)}</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5">You haven't logged today's check-in for <strong>${escapeHtml(recipient.team_name)}</strong> yet. It takes about 30 seconds and helps your coach plan practice.</p>
<p style="margin:0 0 24px"><a href="${escapeHtml(checkInUrl)}" style="display:inline-block;background:#e5ac4c;color:#1d1b16;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:8px;font-size:16px">Check in now</a></p>
<p style="margin:0;font-size:12px;color:#8a857a">Don't want these reminders? <a href="${escapeHtml(unsubscribeUrl)}" style="color:#8a857a">Unsubscribe</a>. You can turn them back on in Settings.</p>
</td></tr></table>
</body></html>`;

  return {
    subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${oneClickUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
    }
  };
}
