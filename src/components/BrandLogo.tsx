import { useId } from 'react';

interface BrandLogoProps {
  compact?: boolean;
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  const uid = useId().replace(/:/g, '');
  const bgId = `rf-bg-${uid}`;
  const shineId = `rf-shine-${uid}`;
  const starId = `rf-star-${uid}`;

  return (
    <span className="inline-flex items-center gap-2.5 select-none group">
      <span className="relative flex items-center justify-center w-9 h-9 rounded-xl shadow-sm shadow-sky-600/20 dark:shadow-sky-500/20 ring-1 ring-sky-500/20 dark:ring-sky-400/25 transition-transform duration-200 group-hover:scale-[1.04]">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
          className="w-9 h-9 rounded-xl"
        >
          <defs>
            <linearGradient id={bgId} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="52%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id={shineId} x1="12" y1="6" x2="48" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={starId} x1="22" y1="16" x2="42" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="55%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${bgId})`} />
          <rect
            x="2.75"
            y="2.75"
            width="58.5"
            height="58.5"
            rx="15.25"
            stroke={`url(#${shineId})`}
            strokeWidth="1.5"
          />
          <path
            d="M17.5 19.5C17.5 16.4624 19.9624 14 23 14H41C44.0376 14 46.5 16.4624 46.5 19.5V35C46.5 38.0376 44.0376 40.5 41 40.5H32.2L23.4 48.1C22.35 49 20.7 48.26 20.7 46.88V40.5H23C19.9624 40.5 17.5 38.0376 17.5 35V19.5Z"
            fill="#FFFFFF"
            fillOpacity="0.16"
            stroke="#FFFFFF"
            strokeOpacity="0.48"
            strokeWidth="1.6"
          />
          <path
            d="M32 17.5L35.3 24.4L42.5 27.25L35.3 30.1L32 37L28.7 30.1L21.5 27.25L28.7 24.4L32 17.5Z"
            fill={`url(#${starId})`}
          />
          <circle cx="44" cy="18" r="2.2" fill="#FFFFFF" fillOpacity="0.92" />
        </svg>
      </span>

      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            Review
            <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Forge
            </span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 mt-0.5">
            Review Studio
          </span>
        </span>
      )}
    </span>
  );
}
