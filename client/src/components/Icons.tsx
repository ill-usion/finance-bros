// Minimal, sleek line-icon set used across the app. Deliberately avoids emoji
// in favor of consistent stroke-based glyphs that inherit `currentColor`.
type IconProps = { size?: number; className?: string };

const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconHome({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10a1 1 0 0 0 1-1v-4.5a1 1 0 0 1 1-1h0a1 1 0 0 1 1 1V20a1 1 0 0 0 1 1h3.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

export function IconList({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <path d="M4 6h.01" />
      <path d="M4 12h.01" />
      <path d="M4 18h.01" />
    </svg>
  );
}

export function IconGuide({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.4a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1 .9-1 1.7" />
      <path d="M12 16.3h.01" />
    </svg>
  );
}

export function IconSettings({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2.1M12 18.4v2.1M20.5 12h-2.1M5.6 12H3.5M17.6 6.4l-1.5 1.5M7.9 16.1l-1.5 1.5M17.6 17.6l-1.5-1.5M7.9 7.9 6.4 6.4" />
    </svg>
  );
}

export function IconCamera({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 8.2A1.2 1.2 0 0 1 5.2 7h2.1l1-1.6a1.2 1.2 0 0 1 1-.6h5.4a1.2 1.2 0 0 1 1 .6l1 1.6h2.1A1.2 1.2 0 0 1 20 8.2v9.6A1.2 1.2 0 0 1 18.8 19H5.2A1.2 1.2 0 0 1 4 17.8Z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

export function IconImage({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M4 17.5 9 12.8a1.6 1.6 0 0 1 2.2 0l1 1 3.4-3.4a1.6 1.6 0 0 1 2.2 0l2.2 2.2" />
    </svg>
  );
}

export function IconPlus({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconWallet({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3.5 8.2A2.2 2.2 0 0 1 5.7 6h11.6a2.7 2.7 0 0 1 2.7 2.7v6.6a2.7 2.7 0 0 1-2.7 2.7H5.7a2.2 2.2 0 0 1-2.2-2.2Z" />
      <path d="M15.5 13.2h2.6" />
      <path d="M14 6 6.4 6" />
    </svg>
  );
}

export function IconEdit({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M15.6 4.6a1.9 1.9 0 0 1 2.7 2.7L8 17.6l-3.4.8.8-3.4Z" />
    </svg>
  );
}

export function IconChat({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 6.8A2.3 2.3 0 0 1 6.3 4.5h11.4A2.3 2.3 0 0 1 20 6.8v7.4a2.3 2.3 0 0 1-2.3 2.3H9.6l-4 3.3v-3.3H6.3A2.3 2.3 0 0 1 4 14.2Z" />
      <path d="M8.3 8.6h7.4M8.3 11.6h4.8" />
    </svg>
  );
}

export function IconSend({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 12 19.5 4.5 15 19.5l-3.6-6.3-6.9-1.2Z" />
      <path d="M11.4 13.2 19.5 4.5" />
    </svg>
  );
}

export function IconTrash({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
      <path d="M6.5 7 7.2 18.7A1.5 1.5 0 0 0 8.7 20h6.6a1.5 1.5 0 0 0 1.5-1.3L17.5 7" />
      <path d="M10.2 11v5M13.8 11v5" />
    </svg>
  );
}
