import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { categorySchema, type CategoryFormData } from './category-schema'

type CategoryFormProps = {
  onSubmit: SubmitHandler<CategoryFormData>
  isSubmitting?: boolean
  initialData?: CategoryFormData
  submitButtonText?: string
  onCancel?: () => void
}

const emptyCategoryFormValues: CategoryFormData = {
  name: '',
  active: true,
}

export function CategoryForm({
  onSubmit,
  isSubmitting,
  initialData,
  submitButtonText = 'Salvar categoria',
  onCancel,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData ?? emptyCategoryFormValues,
  })

  useEffect(() => {
    reset(initialData ?? emptyCategoryFormValues)
  }, [initialData, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Nome</label>
        <input
          {...register('name')}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          placeholder="Nome da categoria"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
        <input type="checkbox" {...register('active')} className="h-4 w-4" />
        Categoria ativa
      </label>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : submitButtonText}
        </button>
      </div>
    </form>
  )
}
