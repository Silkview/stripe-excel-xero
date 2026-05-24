export default function XeroDisconnectButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="block w-full overflow-hidden rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Disconnect from Xero"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/disconnect-xero.svg"
        alt="Disconnect from Xero"
        className="h-auto w-full max-w-full"
      />
    </button>
  );
}
