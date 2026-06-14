import Link from 'next/link';

function WordmarkIcon() {
  return (
    <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-navy">
      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
        <path
          d="M3 5h10M3 8h10M3 11h6"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="11" r="2.5" fill="#13B5EA" />
      </svg>
    </div>
  );
}

export default function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[62px] max-w-[1080px] items-center justify-between px-5 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
          <WordmarkIcon />
          <span className="text-base font-semibold tracking-tight">
            Silkview <span className="font-normal text-accent">Connect</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <a
            href="#how"
            className="hidden rounded-lg px-3.5 py-1.5 text-sm text-ink-2 transition-colors hover:text-ink sm:inline-block"
          >
            How it works
          </a>
          <a
            href="#pricing"
            className="hidden rounded-lg px-3.5 py-1.5 text-sm text-ink-2 transition-colors hover:text-ink sm:inline-block"
          >
            Pricing
          </a>
          <Link
            href="/support"
            className="hidden rounded-lg px-3.5 py-1.5 text-sm text-ink-2 transition-colors hover:text-ink sm:inline-block"
          >
            Support
          </Link>
          <Link
            href="/enterprise"
            className="hidden rounded-lg px-3.5 py-1.5 text-sm text-ink-2 transition-colors hover:text-ink sm:inline-block"
          >
            Enterprise
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg px-3.5 py-1.5 text-sm text-ink-2 transition-colors hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
