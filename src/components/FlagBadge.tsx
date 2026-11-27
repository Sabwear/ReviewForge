import { useState } from 'react';

interface FlagBadgeProps {
  countryCode: string;
  emoji: string;
  label?: string;
  size?: 'sm' | 'md';
}

export function FlagBadge({ countryCode, emoji, label, size = 'md' }: FlagBadgeProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !countryCode) {
    return (
      <span className="text-sm leading-none shrink-0" aria-hidden="true">
        {emoji}
      </span>
    );
  }

  const dims = size === 'sm' ? 'w-4 h-3' : 'w-5 h-3.5';

  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
      alt={label ? `${label} flag` : ''}
      aria-hidden={!label}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${dims} object-cover rounded-[2px] ring-1 ring-black/10 dark:ring-white/15 shrink-0 inline-block`}
    />
  );
}
