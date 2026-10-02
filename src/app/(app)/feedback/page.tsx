import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { feedbackPage } from "@/lib/feedback";

import "@/styles/settings.css";

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <FeedbackForm fromPage={feedbackPage(from ?? null)} />;
}
