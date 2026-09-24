import { ProgressRing } from "@/components/shared/ProgressRing";
import { DEMO_WORKOUTS_PER_WEEK, type DemoData } from "@/data/demoData";
import { computeAttentionItems } from "@/lib/attentionCenter";
import { recoveryStatus } from "@/lib/recovery";

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

/**
 * Team-level summary row for the demo. Every figure is derived from the same
 * sample data the real roster and Attention Center consume.
 */
export function DemoSnapshot({ data }: { data: DemoData }) {
  const readiness = Math.round(average(data.roster.map((athlete) => athlete.recovery)));

  const baselineVerticals: number[] = [];
  const latestVerticals: number[] = [];
  Object.values(data.statsHistory).forEach((history) => {
    const first = Number(history[0]?.vertical);
    const last = Number(history[history.length - 1]?.vertical);
    if (first && last) {
      baselineVerticals.push(first);
      latestVerticals.push(last);
    }
  });
  const latestVertical = average(latestVerticals);
  const verticalGain = latestVertical - average(baselineVerticals);

  const completed = Object.values(data.completedLast7).reduce((sum, count) => sum + count, 0);
  const planned = data.roster.length * DEMO_WORKOUTS_PER_WEEK;

  const highPriority = computeAttentionItems(
    data.roster,
    data.statsHistory,
    data.completedLast7,
    data.recentPRs
  ).filter((item) => item.priority === "high");

  const completionPercent = Math.round((completed / planned) * 100);

  const tiles: { label: string; value: string; unit?: string; detail: string; tone?: "up" | "alert"; accent?: boolean; ring?: number }[] = [
    { label: "Team readiness", value: String(readiness), unit: "%", detail: `${recoveryStatus(readiness).label} across ${data.roster.length} athletes`, accent: true },
    { label: "Average vertical", value: latestVertical.toFixed(1), unit: "in", detail: `+${verticalGain.toFixed(1)} in since preseason`, tone: "up" },
    { label: "Workouts this week", value: `${completed}/${planned}`, detail: `${completionPercent}% of the plan done`, ring: completionPercent },
    {
      label: "High-priority flags",
      value: String(highPriority.length),
      detail: highPriority.length ? `Review now: ${highPriority.map((item) => item.displayName.split(" ")[0]).join(", ")}` : "All clear",
      tone: highPriority.length ? "alert" : "up"
    }
  ];

  return (
    <section className="demo-snapshot" aria-label="Team snapshot">
      {tiles.map((tile) => (
        <div className={`stat-tile demo-snapshot-tile${tile.accent ? " stat-tile-accent" : ""}`} key={tile.label}>
          <p className="stat-label">{tile.label}</p>
          <p className="stat-value">
            {tile.value}
            {tile.unit && <small>{tile.unit}</small>}
          </p>
          <p className={`stat-delta${tile.tone ? ` is-${tile.tone}` : ""}`}>{tile.detail}</p>
          {tile.ring !== undefined && (
            <div className="demo-snapshot-ring">
              <ProgressRing value={tile.ring} size={52} />
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
