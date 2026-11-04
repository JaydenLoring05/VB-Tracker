"use client";

import { Trophy } from "lucide-react";
import { FormEvent, useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Celebrate } from "@/components/shared/Celebrate";
import { useJumpTests } from "@/hooks/useJumpTests";
import { usePRs } from "@/hooks/usePRs";
import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import { useTodayISO } from "@/hooks/useToday";
import { bestJump, JUMP_KINDS, jumpResult, jumpSeries, parseInches, type JumpKind } from "@/lib/jumps";

type Result = { kind: JumpKind; value: number; isPR: boolean; gain: number | null };

/**
 * Log a vertical or approach touch in two taps, see it charted, and get a
 * celebration on a new best (G-04). Saved to `jump_tests`, apart from the
 * daily check-in; older stats-form values still show. A new best also goes
 * on the PR board, which feeds XP and the Sky High badge.
 */
export function JumpTracker() {
  const { history } = useRecoveryStats();
  const { tests, addJump } = useJumpTests();
  const { addPR } = usePRs();
  const today = useTodayISO();
  const [kind, setKind] = useState<JumpKind>("vertical");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [saving, setSaving] = useState(false);

  const meta = JUMP_KINDS.find((option) => option.value === kind)!;
  const series = jumpSeries(history, tests, kind);
  const best = bestJump(series);

  async function save(event: FormEvent) {
    event.preventDefault();
    const value = parseInches(input);
    if (value === null) {
      setError("Enter inches, like 24 or 121.5.");
      return;
    }
    if (!today || saving) return;
    setError(null);
    const outcome = jumpResult(series, value);
    setSaving(true);
    const ok = await addJump(kind, value, today);
    setSaving(false);
    if (!ok) {
      setError("Couldn't save that jump. Check your connection and try again.");
      return;
    }
    if (outcome.isPR) addPR({ exercise: meta.prName, value: String(value), unit: "in", note: "" });
    setResult({ kind, value, isPR: outcome.isPR, gain: outcome.gain });
    setInput("");
  }

  return (
    <div className="panel jump-tracker" id="jumps">
      <h2>Jumps</h2>

      <div className="filter-row" role="group" aria-label="Jump type">
        {JUMP_KINDS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={kind === option.value ? "" : "ghost"}
            aria-pressed={kind === option.value}
            onClick={() => {
              setKind(option.value);
              setResult(null);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form className="jump-form" onSubmit={save}>
        <label htmlFor="jump-inches" className="muted">
          {meta.hint}
        </label>
        <div className="jump-form-row">
          <input
            id="jump-inches"
            type="text"
            inputMode="decimal"
            placeholder={best ? `Best: ${best} in` : "Inches"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "jump-error" : undefined}
          />
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        {error && (
          <p className="guardian-error" id="jump-error" role="alert">
            {error}
          </p>
        )}
      </form>

      <p className="sr-only" role="status">
        {result ? (result.isPR ? `New PR: ${result.value} inches` : `Saved ${result.value} inches`) : ""}
      </p>
      {result && result.kind === kind && (
        <div className={result.isPR ? "jump-result jump-result-pr" : "jump-result"}>
          {result.isPR ? (
            <>
              <Trophy size={18} aria-hidden="true" />
              <strong>New PR! {result.value} in</strong>
              {result.gain !== null && <span>+{result.gain} in</span>}
              <Celebrate />
            </>
          ) : (
            <span className="muted">
              Saved {result.value} in. Best is {best} in. Keep jumping.
            </span>
          )}
        </div>
      )}

      {series.length >= 2 ? (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={series}>
            <CartesianGrid stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--muted)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--muted)" tick={{ fontSize: 12 }} domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip
              contentStyle={{ background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}
              labelStyle={{ color: "var(--muted)" }}
              itemStyle={{ color: "var(--text)" }}
              formatter={(value) => [`${value} in`, meta.label]}
            />
            {best !== null && <ReferenceLine y={best} stroke="var(--gold)" strokeDasharray="4 4" />}
            <Line type="monotone" dataKey="value" stroke="var(--gold)" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="muted">
          {series.length === 1
            ? `One ${meta.label.toLowerCase()} logged (${series[0].value} in). Log another to see your chart.`
            : `Log your first ${meta.label.toLowerCase()} to start your chart.`}
        </p>
      )}
    </div>
  );
}
