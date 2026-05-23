interface StripeMarkProps {
  size?: number;
  className?: string;
}

/** Official Stripe square icon (purple tile + white mark) from public assets. */
export default function StripeMark({ size = 26, className = '' }: StripeMarkProps) {
  return (
    <img
      src="/stripe-icon.svg"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 block rounded-[6px] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
