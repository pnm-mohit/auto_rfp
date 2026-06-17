import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepListProps {
  children: ReactNode
  className?: string
}

export function StepList({ children, className }: StepListProps) {
  return <ol className={cn('flex flex-col', className)}>{children}</ol>
}

interface StepItemProps {
  number: number
  title: string
  description: string
  href?: string
  className?: string
}

// onClick support requires a thin 'use client' wrapper at the callsite — this primitive stays server-safe.
export function StepItem({ number, title, description, href, className }: StepItemProps) {
  const content = (
    <>
      <div className="w-7 h-7 rounded-full bg-white border border-[color:var(--pam-grey-3)] grid place-items-center font-bold text-[12px] text-foreground shrink-0 mt-0.5 transition-colors group-hover:bg-[color:var(--pam-blue)] group-hover:text-white group-hover:border-[color:var(--pam-blue)]">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold text-foreground">{title}</div>
        <div className="text-[12.5px] text-muted-foreground mt-0.5 leading-[1.5]">
          {description}
        </div>
      </div>
      <ArrowRight
        className="w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform group-hover:text-foreground group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </>
  )

  const base = cn(
    'flex gap-3.5 items-start py-3.5 px-3 rounded-lg border-b border-border last:border-b-0 hover:bg-[color:var(--pam-grey)] group cursor-pointer',
    className,
  )

  if (href) {
    return (
      <li>
        <a href={href} className={base}>
          {content}
        </a>
      </li>
    )
  }

  return <li className={base}>{content}</li>
}
