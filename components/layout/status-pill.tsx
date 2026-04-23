import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DotColor = 'green' | 'pink' | 'amber' | 'muted' | 'none'
type Variant = 'solid' | 'ghost'

interface Props {
  variant?: Variant
  dot?: DotColor
  children: ReactNode
  icon?: ReactNode
  className?: string
}

const DOT_CLASS: Record<Exclude<DotColor, 'none'>, string> = {
  green: 'bg-[color:var(--pam-green)]',
  pink: 'bg-[color:var(--pam-pink)]',
  amber: 'bg-[color:var(--pam-amber)]',
  muted: 'bg-[color:var(--pam-muted)]',
}

const VARIANT_CLASS: Record<Variant, string> = {
  solid: 'bg-[color:var(--pam-grey)] border-[color:var(--pam-grey-2)] text-foreground',
  ghost: 'bg-white border-[color:var(--pam-grey-2)] text-foreground',
}

export function StatusPill({
  variant = 'solid',
  dot = 'green',
  children,
  icon,
  className,
}: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold',
        VARIANT_CLASS[variant],
        className,
      )}
    >
      {dot !== 'none' ? (
        <span
          className={cn('w-[7px] h-[7px] rounded-full shrink-0', DOT_CLASS[dot])}
          aria-hidden="true"
        />
      ) : icon ? (
        <span className="inline-flex w-4 h-4 items-center justify-center shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  )
}
