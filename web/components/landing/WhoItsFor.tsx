const personas = [
  {
    title: 'Accountants & bookkeepers',
    body: 'Standardize your client reconciliation process. Stop chasing clients for Stripe login access and get the exact data you need, formatted perfectly in Excel.',
    accent: 'bg-xero',
    iconBg: 'bg-xero-light',
    icon: '📒',
  },
  {
    title: 'SaaS & e-commerce founders',
    body: 'Get clear visibility into your true revenue, processing costs, and cash flow without needing a degree in accounting.',
    accent: 'bg-stripe',
    iconBg: 'bg-stripe-light',
    icon: '🚀',
  },
  {
    title: 'Finance teams',
    body: 'Build reliable, repeatable month-end reporting models that update automatically.',
    accent: 'bg-accent',
    iconBg: 'bg-[#EEF4FF]',
    icon: '📈',
  },
];

export default function WhoItsFor() {
  return (
    <section className="border-t border-rule px-5 py-20 sm:px-12">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-12 text-center">
          <p className="section-eyebrow mb-3.5">Built for</p>
          <h2 className="section-title mb-3">Who is Silkview built for?</h2>
          <p className="section-sub mx-auto max-w-[560px]">
            Trusted by the people who actually own the close: from solo
            bookkeepers to in-house finance teams.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {personas.map((p) => (
            <article
              key={p.title}
              className="relative overflow-hidden rounded-lg border border-rule bg-surface p-7 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.07)]"
            >
              <div className={`absolute inset-x-0 top-0 h-0.5 ${p.accent}`} />
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] text-lg ${p.iconBg}`}
              >
                {p.icon}
              </div>
              <h3 className="mb-2.5 text-base font-semibold tracking-tight text-ink">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-2">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
