import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  children: ReactNode
  className?: string
}

export function InsightStrip({ title, children, className }: Props) {
  return (
    <div
      className={cn(
        'mt-6 p-5 rounded-[10px] bg-[color:var(--pam-grey)] border-l-[3px] border-[color:var(--pam-pink)]',
        className,
      )}
    >
      <h4 className="text-[13.5px] font-bold text-foreground">{title}</h4>
      <p className="text-[12.5px] text-[color:var(--pam-small)] leading-[1.55] mt-1">
        {children}
      </p>
    </div>
  )
}
