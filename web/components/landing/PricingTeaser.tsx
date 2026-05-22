import Button from '@/components/ui/Button';

const plans = [
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    users: '1 user · 1 workspace',
    highlight: false,
  },
  {
    name: 'Firm',
    price: '$79',
    period: '/mo',
    users: '5 users · 5 workspaces',
    highlight: true,
  },
];

export default function PricingTeaser() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-bold text-text">Simple pricing</h2>
        <p className="mt-3 text-center text-text-2">
          Start with a 14-day trial. Upgrade when you need more seats or workspaces.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded border p-6 shadow-card ${
                p.highlight
                  ? 'border-stripe/40 bg-stripe-light/30 ring-1 ring-stripe/20'
                  : 'border-border bg-surface'
              }`}
            >
              {p.highlight && (
                <span className="text-xs font-semibold uppercase tracking-wide text-stripe">
                  Popular
                </span>
              )}
              <h3 className="mt-1 text-lg font-bold text-text">{p.name}</h3>
              <p className="mt-2">
                <span className="text-3xl font-bold text-text">{p.price}</span>
                <span className="text-text-3">{p.period}</span>
              </p>
              <p className="mt-2 text-sm text-text-2">{p.users}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button href="/auth/signup" variant="primary">
            Create account — start trial
          </Button>
        </div>
      </div>
    </section>
  );
}
