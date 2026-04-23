import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface KpiBandProps {
  children: ReactNode
  className?: string
}

export function KpiBand({ children, className }: KpiBandProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[14px] bg-[color:var(--pam-blue)] text-white px-9 py-8 mb-8 grid grid-cols-2 lg:grid-cols-4 gap-y-7 gap-x-10',
        className,
      )}
    >
      <span
        className="absolute right-8 top-8 w-7 h-0.5 bg-[color:var(--pam-pink)]"
        aria-hidden="true"
      />
      {children}
    </section>
  )
}

interface KpiCellProps {
  label: string
  value: ReactNode
  progress?: number
  foot?: ReactNode
  className?: string
}

export function KpiCell({ label, value, progress, foot, className }: KpiCellProps) {
  const clamped = progress === undefined ? undefined : Math.max(0, Math.min(100, progress))
  return (
    <div className={cn('relative flex flex-col gap-2.5 kpi-cell', className)}>
      <span
        className="hidden lg:block absolute left-[-20px] top-1.5 bottom-1.5 w-px bg-white/10 first:hidden [.kpi-cell:first-child>&]:hidden"
        aria-hidden="true"
      />
      <div className="text-[11.5px] font-semibold tracking-[0.1em] uppercase text-white/55">
        {label}
      </div>
      <div className="text-[42px] leading-none font-extrabold tracking-[-0.03em]">{value}</div>
      {clamped !== undefined ? (
        <div className="h-[3px] rounded bg-white/10 overflow-hidden mt-1">
          <span
            className="block h-full bg-[color:var(--pam-pink)]"
            style={{ width: `${clamped}%` }}
          />
        </div>
      ) : null}
      {foot ? <div className="text-[13px] text-white/65">{foot}</div> : null}
    </div>
  )
}

export function KpiOf({ children }: { children: ReactNode }) {
  return (
    <span className="text-[22px] text-white/45 font-semibold ml-1">{children}</span>
  )
}

export function KpiOk({ children }: { children: ReactNode }) {
  return <span className="text-[#4DDBA7] font-semibold">{children}</span>
}

export function KpiWarn({ children }: { children: ReactNode }) {
  return <span className="text-[#FFB454] font-semibold">{children}</span>
}
