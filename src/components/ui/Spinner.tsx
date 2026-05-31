export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`w-5 h-5 rounded-full border-2 border-accent-soft border-t-accent animate-spin ${className}`}
    />
  );
}
