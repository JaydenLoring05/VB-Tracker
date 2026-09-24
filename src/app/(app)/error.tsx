"use client";

import { ErrorView } from "@/components/shared/ErrorView";

// Renders inside the app shell, so the sidebar and nav stay usable while one
// page fails.
export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorView
      error={error}
      reset={reset}
      homeHref="/dashboard"
      homeLabel="Back to dashboard"
      variant="inline"
    />
  );
}
