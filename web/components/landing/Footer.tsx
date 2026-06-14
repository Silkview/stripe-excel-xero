import Link from 'next/link';
import {
  PRIVACY_PATH,
  ENTERPRISE_PATH,
  SUPPORT_EMAIL,
  SUPPORT_GUIDE_PATH,
  TERMS_PATH,
  supportMailtoUrl,
} from '@/lib/support';

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
        <Link href={PRIVACY_PATH} className="hover:text-ink">
          Privacy
        </Link>
        <Link href={TERMS_PATH} className="hover:text-ink">
          Terms
        </Link>
        <Link href={SUPPORT_GUIDE_PATH} className="hover:text-ink">
          User guide
        </Link>
        <Link href={ENTERPRISE_PATH} className="hover:text-ink">
          Enterprise
        </Link>
        <a
          href={supportMailtoUrl()}
          className="hover:text-ink"
          aria-label={`Contact ${SUPPORT_EMAIL}`}
        >
          Contact us
        </a>
      </nav>
    </footer>
  );
}
