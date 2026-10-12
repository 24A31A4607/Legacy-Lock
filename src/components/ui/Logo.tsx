import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false, size = 'md' }) => {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-base' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl' },
  };

  const { icon, text } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight text-slate-900 select-none ${className}`}>
      {/* Distinctive Lock + Leaf Icon */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-indigo-400 p-1.5 shadow-sm border border-indigo-800/40 ${icon}`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full text-indigo-200"
        >
          {/* Lock Shackle */}
          <path d="M7 11V7a5 5 0 0 1 10 0v4" className="stroke-indigo-300" strokeWidth="2.2" />
          {/* Lock Body */}
          <rect x="3" y="11" width="18" height="11" rx="3" ry="3" className="fill-indigo-950/60 stroke-indigo-400" />
          {/* Center Keyhole */}
          <circle cx="12" cy="15.5" r="1.5" className="fill-indigo-300 stroke-none" />
          <path d="M12 17v2.5" className="stroke-indigo-300" strokeWidth="2" />
          {/* Organic Leaf filament motif on upper side */}
          <path
            d="M17 5.5c1.8 0 3 1.2 3 3 0 1.8-1.5 2.5-3 2.5s-2.5-1.5-2.5-3c0-1.5 1-2.5 2.5-2.5z"
            className="fill-emerald-400/30 stroke-emerald-400"
            strokeWidth="1.2"
          />
          <path d="M15.5 8.5c1.2-1 2.2-1.5 3.5-1.5" className="stroke-emerald-300" strokeWidth="1" />
        </svg>
      </div>

      {!iconOnly && (
        <span className={`${text} font-bold text-slate-900 tracking-tight whitespace-nowrap`}>
          Legacy<span className="text-indigo-600">Lock</span>
        </span>
      )}
    </div>
  );
};
