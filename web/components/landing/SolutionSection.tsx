const benefits = [
  {
    title: 'Live data, zero CSVs',
    description:
      'Pull real-time Stripe balances, payouts, and processing fees directly into Excel with a single click.',
    barColor: 'bg-stripe',
    iconBg: 'bg-stripe-light',
    icon: '⚡',
    chip: 'No more CSV exports',
    chipClass: 'bg-stripe-light text-stripe',
  },
  {
    title: 'Bulletproof audit trails',
    description:
      'Every transaction is cleanly mapped. Give your accountants and auditors exactly what they want — a transparent, line-by-line breakdown of where every cent went.',
    barColor: 'bg-accent',
    iconBg: 'bg-[#EEF4FF]',
    icon: '🔍',
    chip: 'Reviewable in Excel',
    chipClass: 'bg-[#EEF4FF] text-accent',
  },
  {
    title: 'Works where you work',
    description:
      'No new software to learn. Silkview Connect lives right inside your Excel ribbon on Mac, Windows, and the web.',
    barColor: 'bg-xero',
    iconBg: 'bg-xero-light',
    icon: '✅',
    chip: 'Mac · Windows · Web',
    chipClass: 'bg-xero-light text-xero-text',
  },
];

export default function SolutionSection() {
  return (
    <section id="features" className="px-5 py-20 sm:px-12">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-12">
          <p className="section-eyebrow mb-3.5">The solution</p>
          <h2 className="section-title mb-3">Meet Silkview Connect</h2>
          <p className="section-sub max-w-[640px]">
            A native Microsoft Excel add-in that bridges the gap between your
            payment gateway and your ledger. We bring your live financial data
            directly into your workbook, so you never have to wrestle with
            another raw CSV export again.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {benefits.map((b) => (
            <article
              key={b.title}
              className="relative overflow-hidden rounded-lg border border-rule bg-bg p-7 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)]"
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 ${b.barColor}`} />
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] text-lg ${b.iconBg}`}
              >
                {b.icon}
              </div>
              <h3 className="mb-2.5 text-base font-semibold tracking-tight text-ink">
                {b.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-2">{b.description}</p>
              <span
                className={`mt-4 inline-block rounded-md px-2.5 py-1 font-mono text-[11px] font-medium ${b.chipClass}`}
              >
                {b.chip}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
