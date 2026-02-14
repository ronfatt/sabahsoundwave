"use client";

import { DISTRICT_OPTIONS, type DistrictValue } from "@/lib/constants";
import { getDistrictLabel } from "@/lib/district";
import { type Lang, withLang } from "@/lib/i18n";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
  aiSummary: string | null;
  submitTermsAcceptedAt: string | null;
  starterAgreementAcceptedAt: string | null;
  starterAgreementVersion: string | null;
  topTrackUrl: string | null;
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
const ARTISTS_PER_PAGE = 12;

export function AdminPanel({
  lang,
  initialSubmissions,
  initialArtists,
  initialDropEvents
}: {
  lang: Lang;
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
  const [artistQuery, setArtistQuery] = useState("");
  const [artistStatusFilter, setArtistStatusFilter] = useState<ArtistItem["status"] | "ALL">("ALL");
  const [artistTypeFilter, setArtistTypeFilter] = useState<ArtistItem["type"] | "ALL">("ALL");
  const [artistDistrictFilter, setArtistDistrictFilter] = useState<DistrictValue | "ALL">("ALL");
  const [artistFeaturedFilter, setArtistFeaturedFilter] = useState<"ALL" | "FEATURED" | "NON_FEATURED">("ALL");
  const [artistPage, setArtistPage] = useState(1);
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null);
  const [editingDropId, setEditingDropId] = useState<string | null>(null);
  const [editingDropTitle, setEditingDropTitle] = useState("");
  const [editingDropDate, setEditingDropDate] = useState("");
  const [editingDropDescription, setEditingDropDescription] = useState("");
  const [editingDropArtistIds, setEditingDropArtistIds] = useState<string[]>([]);

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

  const t = {
    actionFailed: lang === "ms" ? "Tindakan gagal. Semak semula sesi admin." : "Action failed. Re-check admin session.",
    featureFailed: lang === "ms" ? "Kemaskini featured gagal" : "Feature update failed",
    featureUpdated: lang === "ms" ? "Status featured dikemas kini" : "Featured status updated",
    artistUpdateFailed: lang === "ms" ? "Kemaskini artis gagal" : "Artist update failed",
    artistUpdated: lang === "ms" ? "Artis berjaya dikemas kini" : "Artist updated",
    dropDateRequired: lang === "ms" ? "Tarikh Drop diperlukan" : "Drop date is required",
    dropDateInvalid: lang === "ms" ? "Tarikh Drop tidak sah" : "Drop date is invalid",
    dropCreateFailed: lang === "ms" ? "Penciptaan Drop Day gagal" : "Drop Day creation failed",
    dropCreated: lang === "ms" ? "Drop Day berjaya dibuat" : "Drop Day created",
    dropUpdateFailed: lang === "ms" ? "Kemaskini Drop Day gagal" : "Drop Day update failed",
    dropUpdated: lang === "ms" ? "Drop Day berjaya dikemas kini" : "Drop Day updated",
    dropDeleteFailed: lang === "ms" ? "Padam Drop Day gagal" : "Drop Day delete failed",
    dropDeleted: lang === "ms" ? "Drop Day berjaya dipadam" : "Drop Day deleted",
    confirmDeleteDrop: lang === "ms" ? "Padam Drop Day ini?" : "Delete this Drop Day?",
    aiPrecheckFailed: lang === "ms" ? "Semakan AI gagal" : "AI precheck failed",
    dropDayManager: "Drop Day Manager",
    dropTitle: lang === "ms" ? "Tajuk Drop" : "Drop title",
    dropDescription: lang === "ms" ? "Penerangan Drop" : "Drop description",
    assignArtists: lang === "ms" ? "Pilih artis (yang sudah approved sahaja)" : "Assign artists (approved only)",
    createDrop: lang === "ms" ? "Cipta Drop Day" : "Create Drop Day",
    existingDrop: lang === "ms" ? "Drop Day Sedia Ada" : "Existing Drop Days",
    lineup: lang === "ms" ? "Barisan" : "Lineup",
    none: lang === "ms" ? "Tiada" : "None",
    openPublic: lang === "ms" ? "Buka halaman awam" : "Open public page",
    edit: lang === "ms" ? "Edit" : "Edit",
    cancel: lang === "ms" ? "Batal" : "Cancel",
    save: lang === "ms" ? "Simpan" : "Save",
    delete: lang === "ms" ? "Padam" : "Delete",
    grouped: lang === "ms" ? "Submission ikut jenis dan status" : "Submissions grouped by type and status",
    noItems: lang === "ms" ? "Tiada item" : "No items",
    aiPackage: lang === "ms" ? "Cadangan pakej AI" : "AI recommended package",
    aiTags: lang === "ms" ? "Tag" : "Tags",
    manualFollowup: lang === "ms" ? "Perlu semakan manual" : "Needs manual follow-up",
    aiChecking: lang === "ms" ? "AI sedang semak..." : "AI checking...",
    aiPrecheck: lang === "ms" ? "Semakan AI" : "AI precheck",
    approve: lang === "ms" ? "Luluskan" : "Approve",
    reject: lang === "ms" ? "Tolak" : "Reject",
    manageArtists: lang === "ms" ? "Urus artis" : "Manage artists",
    saveEdits: lang === "ms" ? "Simpan perubahan" : "Save edits",
    removeFeatured: lang === "ms" ? "Buang featured" : "Remove featured",
    setFeatured: lang === "ms" ? "Jadikan featured" : "Set featured",
    searchArtists: lang === "ms" ? "Cari artis (nama/slug/genre)" : "Search artists (name/slug/genre)",
    filterStatus: lang === "ms" ? "Status" : "Status",
    filterType: lang === "ms" ? "Jenis" : "Type",
    filterDistrict: lang === "ms" ? "Daerah" : "District",
    filterFeatured: lang === "ms" ? "Featured" : "Featured",
    all: lang === "ms" ? "Semua" : "All",
    featuredOnly: lang === "ms" ? "Featured sahaja" : "Featured only",
    nonFeaturedOnly: lang === "ms" ? "Bukan featured" : "Non-featured only",
    artistsFound: lang === "ms" ? "artis ditemui" : "artists found",
    page: lang === "ms" ? "Halaman" : "Page",
    prev: lang === "ms" ? "Sebelum" : "Previous",
    next: lang === "ms" ? "Seterusnya" : "Next",
    editArtist: lang === "ms" ? "Edit artis" : "Edit artist",
    closeEditor: lang === "ms" ? "Tutup editor" : "Close editor",
    noArtistsMatch: lang === "ms" ? "Tiada artis sepadan dengan penapis." : "No artists match current filters."
    ,
    agreementRecords: lang === "ms" ? "Rekod Starter Agreement" : "Starter Agreement Records",
    acceptedAt: lang === "ms" ? "Diterima pada" : "Accepted at",
    version: lang === "ms" ? "Versi" : "Version",
    agreementPending: lang === "ms" ? "Perjanjian belum disahkan" : "Agreement not accepted yet",
    submitTermsRecords: lang === "ms" ? "Rekod Submit Music Terms" : "Submit Music Terms Records"
  };

  function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(lang === "ms" ? "ms-MY" : "en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  const starterAgreementRecords = [...artists]
    .filter((artist) => artist.type === "LAUNCH_SUPPORT" && artist.starterAgreementAcceptedAt)
    .sort((a, b) => new Date(b.starterAgreementAcceptedAt || 0).getTime() - new Date(a.starterAgreementAcceptedAt || 0).getTime());
  const submitTermsRecords = [...artists]
    .filter((artist) => artist.submitTermsAcceptedAt)
    .sort((a, b) => new Date(b.submitTermsAcceptedAt || 0).getTime() - new Date(a.submitTermsAcceptedAt || 0).getTime());

  function typeLabel(type: ArtistItem["type"]) {
    if (type === "NORMAL_LISTING") return lang === "ms" ? "SENARAI_BIASA" : "NORMAL_LISTING";
    return lang === "ms" ? "LAUNCH_SUPPORT" : "LAUNCH_SUPPORT";
  }

  function statusLabel(status: ArtistItem["status"]) {
    if (status === "PENDING") return lang === "ms" ? "MENUNGGU" : "PENDING";
    if (status === "APPROVED") return lang === "ms" ? "DILULUSKAN" : "APPROVED";
    return lang === "ms" ? "DITOLAK" : "REJECTED";
  }

  function featuredFilterLabel(value: "ALL" | "FEATURED" | "NON_FEATURED") {
    if (value === "FEATURED") return t.featuredOnly;
    if (value === "NON_FEATURED") return t.nonFeaturedOnly;
    return t.all;
  }

  async function moderateSubmission(id: string, action: "approve" | "reject") {
    const response = await fetch(`/api/admin/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload) {
      setStatusMessage(payload?.error || t.actionFailed);
      return;
    }

    setSubmissions(payload.submissions);
    setArtists(payload.artists);
    setStatusMessage(
      action === "approve"
        ? lang === "ms"
          ? "Submission diluluskan"
          : "Submission approved"
        : lang === "ms"
          ? "Submission ditolak"
          : "Submission rejected"
    );
  }

  async function toggleFeatured(id: string, featured: boolean) {
    const response = await fetch(`/api/admin/artists/${id}/feature`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !featured })
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setStatusMessage(payload?.error || t.featureFailed);
      return;
    }

    setArtists((current) => current.map((item) => (item.id === id ? { ...item, featured: !featured } : item)));
    setStatusMessage(t.featureUpdated);
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
      aiSummary: textValue("aiSummary"),
      topTrackUrl: textValue("topTrackUrl"),
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
      setStatusMessage(payload?.error || t.artistUpdateFailed);
      return;
    }

    setArtists((current) => current.map((item) => (item.id === id ? { ...item, ...payload.artist } : item)));
    setSubmissions((current) => current.map((item) => (item.id === id ? { ...item, ...payload.artist } : item)));
    setStatusMessage(t.artistUpdated);
    setEditingArtistId(null);
  }

  async function handleCreateDropEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!dropDate) {
      setStatusMessage(t.dropDateRequired);
      return;
    }

    const date = new Date(dropDate);
    if (Number.isNaN(date.getTime())) {
      setStatusMessage(t.dropDateInvalid);
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
      setStatusMessage(payload?.error || t.dropCreateFailed);
      return;
    }

    setDropEvents((current) =>
      [...current, payload.event].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    setDropTitle("");
    setDropDate("");
    setDropDescription("");
    setSelectedArtistIds([]);
    setStatusMessage(t.dropCreated);
  }

  function toggleArtistSelection(artistId: string) {
    setSelectedArtistIds((current) =>
      current.includes(artistId) ? current.filter((id) => id !== artistId) : [...current, artistId]
    );
  }

  function toggleEditingDropArtistSelection(artistId: string) {
    setEditingDropArtistIds((current) =>
      current.includes(artistId) ? current.filter((id) => id !== artistId) : [...current, artistId]
    );
  }

  function toDateTimeLocalValue(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const tzAdjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return tzAdjusted.toISOString().slice(0, 16);
  }

  function startEditingDropEvent(event: DropEventItem) {
    setEditingDropId(event.id);
    setEditingDropTitle(event.title);
    setEditingDropDate(toDateTimeLocalValue(event.date));
    setEditingDropDescription(event.description);
    setEditingDropArtistIds(event.artists.map((artist) => artist.id));
  }

  async function handleDropEventUpdate(eventId: string) {
    if (!editingDropDate) {
      setStatusMessage(t.dropDateRequired);
      return;
    }

    const date = new Date(editingDropDate);
    if (Number.isNaN(date.getTime())) {
      setStatusMessage(t.dropDateInvalid);
      return;
    }

    const response = await fetch(`/api/admin/drop-events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editingDropTitle,
        date: date.toISOString(),
        description: editingDropDescription,
        artistIds: editingDropArtistIds
      })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      setStatusMessage(payload?.error || t.dropUpdateFailed);
      return;
    }

    setDropEvents((current) =>
      current
        .map((item) => (item.id === eventId ? payload.event : item))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    setEditingDropId(null);
    setStatusMessage(t.dropUpdated);
  }

  async function handleDropEventDelete(eventId: string) {
    if (!window.confirm(t.confirmDeleteDrop)) return;

    const response = await fetch(`/api/admin/drop-events/${eventId}`, { method: "DELETE" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatusMessage(payload?.error || t.dropDeleteFailed);
      return;
    }

    setDropEvents((current) => current.filter((item) => item.id !== eventId));
    if (editingDropId === eventId) {
      setEditingDropId(null);
    }
    setStatusMessage(t.dropDeleted);
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
      setStatusMessage(payload?.error || t.aiPrecheckFailed);
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

  const filteredArtists = useMemo(() => {
    const query = artistQuery.trim().toLowerCase();
    return artists.filter((artist) => {
      const queryMatch =
        !query ||
        artist.name.toLowerCase().includes(query) ||
        artist.slug.toLowerCase().includes(query) ||
        artist.genres.toLowerCase().includes(query);
      const statusMatch = artistStatusFilter === "ALL" || artist.status === artistStatusFilter;
      const typeMatch = artistTypeFilter === "ALL" || artist.type === artistTypeFilter;
      const districtMatch = artistDistrictFilter === "ALL" || artist.district === artistDistrictFilter;
      const featuredMatch =
        artistFeaturedFilter === "ALL" ||
        (artistFeaturedFilter === "FEATURED" && artist.featured) ||
        (artistFeaturedFilter === "NON_FEATURED" && !artist.featured);

      return queryMatch && statusMatch && typeMatch && districtMatch && featuredMatch;
    });
  }, [artists, artistQuery, artistStatusFilter, artistTypeFilter, artistDistrictFilter, artistFeaturedFilter]);

  const totalArtistPages = Math.max(1, Math.ceil(filteredArtists.length / ARTISTS_PER_PAGE));
  const currentArtistPage = Math.min(artistPage, totalArtistPages);
  const pagedArtists = filteredArtists.slice((currentArtistPage - 1) * ARTISTS_PER_PAGE, currentArtistPage * ARTISTS_PER_PAGE);

  useEffect(() => {
    setArtistPage(1);
  }, [artistQuery, artistStatusFilter, artistTypeFilter, artistDistrictFilter, artistFeaturedFilter]);

  return (
    <section className="space-y-8">
      {statusMessage ? <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{statusMessage}</p> : null}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-xl font-semibold">{t.dropDayManager}</h2>
        <form onSubmit={handleCreateDropEvent} className="space-y-3">
          <input
            value={dropTitle}
            onChange={(event) => setDropTitle(event.target.value)}
            placeholder={t.dropTitle}
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
            placeholder={t.dropDescription}
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">{t.assignArtists}</p>
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
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">{t.createDrop}</button>
        </form>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{t.existingDrop}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {dropEvents.map((event) => (
              <article key={event.id} className="rounded-xl border border-slate-200 p-3">
                <p className="font-semibold">{event.title}</p>
                <p className="text-xs text-slate-600">
                  {new Date(event.date).toLocaleDateString(lang === "ms" ? "ms-MY" : "en-MY", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}
                </p>
                <p className="mt-1 text-sm text-slate-700">{event.description}</p>
                <p className="mt-2 text-xs text-slate-600">
                  {t.lineup}: {event.artists.map((a) => a.name).join(", ") || t.none}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href={withLang(`/drop/${event.id}`, lang)} className="inline-flex text-sm font-semibold text-brand-700 hover:text-brand-600">
                    {t.openPublic}
                  </Link>
                  <button
                    type="button"
                    onClick={() => (editingDropId === event.id ? setEditingDropId(null) : startEditingDropEvent(event))}
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    {editingDropId === event.id ? t.cancel : t.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDropEventDelete(event.id)}
                    className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700"
                  >
                    {t.delete}
                  </button>
                </div>

                {editingDropId === event.id ? (
                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                    <input
                      value={editingDropTitle}
                      onChange={(e) => setEditingDropTitle(e.target.value)}
                      placeholder={t.dropTitle}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="datetime-local"
                      value={editingDropDate}
                      onChange={(e) => setEditingDropDate(e.target.value)}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={editingDropDescription}
                      onChange={(e) => setEditingDropDescription(e.target.value)}
                      placeholder={t.dropDescription}
                      rows={3}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                    <div className="grid gap-2 rounded border border-slate-200 p-3">
                      {approvedArtists.map((artist) => (
                        <label key={artist.id} className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={editingDropArtistIds.includes(artist.id)}
                            onChange={() => toggleEditingDropArtistSelection(artist.id)}
                          />
                          <span>{artist.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDropEventUpdate(event.id)}
                        className="rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                      >
                        {t.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingDropId(null)}
                        className="rounded border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{t.grouped}</h2>
        {groupedSubmissions.map((group) => (
          <div key={group.type} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-lg font-semibold">{typeLabel(group.type)}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {group.statuses.map((bucket) => (
                <div key={`${group.type}-${bucket.status}`} className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold">
                    {statusLabel(bucket.status)} ({bucket.items.length})
                  </p>
                  <div className="space-y-2">
                    {bucket.items.length === 0 ? <p className="text-xs text-slate-500">{t.noItems}</p> : null}
                    {bucket.items.map((item) => (
                      <article key={item.id} className="space-y-1 rounded-lg bg-slate-50 p-2">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-slate-600">{getDistrictLabel(item.district)} · {item.genres}</p>
                        <p className="text-xs text-slate-600">
                          {item.submitTermsAcceptedAt
                            ? `Submit Music Terms: ${formatDateTime(item.submitTermsAcceptedAt)}`
                            : "Submit Music Terms: not accepted"}
                        </p>
                        {item.type === "LAUNCH_SUPPORT" ? (
                          <p className="text-xs text-slate-600">
                            {item.starterAgreementAcceptedAt
                              ? `${t.acceptedAt}: ${formatDateTime(item.starterAgreementAcceptedAt)}${
                                  item.starterAgreementVersion ? ` · ${t.version}: ${item.starterAgreementVersion}` : ""
                                }`
                              : t.agreementPending}
                          </p>
                        ) : null}
                        {aiInsights[item.id] ? (
                          <div className="rounded border border-brand-200 bg-brand-50 p-2 text-xs text-slate-700">
                            <p className="font-semibold">
                              {t.aiPackage}: {aiInsights[item.id].recommendedPackage}
                            </p>
                            <p className="mt-1">
                              {t.aiTags}: {aiInsights[item.id].tags.join(" · ") || t.manualFollowup}
                            </p>
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
                              {aiLoadingIds.includes(item.id) ? t.aiChecking : t.aiPrecheck}
                            </button>
                            <button
                              onClick={() => moderateSubmission(item.id, "approve")}
                              className="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white"
                            >
                              {t.approve}
                            </button>
                            <button
                              onClick={() => moderateSubmission(item.id, "reject")}
                              className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                            >
                              {t.reject}
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

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-xl font-semibold">{t.agreementRecords}</h2>
        {starterAgreementRecords.length === 0 ? (
          <p className="text-sm text-slate-500">{t.noItems}</p>
        ) : (
          <div className="grid gap-2">
            {starterAgreementRecords.map((artist) => (
              <div key={artist.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">{artist.name}</p>
                <p className="text-slate-600">
                  {t.acceptedAt}: {formatDateTime(artist.starterAgreementAcceptedAt || "")}
                </p>
                <p className="text-slate-600">
                  {t.version}: {artist.starterAgreementVersion || "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-xl font-semibold">{t.submitTermsRecords}</h2>
        {submitTermsRecords.length === 0 ? (
          <p className="text-sm text-slate-500">{t.noItems}</p>
        ) : (
          <div className="grid gap-2">
            {submitTermsRecords.map((artist) => (
              <div key={artist.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-semibold text-slate-900">{artist.name}</p>
                <p className="text-slate-600">
                  {t.acceptedAt}: {formatDateTime(artist.submitTermsAcceptedAt || "")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{t.manageArtists}</h2>
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-5">
          <input
            value={artistQuery}
            onChange={(event) => setArtistQuery(event.target.value)}
            placeholder={t.searchArtists}
            className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            value={artistStatusFilter}
            onChange={(event) => setArtistStatusFilter(event.target.value as ArtistItem["status"] | "ALL")}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">{t.filterStatus}: {t.all}</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {t.filterStatus}: {statusLabel(status)}
              </option>
            ))}
          </select>
          <select
            value={artistTypeFilter}
            onChange={(event) => setArtistTypeFilter(event.target.value as ArtistItem["type"] | "ALL")}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">{t.filterType}: {t.all}</option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {t.filterType}: {typeLabel(type)}
              </option>
            ))}
          </select>
          <select
            value={artistDistrictFilter}
            onChange={(event) => setArtistDistrictFilter(event.target.value as DistrictValue | "ALL")}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ALL">{t.filterDistrict}: {t.all}</option>
            {DISTRICT_OPTIONS.map((district) => (
              <option key={district.value} value={district.value}>
                {t.filterDistrict}: {district.label}
              </option>
            ))}
          </select>
          <select
            value={artistFeaturedFilter}
            onChange={(event) => setArtistFeaturedFilter(event.target.value as "ALL" | "FEATURED" | "NON_FEATURED")}
            className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          >
            {(["ALL", "FEATURED", "NON_FEATURED"] as const).map((item) => (
              <option key={item} value={item}>
                {t.filterFeatured}: {featuredFilterLabel(item)}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-end text-xs text-slate-600 md:col-span-3">
            {filteredArtists.length} {t.artistsFound}
          </div>
        </div>

        <div className="grid gap-4">
          {pagedArtists.length === 0 ? <p className="text-sm text-slate-600">{t.noArtistsMatch}</p> : null}
          {pagedArtists.map((artist) => (
            <div key={artist.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{artist.name}</p>
                  <p className="text-xs text-slate-500">
                    /{artist.slug} · {getDistrictLabel(artist.district)} · {artist.genres}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">{statusLabel(artist.status)}</span>
                  <button
                    type="button"
                    onClick={() => setEditingArtistId((current) => (current === artist.id ? null : artist.id))}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    {editingArtistId === artist.id ? t.closeEditor : t.editArtist}
                  </button>
                </div>
              </div>

              {editingArtistId === artist.id ? (
                <form onSubmit={(event) => handleArtistSave(event, artist.id)} className="space-y-3 border-t border-slate-200 pt-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <select name="type" defaultValue={artist.type} className="rounded border border-slate-300 px-3 py-2 text-sm">
                      <option value="NORMAL_LISTING">{lang === "ms" ? "SENARAI_BIASA" : "NORMAL_LISTING"}</option>
                      <option value="LAUNCH_SUPPORT">LAUNCH_SUPPORT</option>
                    </select>
                    <select
                      name="hasSongReleased"
                      defaultValue={artist.hasSongReleased ? "yes" : "no"}
                      className="rounded border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="yes">{lang === "ms" ? "Ada lagu sudah rilis" : "has_song_released: yes"}</option>
                      <option value="no">{lang === "ms" ? "Belum rilis lagu" : "has_song_released: no"}</option>
                    </select>
                    <input
                      name="contactWhatsapp"
                      defaultValue={artist.contactWhatsapp}
                      placeholder={lang === "ms" ? "WhatsApp untuk dihubungi" : "contact_whatsapp"}
                      className="rounded border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      name="uploadLinks"
                      defaultValue={artist.uploadLinks || ""}
                      placeholder={lang === "ms" ? "Link fail (opsyenal)" : "upload_links"}
                      className="rounded border border-slate-300 px-3 py-2 text-sm"
                    />

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
                    <input name="aiSummary" defaultValue={artist.aiSummary || ""} placeholder="AI Sound Signature" className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
                    <input name="topTrackUrl" defaultValue={artist.topTrackUrl || ""} placeholder="Top track URL" className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2" />
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
                    <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">{t.saveEdits}</button>
                    <button
                      type="button"
                      disabled={artist.status !== "APPROVED"}
                      onClick={() => toggleFeatured(artist.id, artist.featured)}
                      className="rounded-lg border border-brand-500 px-3 py-2 text-sm font-semibold text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {artist.featured ? t.removeFeatured : t.setFeatured}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <p>
            {t.page} {currentArtistPage} / {totalArtistPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentArtistPage <= 1}
              onClick={() => setArtistPage((current) => Math.max(1, current - 1))}
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
            >
              {t.prev}
            </button>
            <button
              type="button"
              disabled={currentArtistPage >= totalArtistPages}
              onClick={() => setArtistPage((current) => Math.min(totalArtistPages, current + 1))}
              className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
            >
              {t.next}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
