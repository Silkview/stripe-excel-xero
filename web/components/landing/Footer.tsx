import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-4 border-t border-rule px-5 py-7 sm:flex-row sm:px-12">
      <span className="text-base font-semibold tracking-tight text-ink">
        Silkview <span className="font-normal text-accent">Connect</span>
      </span>
      <nav className="flex flex-wrap justify-center gap-5 text-sm text-ink-2">
        <Link href="/auth/login" className="hover:text-ink">
          Sign in
        </Link>
        <Link href="/auth/signup" className="hover:text-ink">
          Sign up
        </Link>
        <a href="mailto:support@silkview.com.au" className="hover:text-ink">
          Support
        </a>
      </nav>
    </footer>
  );
}
