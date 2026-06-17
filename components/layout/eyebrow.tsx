import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  className?: string
}

export function Eyebrow({ children, className }: Props) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 text-[12px] font-semibold tracking-wider uppercase text-muted-foreground',
        className,
      )}
    >
      <span className="block w-7 h-px bg-[color:var(--pam-pink)]" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
