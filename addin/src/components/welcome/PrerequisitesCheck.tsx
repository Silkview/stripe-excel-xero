import StripeMark from '../icons/StripeMark';
import XeroMark from '../icons/XeroMark';

const ITEMS = [
  {
    icon: <StripeMark size={20} />,
    label: 'Valid Stripe account',
  },
  {
    icon: <XeroMark size={20} />,
    label: 'Valid Xero organisation',
  },
] as const;

export default function PrerequisitesCheck() {
  return (
    <div className="rounded border border-border bg-bg p-3">
      <h3 className="text-xs font-semibold text-ink mb-2.5">Prerequisites</h3>
      <ul className="space-y-2 mb-2.5">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5">
            <span className="shrink-0">{item.icon}</span>
            <span className="text-xs text-ink-2">{item.label}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-ink-3 leading-relaxed">
        A valid Stripe and Xero account is required for this add-in.
      </p>
    </div>
  );
}
