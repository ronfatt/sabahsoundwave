import { Navbar } from "@/components/navbar";
import Link from "next/link";

const packages = [
  {
    name: "Starter",
    description: "Best for first-time releases. We help shape your artist profile and cleanly present your first songs.",
    bullets: ["Profile setup guidance", "Release checklist", "Basic promo planning"]
  },
  {
    name: "Pro",
    description: "For active Sabah artists who want stronger rollout and audience growth support.",
    bullets: ["Everything in Starter", "Campaign planning support", "Priority feature consideration"]
  },
  {
    name: "Label",
    description: "For teams or collectives handling multiple artists and regular releases.",
    bullets: ["Multi-artist launch coordination", "Release pipeline support", "Longer-term roadmap discussion"]
  }
];

export default function LaunchSupportPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-6">
        <div className="space-y-3 rounded-2xl bg-slate-900 p-6 text-white">
          <p className="text-sm uppercase tracking-wide text-brand-100">Sabah Artist Growth</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Launch Support</h1>
          <p className="max-w-3xl text-sm text-slate-200 md:text-base">
            If you are a Sabah artist and need help launching your music, pick a support package and apply. No payment is collected yet.
          </p>
          <Link
            href="/submit?type=launch_support"
            className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Apply for Launch Support
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((item) => (
            <article key={item.name} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">{item.name}</h2>
              <p className="text-sm text-slate-700">{item.description}</p>
              <ul className="space-y-1 text-sm text-slate-600">
                {item.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
