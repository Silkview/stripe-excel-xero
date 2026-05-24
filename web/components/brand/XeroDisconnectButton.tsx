import {
  connectBtnClass,
  connectBtnHeight,
  connectBtnImgClass,
  disconnectBtnCompactImgClass,
} from './connectButtonStyles';

export default function XeroDisconnectButton({
  onClick,
  disabled,
  compact = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        compact
          ? 'inline-flex shrink-0 items-center overflow-hidden rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50'
          : `${connectBtnClass} ${connectBtnHeight} border-0 bg-transparent p-0`
      }
      aria-label="Disconnect from Xero"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/disconnect-xero.svg"
        alt="Disconnect from Xero"
        className={compact ? disconnectBtnCompactImgClass : connectBtnImgClass}
      />
    </button>
  );
}
