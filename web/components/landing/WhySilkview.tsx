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

export default function WhySilkview() {
  return (
    <section className="border-t border-rule px-5 py-20 sm:px-12">
      <div className="mx-auto max-w-[1080px]">
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
    </section>
  );
}
