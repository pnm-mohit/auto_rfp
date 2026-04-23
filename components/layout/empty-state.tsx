import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  icon?: ReactNode
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, actions, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-11 px-6 text-center', className)}>
      {icon ? (
        <div className="w-14 h-14 rounded-xl bg-[color:var(--pam-grey)] grid place-items-center mb-4 text-foreground">
          <span className="inline-flex items-center justify-center [&_svg]:w-[26px] [&_svg]:h-[26px] [&_svg]:stroke-[1.6]">
            {icon}
          </span>
        </div>
      ) : null}
      <h3 className="text-[16px] font-bold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1.5 text-[13.5px] text-muted-foreground max-w-[380px] leading-[1.55]">
          {description}
        </p>
      ) : null}
      {actions ? <div className="flex gap-2 mt-[18px]">{actions}</div> : null}
    </div>
  )
}
