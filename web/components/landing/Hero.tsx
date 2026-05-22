import Button from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="gradient-hero px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-2 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Built for accountants &amp; bookkeepers
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
          Stripe payouts to{' '}
          <span className="text-stripe">Xero journals</span>, inside Excel
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-2 leading-relaxed">
          Connect Stripe and Xero once, pull balance transactions in your org currency,
          build manual journals and bank transactions, then push to Xero — without
          leaving your spreadsheet.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/auth/signup" variant="primary" className="min-w-[180px]">
            Create free account
          </Button>
          <Button href="#how-it-works" variant="secondary" className="min-w-[180px]">
            See how it works
          </Button>
        </div>
        <p className="mt-6 text-sm text-text-3">
          14-day trial · Works with Excel desktop · Single-currency per workspace
        </p>
      </div>
    </section>
  );
}
