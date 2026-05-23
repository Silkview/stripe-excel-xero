import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  mono?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Field({ label, children, className = '' }: FieldProps) {
  return (
    <div className={`mb-2.5 last:mb-0 ${className}`}>
      <label className="block text-[11px] font-medium text-ink-2 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputBase =
  'w-full py-2 px-2.5 border border-border rounded-lg bg-white font-sans text-[13px] text-ink outline-none transition-colors focus:border-accent focus:shadow-[0_0_0_3px_rgba(37,99,235,0.07)]';

export function TextInput({
  mono,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input
      className={`${inputBase} ${mono ? 'font-mono text-[11.5px] text-accent' : ''} ${className}`}
      {...props}
    />
  );
}

export function SelectInput({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`${inputBase} appearance-none pr-7 ${className}`}
        {...props}
      >
        {children}
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-[55%] text-ink-3 pointer-events-none text-sm">
        ⌄
      </span>
    </div>
  );
}
