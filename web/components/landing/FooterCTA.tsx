import Link from 'next/link';

export default function FooterCTA() {
  return (
    <section className="bg-navy px-5 py-20 sm:px-12">
      <div className="mx-auto max-w-[720px] text-center">
        <h2 className="font-serif text-[clamp(2rem,4.5vw,3rem)] font-normal leading-[1.15] tracking-tight text-white">
          Get 10 hours back this month.
        </h2>
        <p className="mx-auto mt-5 max-w-[520px] text-lg font-light leading-relaxed text-white/70">
          Stop formatting spreadsheets and start analyzing your business.
          Connect your ledger today.
        </p>
        <div className="mt-9 flex justify-center">
          <Link
            href="/auth/signup"
            className="rounded-[10px] bg-accent px-7 py-3.5 text-[15px] font-medium text-white transition-all hover:-translate-y-px hover:bg-accent-hover hover:shadow-lift"
          >
            Create your free account
          </Link>
        </div>
        <p className="mt-4 text-[13px] text-white/50">
          No credit card required. Setup in under 5 minutes.
        </p>
      </div>
    </section>
  );
}
