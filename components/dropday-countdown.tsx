"use client";

import { useEffect, useMemo, useState } from "react";

function getParts(ms: number) {
  const safe = Math.max(ms, 0);
  const totalSeconds = Math.floor(safe / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export function DropDayCountdown({ targetIso }: { targetIso: string }) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const parts = getParts(target - now);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/35 bg-brand-500/10 px-3 py-1 text-xs text-brand-200">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-300" />
      <span>
        {parts.days}d {parts.hours}h {parts.minutes}m {parts.seconds}s
      </span>
    </div>
  );
}
