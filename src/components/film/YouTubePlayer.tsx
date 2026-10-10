"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { createPlayerHandle, YouTubePlayerHandle, YTPlayer } from "@/lib/youtubePlayerHandle";

export type { YouTubePlayerHandle };

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          events?: { onReady?: () => void };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  if (!apiLoadPromise) {
    apiLoadPromise = new Promise((resolve) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        resolve();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    });
  }

  return apiLoadPromise;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, { videoId: string }>(function YouTubePlayer(
  { videoId },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  // The player's methods only exist once it's ready. A seek asked for
  // before then (opening a clip loads a new film) waits here.
  const readyRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    readyRef.current = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        events: {
          onReady: () => {
            readyRef.current = true;
            const pending = pendingSeekRef.current;
            pendingSeekRef.current = null;
            if (pending !== null) playerRef.current?.seekTo(pending, true);
          }
        }
      });
    });

    return () => {
      cancelled = true;
      readyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  useImperativeHandle(
    ref,
    () =>
      createPlayerHandle({
        getPlayer: () => playerRef.current,
        isReady: () => readyRef.current,
        queueSeek: (seconds) => {
          pendingSeekRef.current = seconds;
        }
      }),
    []
  );

  return <div className="youtube-player-wrap" ref={containerRef} />;
});
