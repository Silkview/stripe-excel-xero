import PlanPricingGrid from '@/components/plans/PlanPricingGrid';

export default function PricingTeaser() {
  return (
    <section id="pricing" className="bg-bg px-5 py-20 sm:px-12">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-12 text-center">
          <p className="section-eyebrow mb-3.5">Pricing</p>
          <h2 className="section-title mb-3">Start free. Pay when you push.</h2>
          <p className="section-sub mx-auto max-w-[480px]">
            Free forever for Stripe pulls. Upgrade for Xero push and higher
            transaction limits.
          </p>
        </div>
        <PlanPricingGrid mode="landing" />
      </div>
    </section>
  );
}
