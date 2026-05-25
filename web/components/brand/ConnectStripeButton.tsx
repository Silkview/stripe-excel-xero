import StripeMark from './StripeMark';
import { connectBtnClass, connectBtnHeight } from './connectButtonStyles';

export default function ConnectStripeButton({
  onClick,
  disabled,
  loading,
  label = 'Connect Stripe',
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`${connectBtnClass} ${connectBtnHeight} justify-center gap-2 border-none bg-stripe px-3 text-[13px] font-semibold text-white transition-colors hover:bg-stripe-hover`}
    >
      <StripeMark size={22} />
      {loading ? 'Connecting…' : label}
    </button>
  );
}
