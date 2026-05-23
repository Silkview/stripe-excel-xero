interface XeroMarkProps {
  size?: number;
  className?: string;
}

/** Xero brand logo from public assets. */
export default function XeroMark({ size = 26, className = '' }: XeroMarkProps) {
  return (
    <img
      src="/xero-logo.png"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-sm object-contain ${className}`}
      aria-hidden
    />
  );
}
