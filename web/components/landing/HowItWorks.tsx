const steps = [
  { n: '1', title: 'Connect', body: 'Sign in, pick a workspace, connect Xero then Stripe.' },
  { n: '2', title: 'Pull & build', body: 'Pull balance transactions; build journals or bank lines in Excel.' },
  { n: '3', title: 'Push', body: 'Post manual journals or bank transactions to Xero with validation.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border bg-surface px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-2xl font-bold text-text">How it works</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stripe-light text-lg font-bold text-stripe">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold text-text">{s.title}</h3>
              <p className="mt-2 text-sm text-text-2">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
