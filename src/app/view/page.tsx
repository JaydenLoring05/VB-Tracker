import type { Metadata } from "next";

import { TrainingViewer } from "@/components/viewer/TrainingViewer";

import "@/styles/auth.css";
import "@/styles/viewer.css";

// The link's token is the only key to this page, so it must never leak to
// another site through the Referer header or end up in a search index.
export const metadata: Metadata = {
  title: "Training summary",
  robots: { index: false, follow: false },
  referrer: "no-referrer"
};

export default async function ViewerPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return <TrainingViewer token={t ?? null} />;
}
