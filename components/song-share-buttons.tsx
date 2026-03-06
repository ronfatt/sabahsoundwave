"use client";

import { useState } from "react";

export function SongShareButtons({
  shareUrl,
  songTitle,
  artistName,
  compact = false
}: {
  shareUrl: string;
  songTitle: string;
  artistName: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const text = `${songTitle} — ${artistName}\n${shareUrl}`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(text)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-2"}`}>
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-emerald-400/50 px-3 py-2 text-xs font-semibold text-emerald-200 hover:border-emerald-300"
      >
        WhatsApp
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-400"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
