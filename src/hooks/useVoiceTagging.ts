"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Browser speech recognition for film tagging (Web Speech API). Two ways
 * to listen: a toggle that keeps listening utterance after utterance, and
 * push-to-talk while Backquote is held. The video time is captured when
 * speech STARTS, so a tag lands on the play, not on the end of the
 * sentence describing it.
 */

type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: RecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => Recognition;

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Mode = "off" | "toggle" | "ptt";

export function useVoiceTagging({
  enabled,
  getCurrentTime,
  onTranscript,
  onError
}: {
  enabled: boolean;
  getCurrentTime: () => number;
  onTranscript: (transcript: string, seconds: number) => void;
  onError: (message: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [mode, setMode] = useState<Mode>("off");
  const [interim, setInterim] = useState("");

  const recognitionRef = useRef<Recognition | null>(null);
  const modeRef = useRef<Mode>("off");
  const speechStartRef = useRef<number | null>(null);

  // Latest callbacks without re-creating recognition sessions.
  const callbacksRef = useRef({ getCurrentTime, onTranscript, onError });
  useEffect(() => {
    callbacksRef.current = { getCurrentTime, onTranscript, onError };
  });

  useEffect(() => {
    setSupported(getRecognitionConstructor() !== null);
  }, []);

  const setModeBoth = useCallback((next: Mode) => {
    modeRef.current = next;
    setMode(next);
  }, []);

  const startSession = useCallback(
    (next: Exclude<Mode, "off">) => {
      const Ctor = getRecognitionConstructor();
      if (!Ctor) return;
      recognitionRef.current?.abort();

      const recognition = new Ctor();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      // Push-to-talk keeps one session open while the key is held; toggle
      // mode restarts per utterance so every utterance gets its own start time.
      recognition.continuous = next === "ptt";

      recognition.onstart = () => {
        speechStartRef.current = null;
      };
      recognition.onspeechstart = () => {
        speechStartRef.current = callbacksRef.current.getCurrentTime();
      };
      recognition.onresult = (event) => {
        let text = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          text += result[0].transcript;
          if (result.isFinal) {
            const seconds = speechStartRef.current ?? callbacksRef.current.getCurrentTime();
            callbacksRef.current.onTranscript(result[0].transcript.trim(), seconds);
            speechStartRef.current = null;
            text = "";
          }
        }
        setInterim(text.trim());
      };
      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          callbacksRef.current.onError("Microphone access was blocked. Allow it in the browser to use voice tags.");
          setModeBoth("off");
        }
        // "no-speech" / "aborted" just end the session; onend decides whether to restart.
      };
      recognition.onend = () => {
        setInterim("");
        if (modeRef.current === "toggle" && recognitionRef.current === recognition) {
          try {
            recognition.start();
            return;
          } catch {
            // Fall through to stopping if the browser refuses a restart.
          }
        }
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
          if (modeRef.current !== "off") setModeBoth("off");
        }
      };

      recognitionRef.current = recognition;
      setModeBoth(next);
      try {
        recognition.start();
      } catch {
        setModeBoth("off");
      }
    },
    [setModeBoth]
  );

  const stopSession = useCallback(() => {
    // Mark off first so onend doesn't restart. stop() (not abort) still
    // delivers the final result for whatever was just said.
    modeRef.current = "off";
    setMode("off");
    recognitionRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (modeRef.current === "off") startSession("toggle");
    else stopSession();
  }, [startSession, stopSession]);

  // Hold Backquote to talk.
  useEffect(() => {
    if (!enabled || !supported) return;

    function isTyping(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
    }

    function handleDown(event: KeyboardEvent) {
      if (event.code !== "Backquote" || event.repeat || isTyping(event.target)) return;
      event.preventDefault();
      if (modeRef.current === "off") startSession("ptt");
    }
    function handleUp(event: KeyboardEvent) {
      if (event.code !== "Backquote") return;
      if (modeRef.current === "ptt") stopSession();
    }

    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, [enabled, supported, startSession, stopSession]);

  // Never leave the mic open after leaving the page.
  useEffect(() => {
    return () => {
      modeRef.current = "off";
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return { supported: enabled && supported, listening: mode !== "off", mode, interim, toggle };
}
