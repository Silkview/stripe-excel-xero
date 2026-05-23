const steps = [
  {
    n: '01',
    title: 'Connect',
    body: 'Sign in, create a workspace, connect your Xero org and Stripe account. Map GL account codes once on the Account_Mappings sheet.',
  },
  {
    n: '02',
    title: 'Pull & build',
    body: 'Pick a date range and pull balance transactions. Silkview Connect builds journal and bank transaction rows from your mapping — review and adjust freely in Excel.',
  },
  {
    n: '03',
    title: 'Push',
    body: "Post as draft or directly to your Xero ledger. Each row gets a Xero transaction ID written back — proof it's posted, protection against duplicates.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-y border-rule bg-bg px-5 py-20 sm:px-12">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-12 text-center">
          <p className="section-eyebrow mb-3.5">Workflow</p>
          <h2 className="section-title mb-3">Three steps, once a month</h2>
          <p className="section-sub mx-auto max-w-[480px]">
            Typically under 15 minutes for a full month-end Stripe reconciliation.
          </p>
        </div>
        <div className="relative grid gap-8 sm:grid-cols-3">
          <div
            className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-7 hidden h-px bg-rule sm:block"
            aria-hidden
          />
          {steps.map((s) => (
            <div key={s.n} className="relative text-center">
              <div className="relative z-10 mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-rule bg-surface font-mono text-sm font-medium text-accent">
                {s.n}
              </div>
              <h3 className="mb-2.5 text-base font-semibold tracking-tight text-ink">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-2">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
