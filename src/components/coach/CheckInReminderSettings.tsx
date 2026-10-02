"use client";

import { useEffect, useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useSupabase } from "@/hooks/useSupabase";
import { formatReminderHour, isReminderTimeZone, REMINDER_TIME_ZONES } from "@/lib/checkInReminders";
import { Team } from "@/types";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/**
 * Coach control for the daily "you haven't checked in yet" email to athletes:
 * on/off, the hour and the time zone (schema_v50). Hidden until that SQL has
 * run, so it never shows a control that can't save.
 */
export function CheckInReminderSettings({ team }: { team: Team }) {
  const supabase = useSupabase();
  const demo = useDemo();
  const available = typeof team.checkin_reminder_enabled === "boolean";

  const [enabled, setEnabled] = useState(Boolean(team.checkin_reminder_enabled));
  const [hour, setHour] = useState(team.checkin_reminder_hour ?? 15);
  const [timeZone, setTimeZone] = useState(team.checkin_reminder_time_zone ?? "America/Los_Angeles");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setEnabled(Boolean(team.checkin_reminder_enabled));
    setHour(team.checkin_reminder_hour ?? 15);
    setTimeZone(team.checkin_reminder_time_zone ?? "America/Los_Angeles");
  }, [team.id, team.checkin_reminder_enabled, team.checkin_reminder_hour, team.checkin_reminder_time_zone]);

  if (!available) return null;

  async function save(next: { enabled: boolean; hour: number; timeZone: string }) {
    if (demo) {
      demo.requestSignup("Check-in reminders");
      return;
    }
    setStatus("saving");
    const { error } = await supabase.rpc("set_checkin_reminder", {
      p_team_id: team.id,
      p_enabled: next.enabled,
      p_hour: next.hour,
      p_time_zone: next.timeZone
    });
    if (error) console.error("Failed to save check-in reminder settings", error);
    setStatus(error ? "error" : "saved");
  }

  function update(next: Partial<{ enabled: boolean; hour: number; timeZone: string }>) {
    const merged = { enabled, hour, timeZone, ...next };
    setEnabled(merged.enabled);
    setHour(merged.hour);
    setTimeZone(merged.timeZone);
    void save(merged);
  }

  const zones = isReminderTimeZone(timeZone) ? REMINDER_TIME_ZONES : [{ id: timeZone, label: timeZone }, ...REMINDER_TIME_ZONES];

  return (
    <fieldset className="checkin-reminder-settings">
      <legend className="sr-only">Athlete check-in reminders</legend>
      <label className="checkin-reminder-toggle">
        <input type="checkbox" checked={enabled} onChange={(e) => update({ enabled: e.target.checked })} />
        Email athletes who haven&apos;t checked in by
      </label>
      <span className="checkin-reminder-when">
        <select aria-label="Reminder time" value={hour} onChange={(e) => update({ hour: Number(e.target.value) })}>
          {HOURS.map((value) => (
            <option key={value} value={value}>
              {formatReminderHour(value)}
            </option>
          ))}
        </select>
        <select aria-label="Time zone" value={timeZone} onChange={(e) => update({ timeZone: e.target.value })}>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.label}
            </option>
          ))}
        </select>
      </span>
      <span className="muted checkin-reminder-status" role="status">
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved." : status === "error" ? "Couldn't save. Try again." : ""}
      </span>
    </fieldset>
  );
}
