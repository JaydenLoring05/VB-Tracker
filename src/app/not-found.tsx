import { Compass } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StateCard } from "@/components/shared/StateCard";

export const metadata: Metadata = {
  title: "Page not found"
};

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="state-page">
      <StateCard
        icon={Compass}
        title="Page not found"
        actions={
          <>
            <Link href="/" className="state-link">
              Back to home
            </Link>
            <Link href="/login" className="state-link">
              Log in
            </Link>
          </>
        }
      >
        That link may be old or mistyped. Head back and pick up where you left off.
      </StateCard>
    </main>
  );
}
