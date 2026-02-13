"use client";

import { DISTRICT_OPTIONS, type DistrictValue } from "@/lib/constants";
import { getDistrictLabel } from "@/lib/district";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

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

type SubmissionAiInsight = {
  recommendedPackage: "Starter" | "Pro" | "Label";
  tags: string[];
  reason: string;
};

const TYPES: ArtistItem["type"][] = ["NORMAL_LISTING", "LAUNCH_SUPPORT"];
const STATUSES: ArtistItem["status"][] = ["PENDING", "APPROVED", "REJECTED"];

export function AdminPanel({
  initialSubmissions,
  initialArtists,
  initialDropEvents
}: {
  initialSubmissions: ArtistItem[];
  initialArtists: ArtistItem[];
  initialDropEvents: DropEventItem[];
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [artists, setArtists] = useState(initialArtists);
  const [dropEvents, setDropEvents] = useState(initialDropEvents);
  const [statusMessage, setStatusMessage] = useState("");
  const [dropTitle, setDropTitle] = useState("");
  const [dropDate, setDropDate] = useState("");
  const [dropDescription, setDropDescription] = useState("");
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [aiInsights, setAiInsights] = useState<Record<string, SubmissionAiInsight>>({});
  const [aiLoadingIds, setAiLoadingIds] = useState<string[]>([]);

  const groupedSubmissions = useMemo(() => {
    return TYPES.map((type) => ({
      type,
      statuses: STATUSES.map((status) => ({
        status,
        items: submissions.filter((item) => item.type === type && item.status === status)
      }))
    }));
  }, [submissions]);

  const approvedArtists = useMemo(() => artists.filter((artist) => artist.status === "APPROVED"), [artists]);

  async function moderateSubmission(id: string, action: "approve" | "reject") {
    const response = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload) {
      setStatusMessage(payload?.error || "Action failed. Re-check admin session.");
      return;
    }

    setSubmissions(payload.submissions);
    setArtists(payload.artists);
    setStatusMessage(action === "approve" ? "Submission approved" : "Submission rejected");
  }

  async function toggleFeatured(id: string, featured: boolean) {
    const response = await fetch(`/api/admin/artists/${id}/feature`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !featured })
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setStatusMessage(payload?.error || "Feature update failed");
      return;
    }

    setArtists((current) => current.map((item) => (item.id === id ? { ...item, featured: !featured } : item)));
    setStatusMessage("Featured status updated");
  }

  async function handleArtistSave(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const textValue = (key: string) => String(formData.get(key) ?? "");

    const body = {
      type: textValue("type"),
      hasSongReleased: textValue("hasSongReleased") === "yes",
      uploadLinks: textValue("uploadLinks"),
      contactWhatsapp: textValue("contactWhatsapp"),
      name: textValue("name"),
      district: textValue("district"),
      genres: textValue("genres"),
      bio: textValue("bio"),
      spotifyUrl: textValue("spotifyUrl"),
      appleMusicUrl: textValue("appleMusicUrl"),
      youtubeUrl: textValue("youtubeUrl"),
      coverImageUrl: textValue("coverImageUrl")
    };

    const response = await fetch(`/api/admin/artists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload) {
      setStatusMessage(payload?.error || "Artist update failed");
      return;
    }

    setArtists((current) => current.map((item) => (item.id === id ? { ...item, ...payload.artist } : item)));
    setSubmissions((current) => current.map((item) => (item.id === id ? { ...item, ...payload.artist } : item)));
    setStatusMessage("Artist updated");
  }

  async function handleCreateDropEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!dropDate) {
      setStatusMessage("Drop date is required");
      return;
    }

    const date = new Date(dropDate);
    if (Number.isNaN(date.getTime())) {
      setStatusMessage("Drop date is invalid");
      return;
    }

    const response = await fetch("/api/admin/drop-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: dropTitle,
        date: date.toISOString(),
        description: dropDescription,
        artistIds: selectedArtistIds
      })
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload) {
      setStatusMessage(payload?.error || "Drop Day creation failed");
      return;
    }

    setDropEvents((current) =>
      [...current, payload.event].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    setDropTitle("");
    setDropDate("");
    setDropDescription("");
    setSelectedArtistIds([]);
    setStatusMessage("Drop Day created");
  }

  function toggleArtistSelection(artistId: string) {
    setSelectedArtistIds((current) =>
      current.includes(artistId) ? current.filter((id) => id !== artistId) : [...current, artistId]
    );
  }

  async function runAiPrecheck(item: ArtistItem) {
    setAiLoadingIds((current) => [...current, item.id]);

    const response = await fetch("/api/ai/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submission_triage",
        payload: {
          id: item.id,
          name: item.name,
          district: item.district,
          genres: item.genres,
          bio: item.bio,
          type: item.type,
          hasSongReleased: item.hasSongReleased,
          uploadLinks: item.uploadLinks,
          spotifyUrl: item.spotifyUrl,
          appleMusicUrl: item.appleMusicUrl,
          youtubeUrl: item.youtubeUrl
        }
      })
    });

    const payload = await response.json().catch(() => null);
    setAiLoadingIds((current) => current.filter((id) => id !== item.id));

    if (!response.ok || !payload) {
      setStatusMessage(payload?.error || "AI precheck failed");
      return;
    }

    setAiInsights((current) => ({
      ...current,
      [item.id]: {
        recommendedPackage: payload.recommendedPackage,
        tags: payload.tags || [],
        reason: payload.reason || ""
      }
    }));
  }

  return (
    <section className="space-y-8">
      {statusMessage ? <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{statusMessage}</p> : null}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-xl font-semibold">Drop Day Manager</h2>
        <form onSubmit={handleCreateDropEvent} className="space-y-3">
          <input
            value={dropTitle}
            onChange={(event) => setDropTitle(event.target.value)}
            placeholder="Drop title"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="datetime-local"
            value={dropDate}
            onChange={(event) => setDropDate(event.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <textarea
            value={dropDescription}
            onChange={(event) => setDropDescription(event.target.value)}
            placeholder="Drop description"
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">Assign artists (approved only)</p>
            <div className="grid gap-2 rounded border border-slate-200 p-3 md:grid-cols-2">
              {approvedArtists.map((artist) => (
                <label key={artist.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedArtistIds.includes(artist.id)}
                    onChange={() => toggleArtistSelection(artist.id)}
                  />
                  <span>{artist.name}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Create Drop Day</button>
        </form>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Existing Drop Days</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {dropEvents.map((event) => (
              <article key={event.id} className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold">{event.title}</p>
                <p className="text-xs text-slate-600">
                  {new Date(event.date).toLocaleDateString("en-MY", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </p>
                <p className="mt-1 text-sm text-slate-700">{event.description}</p>
                <p className="mt-2 text-xs text-slate-600">Lineup: {event.artists.map((a) => a.name).join(", ") || "None"}</p>
                <Link href={`/drop/${event.id}`} className="mt-2 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-600">
                  Open public page
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Submissions grouped by type and status</h2>
        {groupedSubmissions.map((group) => (
          <div key={group.type} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold">{group.type}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {group.statuses.map((bucket) => (
                <div key={`${group.type}-${bucket.status}`} className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold">{bucket.status} ({bucket.items.length})</p>
                  <div className="space-y-2">
                    {bucket.items.length === 0 ? <p className="text-xs text-slate-500">No items</p> : null}
                    {bucket.items.map((item) => (
                      <article key={item.id} className="space-y-1 rounded-lg bg-slate-50 p-2">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-slate-600">{getDistrictLabel(item.district)} · {item.genres}</p>
                        {aiInsights[item.id] ? (
                          <div className="rounded border border-brand-200 bg-brand-50 p-2 text-xs text-slate-700">
                            <p className="font-semibold">AI 推荐套餐: {aiInsights[item.id].recommendedPackage}</p>
                            <p className="mt-1">标签: {aiInsights[item.id].tags.join(" · ") || "需人工跟进"}</p>
                            <p className="mt-1">{aiInsights[item.id].reason}</p>
                          </div>
                        ) : null}
                        {item.status === "PENDING" ? (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => runAiPrecheck(item)}
                              disabled={aiLoadingIds.includes(item.id)}
                              className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
                            >
                              {aiLoadingIds.includes(item.id) ? "AI checking..." : "AI precheck"}
                            </button>
                            <button
                              onClick={() => moderateSubmission(item.id, "approve")}
                              className="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => moderateSubmission(item.id, "reject")}
                              className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Manage artists</h2>
        <div className="grid gap-4">
          {artists.map((artist) => (
            <form key={artist.id} onSubmit={(event) => handleArtistSave(event, artist.id)} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">/{artist.slug}</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{artist.status}</span>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <select name="type" defaultValue={artist.type} className="rounded border border-slate-300 px-3 py-2 text-sm">
                  <option value="NORMAL_LISTING">NORMAL_LISTING</option>
                  <option value="LAUNCH_SUPPORT">LAUNCH_SUPPORT</option>
                </select>
                <select
                  name="hasSongReleased"
                  defaultValue={artist.hasSongReleased ? "yes" : "no"}
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="yes">has_song_released: yes</option>
                  <option value="no">has_song_released: no</option>
                </select>
                <input name="contactWhatsapp" defaultValue={artist.contactWhatsapp} placeholder="contact_whatsapp" className="rounded border border-slate-300 px-3 py-2 text-sm" />
                <input name="uploadLinks" defaultValue={artist.uploadLinks || ""} placeholder="upload_links" className="rounded border border-slate-300 px-3 py-2 text-sm" />

                <input name="name" defaultValue={artist.name} className="rounded border border-slate-300 px-3 py-2 text-sm" />
                <select name="district" defaultValue={artist.district} className="rounded border border-slate-300 px-3 py-2 text-sm">
                  {DISTRICT_OPTIONS.map((district) => (
                    <option key={district.value} value={district.value}>
                      {district.label}
                    </option>
                  ))}
                </select>
                <input name="genres" defaultValue={artist.genres} className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
                <textarea name="bio" defaultValue={artist.bio} className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2" rows={3} />
                <input name="spotifyUrl" defaultValue={artist.spotifyUrl || ""} placeholder="Spotify URL" className="rounded border border-slate-300 px-3 py-2 text-sm" />
                <input name="appleMusicUrl" defaultValue={artist.appleMusicUrl || ""} placeholder="Apple Music URL" className="rounded border border-slate-300 px-3 py-2 text-sm" />
                <input name="youtubeUrl" defaultValue={artist.youtubeUrl || ""} placeholder="YouTube URL" className="rounded border border-slate-300 px-3 py-2 text-sm" />
                <input
                  name="coverImageUrl"
                  defaultValue={artist.coverImageUrl || ""}
                  placeholder="Cover image URL"
                  className="rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Save edits</button>
                <button
                  type="button"
                  disabled={artist.status !== "APPROVED"}
                  onClick={() => toggleFeatured(artist.id, artist.featured)}
                  className="rounded-lg border border-brand-500 px-3 py-2 text-sm font-semibold text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {artist.featured ? "Remove featured" : "Set featured"}
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>
    </section>
  );
}
