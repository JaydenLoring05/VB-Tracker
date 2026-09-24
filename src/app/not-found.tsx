import { Compass } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StateCard } from "@/components/shared/StateCard";

export const metadata: Metadata = {
  title: "Page not found"
};

export default function NotFound() {
  return (
    <div className="state-page">
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
    </div>
  );
}
