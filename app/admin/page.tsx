"use client";

import { AdminAuth } from "@/components/admin-auth";
import { AdminPanel } from "@/components/admin-panel";
import { type DistrictValue } from "@/lib/constants";
import { Navbar } from "@/components/navbar";
import { useEffect, useState } from "react";

type ArtistItem = {
  id: string;
  slug: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  type: "NORMAL_LISTING" | "LAUNCH_SUPPORT";
  hasSongReleased: boolean;
  uploadLinks: string | null;
  contactWhatsapp: string;
  name: string;
  district: DistrictValue;
  genres: string;
  bio: string;
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

type AdminData = {
  submissions: ArtistItem[];
  artists: ArtistItem[];
  dropEvents: DropEventItem[];
};

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);

  useEffect(() => {
    if (!authorized) return;

    fetch("/api/admin/dashboard")
      .then((response) => {
        if (!response.ok) throw new Error("Unauthorized");
        return response.json();
      })
      .then((payload) => setData(payload))
      .catch(() => {
        setAuthorized(false);
        setData(null);
      });
  }, [authorized]);

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
          <p className="text-slate-600">Review submissions by type/status, manage Drop Day, edit artist profiles, and manage featured status.</p>
        </div>

        {!authorized ? <AdminAuth onAuthorized={() => setAuthorized(true)} /> : null}
        {authorized && !data ? <p>Loading dashboard...</p> : null}
        {authorized && data ? (
          <AdminPanel initialSubmissions={data.submissions} initialArtists={data.artists} initialDropEvents={data.dropEvents} />
        ) : null}
      </section>
    </main>
  );
}
