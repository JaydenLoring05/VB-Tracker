"use client";

import { useEffect } from "react";

// Last-resort boundary: it replaces the root layout, so globals.css and the
// font are not loaded. Everything here is self-contained inline styling that
// mirrors the NextRep dark theme.
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px 16px",
          background: "#05070a",
          color: "#f4f6f8",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}
      >
        <main
          role="alert"
          style={{
            width: "100%",
            maxWidth: 460,
            textAlign: "center",
            padding: 24,
            background: "#101419",
            border: "1px solid #272d36",
            borderRadius: 20
          }}
        >
          <h1 style={{ margin: "0 0 8px", fontSize: 28, lineHeight: 1.15 }}>Something went wrong</h1>
          <p style={{ margin: "0 auto", maxWidth: "36ch", lineHeight: 1.5, color: "#aeb6c4" }}>
            NextRep hit an unexpected problem. Your data is safe. Try again, and if it keeps
            happening, let your coach or the NextRep team know.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
              marginTop: 24
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: 44,
                padding: "11px 18px",
                border: "none",
                borderRadius: 10,
                background: "#ffc400",
                color: "#14110a",
                font: "inherit",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Try again
            </button>
            {/* A plain anchor on purpose: the router may be the thing that broke. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
                padding: "0 18px",
                border: "1px solid #272d36",
                borderRadius: 10,
                color: "#f4f6f8",
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              Back to home
            </a>
          </div>
          {error.digest && (
            <p style={{ marginTop: 20, fontSize: 12, color: "#aeb6c4" }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
