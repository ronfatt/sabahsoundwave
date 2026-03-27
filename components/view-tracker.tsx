"use client";

import { useEffect, useRef } from "react";

export function ViewTracker({
  endpoint
}: {
  endpoint: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    fetch(endpoint, {
      method: "POST",
      keepalive: true
    }).catch(() => null);
  }, [endpoint]);

  return null;
}

