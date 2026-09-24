"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";

import { StateCard } from "@/components/shared/StateCard";

/**
 * Body for Next.js error boundaries (error.tsx). Deliberately ignores
 * error.message: in production it is already redacted by Next for server
 * errors, and client-side errors (raw Supabase text, stack fragments) must
 * never reach the screen. The digest is a safe reference for support.
 */
export function ErrorView({
  error,
  reset,
  homeHref,
  homeLabel,
  variant
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  homeLabel: string;
  variant: "page" | "inline";
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  function retry() {
    // reset() alone re-renders with the same failed server data; refresh
    // re-fetches it first.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div className={variant === "page" ? "state-page" : "state-inline"} role="alert">
      <StateCard
        icon={AlertTriangle}
        title="Something went wrong"
        reference={error.digest}
        actions={
          <>
            <button type="button" onClick={retry}>
              <RefreshCw size={16} aria-hidden="true" /> Try again
            </button>
            <Link href={homeHref} className="state-link">
              {homeLabel}
            </Link>
          </>
        }
      >
        We hit a snag loading this page. Your data is safe. Give it another try, and if it keeps
        happening, let your coach or the NextRep team know.
      </StateCard>
    </div>
  );
}
