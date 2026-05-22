const features = [
  {
    title: 'Connect Stripe & Xero',
    description:
      'OAuth per workspace. Tokens encrypted at rest. Your org base currency is detected automatically from Xero.',
    accent: 'stripe',
  },
  {
    title: 'Pull from Stripe',
    description:
      'Payouts, balance transactions, and charges — filtered to your ledger currency, written straight to Excel sheets.',
    accent: 'xero',
  },
  {
    title: 'Build & push to Xero',
    description:
      'Formula-driven journals and bank transactions from balance data. Push drafts or posted entries with row-level feedback.',
    accent: 'success',
  },
];

const accentBorder: Record<string, string> = {
  stripe: 'border-t-stripe',
  xero: 'border-t-xero',
  success: 'border-t-success',
};

export default function FeatureGrid() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold text-text sm:text-3xl">
          Everything you need in the task pane
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-text-2">
          A focused workflow: connect, pull, build, push — with account mappings on a
          dedicated sheet.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className={`rounded border border-border bg-surface p-6 shadow-card border-t-4 ${accentBorder[f.accent]}`}
            >
              <h3 className="font-semibold text-text">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-2">{f.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
