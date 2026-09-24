"use client";

import { Share, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import "@/styles/pwa.css";

const DISMISS_KEY = "nextrep:install-prompt-dismissed";
const DISMISS_DAYS = 30;
const IOS_SHOW_DELAY_MS = 2500;

// Chrome/Edge fire this before showing their own install UI. Not in the TS DOM lib.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "hidden" | "native" | "ios";

function isDismissed(): boolean {
  try {
    const stored = window.localStorage.getItem(DISMISS_KEY);
    if (!stored) return false;
    const dismissedAt = Number(stored);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Storage can be blocked (private mode); the banner just returns next visit.
  }
}

function isStandalone(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

// iOS Safari has no beforeinstallprompt, so it needs written instructions. iPadOS 13+
// reports itself as a Mac, hence the touch-points check. Other iOS browsers are skipped:
// their Add to Home Screen steps differ and we would rather show nothing than wrong steps.
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);
  return isIos && !isOtherBrowser;
}

export function InstallPrompt() {
  const [mode, setMode] = useState<Mode>("hidden");
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    let iosTimer: ReturnType<typeof setTimeout> | undefined;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setMode("native");
    };
    const onInstalled = () => {
      deferredPrompt.current = null;
      setMode("hidden");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (isIosSafari()) {
      iosTimer = setTimeout(() => setMode("ios"), IOS_SHOW_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = useCallback(() => {
    rememberDismissal();
    setMode("hidden");
  }, []);

  const install = useCallback(async () => {
    const promptEvent = deferredPrompt.current;
    if (!promptEvent) return;

    deferredPrompt.current = null;
    setMode("hidden");
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === "dismissed") rememberDismissal();
    } catch {
      // The browser refused to show the prompt; nothing more we can do.
    }
  }, []);

  if (mode === "hidden") return null;

  return (
    <aside className="install-banner" role="region" aria-label="Install NextRep">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="install-banner-icon" src="/icons/icon-192.png" alt="" width={44} height={44} />

      <div className="install-banner-body">
        <p className="install-banner-title">Add NextRep to your home screen</p>
        {mode === "native" ? (
          <p className="install-banner-copy">Open it like an app, full screen and one tap away.</p>
        ) : (
          <p className="install-banner-copy">
            Tap <Share size={14} aria-hidden="true" className="install-banner-share" />
            <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
          </p>
        )}
      </div>

      {mode === "native" && (
        <button type="button" className="install-banner-action" onClick={install}>
          Install
        </button>
      )}

      <button
        type="button"
        className="install-banner-close"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </aside>
  );
}
