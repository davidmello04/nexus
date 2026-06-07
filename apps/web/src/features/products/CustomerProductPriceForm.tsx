import { getCustomers } from '@/features/customers/customers-service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm, type SubmitHandler } from 'react-hook-form'
import {
  customerProductPriceSchema,
  type CustomerProductPriceFormData,
  type CustomerProductPriceFormInput,
} from './customer-product-price-schema'
import type { ProductVariant } from './types'

type CustomerProductPriceFormProps = {
  productId: string
  variants: ProductVariant[]
  onSubmit: SubmitHandler<CustomerProductPriceFormData>
  isSubmitting?: boolean
}

export function CustomerProductPriceForm({
  productId,
  variants,
  onSubmit,
  isSubmitting,
}: CustomerProductPriceFormProps) {
  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    isError: isCustomersError,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<
    CustomerProductPriceFormInput,
    unknown,
    CustomerProductPriceFormData
  >({
    resolver: zodResolver(customerProductPriceSchema),
    defaultValues: {
      customerId: '',
      productId,
      variantId: '',
      price: '',
      active: true,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('productId')} />

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Cliente</label>
          <select
            {...register('customerId')}
            disabled={isLoadingCustomers}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">Selecione um cliente</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {errors.customerId && (
            <p className="mt-1 text-xs text-red-600">
              {errors.customerId.message}
            </p>
          )}
          {isCustomersError && (
            <p className="mt-1 text-xs text-red-600">
              Não foi possível carregar os clientes.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Variação
          </label>
          <select
            {...register('variantId')}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            <option value="">Sem variação</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {formatVariantLabel(variant)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Preço</label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('price')}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="0,00"
          />
          {errors.price && (
            <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register('active')} className="h-4 w-4" />
          Preço ativo
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar preço'}
        </button>
      </div>
    </form>
  )
}

function formatVariantLabel(variant: ProductVariant) {
  const parts = [variant.size, variant.color, variant.type, variant.material]
    .filter(Boolean)
    .join(' / ')

  return parts || `Variação ${variant.id.slice(0, 8)}`
}
