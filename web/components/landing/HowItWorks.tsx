const steps = [
  {
    n: '01',
    title: 'Connect your core stack',
    body: 'Securely link your Stripe and Xero accounts to Silkview with standard, bank-level OAuth authentication.',
  },
  {
    n: '02',
    title: 'Load the Excel add-in',
    body: 'Open Microsoft Excel, launch the Silkview taskpane from your ribbon menu, and log in.',
  },
  {
    n: '03',
    title: 'Sync and reconcile',
    body: 'Select your date range and hit sync. Watch your raw Stripe transactions, fee deductions, and Xero ledger metrics stream perfectly formatted into your spreadsheet.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="border-y border-rule bg-bg px-5 py-20 sm:px-12">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-12 text-center">
          <p className="section-eyebrow mb-3.5">How it works</p>
          <h2 className="section-title mb-3">Three simple steps</h2>
          <p className="section-sub mx-auto max-w-[520px]">
            From OAuth connection to clean books — typically under 15 minutes
            for a full month-end Stripe reconciliation.
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
