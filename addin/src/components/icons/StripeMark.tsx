interface StripeMarkProps {
  size?: number;
  className?: string;
}

/** Stripe square icon from public assets. */
export default function StripeMark({ size = 26, className = '' }: StripeMarkProps) {
  return (
    <img
      src="/stripe-icon.svg"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-sm object-contain ${className}`}
      aria-hidden
    />
  );
}
