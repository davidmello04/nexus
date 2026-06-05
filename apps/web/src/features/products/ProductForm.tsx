import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { getCategories } from './categories-service'
import {
  productSchema,
  type ProductFormData,
  type ProductFormInput,
} from './product-schema'

type ProductFormProps = {
  onSubmit: SubmitHandler<ProductFormData>
  isSubmitting?: boolean
}

export function ProductForm({ onSubmit, isSubmitting }: ProductFormProps) {
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      basePrice: 0,
      outsourcedPrice: undefined,
      active: true,
      categoryId: '',
    },
  })

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
          Descricao
        </label>
        <textarea
          {...register('description')}
          className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          placeholder="Descricao do produto"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Preco base
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('basePrice')}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="0,00"
          />
          {errors.basePrice && (
            <p className="mt-1 text-xs text-red-600">
              {errors.basePrice.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Preco terceirizado
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('outsourcedPrice')}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="0,00"
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
            Nao foi possivel carregar as categorias.
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
        <input type="checkbox" {...register('active')} className="h-4 w-4" />
        Produto ativo
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar produto'}
        </button>
      </div>
    </form>
  )
}
