import { useEffect } from 'react'
import { getCustomers } from '@/features/customers/customers-service'
import { getProducts } from '@/features/products/products-service'
import type { ProductVariant } from '@/features/products/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form'
import { CurrencyInput } from '@/components/CurrencyInput'
import { formatCurrency } from '@/lib/formatters'
import {
  orderSchema,
  type OrderFormData,
  type OrderFormInput,
} from './order-schema'
import { resolvePrice, type ResolvedPriceSource } from './pricing-service'
import type { Order } from './types'

type OrderFormProps = {
  onSubmit: SubmitHandler<OrderFormData>
  isSubmitting?: boolean
  initialData?: Order | null
  submitButtonText?: string
  onCancel?: () => void
}

export function OrderForm({
  onSubmit,
  isSubmitting,
  initialData,
  submitButtonText = 'Salvar pedido',
  onCancel,
}: OrderFormProps) {
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
    reset,
    formState: { errors },
  } = useForm<OrderFormInput, unknown, OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: getOrderFormDefaultValues(initialData),
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })
  const customerId = watch('customerId')
  const watchedItems = watch('items')
  const discount = watch('discount')
  const priceQueries = useQueries({
    queries: fields.map((field, index) => {
      const item = watchedItems?.[index]
      const productId = item?.productId || ''
      const variantId = item?.productVariantId || ''

      return {
        queryKey: [
          'pricing',
          'resolve',
          customerId,
          productId,
          variantId || null,
          field.id,
        ],
        queryFn: () =>
          resolvePrice({
            customerId,
            productId,
            variantId: variantId || undefined,
          }),
        enabled: Boolean(customerId && productId),
      }
    }),
  })
  const previewItems = fields.map((field, index) => {
    const query = priceQueries[index]
    const quantity = Number(watchedItems?.[index]?.quantity) || 0
    const unitPrice = query?.data ? Number(query.data.price) : undefined

    return {
      fieldId: field.id,
      quantity,
      unitPrice,
      total:
        unitPrice !== undefined && Number.isFinite(unitPrice)
          ? unitPrice * quantity
          : undefined,
    }
  })
  const estimatedSubtotal = previewItems.reduce(
    (subtotal, item) => subtotal + (item.total ?? 0),
    0,
  )
  const estimatedDiscount = Number(discount) || 0
  const estimatedTotal = Math.max(estimatedSubtotal - estimatedDiscount, 0)

  useEffect(() => {
    reset(getOrderFormDefaultValues(initialData))
  }, [initialData, reset])

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
            Não foi possível carregar os clientes.
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
            className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
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
                    Variação
                  </label>
                  <select
                    {...register(`items.${index}.productVariantId`)}
                    disabled={variants.length === 0}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                    className="w-full cursor-pointer rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Observações do item
                </label>
                <input
                  {...register(`items.${index}.notes`)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                  placeholder="Detalhes do item"
                />
              </div>

              <ItemPricePreview
                isReady={Boolean(customerId && watchedItems?.[index]?.productId)}
                isLoading={priceQueries[index]?.isLoading}
                isError={priceQueries[index]?.isError}
                unitPrice={previewItems[index]?.unitPrice}
                source={priceQueries[index]?.data?.source}
                total={previewItems[index]?.total}
              />
            </div>
          )
        })}

        {isProductsError && (
          <p className="text-xs text-red-600">
            Não foi possível carregar os produtos.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Desconto</label>
          <Controller
            control={control}
            name="discount"
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
          {errors.discount && (
            <p className="mt-1 text-xs text-red-600">
              {errors.discount.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Observações do pedido
          </label>
          <input
            {...register('notes')}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="Informações gerais"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Resumo estimado
        </h3>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Subtotal estimado</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatCurrency(estimatedSubtotal)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Desconto</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatCurrency(estimatedDiscount)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Total estimado</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatCurrency(estimatedTotal)}
            </dd>
          </div>
        </dl>
      </div>

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

function getOrderFormDefaultValues(order?: Order | null): OrderFormInput {
  if (!order) {
    return {
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
    }
  }

  return {
    customerId: order.customerId,
    discount:
      order.discount === null || order.discount === undefined
        ? undefined
        : Number(order.discount),
    notes: order.notes || '',
    items: order.items.map((item) => ({
      productId: item.productId,
      productVariantId: item.productVariantId || '',
      quantity: item.quantity,
      notes: item.notes || '',
    })),
  }
}

type ItemPricePreviewProps = {
  isReady: boolean
  isLoading?: boolean
  isError?: boolean
  unitPrice?: number
  source?: ResolvedPriceSource
  total?: number
}

function ItemPricePreview({
  isReady,
  isLoading,
  isError,
  unitPrice,
  source,
  total,
}: ItemPricePreviewProps) {
  if (!isReady) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
        Selecione cliente e produto para calcular a prévia de preço.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
        Calculando preço...
      </div>
    )
  }

  if (isError || unitPrice === undefined || total === undefined) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Não foi possível resolver o preço deste item.
      </div>
    )
  }

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm sm:grid-cols-3">
      <div>
        <span className="text-slate-500">Preço unitário</span>
        <p className="mt-1 font-semibold text-slate-900">
          {formatCurrency(unitPrice)}
        </p>
      </div>
      <div>
        <span className="text-slate-500">Origem do preço</span>
        <p className="mt-1 font-semibold text-slate-900">
          {source ? formatPriceSource(source) : '-'}
        </p>
      </div>
      <div>
        <span className="text-slate-500">Total do item</span>
        <p className="mt-1 font-semibold text-slate-900">
          {formatCurrency(total)}
        </p>
      </div>
    </div>
  )
}

function formatPriceSource(source: ResolvedPriceSource) {
  const labels: Record<ResolvedPriceSource, string> = {
    CUSTOMER_PRODUCT_VARIANT: 'Preço específico do cliente para variação',
    CUSTOMER_PRODUCT: 'Preço específico do cliente para produto',
    VARIANT_OUTSOURCED: 'Preço terceirizado da variação',
    PRODUCT_OUTSOURCED: 'Preço terceirizado do produto',
    VARIANT_BASE: 'Preço base da variação',
    PRODUCT_BASE: 'Preço base do produto',
  }

  return labels[source]
}

function formatVariantLabel(variant: ProductVariant) {
  const parts = [variant.size, variant.color, variant.type, variant.material]
    .filter(Boolean)
    .join(' / ')

  return parts || `Variação ${variant.id.slice(0, 8)}`
}
