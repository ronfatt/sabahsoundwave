import { LaunchReadinessCheck } from "@/components/launch-readiness-check";
import { Navbar } from "@/components/navbar";
import { parseLang, withLang } from "@/lib/i18n";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Launch Support"
};

export default async function LaunchSupportPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang: langParam } = await searchParams;
  const lang = parseLang(langParam);

  const packages =
    lang === "ms"
      ? [
          {
            name: "Starter",
            description: "Sesuai untuk artis rilis pertama. Kami bantu kemaskan profil dan paparan lagu pertama anda.",
            bullets: [
              "Panduan distribution (Spotify / Apple / YouTube)",
              "AI-assisted bio positioning",
              "Perancangan release timeline",
              "Template strategi promosi",
              "Kelayakan untuk Drop Day"
            ],
            status: "Currently Open",
            highlight: true,
            price: "RM199 (placeholder)"
          },
          {
            name: "Pro",
            description: "Untuk artis Sabah yang aktif dan mahu pelancaran lebih kuat serta pertumbuhan audiens.",
            bullets: ["Semua dalam Starter", "Sokongan perancangan kempen", "Pertimbangan priority featured"],
            status: "Invitation Only",
            highlight: false,
            price: "Contact us"
          },
          {
            name: "Label",
            description: "Untuk pasukan atau kolektif yang urus ramai artis dan rilis berkala.",
            bullets: ["Koordinasi pelancaran multi-artis", "Sokongan pipeline rilis", "Perbincangan roadmap jangka panjang"],
            status: "By Partnership",
            highlight: false,
            price: "Partnership"
          }
        ]
      : [
          {
            name: "Starter",
            description: "Best for first-time releases. We help shape your artist profile and cleanly present your first songs.",
            bullets: [
              "Distribution guidance (Spotify / Apple / YouTube)",
              "AI-assisted bio positioning",
              "Release timeline planning",
              "Promo strategy template",
              "Drop Day eligibility"
            ],
            status: "Currently Open",
            highlight: true,
            price: "RM199 (placeholder)"
          },
          {
            name: "Pro",
            description: "For active Sabah artists who want stronger rollout and audience growth support.",
            bullets: ["Everything in Starter", "Campaign planning support", "Priority feature consideration"],
            status: "Invitation Only",
            highlight: false,
            price: "Contact us"
          },
          {
            name: "Label",
            description: "For teams or collectives handling multiple artists and regular releases.",
            bullets: ["Multi-artist launch coordination", "Release pipeline support", "Longer-term roadmap discussion"],
            status: "By Partnership",
            highlight: false,
            price: "Partnership"
          }
        ];

  const steps =
    lang === "ms"
      ? [
          { title: "1. Hantar maklumat", body: "Isi borang ringkas tentang muzik, genre dan matlamat launch anda." },
          { title: "2. Semakan + readiness", body: "Kami semak profil anda dan bantu susun keutamaan launch." },
          { title: "3. Jalankan pelan", body: "Terbitkan lagu, jalankan promosi, dan optimakan discovery di Sabah Soundwave." }
        ]
      : [
          { title: "1. Submit your details", body: "Fill a short form about your music, genre, and launch goals." },
          { title: "2. Review + readiness", body: "We review your profile and help prioritize launch actions." },
          { title: "3. Execute your plan", body: "Release the track, run promotion, and optimize discovery on Sabah Soundwave." }
        ];

  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-6">
        <div className="space-y-3 rounded-2xl bg-slate-900 p-6 text-white">
          <p className="text-sm uppercase tracking-wide text-brand-100">{lang === "ms" ? "Pertumbuhan Artis Sabah" : "Sabah Artist Growth"}</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Launch Support</h1>
          <p className="max-w-3xl text-sm text-slate-200 md:text-base">
            {lang === "ms"
              ? "Jika anda artis Sabah dan perlukan bantuan melancarkan muzik, pilih pakej sokongan dan mohon. Tiada bayaran dikutip buat masa ini."
              : "If you are a Sabah artist and need help launching your music, pick a support package and apply. No payment is collected yet."}
          </p>
          <Link href={withLang("/submit?type=launch_support", lang)} className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            {lang === "ms" ? "Mohon Launch Support" : "Apply for Launch Support"}
          </Link>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-100">{lang === "ms" ? "How It Works" : "How It Works"}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <h3 className="text-lg font-semibold text-slate-100">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((item) => (
            <article
              key={item.name}
              className={`space-y-3 rounded-2xl p-5 shadow-sm ${
                item.highlight
                  ? "border-2 border-brand-400/70 bg-[radial-gradient(circle_at_top_left,rgba(0,245,160,0.16),transparent_45%),linear-gradient(180deg,#0b1120_0%,#111827_100%)] shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
                  : "border border-slate-700 bg-slate-900/70"
              }`}
            >
              <p
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  item.highlight ? "bg-brand-500/20 text-brand-200" : "bg-slate-800 text-slate-300"
                }`}
              >
                {item.highlight
                  ? lang === "ms"
                    ? "Currently Open / Most Popular"
                    : "Currently Open / Most Popular"
                  : item.status}
              </p>
              <h2 className="text-2xl font-semibold text-slate-100">{item.name}</h2>
              <p className="text-sm font-semibold text-brand-200">{item.price}</p>
              <p className="text-sm text-slate-300">{item.description}</p>
              <ul className="space-y-1 text-sm text-slate-300">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
              {item.name === "Starter" ? (
                <details className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-brand-200">
                    {lang === "ms" ? "Sample Launch Plan (Preview)" : "Sample Launch Plan (Preview)"}
                  </summary>
                  <ol className="mt-2 space-y-1 text-sm text-slate-300">
                    <li>1. Week 1: finalize track links + press angle.</li>
                    <li>2. Week 2: teaser clips + district-focused outreach.</li>
                    <li>3. Week 3: release day push + creator/community reposts.</li>
                    <li>4. Week 4: post-launch recap + next drop planning.</li>
                  </ol>
                </details>
              ) : null}
            </article>
          ))}
        </div>

        <LaunchReadinessCheck lang={lang} />
      </section>
    </main>
  );
}
