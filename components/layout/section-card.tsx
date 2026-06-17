import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  bar?: boolean
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  padded?: boolean
  children: ReactNode
}

export function SectionCard({
  title,
  bar = true,
  actions,
  className,
  bodyClassName,
  padded = true,
  children,
}: Props) {
  return (
    <section className={cn('rounded-[12px] border border-border bg-card overflow-hidden', className)}>
      <div className="flex items-center justify-between px-7 pt-7 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 text-[15px] font-bold tracking-[-0.01em] text-foreground">
          {bar ? (
            <span
              className="w-[3px] h-[18px] bg-[color:var(--pam-pink)] rounded-sm shrink-0"
              aria-hidden="true"
            />
          ) : null}
          <span>{title}</span>
        </div>
        {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
      </div>
      <div className={cn(padded ? 'p-7' : '', bodyClassName)}>{children}</div>
    </section>
  )
}
