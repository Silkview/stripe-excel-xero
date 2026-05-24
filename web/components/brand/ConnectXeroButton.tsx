export default function ConnectXeroButton({
  onClick,
  disabled,
  loading,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="block w-full overflow-hidden rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={loading ? 'Connecting to Xero' : 'Connect to Xero'}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/connect-xero.svg"
        alt={loading ? 'Connecting…' : 'Connect to Xero'}
        className="h-auto w-full max-w-full"
      />
    </button>
  );
}
