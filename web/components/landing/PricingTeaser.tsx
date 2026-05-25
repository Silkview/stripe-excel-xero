import PlanPricingGrid from '@/components/plans/PlanPricingGrid';

export default function PricingTeaser() {
  return (
    <section id="pricing" className="bg-bg px-5 py-20 sm:px-12">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-12 text-center">
          <p className="section-eyebrow mb-3.5">Pricing</p>
          <h2 className="section-title mb-3">Simple, transparent pricing</h2>
          <p className="section-sub mx-auto max-w-[520px]">
            Start saving hours on your month-end close today. Free forever for
            Stripe pulls — upgrade for Xero push and higher transaction limits.
          </p>
        </div>
        <PlanPricingGrid mode="landing" />
        <p className="mt-8 text-center text-xs italic text-ink-3">
          Prices are GST-exclusive. A 10% GST applies to Australian-registered
          entities.
        </p>
      </div>
    </section>
  );
}
