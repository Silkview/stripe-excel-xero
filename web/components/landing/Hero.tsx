import Link from 'next/link';
import { trialHeroLabel } from '@/lib/plans/trial';

const metaItems = [
  trialHeroLabel(),
  'Excel on Mac, Windows & web',
  'AUD · single currency per workspace',
  'Tokens encrypted at rest',
];

export default function Hero() {
  return (
    <section className="gradient-hero border-b border-rule">
      <div className="mx-auto max-w-[900px] px-5 py-20 text-center sm:px-10 sm:py-24">
        <p className="mb-9 inline-flex items-center gap-2 rounded-full border border-rule bg-surface px-3.5 py-1.5 text-[13px] font-medium text-ink-2 shadow-card">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EEF4FF] text-[11px]">
            ✦
          </span>
          Built for Xero bookkeepers &amp; accounting firms
        </p>
        <h1 className="font-serif text-[clamp(2.375rem,5.5vw,4rem)] font-normal leading-[1.12] tracking-tight text-ink">
          Stop drowning in
          <br />
          <em className="text-accent">month-end reconciliation.</em>
        </h1>
        <p className="mx-auto mt-5 max-w-[620px] text-lg font-light leading-relaxed text-ink-2">
          Connect Stripe and Xero directly to Microsoft Excel. Sync live payout
          data, eliminate messy CSV exports, and build{' '}
          <strong className="font-medium text-ink">
            bulletproof audit trails
          </strong>{' '}
          inside the spreadsheet you already use.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/signup"
            className="rounded-[10px] bg-accent px-7 py-3.5 text-[15px] font-medium text-white transition-all hover:-translate-y-px hover:bg-accent-hover hover:shadow-lift"
          >
            Start syncing for free
          </Link>
          <Link
            href="#how"
            className="rounded-[10px] border border-rule bg-surface px-7 py-3.5 text-[15px] text-ink transition-colors hover:border-[#C5CBDA] hover:bg-bg"
          >
            See how it works →
          </Link>
        </div>
        <p className="mt-4 text-[13px] text-ink-3">
          Join our private beta. Setup takes under 5 minutes.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-0 text-[13px] text-ink-3 max-sm:flex-col max-sm:gap-1.5">
          {metaItems.map((item, i) => (
            <span
              key={item}
              className={`px-3.5 max-sm:border-0 ${
                i < metaItems.length - 1 ? 'border-r border-rule max-sm:border-0' : ''
              }`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
