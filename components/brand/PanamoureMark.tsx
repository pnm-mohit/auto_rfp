// TODO: replace with official Panamoure SVG logo — this is a placeholder

export interface PanamoureMarkProps {
  size?: number;
  className?: string;
  variant?: 'solid-navy' | 'solid-white';
}

export function PanamoureMark({
  size = 30,
  className,
  variant = 'solid-navy',
}: PanamoureMarkProps) {
  const isNavy = variant === 'solid-navy';
  const wrapperClasses = [
    'inline-grid place-items-center rounded-md shrink-0',
    isNavy
      ? 'bg-[color:var(--pam-blue)]'
      : 'bg-white border border-[color:var(--pam-blue)]',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const glyphColor = isNavy ? '#FFFFFF' : 'var(--pam-blue)';
  const glyphSize = Math.round(size * 0.8);

  return (
    <span
      aria-hidden="true"
      className={wrapperClasses}
      style={{ width: size, height: size }}
    >
      <svg
        width={glyphSize}
        height={glyphSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 20V4H13C16.3 4 19 6.7 19 10C19 13.3 16.3 16 13 16H9V20H5Z"
          fill={glyphColor}
        />
      </svg>
    </span>
  );
}
