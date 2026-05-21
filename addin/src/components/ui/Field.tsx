import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  mono?: boolean;
  children: ReactNode;
  className?: string;
}

export default function Field({ label, mono, children, className = '' }: FieldProps) {
  return (
    <div className={`mb-2.5 ${className}`}>
      <label className="block text-[11px] font-medium text-text-2 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBase =
  'w-full py-2 px-2.5 border border-border rounded-sm bg-surface font-sans text-[13px] text-text outline-none transition-colors focus:border-stripe focus:ring-[3px] focus:ring-stripe/10';

export function TextInput({
  mono,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return (
    <input
      className={`${inputBase} ${mono ? 'font-mono text-[11px] text-stripe' : ''} ${className}`}
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
      <span className="absolute right-2.5 top-1/2 -translate-y-[55%] text-text-3 pointer-events-none text-[13px]">
        ⌄
      </span>
    </div>
  );
}
