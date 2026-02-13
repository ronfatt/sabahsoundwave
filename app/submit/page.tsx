"use client";

import { Navbar } from "@/components/navbar";
import { DISTRICT_OPTIONS, type DistrictValue } from "@/lib/constants";
import { parseLang } from "@/lib/i18n";
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
  const [lang, setLang] = useState<"en" | "ms">("en");
  const [form, setForm] = useState<FormState>(defaultState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLang(parseLang(params.get("lang")));

    const type = params.get("type");
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
      setAiError(lang === "ms" ? "Sila isi nama artis dan genre dahulu." : "Please fill artist name and genres first.");
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

    const data = await response.json().catch(() => ({ error: lang === "ms" ? "Permintaan AI gagal." : "AI request failed" }));
    if (!response.ok) {
      setAiError(data.error || (lang === "ms" ? "Permintaan AI gagal." : "AI request failed"));
      setAiLoading(false);
      return;
    }

    setForm((current) => ({ ...current, bio: data.bio || current.bio }));
    setAiLoading(false);
  }

  const t = {
    title: lang === "ms" ? "Hantar Muzik" : "Submit Music",
    desc:
      lang === "ms"
        ? "Khas untuk artis/band Sabah sahaja. Semua hantaran masuk sebagai pending untuk semakan admin."
        : "For Sabah artists/bands only. Submissions are stored as pending for admin review.",
    typeNormal: lang === "ms" ? "Senarai biasa" : "Normal listing",
    typeLaunch: lang === "ms" ? "Launch support" : "Launch support",
    releasedYes: lang === "ms" ? "Ada lagu sudah rilis" : "Has song released: yes",
    releasedNo: lang === "ms" ? "Belum rilis lagu" : "Has song released: no",
    whatsapp: lang === "ms" ? "WhatsApp untuk dihubungi" : "Contact WhatsApp",
    uploads: lang === "ms" ? "Link fail (Google Drive/Dropbox, opsyenal)" : "Upload links (Google Drive/Dropbox URL, optional)",
    name: lang === "ms" ? "Nama artis atau band" : "Artist or band name",
    genres: lang === "ms" ? "Genre (contoh: Indie, R&B)" : "Genres (e.g. Indie, R&B)",
    bio: lang === "ms" ? "Ceritakan bunyi muzik, latar belakang, dan rilisan terbaru anda" : "Tell listeners about your sound, history, and latest releases",
    aiButtonIdle: lang === "ms" ? "AI bantu tulis bio" : "AI write my bio",
    aiButtonLoading: lang === "ms" ? "AI sedang jana..." : "AI generating...",
    aiHint: lang === "ms" ? "AI akan hasilkan draf, anda boleh edit semula." : "AI will generate a draft that you can edit.",
    submitIdle: lang === "ms" ? "Hantar untuk semakan" : "Submit for review",
    submitLoading: lang === "ms" ? "Menghantar..." : "Submitting...",
    success: lang === "ms" ? "Hantaran diterima. Profil anda kini menunggu kelulusan admin." : "Submission received. Your profile is now pending admin approval."
  };

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 md:px-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-slate-600">{t.desc}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as FormState["type"] }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="normal_listing">{t.typeNormal}</option>
              <option value="launch_support">{t.typeLaunch}</option>
            </select>

            <select
              value={form.has_song_released}
              onChange={(event) => setForm((current) => ({ ...current, has_song_released: event.target.value as FormState["has_song_released"] }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="yes">{t.releasedYes}</option>
              <option value="no">{t.releasedNo}</option>
            </select>
          </div>

          <input
            value={form.contact_whatsapp}
            onChange={(event) => setForm((current) => ({ ...current, contact_whatsapp: event.target.value }))}
            placeholder={t.whatsapp}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />

          <input
            value={form.upload_links}
            onChange={(event) => setForm((current) => ({ ...current, upload_links: event.target.value }))}
            placeholder={t.uploads}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <input
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder={t.name}
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
            placeholder={t.genres}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <textarea
            required
            rows={5}
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            placeholder={t.bio}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generateBioWithAi}
              disabled={aiLoading}
              className="rounded-lg border border-brand-500 px-3 py-2 text-sm font-semibold text-brand-700 disabled:opacity-60"
            >
              {aiLoading ? t.aiButtonLoading : t.aiButtonIdle}
            </button>
            <p className="text-xs text-slate-500">{t.aiHint}</p>
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
            {submitting ? t.submitLoading : t.submitIdle}
          </button>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-brand-700">{t.success}</p> : null}
        </form>
      </section>
    </main>
  );
}
