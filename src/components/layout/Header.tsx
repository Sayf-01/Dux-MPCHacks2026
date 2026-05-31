'use client';

interface HeaderProps {
  onLogoClick?: () => void;
}

export function Header({ onLogoClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-20">
      <button
        onClick={onLogoClick}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center text-white shadow-btn flex-shrink-0">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor">
            <ellipse cx="14" cy="22" rx="13" ry="9" />
            <circle cx="20" cy="10" r="7" />
            <path d="M25 9.5 L30 11.5 L25 13.5 Z" />
            <circle cx="22" cy="8" r="1.5" fill="#F5EFE6" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-xl text-ink leading-none">DUX</span>
          <span className="relative -top-px text-xs font-bold text-ink-3 tracking-widest uppercase leading-none">
            TRAVEL GUIDE
          </span>
        </div>
      </button>

      <nav className="hidden md:flex items-center">
        <button className="px-4 py-2 rounded-full border border-line-2 text-sm font-bold text-ink hover:border-accent hover:-translate-y-0.5 transition shadow-card-sm">
          How it works
        </button>
      </nav>
    </header>
  );
}
