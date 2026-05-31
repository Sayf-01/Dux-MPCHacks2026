import { InputHTMLAttributes } from 'react';

type SliderProps = InputHTMLAttributes<HTMLInputElement> & { className?: string };

export function Slider({ className = '', ...props }: SliderProps) {
  return (
    <input
      type="range"
      className={`w-full accent-accent cursor-pointer ${className}`}
      {...props}
    />
  );
}
