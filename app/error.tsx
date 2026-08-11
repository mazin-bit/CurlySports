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
        background: "#f6ede0",
        color: "#0c0a1d",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          background: "#c8ff3d",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          fontFamily: "'Bricolage Grotesque', Georgia, serif",
          fontWeight: 900,
          fontSize: 34,
          color: "#0c0a1d",
          border: "3px solid #0c0a1d",
          boxShadow: "4px 4px 0 #0c0a1d",
        }}
      >
        c
      </div>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 8,
          fontFamily: "'Bricolage Grotesque', -apple-system, sans-serif",
        }}
      >
        Something went wrong
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "rgba(12,10,29,0.55)",
          maxWidth: 400,
          lineHeight: 1.6,
          marginBottom: 28,
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
          border: "3px solid #0c0a1d",
          borderRadius: 999,
          padding: "12px 32px",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          boxShadow: "3px 3px 0 #0c0a1d",
          fontFamily: "'DM Sans', -apple-system, sans-serif",
          transition: "transform 0.1s, box-shadow 0.1s",
        }}
        onMouseDown={(e) => {
          (e.target as HTMLButtonElement).style.transform = "translate(2px, 2px)";
          (e.target as HTMLButtonElement).style.boxShadow = "1px 1px 0 #0c0a1d";
        }}
        onMouseUp={(e) => {
          (e.target as HTMLButtonElement).style.transform = "none";
          (e.target as HTMLButtonElement).style.boxShadow = "3px 3px 0 #0c0a1d";
        }}
      >
        Try again
      </button>
    </div>
  );
}
