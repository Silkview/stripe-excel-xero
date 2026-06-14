import Link from 'next/link';
import DeploymentDeskNote from '@/components/enterprise/DeploymentDeskNote';
import { ENTERPRISE_PATH } from '@/lib/support';

export default function EnterpriseTeaser() {
  return (
    <section className="border-t border-rule bg-bg px-5 py-20 sm:px-12">
      <div className="mx-auto max-w-[720px] text-center">
        <p className="section-eyebrow mb-3.5">For teams &amp; practices</p>
        <h2 className="section-title mb-3">Enterprise &amp; Firm Deployment</h2>
        <p className="section-sub mx-auto mb-3 max-w-[600px]">
          Centralized Stripe-to-Xero reconciliation built for accounting practices
          and corporate finance teams.
        </p>
        <p className="mx-auto mb-8 max-w-[600px] text-sm leading-relaxed text-ink-2">
          Silkview Connect scales seamlessly across large organizations. Whether you
          are an accounting firm managing dozens of distinct client Stripe feeds or an
          enterprise finance team operating multi-entity corporate structures, our
          platform provides the security, control, and centralized management your
          workflow demands.
        </p>
        <DeploymentDeskNote className="mx-auto mb-6 max-w-[560px] text-left" />
        <Link
          href={ENTERPRISE_PATH}
          className="inline-flex rounded-[10px] bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          View enterprise options →
        </Link>
      </div>
    </section>
  );
}
