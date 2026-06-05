import { getCustomers } from '@/features/customers/customers-service'
import { getProducts } from '@/features/products/products-service'
import type { ProductVariant } from '@/features/products/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useFieldArray, useForm, type SubmitHandler } from 'react-hook-form'
import {
  orderSchema,
  type OrderFormData,
  type OrderFormInput,
} from './order-schema'

type OrderFormProps = {
  onSubmit: SubmitHandler<OrderFormData>
  isSubmitting?: boolean
}

export function OrderForm({ onSubmit, isSubmitting }: OrderFormProps) {
  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    isError: isCustomersError,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  })
  const {
    data: products = [],
    isLoading: isLoadingProducts,
    isError: isProductsError,
  } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormInput, unknown, OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: '',
      discount: undefined,
      notes: '',
      items: [
        {
          productId: '',
          productVariantId: '',
          quantity: 1,
          notes: '',
        },
      ],
    },
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })
  const watchedItems = watch('items')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            Nao foi possivel carregar os clientes.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Itens</h3>
          <button
            type="button"
            onClick={() =>
              append({
                productId: '',
                productVariantId: '',
                quantity: 1,
                notes: '',
              })
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Adicionar item
          </button>
        </div>

        {errors.items?.root?.message && (
          <p className="text-xs text-red-600">{errors.items.root.message}</p>
        )}

        {fields.map((field, index) => {
          const selectedProduct = products.find(
            (product) => product.id === watchedItems?.[index]?.productId,
          )
          const variants = selectedProduct?.variants ?? []

          return (
            <div
              key={field.id}
              className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_120px_auto]">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Produto
                  </label>
                  <select
                    {...register(`items.${index}.productId`)}
                    disabled={isLoadingProducts}
                    onChange={(event) => {
                      setValue(`items.${index}.productId`, event.target.value)
                      setValue(`items.${index}.productVariantId`, '')
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {errors.items?.[index]?.productId && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.items[index]?.productId?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Variacao
                  </label>
                  <select
                    {...register(`items.${index}.productVariantId`)}
                    disabled={variants.length === 0}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">Sem variacao</option>
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {formatVariantLabel(variant)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    {...register(`items.${index}.quantity`)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.items[index]?.quantity?.message}
                    </p>
                  )}
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="w-full rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Observacoes do item
                </label>
                <input
                  {...register(`items.${index}.notes`)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                  placeholder="Detalhes do item"
                />
              </div>
            </div>
          )
        })}

        {isProductsError && (
          <p className="text-xs text-red-600">
            Nao foi possivel carregar os produtos.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Desconto</label>
          <input
            type="number"
            min="0"
            step="0.01"
            {...register('discount')}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="0,00"
          />
          {errors.discount && (
            <p className="mt-1 text-xs text-red-600">
              {errors.discount.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Observacoes do pedido
          </label>
          <input
            {...register('notes')}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="Informacoes gerais"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar pedido'}
        </button>
      </div>
    </form>
  )
}

function formatVariantLabel(variant: ProductVariant) {
  const parts = [variant.size, variant.color, variant.type, variant.material]
    .filter(Boolean)
    .join(' / ')

  return parts || `Variacao ${variant.id.slice(0, 8)}`
}
