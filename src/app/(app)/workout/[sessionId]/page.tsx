import { ActiveWorkoutView } from "@/components/workout/ActiveWorkoutView";

import "@/styles/workout-mode.css";

export default async function ActiveWorkoutPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return <ActiveWorkoutView sessionId={sessionId} />;
}
