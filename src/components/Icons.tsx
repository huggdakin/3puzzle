import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ children, size = 20, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LogoMark({ size = 40 }: { size?: number }) {
  const cells = [
    ["#ffb03a", 0, 0],
    ["#23e0b6", 1, 0],
    ["#8b62ff", 2, 0],
    ["#ff2f74", 0, 1],
    ["#6ef7d8", 1, 1],
    ["#ffd166", 2, 1],
    ["#0fb494", 0, 2],
    ["#6a3cf0", 1, 2],
  ] as const;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <polygon points="14,3 62,3 62,51 50,63 2,63 2,15" fill="#04030c" />
      <polygon points="14,1 62,1 62,49 50,61 2,61 2,13" fill="url(#wm-frame)" />
      <defs>
        <linearGradient id="wm-frame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd166" />
          <stop offset="0.5" stopColor="#23e0b6" />
          <stop offset="1" stopColor="#8b62ff" />
        </linearGradient>
      </defs>
      <polygon points="16,5.5 57.5,5.5 57.5,47 47.5,56.5 6.5,56.5 6.5,15" fill="#080718" />
      {cells.map(([color, c, r]) => (
        <rect
          key={`${c}-${r}`}
          x={10 + c * 15.5}
          y={9 + r * 15.5}
          width="13.5"
          height="13.5"
          rx="2.5"
          fill={color}
          stroke="rgba(255,255,255,0.88)"
          strokeWidth="1.15"
        />
      ))}
      <path
        d="M49 41.5l1.9 4.3 4.3 1.9-4.3 1.9L49 54l-1.9-4.4-4.3-1.9 4.3-1.9Z"
        fill="#ffe9b8"
      />
    </svg>
  );
}

export const CompassIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <polygon
      points="14.8,9.2 13.1,13.1 9.2,14.8 10.9,10.9"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.2}
    />
  </Base>
);

export const BoltIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6l1-8Z" fill="currentColor" />
  </Base>
);

export const PlayIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 5.5v13l10-6.5-10-6.5Z" fill="currentColor" stroke="none" />
  </Base>
);

export const GridIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </Base>
);

export const CollageIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="11" height="9" rx="2.5" />
    <rect x="16" y="4" width="5" height="5" rx="1.6" />
    <rect x="3" y="15" width="5" height="5" rx="1.6" />
    <rect x="10" y="15" width="11" height="5" rx="2.2" />
  </Base>
);

export const BagIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 8.5h15l-1.1 11a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8l-1.1-11Z" />
    <path d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5" />
    <path d="M9.5 12.5h5" />
  </Base>
);

export const TrophyIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5.5H5.2a2.7 2.7 0 0 0 3 4.2M16 5.5h2.8a2.7 2.7 0 0 1-3 4.2" />
    <path d="M12 12.5V16M8.5 20h7M10 20v-2.2a2 2 0 0 1 4 0V20" />
  </Base>
);

export const CoinIcon = ({ size = 20, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
    <circle cx="12" cy="12.8" r="9.5" fill="#a35205" />
    <circle cx="12" cy="11.6" r="9.5" fill="#ffb03a" stroke="#f2820f" strokeWidth="1.2" />
    <circle cx="12" cy="11.6" r="6.3" fill="#ffe9b8" stroke="#f2820f" strokeWidth="1" />
    <path
      d="m12 7.4 1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4 1.3-2.7Z"
      fill="#f2820f"
    />
  </svg>
);

export const StarIcon = ({ filled = false, ...p }: IconProps & { filled?: boolean }) => (
  <Base {...p}>
    <path
      d="m12 3.8 2.5 5 5.5.8-4 3.9.95 5.5L12 16.4 7.05 19l.95-5.5-4-3.9 5.5-.8 2.5-5Z"
      fill={filled ? "currentColor" : "none"}
    />
  </Base>
);

export const SparklesIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m12 3 1.7 4.6L18.5 9.5l-4.8 1.9L12 16l-1.7-4.6L5.5 9.5l4.8-1.9L12 3Z" />
    <path d="M18.5 15.5 19.4 18l2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9.9-2.5Z" />
    <path d="M5 15.5 5.6 17l1.6.6-1.6.6L5 19.8l-.6-1.6-1.6-.6 1.6-.6.6-1.5Z" />
  </Base>
);

export const EyeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.8 12S6.2 5.8 12 5.8 21.2 12 21.2 12 17.8 18.2 12 18.2 2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.9" />
  </Base>
);

export const ShuffleIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 7h3.5c1.6 0 3.1.8 4 2.2l3 4.6c.9 1.4 2.4 2.2 4 2.2H21" />
    <path d="m18 13 3 3-3 3M3 17h3.5c1.1 0 2.2-.4 3-1.2M13.5 8.2c.8-.8 1.9-1.2 3-1.2H21" />
    <path d="m18 4 3 3-3 3" />
  </Base>
);

