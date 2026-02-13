"use client";

import { type Lang } from "@/lib/i18n";
import { FormEvent, useState } from "react";

export function AdminAuth({ lang, onAuthorized }: { lang: Lang; onAuthorized: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      setError(lang === "ms" ? "Kata laluan admin tidak sah" : "Invalid admin password");
      return;
    }

    onAuthorized();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{lang === "ms" ? "Akses Admin" : "Admin Access"}</h2>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder={lang === "ms" ? "Masukkan kata laluan admin" : "Enter admin password"}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button className="w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">
        {lang === "ms" ? "Log masuk" : "Sign in"}
      </button>
    </form>
  );
}
