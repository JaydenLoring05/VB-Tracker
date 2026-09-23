"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type YouTubePlayerHandle = {
  getCurrentTime: () => number;
  seekTo: (seconds: number) => void;
};

type YTPlayer = {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
};

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

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  useImperativeHandle(
    ref,
    () => ({
      getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
      seekTo: (seconds: number) => playerRef.current?.seekTo(seconds, true)
    }),
    []
  );

  return <div className="youtube-player-wrap" ref={containerRef} />;
});
