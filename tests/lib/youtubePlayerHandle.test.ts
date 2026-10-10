import { describe, expect, it, vi } from "vitest";

import { handleHotkey } from "@/lib/filmHotkeys";
import { createPlayerHandle, YTPlayer } from "@/lib/youtubePlayerHandle";

const YT_PAUSED = 2;

/** A player the way YouTube hands it over: `new YT.Player()` returns at once, but its methods only appear at onReady. */
function loadingPlayer(): YTPlayer {
  return { destroy: vi.fn() } as unknown as YTPlayer;
}

function readyPlayer(time = 30, state = YT_PAUSED) {
  return {
    getCurrentTime: vi.fn(() => time),
    seekTo: vi.fn(),
    playVideo: vi.fn(),
    pauseVideo: vi.fn(),
    getPlayerState: vi.fn(() => state),
    destroy: vi.fn()
  };
}

function handleFor(player: YTPlayer | null, ready: boolean) {
  const queueSeek = vi.fn();
  const handle = createPlayerHandle({ getPlayer: () => player, isReady: () => ready, queueSeek });
  return { handle, queueSeek };
}

describe("createPlayerHandle: before the player is ready (B-02)", () => {
  it("reports 0:00 without touching a player that has no methods yet", () => {
    const { handle } = handleFor(loadingPlayer(), false);
    expect(() => handle.getCurrentTime()).not.toThrow();
    expect(handle.getCurrentTime()).toBe(0);
  });

  it("lets a tag key pressed right after the player mounts start a tag", () => {
    const { handle } = handleFor(loadingPlayer(), false);
    const next = handleHotkey(null, { key: "k" }, handle.getCurrentTime());
    expect(next.handled).toBe(true);
    expect(next.draft).toEqual({ tag: "kill", seconds: 0, details: {} });
  });

  it("holds a seek until the player is ready", () => {
    const { handle, queueSeek } = handleFor(loadingPlayer(), false);
    expect(() => handle.seekTo(95)).not.toThrow();
    expect(queueSeek).toHaveBeenCalledWith(95);
  });

  it("ignores play/pause and seek keys without throwing", () => {
    const { handle, queueSeek } = handleFor(loadingPlayer(), false);
    expect(() => handle.togglePlay()).not.toThrow();
    expect(() => handle.seekBy(5)).not.toThrow();
    expect(queueSeek).not.toHaveBeenCalled();
  });

  it("copes with no player at all while the YouTube script is still loading", () => {
    const { handle, queueSeek } = handleFor(null, false);
    expect(handle.getCurrentTime()).toBe(0);
    handle.seekTo(12);
    handle.seekBy(-5);
    handle.togglePlay();
    expect(queueSeek).toHaveBeenCalledWith(12);
  });
});

describe("createPlayerHandle: once the player is ready", () => {
  it("reads the time from the player", () => {
    const player = readyPlayer(42.7);
    expect(handleFor(player, true).handle.getCurrentTime()).toBe(42.7);
  });

  it("seeks straight away instead of queueing", () => {
    const player = readyPlayer();
    const { handle, queueSeek } = handleFor(player, true);
    handle.seekTo(95);
    expect(player.seekTo).toHaveBeenCalledWith(95, true);
    expect(queueSeek).not.toHaveBeenCalled();
  });

  it("seeks relative to the current time and never before 0:00", () => {
    const player = readyPlayer(3);
    const { handle } = handleFor(player, true);
    handle.seekBy(5);
    expect(player.seekTo).toHaveBeenLastCalledWith(8, true);
    handle.seekBy(-5);
    expect(player.seekTo).toHaveBeenLastCalledWith(0, true);
  });

  it("pauses while playing or buffering and plays otherwise", () => {
    for (const state of [1, 3]) {
      const player = readyPlayer(0, state);
      handleFor(player, true).handle.togglePlay();
      expect(player.pauseVideo).toHaveBeenCalledTimes(1);
      expect(player.playVideo).not.toHaveBeenCalled();
    }
    const paused = readyPlayer(0, YT_PAUSED);
    handleFor(paused, true).handle.togglePlay();
    expect(paused.playVideo).toHaveBeenCalledTimes(1);
    expect(paused.pauseVideo).not.toHaveBeenCalled();
  });
});
