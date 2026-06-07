import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type ModalProps = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
}: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          title="Fechar modal"
          aria-label="Fechar modal"
          className="absolute right-4 top-4 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="mb-5 pr-10">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold">
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

        {children}
      </div>
    </div>
  )
}
