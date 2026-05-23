import type { ReactNode } from 'react';

interface CardProps {
  title: ReactNode;
  icon?: ReactNode;
  iconClass?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Card({
  title,
  icon,
  iconClass = 'bg-stripe-light',
  badge,
  children,
  className = '',
}: CardProps) {
  return (
    <div
      className={`bg-white border border-border rounded overflow-hidden mb-2.5 last:mb-0 ${className}`}
    >
      <div className="px-3 py-2.5 bg-bg border-b border-border flex items-center justify-between gap-2">
        <div className="text-[12.5px] font-semibold flex items-center gap-1.5 text-ink">
          {icon && (
            <span
              className={`w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-xs ${iconClass}`}
            >
              {icon}
            </span>
          )}
          {title}
        </div>
        {badge}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
