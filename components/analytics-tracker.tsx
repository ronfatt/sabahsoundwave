"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true
    }).catch(() => null);
  }, [pathname]);

  return null;
}

