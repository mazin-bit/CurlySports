"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Wrench } from "lucide-react";

interface PublicFlags {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceEstimated: string;
  siteNoticeEnabled: boolean;
  siteNotice: string;
}

function MaintenancePage({ message, estimated }: { message: string; estimated: string }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#07090b",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'JetBrains Mono', monospace",
      color: "#f0f1f3",
      padding: 32,
      textAlign: "center",
    }}>
      <div style={{ marginBottom: 20, color: "#c8ff3d" }}><Wrench size={56} strokeWidth={1.5} /></div>
      <div style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 32,
        fontWeight: 800,
        marginBottom: 12,
        color: "#f0f1f3",
      }}>
        We&apos;ll be right back
      </div>
      <div style={{ fontSize: 15, color: "rgba(240,241,243,0.6)", maxWidth: 480, lineHeight: 1.6, marginBottom: 12 }}>
        {message || "We're making some improvements."}
      </div>
      {estimated && (
        <div style={{ fontSize: 13, color: "#c8ff3d", fontWeight: 600, marginBottom: 24 }}>
          {estimated}
        </div>
      )}
      <div style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontSize: 16,
        fontWeight: 800,
        color: "rgba(240,241,243,0.25)",
        marginTop: 32,
      }}>
        curly<span style={{ color: "#ff5b3d" }}>.</span>sports
      </div>
    </div>
  );
}

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [flags, setFlags] = useState<PublicFlags | null>(null);

  // Track page view
  useEffect(() => {
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
      fetch("/api/admin/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ page: pathname }),
      }).catch(() => {});
    }
  }, [pathname]);

  // Fetch flags
  useEffect(() => {
    fetch("/api/admin/flags")
      .then((r) => r.json())
      .then((f) => setFlags(f))
      .catch(() => {});
  }, [pathname]);

  // Admin path is always accessible
  if (pathname.startsWith("/admin")) return <>{children}</>;

  // While loading flags, show children (avoids flash)
  if (!flags) return <>{children}</>;

  // Maintenance mode
  if (flags.maintenanceMode) {
    return <MaintenancePage message={flags.maintenanceMessage} estimated={flags.maintenanceEstimated} />;
  }

  return (
    <>
      {/* Site notice banner */}
      {flags.siteNoticeEnabled && flags.siteNotice && (
        <NoticeBanner text={flags.siteNotice} />
      )}
      {children}
    </>
  );
}

function NoticeBanner({ text }: { text: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div style={{
      background: "#c8ff3d",
      color: "#07090b",
      padding: "9px 20px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 13,
      fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      position: "relative",
      zIndex: 1000,
    }}>
      <span style={{ flex: 1 }}>{text}</span>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20, color: "#07090b", opacity: 0.6 }}
      >
        ×
      </button>
    </div>
  );
}
