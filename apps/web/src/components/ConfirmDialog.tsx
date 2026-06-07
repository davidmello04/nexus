import { X } from 'lucide-react'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  variant?: 'default' | 'danger'
  isLoading?: boolean
  errorMessage?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  isLoading,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  const confirmButtonClassName =
    variant === 'danger'
      ? 'cursor-pointer rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60'
      : 'cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'

  const descriptionParagraphs = description
    .split('\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          title="Fechar modal"
          aria-label="Fechar modal"
          className="absolute right-4 top-4 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2
          id="confirm-dialog-title"
          className="pr-10 text-lg font-semibold text-slate-950"
        >
          {title}
        </h2>

        <div
          id="confirm-dialog-description"
          className="mt-2 space-y-2 text-sm leading-6 text-slate-600"
        >
          {descriptionParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmButtonClassName}
          >
            {isLoading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
