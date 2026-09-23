const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

export function parseYouTubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (host === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return id || null;
  }

  if (parsed.pathname === "/watch") {
    return parsed.searchParams.get("v");
  }

  const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/]+)/);
  if (shortsMatch) return shortsMatch[1];

  const embedMatch = parsed.pathname.match(/^\/embed\/([^/]+)/);
  if (embedMatch) return embedMatch[1];

  const liveMatch = parsed.pathname.match(/^\/live\/([^/]+)/);
  if (liveMatch) return liveMatch[1];

  return null;
}

export function formatTimestamp(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function parseTimestamp(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(":");
  if (parts.length === 0 || parts.length > 3) return null;
  if (parts.some((part) => part === "" || !/^\d+$/.test(part))) return null;

  const numbers = parts.map((part) => parseInt(part, 10));
  let seconds = 0;
  for (const num of numbers) {
    seconds = seconds * 60 + num;
  }

  return seconds >= 0 ? seconds : null;
}

export function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
