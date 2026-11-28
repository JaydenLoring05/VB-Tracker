"use client";

import { useSyncExternalStore } from "react";

import { todayISO, todayName } from "@/lib/storage";

// "Today" depends on the viewer's time zone, but pages are first rendered on
// the server in UTC. In the evening (Pacific) the server is already on
// tomorrow, so rendering todayName() directly made the server and browser
// disagree and React threw hydration error #418 (B-08). These hooks render
// "" on the server and during hydration, then the browser's real day.

const subscribe = () => () => {};

export function useTodayName(): string {
  return useSyncExternalStore(subscribe, todayName, () => "");
}

export function useTodayISO(): string {
  return useSyncExternalStore(subscribe, () => todayISO(), () => "");
}
