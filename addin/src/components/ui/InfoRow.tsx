import type { ReactNode } from 'react';

interface InfoRowProps {
  children: ReactNode;
  className?: string;
}

export default function InfoRow({ children, className = '' }: InfoRowProps) {
  return (
    <div
      className={`flex items-start gap-1.5 px-2 py-1.5 bg-bg border border-border rounded-sm text-[11px] text-text-2 mb-2.5 ${className}`}
    >
      {children}
    </div>
  );
}
