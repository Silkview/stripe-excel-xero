interface XeroMarkProps {
  size?: number;
  className?: string;
}

/** Compact Xero logomark for small UI (connect buttons, pills). */
export default function XeroMark({ size = 14, className = '' }: XeroMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="12" fill="#13B5EA" />
      <path
        fill="#fff"
        d="M7.2 16.5 12 10.2l4.8 6.3h-2.1L12 13.4l-2.7 3.1H7.2Zm0-9 4.8 6.3L12 7.8 9.3 4.5H7.2Z"
      />
    </svg>
  );
}
