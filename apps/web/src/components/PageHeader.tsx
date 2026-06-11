import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden border-b border-blue-100/80 bg-gradient-to-r from-blue-50/95 via-indigo-50/70 to-white px-1 pb-5 pt-1 sm:flex sm:items-end sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-gradient-to-b from-blue-600 via-indigo-500 to-cyan-400" />

      <div className="max-w-3xl pl-5">
        {eyebrow && (
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="mt-4 flex shrink-0 flex-wrap gap-2 pl-5 sm:mt-0 sm:pl-0">
          {actions}
        </div>
      )}
    </div>
  )
}
