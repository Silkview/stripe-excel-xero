interface StripeMarkProps {
  size?: number;
  className?: string;
}

/** Compact Stripe brand mark for small UI (connect buttons, pills). */
export default function StripeMark({ size = 14, className = '' }: StripeMarkProps) {
  const width = Math.round(size * (40 / 17));
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={size}
      viewBox="0 0 40 17"
      fill="none"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      <path
        fill="#635bff"
        d="M13.3 6.2c0-.9.7-1.2 1.9-1.2 1.7 0 3.8.5 5.5 1.4V.4C19.5.1 17.4 0 15.2 0 9.5 0 5.8 2.7 5.8 7.1c0 6.9 9.5 5.8 9.5 8.8 0 1.1-.9 1.4-2.2 1.4-1.9 0-4.4-.5-6.3-1.4v5.5c2.7.6 5.4.9 8.1.9 5.8 0 9.7-2.9 9.7-7.3-.1-7.4-9.6-6.1-9.6-8.9Zm-13.3 0h5.8V16H0V6.2Zm22.4 9.8h5.8V.4h-5.8V16Z"
      />
    </svg>
  );
}
