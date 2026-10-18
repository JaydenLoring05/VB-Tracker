// Phone push reminders for players (schema_v55). Pure helpers; the hourly
// job is src/app/api/push-reminders, the test button is
// src/app/api/push/test, and the browser side is src/lib/pushClient.ts.

export type PushConfig = {
  publicKey: string;
  privateKey: string;
  /** "mailto:..." or an https URL the push services can contact. */
  subject: string;
};

/**
 * Off unless NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and
 * VAPID_SUBJECT are all set.
 */
export function readPushConfig(env: Record<string, string | undefined>): PushConfig | null {
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  const rawSubject = env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !rawSubject) return null;
  const subject = /^(mailto:|https:\/\/)/.test(rawSubject) ? rawSubject : `mailto:${rawSubject}`;
  return { publicKey, privateKey, subject };
}

export type PushMessage = {
  title: string;
  body: string;
  /** Where tapping the notification opens. */
  url: string;
  /** Replaces an earlier NextRep reminder on the lock screen instead of stacking. */
  tag: string;
};

function firstName(displayName: string | null | undefined): string | null {
  const first = displayName?.trim().split(/\s+/)[0]?.replace(/[<>]/g, "");
  return first ? first : null;
}

/**
 * The reminder. Like the reminder email it carries no readiness, pain or
 * other health values, since it shows on a lock screen.
 */
export function buildPushReminder(recipient: {
  display_name?: string | null;
  needs_check_in: boolean;
  needs_workout: boolean;
}): PushMessage {
  const name = firstName(recipient.display_name);
  const hey = name ? `${name}, ` : "";
  if (recipient.needs_check_in && recipient.needs_workout) {
    return {
      title: "Check in, then train",
      body: `${hey}30 seconds to check in, then today's workout is ready.`,
      url: "/check-in",
      tag: "nextrep-daily"
    };
  }
  if (recipient.needs_check_in) {
    return {
      title: "Daily check-in",
      body: `${hey}30 seconds: sleep, energy, soreness. Keep your readiness up to date.`,
      url: "/check-in",
      tag: "nextrep-daily"
    };
  }
  return {
    title: "Today's workout is waiting",
    body: `${hey}your plan has a session today. Tap to start it.`,
    url: "/dashboard",
    tag: "nextrep-daily"
  };
}

/** The test notification from Settings. */
export const TEST_PUSH: PushMessage = {
  title: "Reminders are on",
  body: "This is how NextRep will remind you to check in and train.",
  url: "/dashboard",
  tag: "nextrep-test"
};

/** A push service answer that means the subscription is gone for good. */
export function isGoneStatus(statusCode: number | undefined): boolean {
  return statusCode === 404 || statusCode === 410;
}

/** The hours a player can pick, with labels like "4 PM". */
export const PUSH_HOURS: { hour: number; label: string }[] = Array.from({ length: 17 }, (_, i) => {
  const hour = i + 6; // 6 AM to 10 PM
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return { hour, label: `${h} ${hour < 12 ? "AM" : "PM"}` };
});
