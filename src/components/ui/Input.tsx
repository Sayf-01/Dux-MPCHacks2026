import { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function Input({ icon, className = '', ...props }: InputProps) {
  return (
    <div className="relative flex items-center">
      {icon && (
        <span className="absolute left-4 text-accent-ink flex items-center pointer-events-none">
          {icon}
        </span>
      )}
      <input
        className={`w-full h-14 border-2 border-line-2 bg-cream rounded-2xl font-bold text-ink text-lg outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft placeholder:text-ink-3 placeholder:font-semibold ${
          icon ? 'pl-12 pr-4' : 'px-4'
        } ${className}`}
        {...props}
      />
    </div>
  );
}
