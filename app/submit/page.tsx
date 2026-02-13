"use client";

import { Navbar } from "@/components/navbar";
import { DISTRICT_OPTIONS, type DistrictValue } from "@/lib/constants";
import { FormEvent, useEffect, useState } from "react";

const fields = ["spotifyUrl", "appleMusicUrl", "youtubeUrl", "coverImageUrl"] as const;

type FormState = {
  type: "normal_listing" | "launch_support";
  has_song_released: "yes" | "no";
  upload_links: string;
  contact_whatsapp: string;
  name: string;
  district: DistrictValue;
  genres: string;
  bio: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  youtubeUrl: string;
  coverImageUrl: string;
};

const defaultState: FormState = {
  type: "normal_listing",
  has_song_released: "no",
  upload_links: "",
  contact_whatsapp: "",
  name: "",
  district: DISTRICT_OPTIONS[0].value,
  genres: "",
  bio: "",
  spotifyUrl: "",
  appleMusicUrl: "",
  youtubeUrl: "",
  coverImageUrl: ""
};

export default function SubmitPage() {
  const [form, setForm] = useState<FormState>(defaultState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get("type");
    if (type === "launch_support") {
      setForm((current) => ({ ...current, type: "launch_support" }));
    }
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await response.json().catch(() => ({ error: "Submission failed" }));

    if (!response.ok) {
      setError(data.error || "Submission failed");
      setSubmitting(false);
      return;
    }

    const resetType = form.type;
    setForm({ ...defaultState, type: resetType });
    setSuccess(true);
    setSubmitting(false);
  }

  async function generateBioWithAi() {
    if (!form.name.trim() || !form.genres.trim()) {
      setAiError("Please fill artist name and genres first");
      return;
    }

    setAiLoading(true);
    setAiError("");

    const response = await fetch("/api/ai/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "bio_draft",
        payload: {
          name: form.name,
          district: form.district,
          genres: form.genres,
          type: form.type,
          has_song_released: form.has_song_released,
          existingBio: form.bio
        }
      })
    });

    const data = await response.json().catch(() => ({ error: "AI request failed" }));
    if (!response.ok) {
      setAiError(data.error || "AI request failed");
      setAiLoading(false);
      return;
    }

    setForm((current) => ({ ...current, bio: data.bio || current.bio }));
    setAiLoading(false);
  }

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submit Music</h1>
          <p className="text-slate-600">For Sabah artists/bands only. Submissions are stored as pending for admin review.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as FormState["type"] }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="normal_listing">normal_listing</option>
              <option value="launch_support">launch_support</option>
            </select>

            <select
              value={form.has_song_released}
              onChange={(event) => setForm((current) => ({ ...current, has_song_released: event.target.value as FormState["has_song_released"] }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="yes">has_song_released: yes</option>
              <option value="no">has_song_released: no</option>
            </select>
          </div>

          <input
            value={form.contact_whatsapp}
            onChange={(event) => setForm((current) => ({ ...current, contact_whatsapp: event.target.value }))}
            placeholder="contact_whatsapp"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />

          <input
            value={form.upload_links}
            onChange={(event) => setForm((current) => ({ ...current, upload_links: event.target.value }))}
            placeholder="upload_links (Google Drive/Dropbox URL, optional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <input
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Artist or band name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <select
            value={form.district}
            onChange={(event) => setForm((current) => ({ ...current, district: event.target.value as DistrictValue }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {DISTRICT_OPTIONS.map((district) => (
              <option key={district.value} value={district.value}>
                {district.label}
              </option>
            ))}
          </select>

          <input
            required
            value={form.genres}
            onChange={(event) => setForm((current) => ({ ...current, genres: event.target.value }))}
            placeholder="Genres (e.g. Indie, R&B)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <textarea
            required
            rows={5}
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            placeholder="Tell listeners about your sound, history, and latest releases"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generateBioWithAi}
              disabled={aiLoading}
              className="rounded-lg border border-brand-500 px-3 py-2 text-sm font-semibold text-brand-700 disabled:opacity-60"
            >
              {aiLoading ? "AI generating..." : "AI 帮我写简介"}
            </button>
            <p className="text-xs text-slate-500">AI 会生成草稿，你可以再手动修改。</p>
          </div>
          {aiError ? <p className="text-sm text-red-600">{aiError}</p> : null}

          {fields.map((key) => (
            <input
              key={key}
              value={form[key]}
              onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
              placeholder={
                key === "spotifyUrl"
                  ? "Spotify URL"
                  : key === "appleMusicUrl"
                    ? "Apple Music URL"
                    : key === "youtubeUrl"
                      ? "YouTube URL"
                      : "Cover image URL"
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          ))}

          <button disabled={submitting} className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-70">
            {submitting ? "Submitting..." : "Submit for review"}
          </button>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-brand-700">Submission received. Your profile is now pending admin approval.</p> : null}
        </form>
      </section>
    </main>
  );
}
