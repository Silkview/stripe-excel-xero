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
          ? 'inline-flex shrink-0 overflow-hidden rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50'
          : 'block w-full overflow-hidden rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50'
      }
      aria-label="Disconnect from Xero"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/disconnect-xero.svg"
        alt="Disconnect from Xero"
        className={
          compact
            ? 'h-[26px] w-auto max-w-[140px]'
            : 'h-auto w-full max-w-full'
        }
      />
    </button>
  );
}
