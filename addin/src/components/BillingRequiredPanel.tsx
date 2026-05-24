'use client';

import Button from './ui/Button';

export default function BillingRequiredPanel({
  billingUrl,
  billingAccess,
  needsDowngradeSelection,
}: {
  billingUrl: string;
  billingAccess: 'trial_expired' | 'payment_required' | 'active';
  needsDowngradeSelection?: boolean;
}) {
  const headline = needsDowngradeSelection
    ? 'Finish your Pro setup'
    : billingAccess === 'payment_required'
      ? 'Subscription inactive'
      : 'Trial ended';

  const message = needsDowngradeSelection
    ? 'Choose which workspace and connections to keep on the Pro plan in your browser.'
    : billingAccess === 'payment_required'
      ? 'Update billing in your browser to continue syncing Stripe and Xero data.'
      : 'Subscribe to Pro or Firm in your browser to continue using Silkview Connect.';

  return (
    <div className="p-3.5 flex-1">
      <h2 className="text-lg font-semibold">{headline}</h2>
      <p className="text-sm text-ink-2 mt-2 mb-4">{message}</p>
      <Button
        variant="build"
        onClick={() => {
          window.open(billingUrl, '_blank');
        }}
      >
        Open billing in browser
      </Button>
    </div>
  );
}
