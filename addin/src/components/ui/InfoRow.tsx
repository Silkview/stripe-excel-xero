import type { ReactNode } from 'react';

interface InfoRowProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'amber';
}

export default function InfoRow({
  children,
  className = '',
  variant = 'default',
}: InfoRowProps) {
  const variantClass =
    variant === 'amber'
      ? 'bg-warn-bg border-[#fde68a] text-warn-text'
      : 'bg-bg border-border text-ink-2';

  return (
    <div
      className={`px-2.5 py-2 border rounded-lg text-[11.5px] leading-snug mb-2.5 last:mb-0 ${variantClass} ${className}`}
    >
      {children}
    </div>
  );
}
