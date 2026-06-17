import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Eyebrow } from './eyebrow'

interface Props {
  eyebrow?: string
  title: string
  sub?: string
  pills?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, sub, pills, actions, className }: Props) {
  return (
    <div className={cn('w-full', className)}>
      {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
      <header className="flex items-end justify-between gap-6 pb-6 border-b border-border mb-8 flex-wrap lg:flex-nowrap">
        <div className="min-w-0">
          <h1 className="text-[44px] leading-[1.05] font-extrabold tracking-[-0.03em] text-foreground">
            {title}
          </h1>
          {sub ? (
            <p className="mt-2.5 text-[15px] leading-[1.55] text-[color:var(--pam-small)] max-w-[560px]">
              {sub}
            </p>
          ) : null}
          {pills ? (
            <div className="flex items-center gap-2.5 mt-[18px] flex-wrap">{pills}</div>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </header>
    </div>
  )
}
