import StripeMark from './StripeMark';

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
      className="flex w-full items-center justify-center gap-2 rounded border-none bg-stripe py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-stripe-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      <StripeMark size={22} />
      {loading ? 'Connecting…' : label}
    </button>
  );
}
