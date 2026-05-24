export default function StripeMark({
  size = 26,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/stripe-icon.svg"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 block rounded-[6px] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
