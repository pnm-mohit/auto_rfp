import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  left?: ReactNode
  right?: ReactNode
  className?: string
}

const DEFAULT_LEFT = '© 2026 Panamoure · Intelligent RFP'
const DEFAULT_RIGHT = (
  <span className="flex gap-[18px]">
    <span>Docs</span>
    <span>Support</span>
    <span>Status · operational</span>
  </span>
)

export function FooterNote({ left, right, className }: Props) {
  return (
    <footer
      className={cn(
        'mt-10 pt-4 border-t border-border text-[12px] text-muted-foreground flex items-center justify-between',
        className,
      )}
    >
      <span>{left ?? DEFAULT_LEFT}</span>
      <span>{right ?? DEFAULT_RIGHT}</span>
    </footer>
  )
}
