import XeroMark from './XeroMark';
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
      className={`${connectBtnClass} ${connectBtnHeight} justify-center gap-2 border-none bg-xero px-3 text-[13px] font-semibold text-white transition-colors hover:bg-xero-dark`}
      aria-label={loading ? 'Connecting to Xero' : 'Connect to Xero'}
    >
      <XeroMark size={22} />
      {loading ? 'Connecting…' : 'Connect to Xero'}
    </button>
  );
}
