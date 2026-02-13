import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/artists", label: "Artists" },
  { href: "/launch-support", label: "Launch Support" },
  { href: "/submit", label: "Submit Music" },
  { href: "/admin", label: "Admin" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="text-base font-bold tracking-tight text-brand-700 md:text-lg">
          Sabah Soundwave
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium text-slate-700 md:gap-6">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-brand-600">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
