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
      className={`bg-surface border border-border rounded overflow-hidden mb-2.5 ${className}`}
    >
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <div className="text-xs font-semibold flex items-center gap-1.5">
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
