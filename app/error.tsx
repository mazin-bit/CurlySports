"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service (Sentry, etc.) when configured
    console.error("Unhandled error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0c0a1d",
        color: "#fffdf7",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          background: "#c8ff3d",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          fontFamily: "Georgia, serif",
          fontWeight: 900,
          fontSize: 28,
          color: "#0c0a1d",
        }}
      >
        c
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
        Something went wrong
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "rgba(255,253,247,0.6)",
          maxWidth: 400,
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        We hit an unexpected error. This has been logged and we&apos;re looking
        into it.
      </p>
      <button
        onClick={reset}
        style={{
          background: "#c8ff3d",
          color: "#0c0a1d",
          border: "none",
          borderRadius: 999,
          padding: "12px 32px",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
