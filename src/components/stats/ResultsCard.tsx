"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

import { useRecoveryStats } from "@/hooks/useRecoveryStats";
import {
  buildResults,
  formatChange,
  formatShortDate,
  MetricResult,
  RETEST_DAYS
} from "@/lib/resultsCard";
import { todayISO } from "@/lib/storage";

/** Draws the share image (1080x1350, the portrait size Instagram and TikTok use). */
async function drawResultsImage(metrics: MetricResult[]): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gold = "#e3b04b";
  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = gold;
  ctx.font = "800 56px system-ui, sans-serif";
  ctx.fillText("NEXTREP", 80, 140);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 92px system-ui, sans-serif";
  ctx.fillText("MY RESULTS", 80, 270);

  const first = metrics[0];
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "500 40px system-ui, sans-serif";
  ctx.fillText(`${formatShortDate(first.fromDate)} → ${formatShortDate(first.toDate)}`, 80, 340);

  metrics.forEach((metric, index) => {
    const top = 440 + index * 270;
    ctx.fillStyle = "#18181b";
    ctx.fillRect(80, top, 920, 230);
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "600 40px system-ui, sans-serif";
    ctx.fillText(metric.label.toUpperCase(), 120, top + 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 80px system-ui, sans-serif";
    ctx.fillText(`${metric.from}${metric.unit} → ${metric.to}${metric.unit}`, 120, top + 175);
    ctx.fillStyle = metric.change >= 0 ? gold : "#f87171";
    ctx.font = "900 72px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(formatChange(metric.change, metric.unit), 960, top + 175);
    ctx.textAlign = "left";
  });

  ctx.fillStyle = "#71717a";
  ctx.font = "500 34px system-ui, sans-serif";
  ctx.fillText("Trained with NextRep", 80, 1290);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function ResultsCard() {
  const { history } = useRecoveryStats();
  const [shareState, setShareState] = useState<"idle" | "working" | "saved" | "failed">("idle");
  const results = buildResults(history, todayISO());

  async function share() {
    if (results.metrics.length === 0) return;
    setShareState("working");
    try {
      const blob = await drawResultsImage(results.metrics);
      if (!blob) throw new Error("No image");
      const file = new File([blob], "nextrep-results.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My NextRep results" });
        setShareState("idle");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      setShareState("saved");
    } catch (error) {
      // Closing the share sheet throws AbortError; that's not a failure.
      setShareState(error instanceof DOMException && error.name === "AbortError" ? "idle" : "failed");
    }
  }

  return (
    <div className="panel results-card">
      <div className="results-card-header">
        <h2>Your Results</h2>
        {results.metrics.length > 0 && (
          <button type="button" className="ghost" onClick={share} disabled={shareState === "working"}>
            <Share2 size={16} aria-hidden="true" /> {shareState === "working" ? "Making image…" : "Share"}
          </button>
        )}
      </div>

      {results.metrics.length === 0 ? (
        <p className="muted">
          Test your vertical and approach touch now, then again in {RETEST_DAYS / 7} weeks. Your before and after shows
          up here, ready to share.
        </p>
      ) : (
        <div className="results-grid">
          {results.metrics.map((metric) => (
            <div key={metric.key} className="results-metric">
              <span className="muted">{metric.label}</span>
              <strong>
                {metric.from}
                {metric.unit} → {metric.to}
                {metric.unit}
              </strong>
              <span className={metric.change >= 0 ? "results-up" : "results-down"}>
                {formatChange(metric.change, metric.unit)}
              </span>
              <span className="muted results-dates">
                {formatShortDate(metric.fromDate)} → {formatShortDate(metric.toDate)}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className={results.retestDue ? "results-retest-due" : "muted results-retest"} role="status">
        {results.retestDue
          ? "Retest due: vertical and approach touch, best of 3 each, same shoes, fresh legs. Log them below."
          : `Next retest in ${results.daysUntilRetest} ${results.daysUntilRetest === 1 ? "day" : "days"}.`}
      </p>
      {shareState === "saved" && <p className="muted">Image saved. Post it from your photos.</p>}
      {shareState === "failed" && <p className="muted">Couldn&apos;t make the image. Try again.</p>}
    </div>
  );
}
