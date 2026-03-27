"use client";

import { AdminAuth } from "@/components/admin-auth";
import { AdminPanel } from "@/components/admin-panel";
import { type DistrictValue } from "@/lib/constants";
import { parseLang, type Lang } from "@/lib/i18n";
import { Navbar } from "@/components/navbar";
import { useEffect, useState } from "react";

type ArtistItem = {
  id: string;
  slug: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  type: "NORMAL_LISTING" | "LAUNCH_SUPPORT";
  spotifyArtistId: string | null;
  discoverySource: "MANUAL" | "SUBMISSION" | "PLAYLIST" | "SEARCH" | "CSV_IMPORT" | "YOUTUBE_CHANNEL" | "YOUTUBE_SEARCH";
  verificationStatus: "NEEDS_REVIEW" | "AUTO_APPROVED" | "VERIFIED" | "REJECTED";
  sabahConfidence: number;
  sourceTags: string | null;
  discoveredAt: string | null;
  hasSongReleased: boolean;
  uploadLinks: string | null;
  contactWhatsapp: string;
  name: string;
  district: DistrictValue;
  genres: string;
  bio: string;
  aiSummary: string | null;
  spotifyFollowers: number | null;
  artistCardClickCount: number;
  profileViewCount: number;
  songSpotlightViewCount: number;
  songListenClickCount: number;
  submitTermsAcceptedAt: string | null;
  starterAgreementAcceptedAt: string | null;
  starterAgreementVersion: string | null;
  topTrackUrl: string | null;
  topTrackName: string | null;
  latestReleaseName: string | null;
  latestReleaseDate: string | null;
  latestReleaseUrl: string | null;
  lastSpotifySyncedAt: string | null;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
  youtubeUrl: string | null;
  coverImageUrl: string | null;
  featured: boolean;
};

type DropEventItem = {
  id: string;
  title: string;
  date: string;
  description: string;
  artists: Array<{
    id: string;
    name: string;
    slug: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
  }>;
};

type YoutubeCandidateItem = {
  id: string;
  sourceType: "YOUTUBE_CHANNEL" | "YOUTUBE_SEARCH";
  status: "NEW" | "REVIEWED" | "DISMISSED";
  confidence: number;
  artistName: string;
  normalizedName: string;
  channelId: string;
  channelTitle: string;
  videoId: string;
  songTitle: string;
  publishedAt: string;
  watchUrl: string;
  thumbnailUrl: string | null;
  sourceTerm: string | null;
  createdAt: string;
  updatedAt: string;
};

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string | null;
  publishedAt: string;
  summary: string | null;
  clickCount: number;
  lastClickedAt: string | null;
};

type AdminData = {
  submissions: ArtistItem[];
  artists: ArtistItem[];
  dropEvents: DropEventItem[];
  youtubeCandidates: YoutubeCandidateItem[];
  newsItems: NewsItem[];
  newsCategoryCounts: Record<string, number>;
};

export default function AdminPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [authorized, setAuthorized] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    setLang(parseLang(new URLSearchParams(window.location.search).get("lang")));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/dashboard")
      .then((response) => {
        if (response.status === 401) return null;
        if (!response.ok) throw new Error(lang === "ms" ? "Dashboard gagal dimuatkan" : "Dashboard failed to load");
        return response.json();
      })
      .then((payload) => {
        if (cancelled || !payload) return;
        setAuthorized(true);
        setData(payload);
        setDashboardError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setDashboardError(error instanceof Error ? error.message : "Dashboard failed to load");
      });

    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function loadDashboard() {
      const fetchOnce = async () => {
        const response = await fetch("/api/admin/dashboard", { credentials: "same-origin" });
        if (response.ok) return response.json();

        const payload = await response.json().catch(() => null);
        const fallback =
          response.status === 401 || response.status === 403
            ? lang === "ms"
              ? "Tiada kebenaran"
              : "Unauthorized"
            : lang === "ms"
              ? "Dashboard gagal dimuatkan"
              : "Dashboard failed to load";
        const error = new Error(payload?.error || fallback);
        (error as Error & { status?: number }).status = response.status;
        throw error;
      };

      try {
        const payload = await fetchOnce();
        if (!cancelled) {
          setData(payload);
          setDashboardError("");
        }
      } catch {
        try {
          await new Promise((resolve) => setTimeout(resolve, 250));
          const payload = await fetchOnce();
          if (!cancelled) {
            setData(payload);
            setDashboardError("");
          }
        } catch (error) {
          if (!cancelled) {
            const message = error instanceof Error ? error.message : "Dashboard failed to load";
            const status = typeof error === "object" && error && "status" in error ? (error as { status?: number }).status : undefined;
            if (status === 401 || status === 403) {
              setAuthorized(false);
              setData(null);
              setDashboardError("");
            } else {
              setDashboardError(message);
            }
          }
        }
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [authorized, lang]);

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p className="text-slate-600">
            {lang === "ms"
              ? "Semak submission ikut jenis/status, urus Drop Day, kemas kini profil artis, dan tetapkan status featured."
              : "Review submissions by type/status, manage Drop Day, edit artist profiles, and manage featured status."}
          </p>
        </div>

        {!authorized ? <AdminAuth lang={lang} onAuthorized={() => setAuthorized(true)} /> : null}
        {dashboardError ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{dashboardError}</p> : null}
        {authorized && !data ? <p>{lang === "ms" ? "Memuatkan dashboard..." : "Loading dashboard..."}</p> : null}
        {authorized && data ? (
          <AdminPanel
            lang={lang}
            initialSubmissions={data.submissions}
            initialArtists={data.artists}
            initialDropEvents={data.dropEvents}
            initialYoutubeCandidates={data.youtubeCandidates}
            initialNewsItems={data.newsItems}
            initialNewsCategoryCounts={data.newsCategoryCounts}
          />
        ) : null}
      </section>
    </main>
  );
}
