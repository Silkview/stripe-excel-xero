const features = [
  {
    title: 'Connect Stripe & Xero',
    description:
      'OAuth per workspace. Tokens encrypted with AES-256-GCM. Your Xero base currency detected automatically — no manual config required.',
    barColor: 'bg-stripe',
    iconBg: 'bg-stripe-light',
    icon: '⚡',
    chip: 'Stripe Connect OAuth',
    chipClass: 'bg-stripe-light text-stripe',
  },
  {
    title: 'Pull balance transactions',
    description:
      'Charges, refunds, payouts, and fees land on named Excel sheets. Filter by date range. Re-pull any time — sheets overwrite cleanly with fresh data.',
    barColor: 'bg-accent',
    iconBg: 'bg-[#EEF4FF]',
    icon: '📊',
    chip: 'Writes directly to Excel',
    chipClass: 'bg-[#EEF4FF] text-accent',
  },
  {
    title: 'Build & push to Xero',
    description:
      'Formula-driven journals and bank transactions from your balance data. Push as draft or posted. Row-level status writeback prevents double-posting.',
    barColor: 'bg-xero',
    iconBg: 'bg-xero-light',
    icon: '✅',
    chip: 'Xero API',
    chipClass: 'bg-xero-light text-xero-text',
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="px-5 py-20 sm:px-12">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-12">
          <p className="section-eyebrow mb-3.5">What it does</p>
          <h2 className="section-title mb-3">Connect. Pull. Build. Push.</h2>
          <p className="section-sub max-w-[480px]">
            A focused four-step workflow with your account mappings on a dedicated
            Excel sheet — no black boxes, no surprises in Xero.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="relative overflow-hidden rounded-lg border border-rule bg-bg p-7 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)]"
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 ${f.barColor}`} />
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] text-lg ${f.iconBg}`}
              >
                {f.icon}
              </div>
              <h3 className="mb-2.5 text-base font-semibold tracking-tight text-ink">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-2">{f.description}</p>
              <span
                className={`mt-4 inline-block rounded-md px-2.5 py-1 font-mono text-[11px] font-medium ${f.chipClass}`}
              >
                {f.chip}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
