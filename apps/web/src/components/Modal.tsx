import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type ModalProps = {
  open: boolean
  title: string
  description?: string
  maxWidthClassName?: string
  children: ReactNode
  onClose: () => void
}

export function Modal({
  open,
  title,
  description,
  maxWidthClassName = 'max-w-2xl',
  children,
  onClose,
}: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        className={[
          'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl shadow-slate-950/20',
          maxWidthClassName,
        ].join(' ')}
      >
        <button
          type="button"
          onClick={onClose}
          title="Fechar modal"
          aria-label="Fechar modal"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition hover:bg-brand-soft hover:text-brand-strong"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="sticky top-0 z-[1] border-b border-brand-soft bg-brand-gradient-soft px-6 py-4 pr-14 shadow-sm shadow-slate-200/70">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-slate-950 sm:text-xl">
              {title}
            </h2>
            {description && (
              <p
                id="modal-description"
                className="mt-1 text-sm leading-6 text-slate-500"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
