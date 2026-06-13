import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: string | number
  description?: string
  icon?: LucideIcon
  tone?: 'slate' | 'blue' | 'amber' | 'emerald' | 'red' | 'purple'
}

const toneClassNames = {
  slate: 'bg-slate-50 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
}

const accentClassNames = {
  slate: 'from-slate-400 to-slate-500',
  blue: 'from-blue-500 to-indigo-500',
  amber: 'from-amber-400 to-orange-500',
  emerald: 'from-emerald-400 to-teal-500',
  red: 'from-red-400 to-rose-500',
  purple: 'from-purple-400 to-fuchsia-500',
}

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = 'slate',
}: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-100/70">
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 bg-gradient-to-r',
          accentClassNames[tone],
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <strong className="mt-2 block text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </strong>
        </div>

        {Icon && (
          <span
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-2xl ring-1',
              toneClassNames[tone],
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>

      {description && (
        <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
      )}
    </div>
  )
}
