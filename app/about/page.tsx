import { Navbar } from "@/components/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Sabah Soundwave"
};

export default function AboutPage() {
  return (
    <main>
      <Navbar />
      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 md:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div
            className="relative h-52 w-full bg-cover bg-center md:h-72"
            style={{ backgroundImage: "url('/about/about-vision-16x9.jpg')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-slate-950/80" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,6,23,0.55)_100%)]" />
          </div>
        </div>

        <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Why Sabah Soundwave Exists</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 md:text-5xl">Why Sabah Soundwave Exists</h1>

          <div className="space-y-4 text-slate-300">
            <p>Sabah Soundwave was not created because the market needed another platform.</p>
            <p>It was created because Sabah needed a home.</p>
            <p>
              For years, I have travelled across Sabah and even Sarawak, watching how small music communities grew into internationally recognized festivals.
              I have seen how local stages transformed into global movements.
            </p>
            <p>
              And yet, in Sabah, I kept seeing something different. I met talented musicians holding simple guitars in small towns, writing beautiful songs
              that only a handful of people would ever hear.
            </p>
            <p>
              I saw young bands upload a few songs to YouTube, receive little traction, and slowly give up. Not because they lacked talent. But because they
              lacked structure, visibility, and support.
            </p>
            <p>Sabah Soundwave exists to change that.</p>
          </div>

          <h2 className="pt-2 text-2xl font-bold text-slate-100">A Home Before A Stage</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              This platform is built so that when someone clicks Sabah Soundwave, they don’t have to search through global noise. They immediately hear Sabah.
              All Sabah.
            </p>
            <p>
              AI helps listeners discover artists based on the sounds they already love. Artists don’t need complicated systems to share their work. If they
              simply want to share, they can.
            </p>
            <p>
              If they want to release properly, we guide them. If they want better arrangement or mixing, we connect them with collaborators. If they want
              distribution, we support that too. And if they are ready for bigger stages, we help open those doors.
            </p>
          </div>

          <h2 className="pt-2 text-2xl font-bold text-slate-100">Not Just Exposure — Structure</h2>
          <div className="space-y-4 text-slate-300">
            <p>Sabah Soundwave is not here to promise fame. It is here to provide structure.</p>
            <p>
              Low-cost access to AI-assisted arrangement support, mixing partners, release guidance, distribution assistance, and industry connections.
            </p>
            <p>So that even with minimal resources, a good song can still become a properly launched release.</p>
          </div>

          <h2 className="pt-2 text-2xl font-bold text-slate-100">Why Build Something That May Not Make Money?</h2>
          <div className="space-y-4 text-slate-300">
            <p>Because movements are not built by profit first. They are built by belief.</p>
            <p>Sabah has talent. Sabah has stories. Sabah has sound.</p>
            <p>What it lacked was a centralized home. Sabah Soundwave is that home.</p>
            <p className="font-semibold text-brand-200">Built in Sabah. For Sabah.</p>
            <p>
              This is not about competing with global platforms. It is about strengthening our own.
              <br />
              One State.
              <br />
              One Sound.
              <br />
              One Wave.
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-night-900 via-night-800 to-night-700">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-[260px] md:min-h-[420px]">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/about/founder-portrait-16x9.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-slate-950/45 to-slate-950/90" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_52%,rgba(2,6,23,0.52)_100%)]" />
            </div>

            <div className="space-y-4 p-6 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Founder Note</p>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">Sabah deserves its own stage.</h2>
              <p className="text-sm leading-7 text-slate-300">
                Sabah Soundwave started from years of seeing how great songs in Sabah could disappear without proper structure, visibility, and support.
                The mission is to make discovery and release support practical for local artists, not complicated.
              </p>
              <p className="text-sm leading-7 text-slate-300">
                We focus on building an ecosystem where artists can share, launch, collaborate, and grow with a Sabah-first foundation while still reaching
                wider audiences over time.
              </p>
              <p className="pt-2 text-sm font-semibold text-slate-200">Founder · RONMERAKI Studio</p>
              <p className="text-sm italic text-brand-200">“Movement starts local. Impact goes global.”</p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
