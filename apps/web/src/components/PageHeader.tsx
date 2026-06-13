import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
  icon?: LucideIcon
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'bg-brand-gradient-soft relative overflow-hidden rounded-[1.35rem] border border-brand-soft px-5 py-4 shadow-sm shadow-brand sm:flex sm:items-center sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="brand-top-line absolute inset-x-0 top-0 h-1" />

      <div className="flex max-w-4xl items-start gap-4">
        {Icon && (
          <div className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-sm shadow-brand sm:flex">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}

        <div>
          {eyebrow && (
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
              {eyebrow}
            </span>
          )}
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.7rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">
          {actions}
        </div>
      )}
    </div>
  )
}
