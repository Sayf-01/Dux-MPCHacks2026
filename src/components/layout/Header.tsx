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
          <svg viewBox="0 0 32 32" width="22" height="22" fill="currentColor">
            <ellipse cx="19" cy="20" rx="11" ry="8" />
            <circle cx="11" cy="11" r="6" />
            <rect x="2" y="10" width="9" height="4" rx="2" />
            <path d="M27 17 L32 12 L29 20 Z" />
            <circle cx="9" cy="10" r="1.5" fill="#F5EFE6" />
          </svg>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display font-bold text-xl text-ink leading-none">DUX</span>
          <span className="text-xs font-bold text-ink-3 tracking-widest uppercase leading-none">
            Trip Studio
          </span>
        </div>
      </button>

      <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-ink-2">
        <span className="px-3 py-2 rounded-full hover:bg-surface-2 hover:text-ink cursor-pointer transition">
          How it works
        </span>
        <span className="px-3 py-2 rounded-full hover:bg-surface-2 hover:text-ink cursor-pointer transition">
          Saved trips
        </span>
        <button className="ml-2 px-4 py-2 rounded-full border border-line-2 text-ink font-bold hover:border-accent hover:-translate-y-0.5 transition shadow-card-sm">
          Sign in
        </button>
      </nav>
    </header>
  );
}
