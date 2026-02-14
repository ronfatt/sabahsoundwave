import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-14 border-t border-slate-800/80 bg-slate-950/55">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
        <div className="grid gap-6 text-sm text-slate-400 md:grid-cols-4">
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300/90">Brand</h2>
            <p className="max-w-xs text-xs leading-6 text-slate-400/85">
              Sabah Soundwave curates Sabah-only artists and original releases.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300/90">Explore</h2>
            <nav className="space-y-1 text-xs">
              <p><Link href="/" className="hover:text-brand-300">Home</Link></p>
              <p><Link href="/artists" className="hover:text-brand-300">Artists</Link></p>
              <p><Link href="/launch-support" className="hover:text-brand-300">Drop Day & Launch</Link></p>
            </nav>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300/90">Community</h2>
            <nav className="space-y-1 text-xs">
              <p><Link href="/submit" className="hover:text-brand-300">Submit Music</Link></p>
              <p><Link href="/launch-support" className="hover:text-brand-300">Launch Support</Link></p>
              <p><Link href="/admin" className="hover:text-brand-300">Admin</Link></p>
            </nav>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300/90">Legal</h2>
            <nav className="space-y-1 text-xs">
              <p><Link href="/submit" className="hover:text-brand-300">Submit Music Terms</Link></p>
              <p>
                <a
                  href="/api/contracts/starter-support-agreement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-300"
                >
                  Starter Agreement (PDF)
                </a>
              </p>
            </nav>
          </section>
        </div>

        <p className="mt-6 border-t border-slate-800/80 pt-4 text-center text-[11px] text-slate-500/85">
          Sabah Soundwave is an initiative by RONMERAKI Studio.
        </p>
      </div>
    </footer>
  );
}
