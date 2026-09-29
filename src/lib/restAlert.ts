/**
 * The "rest is over" alert: beeps, a vibration pattern, and (when the
 * athlete has switched away from the app) a system notification.
 *
 * Mobile browsers only allow audio from an AudioContext that was created
 * or resumed during a user gesture. primeRestAlert() is called from the
 * "Log set" tap, which starts every rest, so the context is already
 * unlocked by the time the timer ends 90 seconds later.
 */

let audioContext: AudioContext | null = null;

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  );
}

/** Call from a user gesture (the Log set submit) so the end-of-rest beeps are allowed to play. */
export function primeRestAlert() {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return;
  try {
    if (!audioContext || audioContext.state === "closed") audioContext = new AudioContextClass();
    if (audioContext.state === "suspended") void audioContext.resume();
  } catch {
    audioContext = null;
  }
}

/** Seconds offsets of the three beeps; the last one is higher so it reads as "go". */
export const REST_ALERT_BEEPS: { at: number; frequency: number }[] = [
  { at: 0, frequency: 880 },
  { at: 0.3, frequency: 880 },
  { at: 0.6, frequency: 1320 }
];

export const REST_ALERT_VIBRATION = [300, 150, 300, 150, 500];

function playBeeps() {
  const ctx = audioContext;
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const start = ctx.currentTime + 0.02;

    for (const beep of REST_ALERT_BEEPS) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = start + beep.at;

      oscillator.type = "square";
      oscillator.frequency.value = beep.frequency;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(t);
      oscillator.stop(t + 0.25);
    }
  } catch {
    // Audio is a nice-to-have; the on-screen alert still shows.
  }
}

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(REST_ALERT_VIBRATION);
  }
}

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Asks once, from a tap. Returns whether notifications are now allowed. */
export async function requestRestNotifications(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

async function notify(nextExercise: string | null) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  // Only when the athlete isn't looking at the app; otherwise the on-screen banner is enough.
  if (typeof document !== "undefined" && document.visibilityState === "visible") return;

  const title = "Rest's over";
  const options: NotificationOptions = {
    body: nextExercise ? `Time for your next set of ${nextExercise}.` : "Time for your next set.",
    tag: "rest-timer",
    icon: "/icons/icon-192.png"
  };

  try {
    // Android Chrome only allows notifications through the service worker.
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification(title, options);
      return;
    }
    new Notification(title, options);
  } catch {
    // Notifications are best-effort.
  }
}

export function fireRestAlert(nextExercise: string | null = null) {
  playBeeps();
  vibrate();
  void notify(nextExercise);
}
