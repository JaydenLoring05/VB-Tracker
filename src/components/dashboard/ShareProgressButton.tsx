"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

import { useDemo } from "@/context/DemoContext";
import { useTrackerContext } from "@/context/TrackerContext";
import { useSupabase } from "@/hooks/useSupabase";
import type { BadgeId } from "@/lib/badges";
import { buildShareCard, type ShareCard } from "@/lib/shareCard";

const GOLD = "#e3b04b";

/** Draws the share card at 1080x1350, the portrait size Instagram and TikTok use (like the F-36 results card). */
function drawShareCard(card: ShareCard): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = GOLD;
  ctx.font = "800 56px system-ui, sans-serif";
  ctx.fillText("NEXTREP", 80, 140);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 84px system-ui, sans-serif";
  ctx.fillText(card.title, 80, 260, 920);

  // Stats as a 2x2 grid of tiles.
  card.stats.forEach((stat, index) => {
    const x = 80 + (index % 2) * 470;
    const y = 330 + Math.floor(index / 2) * 260;
    ctx.fillStyle = "#18181b";
    ctx.fillRect(x, y, 450, 230);
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "600 36px system-ui, sans-serif";
    ctx.fillText(stat.label.toUpperCase(), x + 36, y + 70, 380);
    ctx.fillStyle = index === 0 ? GOLD : "#ffffff";
    ctx.font = "800 72px system-ui, sans-serif";
    ctx.fillText(stat.value, x + 36, y + 170, 380);
  });

  // Badges: up to six, icon over name.
  const badgesTop = 330 + Math.ceil(card.stats.length / 2) * 260 + 40;
  ctx.fillStyle = "#a1a1aa";
  ctx.font = "600 36px system-ui, sans-serif";
  ctx.fillText(card.badges.length > 0 ? "BADGES" : "FIRST BADGE COMING SOON", 80, badgesTop);
  card.badges.slice(0, 6).forEach((badge, index) => {
    const x = 80 + index * 155;
    ctx.font = "72px system-ui, sans-serif";
    ctx.fillText(badge.icon, x, badgesTop + 100);
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 22px system-ui, sans-serif";
    ctx.fillText(badge.name, x, badgesTop + 140, 145);
    ctx.fillStyle = "#a1a1aa";
  });

  ctx.fillStyle = GOLD;
  ctx.font = "700 40px system-ui, sans-serif";
  ctx.fillText(card.watermark, 80, 1280);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/**
 * "Share my progress" (G-05): streak, level, badges and best jump as an image,
 * through the phone's share sheet, or downloaded where there isn't one.
 */
export function ShareProgressButton({
  streak,
  levelName,
  xp,
  badges
}: {
  streak: number;
  levelName: string;
  xp: number;
  badges: BadgeId[];
}) {
  const { userId, prs, history } = useTrackerContext();
  const supabase = useSupabase();
  const demo = useDemo();
  const [state, setState] = useState<"idle" | "working" | "saved" | "failed">("idle");

  async function athleteName(): Promise<string> {
    if (demo) return demo.data.athletes.find((athlete) => athlete.userId === demo.data.spotlight.userId)?.displayName ?? "";
    if (!userId) return "";
    const { data } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
    return (data?.display_name as string | null) ?? "";
  }

  async function share() {
    setState("working");
    try {
      const jumpValues = history.flatMap((entry) => [
        ...(typeof entry.vertical === "number" ? [{ label: "Vertical", value: entry.vertical }] : []),
        ...(typeof entry.approach === "number" ? [{ label: "Approach touch", value: entry.approach }] : [])
      ]);
      const card = buildShareCard({ name: await athleteName(), streak, levelName, xp, badges, prs, jumpValues });
      const blob = await drawShareCard(card);
      if (!blob) throw new Error("No image");
      const file = new File([blob], "nextrep-progress.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My NextRep progress" });
        setState("idle");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      setState("saved");
    } catch (error) {
      // Closing the share sheet throws AbortError; that's not a failure.
      setState(error instanceof DOMException && error.name === "AbortError" ? "idle" : "failed");
    }
  }

  return (
    <div className="share-progress">
      <button type="button" className="ghost" onClick={share} disabled={state === "working"}>
        <Share2 size={16} aria-hidden="true" /> {state === "working" ? "Making image…" : "Share my progress"}
      </button>
      <span className="muted" role="status">
        {state === "saved" ? "Image saved. Post it from your photos." : state === "failed" ? "Couldn't make the image. Try again." : ""}
      </span>
    </div>
  );
}
