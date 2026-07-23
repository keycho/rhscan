import Link from "next/link";
import { PofMark } from "@/components/ui";

export const INDEPENDENCE_NOTICE =
  "proof of flywheel is independent and is not affiliated with or endorsed by pump.fun. creator fees must be claimed on pump.fun separately — pof only routes SOL that a verified creator deposits. token performance, liquidity and returns are never guaranteed.";

export const SEED_NOTICE =
  "proof of flywheel never requests seed phrases or private keys.";

export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav className={className}>
      <Link href="/terms" className="px-1.5 text-2xs text-muted transition hover:text-accent">
        [ terms ]
      </Link>
      <Link href="/privacy" className="px-1.5 text-2xs text-muted transition hover:text-accent">
        [ privacy ]
      </Link>
      <Link href="/risks" className="px-1.5 text-2xs text-muted transition hover:text-accent">
        [ risk disclosure ]
      </Link>
      <Link href="/#docs" className="px-1.5 text-2xs text-muted transition hover:text-accent">
        [ docs ]
      </Link>
    </nav>
  );
}

export function LegalFooter() {
  return (
    <footer className="border-t border-line bg-panel">
      <div className="mx-auto max-w-page px-4 py-5">
        <LegalLinks className="flex flex-wrap" />
        <p className="mt-3 max-w-2xl text-3xs leading-4 text-faint">{INDEPENDENCE_NOTICE}</p>
        <p className="mt-1 text-3xs leading-4 text-faint">{SEED_NOTICE}</p>
        <p className="mt-2 text-3xs text-faint">© 2026 proof of flywheel · deposit. route. verify.</p>
      </div>
    </footer>
  );
}

export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalShell({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex h-14 max-w-page items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 text-accent">
            <PofMark size={20} />
            <span className="text-sm font-bold lowercase text-text">
              proof of flywheel<span className="text-accent">_</span>
            </span>
          </Link>
          <div className="flex-1" />
          <Link href="/" className="text-xs text-secondary transition hover:text-accent">
            [ back to app ]
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold lowercase text-accent">{title}</h1>
        <p className="mt-1 text-3xs text-faint">last updated · {updated}</p>
        <div className="mt-8 space-y-7">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-sm font-bold lowercase text-amber">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-2 text-xs leading-5 text-secondary">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
