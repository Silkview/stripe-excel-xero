const painPoints = [
  'Download massive, ugly Stripe CSVs.',
  'Manually split gross payments from processing fees.',
  'Hunt down missing cents to make the bank feed match the payout.',
];

export default function ProblemSection() {
  return (
    <section className="border-b border-rule px-5 py-20 sm:px-12">
      <div className="mx-auto grid max-w-[1080px] gap-12 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="section-eyebrow mb-3.5">The problem</p>
          <h2 className="section-title mb-3">The month-end nightmare</h2>
          <p className="section-sub">
            If you process payments through Stripe and balance your books in
            Xero, you already know the pain of the month-end close.
          </p>
        </div>
        <div className="border-l-2 border-accent/30 pl-6 sm:pl-8">
          <p className="text-[15px] leading-relaxed text-ink-2">
            You are forced to wrestle with the same painful workflow every
            single month:
          </p>
          <ul className="mt-5 space-y-3">
            {painPoints.map((point) => (
              <li key={point} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[15px] leading-relaxed text-ink-2">
            <strong className="font-semibold text-ink">
              Tedious. Highly prone to human error. A massive drain on your
              billable hours.
            </strong>{' '}
            There has to be a better way to leave a clean audit trail.
          </p>
        </div>
      </div>
    </section>
  );
}
