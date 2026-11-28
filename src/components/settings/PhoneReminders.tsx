"use client";

import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";

import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import {
  currentEndpoint,
  currentPushSupport,
  deviceTimeZone,
  PushSupport,
  subscribeThisDevice,
  unsubscribeThisDevice
} from "@/lib/pushClient";
import { PUSH_HOURS } from "@/lib/pushReminders";

const DEFAULT_HOUR = 16;

type Status = { tone: "ok" | "error"; text: string } | null;

/**
 * Settings → Phone reminders (schema_v55). The player turns lock-screen
 * reminders on for this phone and picks the hour; works with or without a
 * team. Hidden until the schema is in.
 */
export function PhoneReminders() {
  const { userId } = useTrackerContext();
  const supabase = useSupabase();
  const [ready, setReady] = useState(false);
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [hour, setHour] = useState<number | null>(null);
  const [onThisDevice, setOnThisDevice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("push_reminder_hour")
        .eq("user_id", userId)
        .maybeSingle();
      // Column missing = schema_v55 not run yet: keep the section hidden.
      if (cancelled || error) return;
      const endpoint = await currentEndpoint();
      let saved = false;
      if (endpoint) {
        const { data: row } = await supabase.from("push_subscriptions").select("id").eq("endpoint", endpoint).maybeSingle();
        saved = Boolean(row);
      }
      if (cancelled) return;
      setSupport(currentPushSupport());
      setHour(data?.push_reminder_hour ?? null);
      setOnThisDevice(saved);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  if (!ready) return null;

  const on = hour != null && onThisDevice;

  async function saveHour(next: number | null) {
    const { error } = await supabase.rpc("set_push_reminder", { p_hour: next, p_time_zone: deviceTimeZone() });
    if (error) throw error;
    setHour(next);
  }

  async function turnOn() {
    setBusy(true);
    setStatus(null);
    try {
      const subscription = await subscribeThisDevice();
      if (!subscription) {
        setSupport(currentPushSupport());
        setStatus({ tone: "error", text: "Notifications weren't allowed, so reminders are off." });
        return;
      }
      const { error } = await supabase.from("push_subscriptions").upsert(
        { user_id: userId, ...subscription, user_agent: navigator.userAgent.slice(0, 300) },
        { onConflict: "endpoint" }
      );
      if (error) throw error;
      await saveHour(hour ?? DEFAULT_HOUR);
      setOnThisDevice(true);
      setStatus({ tone: "ok", text: "Reminders are on for this phone." });
    } catch (error) {
      console.error("Failed to turn on phone reminders", error);
      setStatus({ tone: "error", text: "Couldn't turn reminders on. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setStatus(null);
    try {
      const endpoint = await unsubscribeThisDevice();
      if (endpoint) await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
      const { count } = await supabase
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      // Other phones still on: keep the hour so they keep getting reminders.
      if (!count) await saveHour(null);
      setOnThisDevice(false);
      setStatus({ tone: "ok", text: "Reminders are off for this phone." });
    } catch (error) {
      console.error("Failed to turn off phone reminders", error);
      setStatus({ tone: "error", text: "Couldn't turn reminders off. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function changeHour(next: number) {
    setStatus(null);
    try {
      await saveHour(next);
      setStatus({ tone: "ok", text: "Saved." });
    } catch {
      setStatus({ tone: "error", text: "Couldn't save. Try again." });
    }
  }

  async function sendTest() {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      setStatus(
        response.ok
          ? { tone: "ok", text: "Sent. It should show up in a few seconds." }
          : { tone: "error", text: "Couldn't send a test. Turn reminders off and on again." }
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel phone-reminders" id="phone-reminders">
      <h2>
        <BellRing size={18} aria-hidden="true" /> Phone reminders
      </h2>
      <p className="muted">
        A daily nudge on your lock screen if you haven&apos;t checked in, or haven&apos;t started a workout on a
        training day. Nothing is sent once you&apos;re done for the day.
      </p>

      {support === "needs-home-screen" && !on && (
        <p className="phone-reminders-hint">
          On iPhone, add NextRep to your home screen first: tap <strong>Share</strong>, then{" "}
          <strong>Add to Home Screen</strong>, and open NextRep from there.
        </p>
      )}
      {support === "blocked" && !on && (
        <p className="phone-reminders-hint">
          Notifications are blocked for NextRep. Allow them in your browser&apos;s site settings, then come back.
        </p>
      )}
      {support === "unsupported" && !on && (
        <p className="muted">This browser can&apos;t show reminders. Try NextRep on your phone.</p>
      )}

      {support === "supported" && !on && (
        <button type="button" onClick={turnOn} disabled={busy}>
          {busy ? "Turning on…" : "Turn on reminders"}
        </button>
      )}

      {on && (
        <div className="phone-reminders-on">
          <label>
            <span className="micro">Remind me at</span>
            <select value={hour ?? DEFAULT_HOUR} onChange={(event) => changeHour(Number(event.target.value))}>
              {PUSH_HOURS.map((option) => (
                <option key={option.hour} value={option.hour}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="phone-reminders-actions">
            <button type="button" className="ghost" onClick={sendTest} disabled={busy}>
              Send a test
            </button>
            <button type="button" className="ghost" onClick={turnOff} disabled={busy}>
              Turn off
            </button>
          </div>
        </div>
      )}

      {status && (
        <p className={status.tone === "error" ? "program-guardrail-warning" : "muted"} role="status">
          {status.text}
        </p>
      )}
    </section>
  );
}