export const BulbIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 17.5h6M9.8 20.5h4.4" />
    <path d="M12 3.5a5.8 5.8 0 0 0-3.4 10.5c.6.5.9 1.1.9 1.8v1.7h5v-1.7c0-.7.3-1.3.9-1.8A5.8 5.8 0 0 0 12 3.5Z" />
    <path d="M12 7.5v4M10.2 9.3h3.6" />
  </Base>
);

export const VolumeIcon = ({ muted = false, ...p }: IconProps & { muted?: boolean }) => (
  <Base {...p}>
    <path d="M4.5 9.5h3l4-3.2v11.4l-4-3.2h-3v-5Z" />
    {muted ? (
      <path d="m16.5 9.5 4 5M20.5 9.5l-4 5" />
    ) : (
      <path d="M15.5 9a4.3 4.3 0 0 1 0 6M18 6.7a7.7 7.7 0 0 1 0 10.6" />
    )}
  </Base>
);

export const SettingsIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.5 12a7.7 7.7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-2.1-1.2l-.3-2.5h-4l-.3 2.5A7.5 7.5 0 0 0 8.3 7l-2.3-1-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.5 7.5 0 0 0 2.1 1.2l.3 2.5h4l.3-2.5a7.5 7.5 0 0 0 2.1-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z" />
  </Base>
);

export const TimerIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="13.5" r="7.5" />
    <path d="M12 10v3.8l2.4 1.5M9.5 2.8h5" />
  </Base>
);

export const MovesIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 17.5c1.5-4 3.6-6 6.2-6 3.5 0 4.2 4.6 7.8 4.6 1 0 1.7-.3 2-1" />
    <path d="M3 8.5c1.7-2.4 3.5-3.6 5.4-3.6 3.8 0 5 5.3 8.8 4.1" />
    <circle cx="10" cy="20" r="1" fill="currentColor" stroke="none" />
    <circle cx="14" cy="20" r="1" fill="currentColor" stroke="none" />
  </Base>
);

export const FlameIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21c3.7 0 6.2-2.4 6.2-5.7 0-2.6-1.6-4.5-2.8-6.2-.8-1.1-1.4-2.3-1.5-3.9-2.4 1.4-3.5 3.5-3.4 5.7-1-.4-1.7-1.2-2.1-2.4-1.7 1.7-2.6 3.8-2.6 6.3 0 3.6 2.4 6.2 6.2 6.2Z" />
    <path d="M12 17.5c1.3 0 2.2-.9 2.2-2.1 0-1.1-.8-1.8-1.3-2.9-.6.8-1.1 1.2-1.8 1.7-.5.4-.8 1-.8 1.6 0 1.1.7 1.7 1.7 1.7Z" />
  </Base>
);

export const LockIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="4.8" y="10.5" width="14.4" height="10" rx="3" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2" />
  </Base>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m9 5 7 7-7 7" />
  </Base>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Base>
);

export const CheckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Base>
);

export const CloseIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />
  </Base>
);

export const VideoIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="2.5" y="6" width="13" height="12" rx="3" />
    <path d="m15.5 10.5 5-2.8v8.6l-5-2.8" />
    <path d="m8 9.2 2.9 2.8L8 14.8V9.2Z" fill="currentColor" stroke="none" />
  </Base>
);

export const GiftIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="8.5" width="17" height="12" rx="2.5" />
    <path d="M2.8 8.5h18.4M12 8.5v12M12 8.5C10 8.5 7.5 8 7.5 5.8 7.5 4 8.6 3 10 3c1.7 0 2 3.2 2 5.5ZM12 8.5c2 0 4.5-.5 4.5-2.7C16.5 4 15.4 3 14 3c-1.7 0-2 3.2-2 5.5Z" />
  </Base>
);

export const ShieldIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 2.8 20 6v5.4c0 4.5-3.2 8-8 9.8-4.8-1.8-8-5.3-8-9.8V6l8-3.2Z" />
    <path d="m8.5 11.8 2.4 2.4 4.7-4.6" />
  </Base>
);

export const HashIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 3.5 7 20.5M17 3.5l-2 17M3.8 8.5h16.4M3 15.5h16.4" />
  </Base>
);

export const SunIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    <path
      d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"
      strokeWidth={2}
    />
  </Base>
);

export const MoonIcon = (p: IconProps) => (
  <Base {...p}>
    <path
      d="M20.5 14.6A8.7 8.7 0 0 1 9.4 3.5a8.7 8.7 0 1 0 11.1 11.1Z"
      fill="currentColor"
      stroke="none"
    />
  </Base>
);

export const InfoIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.8v.5" />
  </Base>
);

export const RefreshIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5" />
  </Base>
);

export function Stars({
  value,
  size = 14,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} / 3`}>
      {[1, 2, 3].map((n) => (
        <StarIcon
          key={n}
          size={size}
          filled={n <= value}
          className={n <= value ? "text-sun" : "text-ink/20"}
        />
      ))}
    </span>
  );
}
