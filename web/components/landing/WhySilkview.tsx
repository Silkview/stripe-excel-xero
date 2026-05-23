const whyItems = [
  {
    title: 'Full Excel control before any push',
    body: "Formulas, adjustments, custom account codes — your workbook, your rules. We read whatever you've built and push it as-is.",
  },
  {
    title: 'Clearing account pattern, done correctly',
    body: "Revenue recognised on charge date. Payout moves clearing to bank. GST split automatically via Xero's tax engine.",
  },
  {
    title: 'Multi-client ready for accounting firms',
    body: 'Firm plan: 5 workspaces, each with its own Stripe and Xero connection. One tool for your entire Stripe client book.',
  },
];

const comparisons = [
  {
    bad: 'Pushes to Xero automatically — errors discovered at BAS',
    good: "Review in Excel first, push when you're ready",
  },
  {
    bad: "Black-box mapping you can't see or audit",
    good: 'Formula-driven rows you built yourself',
  },
  {
    bad: 'No record of what was sent to Xero',
    good: 'Xero ID written back to every row after push',
  },
  {
    bad: 'One price regardless of client count',
    good: 'Firm plan covers 5 clients in one subscription',
  },
];

export default function WhySilkview() {
  return (
    <section className="border-t border-rule px-5 py-20 sm:px-12">
      <div className="mx-auto grid max-w-[1080px] gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="section-eyebrow mb-3.5">Why Silkview Connect</p>
          <h2 className="section-title mb-3">
            You review before Xero sees anything
          </h2>
          <p className="section-sub mb-8 max-w-[480px]">
            Other tools push straight to Xero automatically. You find errors at BAS
            time. Silkview Connect gives you the Excel review step accountants
            actually want.
          </p>
          <ul className="space-y-6">
            {whyItems.map((item) => (
              <li key={item.title} className="flex gap-4">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                <div>
                  <h4 className="mb-1 text-[15px] font-semibold tracking-tight text-ink">
                    {item.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-ink-2">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="overflow-hidden rounded-lg border border-rule">
          <div className="border-b border-rule bg-bg px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wide text-ink-3">
            Other tools &nbsp;vs&nbsp; Silkview Connect
          </div>
          {comparisons.map((row) => (
            <div
              key={row.bad}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-rule px-4 py-3.5 last:border-b-0"
            >
              <div className="text-[13px] leading-snug text-ink-3 line-through decoration-ink-3/40">
                {row.bad}
              </div>
              <div className="text-ink-3">→</div>
              <div className="text-[13px] font-medium leading-snug text-ink">
                {row.good}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
