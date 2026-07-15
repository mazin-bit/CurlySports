"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    fetch("/api/tracking/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
