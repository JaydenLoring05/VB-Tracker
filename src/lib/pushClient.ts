// Browser side of phone reminders (schema_v55): can this device get them, and
// turning them on or off. Every browser API call is guarded, since support
// varies a lot (iPhone only allows it once NextRep is on the home screen).

export type PushSupport =
  /** Ready to turn on. */
  | "supported"
  /** iPhone or iPad in Safari: works once NextRep is added to the home screen. */
  | "needs-home-screen"
  /** The person blocked notifications for this site in the browser. */
  | "blocked"
  /** No push in this browser, or the server has no keys yet. */
  | "unsupported";

type Nav = { userAgent: string; maxTouchPoints?: number; standalone?: boolean; serviceWorker?: unknown };

export function isAppleMobile(nav: Nav): boolean {
  return /iPhone|iPad|iPod/.test(nav.userAgent) || (/Macintosh/.test(nav.userAgent) && (nav.maxTouchPoints ?? 0) > 1);
}

/** Pure, so it can be tested: what the reminder settings should offer on this device. */
export function pushSupport(env: {
  nav: Nav;
  standalone: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
  permission: string | null;
  publicKey: string | undefined;
}): PushSupport {
  if (!env.publicKey) return "unsupported";
  if (isAppleMobile(env.nav) && !env.standalone) return "needs-home-screen";
  if (!env.hasPushManager || !env.hasNotification || !env.nav.serviceWorker) return "unsupported";
  if (env.permission === "denied") return "blocked";
  return "supported";
}

export function currentPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  try {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    return pushSupport({
      nav: navigator as unknown as Nav,
      standalone,
      hasPushManager: "PushManager" in window,
      hasNotification: "Notification" in window,
      permission: "Notification" in window ? Notification.permission : null,
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    });
  } catch {
    return "unsupported";
  }
}

/** The VAPID public key as the bytes PushManager.subscribe() wants. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
}

export type SavedSubscription = { endpoint: string; p256dh: string; auth: string };

/**
 * Asks for permission (only ever from a tap) and subscribes this browser.
 * Returns the keys to save, or null if the person said no.
 */
export async function subscribeThisDevice(): Promise<SavedSubscription | null> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "")
    }));
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth };
}

/** This browser's current subscription endpoint, if it has one. */
export async function currentEndpoint(): Promise<string | null> {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    return (await reg?.pushManager.getSubscription())?.endpoint ?? null;
  } catch {
    return null;
  }
}

/** Unsubscribes this browser. Returns the endpoint it had, so the saved row can go too. */
export async function unsubscribeThisDevice(): Promise<string | null> {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const subscription = await reg?.pushManager.getSubscription();
    if (!subscription) return null;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    return endpoint;
  } catch {
    return null;
  }
}

/** The device's time zone, e.g. "America/Los_Angeles". */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";
  } catch {
    return "America/Los_Angeles";
  }
}
