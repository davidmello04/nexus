import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { CurrencyInput } from '@/components/CurrencyInput'
import { getCategories } from './categories-service'
import {
  productSchema,
  type ProductFormData,
  type ProductFormInput,
} from './product-schema'

type ProductFormProps = {
  onSubmit: SubmitHandler<ProductFormData>
  isSubmitting?: boolean
  initialData?: ProductFormData
  submitButtonText?: string
  onCancel?: () => void
}

export function ProductForm({
  onSubmit,
  isSubmitting,
  initialData,
  submitButtonText = 'Salvar produto',
  onCancel,
}: ProductFormProps) {
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: getDefaultValues(initialData),
  })

  useEffect(() => {
    reset(getDefaultValues(initialData))
  }, [initialData, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Nome</label>
        <input
          {...register('name')}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          placeholder="Nome do produto"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Descrição
        </label>
        <textarea
          {...register('description')}
          className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          placeholder="Descrição do produto"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Preço base
          </label>
          <Controller
            control={control}
            name="basePrice"
            render={({ field }) => (
              <CurrencyInput
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                placeholder="R$ 0,00"
                disabled={field.disabled}
              />
            )}
          />
          {errors.basePrice && (
            <p className="mt-1 text-xs text-red-600">
              {errors.basePrice.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Preço terceirizado
          </label>
          <Controller
            control={control}
            name="outsourcedPrice"
            render={({ field }) => (
              <CurrencyInput
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                placeholder="R$ 0,00"
                disabled={field.disabled}
              />
            )}
          />
          {errors.outsourcedPrice && (
            <p className="mt-1 text-xs text-red-600">
              {errors.outsourcedPrice.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Categoria</label>
        <select
          {...register('categoryId')}
          disabled={isLoadingCategories}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">Sem categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {isCategoriesError && (
          <p className="mt-1 text-xs text-red-600">
            Não foi possível carregar as categorias.
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
        <input type="checkbox" {...register('active')} className="h-4 w-4" />
        Produto ativo
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

function getDefaultValues(initialData?: ProductFormData): ProductFormInput {
  return {
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    basePrice: initialData?.basePrice ?? '',
    outsourcedPrice: initialData?.outsourcedPrice ?? '',
    active: initialData?.active ?? true,
    categoryId: initialData?.categoryId ?? '',
  }
}
