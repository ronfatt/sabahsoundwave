"use client";

import { Navbar } from "@/components/navbar";
import { DISTRICT_OPTIONS, type DistrictValue } from "@/lib/constants";
import { parseLang } from "@/lib/i18n";
import {
  STARTER_AGREEMENT_PARAGRAPHS,
  STARTER_AGREEMENT_TITLE,
  STARTER_AGREEMENT_VERSION
} from "@/lib/starter-agreement";
import { SUBMIT_MUSIC_TERMS, SUBMIT_MUSIC_TERMS_TITLE } from "@/lib/submit-music-terms";
import { FormEvent, useEffect, useState } from "react";

const fields = ["topTrackUrl", "spotifyUrl", "appleMusicUrl", "youtubeUrl", "coverImageUrl"] as const;

type FormState = {
  type: "normal_listing" | "launch_support";
  has_song_released: "yes" | "no";
  upload_links: string;
  contact_whatsapp: string;
  name: string;
  district: DistrictValue;
  genres: string;
  bio: string;
  aiSummary: string;
  topTrackUrl: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  youtubeUrl: string;
  coverImageUrl: string;
  starterAgreementAccepted: boolean;
  starterAgreementVersion: string;
  submitTermsAccepted: boolean;
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
  aiSummary: "",
  topTrackUrl: "",
  spotifyUrl: "",
  appleMusicUrl: "",
  youtubeUrl: "",
  coverImageUrl: "",
  starterAgreementAccepted: false,
  starterAgreementVersion: STARTER_AGREEMENT_VERSION,
  submitTermsAccepted: false
};

export default function SubmitPage() {
  const [lang, setLang] = useState<"en" | "ms">("en");
  const [form, setForm] = useState<FormState>(defaultState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLang(parseLang(params.get("lang")));

    const type = params.get("type");
    if (type === "launch_support") {
      setForm((current) => ({ ...current, type: "launch_support" }));
    }
  }, []);

  async function submitApplication() {
    setSubmitting(true);
    setError("");
    setSuccess(false);

    const payload = {
      ...form,
      submitTermsAccepted: form.submitTermsAccepted,
      starterAgreementAccepted: form.type === "launch_support" ? agreementChecked : false,
      starterAgreementVersion: form.type === "launch_support" ? STARTER_AGREEMENT_VERSION : ""
    };

    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({ error: "Submission failed" }));

    if (!response.ok) {
      setError(data.error || "Submission failed");
      setSubmitting(false);
      return;
    }

    const resetType = form.type;
    setForm({ ...defaultState, type: resetType });
    setAgreementChecked(false);
    setShowAgreementModal(false);
    setSuccess(true);
    setSubmitting(false);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.submitTermsAccepted) {
      setError(
        lang === "ms"
          ? "Sila setuju dengan Submit Music Terms sebelum hantar."
          : "Please agree to the Submit Music Terms before submitting."
      );
      return;
    }
    if (form.type === "launch_support" && !agreementChecked) {
      setShowAgreementModal(true);
      return;
    }
    await submitApplication();
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
    aiSummary:
      lang === "ms"
        ? "AI Sound Signature (opsyenal)"
        : "AI Sound Signature (optional)",
    aiButtonIdle: lang === "ms" ? "AI bantu tulis bio" : "AI write my bio",
    aiButtonLoading: lang === "ms" ? "AI sedang jana..." : "AI generating...",
    aiHint: lang === "ms" ? "AI akan hasilkan draf, anda boleh edit semula." : "AI will generate a draft that you can edit.",
    submitIdle: lang === "ms" ? "Hantar untuk semakan" : "Submit for review",
    submitLoading: lang === "ms" ? "Menghantar..." : "Submitting...",
    success: lang === "ms" ? "Hantaran diterima. Profil anda kini menunggu kelulusan admin." : "Submission received. Your profile is now pending admin approval.",
    submitTermsAgree:
      lang === "ms"
        ? "Saya setuju dengan Submit Music Terms."
        : "I agree to the Submit Music Terms."
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
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as FormState["type"]
                }))
              }
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

          {form.type === "launch_support" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {lang === "ms"
                ? "Starter Support Agreement wajib disahkan sebelum penghantaran akhir."
                : "Starter Support Agreement confirmation is required before final submission."}
            </div>
          ) : null}

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
                  : key === "topTrackUrl"
                    ? "Top track URL (Listen button)"
                  : key === "appleMusicUrl"
                    ? "Apple Music URL"
                    : key === "youtubeUrl"
                      ? "YouTube URL"
                      : "Cover image URL"
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          ))}

          <input
            value={form.aiSummary}
            onChange={(event) => setForm((current) => ({ ...current, aiSummary: event.target.value }))}
            placeholder={t.aiSummary}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />

          <details className="rounded-lg border border-slate-300 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">
              {SUBMIT_MUSIC_TERMS_TITLE}
            </summary>
            <div className="mt-3 space-y-3 text-sm text-slate-700">
              {SUBMIT_MUSIC_TERMS.map((item) => (
                <div key={item.heading}>
                  <p className="font-semibold">{item.heading}</p>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </details>

          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.submitTermsAccepted}
              onChange={(event) =>
                setForm((current) => ({ ...current, submitTermsAccepted: event.target.checked }))
              }
              className="mt-1 h-4 w-4"
              required
            />
            <span>{t.submitTermsAgree}</span>
          </label>

          <button disabled={submitting} className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-70">
            {submitting ? t.submitLoading : t.submitIdle}
          </button>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-brand-700">{t.success}</p> : null}
        </form>

        {showAgreementModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
              <div className="border-b border-slate-700 px-5 py-4">
                <h2 className="text-xl font-bold text-slate-100">{STARTER_AGREEMENT_TITLE}</h2>
                <p className="text-xs text-slate-400">{STARTER_AGREEMENT_VERSION}</p>
              </div>
              <div className="max-h-[55vh] space-y-3 overflow-y-auto px-5 py-4">
                {STARTER_AGREEMENT_PARAGRAPHS.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-6 text-slate-200">
                    {paragraph}
                  </p>
                ))}
                <a
                  href="/api/contracts/starter-support-agreement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-lg border border-brand-400/60 px-3 py-2 text-sm font-semibold text-brand-200 hover:border-brand-300 hover:text-brand-100"
                >
                  {lang === "ms" ? "Muat turun PDF kontrak" : "Download contract PDF"}
                </a>
              </div>
              <div className="space-y-3 border-t border-slate-700 px-5 py-4">
                <label className="flex items-start gap-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={agreementChecked}
                    onChange={(event) => setAgreementChecked(event.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    {lang === "ms"
                      ? "Saya telah membaca dan bersetuju dengan Starter Support Agreement"
                      : "I have read and agree to the Starter Support Agreement"}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAgreementModal(false)}
                    className="rounded-lg border border-slate-500 px-3 py-2 text-sm font-semibold text-slate-200"
                  >
                    {lang === "ms" ? "Kembali" : "Back"}
                  </button>
                  <button
                    type="button"
                    disabled={!agreementChecked || submitting}
                    onClick={submitApplication}
                    className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting
                      ? lang === "ms"
                        ? "Memproses..."
                        : "Processing..."
                      : lang === "ms"
                        ? "Teruskan ke pengesahan"
                        : "Continue to confirmation"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
