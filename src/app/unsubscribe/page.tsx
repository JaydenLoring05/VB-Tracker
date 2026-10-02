import type { Metadata } from "next";

import { UnsubscribeReminders } from "@/components/settings/UnsubscribeReminders";

import "@/styles/auth.css";

export const metadata: Metadata = {
  title: "Unsubscribe from check-in reminders",
  robots: { index: false }
};

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return <UnsubscribeReminders token={t ?? null} />;
}
