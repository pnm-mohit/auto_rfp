import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MetaRibbonProps {
  children: ReactNode
  className?: string
}

export function MetaRibbon({ children, className }: MetaRibbonProps) {
  return (
    <section
      className={cn(
        'bg-[color:var(--pam-grey)] rounded-[10px] px-[22px] py-3.5 mb-8 flex items-center gap-9 flex-wrap',
        className,
      )}
    >
      {children}
    </section>
  )
}

interface MetaItemProps {
  icon?: ReactNode
  label: string
  value: ReactNode
  mono?: boolean
  className?: string
}

export function MetaItem({ icon, label, value, mono = false, className }: MetaItemProps) {
  return (
    <div className={cn('flex items-center gap-2.5 text-[13px]', className)}>
      {icon ? (
        <span className="inline-flex w-[15px] h-[15px] items-center justify-center text-muted-foreground shrink-0">
          {icon}
        </span>
      ) : null}
      <span className="text-muted-foreground font-semibold text-[13px]">{label}</span>
      {mono ? (
        <code className="font-mono text-[12px] bg-white px-2 py-0.5 rounded border border-border font-medium text-foreground">
          {value}
        </code>
      ) : (
        <span className="text-foreground font-semibold text-[13px]">{value}</span>
      )}
    </div>
  )
}

export function MetaSync({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('ml-auto', className)}>{children}</div>
}
