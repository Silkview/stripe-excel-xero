import { connectBtnClass, connectBtnHeight } from './connectButtonStyles';

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
      className={`${connectBtnClass} ${connectBtnHeight} border-0 bg-transparent p-0`}
      aria-label={loading ? 'Connecting to Xero' : 'Connect to Xero'}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/connect-xero.svg"
        alt={loading ? 'Connecting…' : 'Connect to Xero'}
        className="h-full w-full object-cover object-left"
      />
    </button>
  );
}
