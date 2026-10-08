import Link from "next/link";

export function SiteHeader({ animate = false }: { animate?: boolean }) {
  return (
    <header className="bg-tarmac text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="font-display text-2xl font-bold tracking-wide">
          Ridgeline<span className="font-medium text-white/60"> Motor Park</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/#experiences" className="hidden hover:underline sm:inline">Experiences</Link>
          <Link href="/#groups" className="hidden hover:underline sm:inline">Groups</Link>
          <Link href="/book" className="rounded-[3px] bg-kerb px-4 py-2 font-display text-base font-semibold tracking-wide hover:bg-[#A50F27]">
            Book a session
          </Link>
        </nav>
      </div>
      <div className={`kerb h-2 ${animate ? "kerb-load" : ""}`} />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-steel sm:flex-row sm:justify-between">
        <p>Ridgeline Motor Park is a fictional venue. This site is a working portfolio demo.</p>
        <p>
          <a className="underline" href="/admin">Staff sign-in</a>
        </p>
      </div>
    </footer>
  );
}
