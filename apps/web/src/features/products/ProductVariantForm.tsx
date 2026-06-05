import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import {
  productVariantSchema,
  type ProductVariantFormData,
  type ProductVariantFormInput,
} from './product-variant-schema'

type ProductVariantFormProps = {
  productId: string
  onSubmit: SubmitHandler<ProductVariantFormData>
  isSubmitting?: boolean
}

export function ProductVariantForm({
  productId,
  onSubmit,
  isSubmitting,
}: ProductVariantFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductVariantFormInput, unknown, ProductVariantFormData>({
    resolver: zodResolver(productVariantSchema),
    defaultValues: {
      productId,
      size: '',
      color: '',
      type: '',
      material: '',
      basePrice: undefined,
      outsourcedPrice: undefined,
      active: true,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('productId')} />

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Tamanho</label>
          <input
            {...register('size')}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="P, M, G..."
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Cor</label>
          <input
            {...register('color')}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="Azul"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Tipo</label>
          <input
            {...register('type')}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="Modelo"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Material</label>
          <input
            {...register('material')}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="Algodão"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Preço base
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('basePrice')}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
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
            Preço terceirizado
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('outsourcedPrice')}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="0,00"
          />
          {errors.outsourcedPrice && (
            <p className="mt-1 text-xs text-red-600">
              {errors.outsourcedPrice.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register('active')} className="h-4 w-4" />
          Variação ativa
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar variação'}
        </button>
      </div>
    </form>
  )
}
