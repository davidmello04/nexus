import { useEffect } from 'react'
import { getCustomers } from '@/features/customers/customers-service'
import { getProducts } from '@/features/products/products-service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form'
import { CurrencyInput } from '@/components/CurrencyInput'
import { LineItemProductSelector } from '@/components/LineItemProductSelector'
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
  const selectedCustomer = customers.find((customer) => customer.id === customerId)
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
        {selectedCustomer?.isOutsourced && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            Cliente terceirizado. O preço final será calculado automaticamente ao salvar.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Itens</h3>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre os produtos, variações e quantidades do pedido.
          </p>
        </div>

        {errors.items?.root?.message && (
          <p className="text-xs text-red-600">{errors.items.root.message}</p>
        )}

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/45 p-4 shadow-sm shadow-blue-100/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="inline-flex items-center rounded-full border border-blue-100 bg-white px-3 py-1 text-sm font-semibold text-blue-900">
                  Item {index + 1}
                </h4>

              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="cursor-pointer rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50"
                >
                  Remover item
                </button>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_120px]">
              <LineItemProductSelector
                products={products}
                productId={watchedItems?.[index]?.productId}
                productVariantId={watchedItems?.[index]?.productVariantId}
                productError={errors.items?.[index]?.productId?.message}
                isLoadingProducts={isLoadingProducts}
                onProductChange={(productId) =>
                  setValue(`items.${index}.productId`, productId, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                onVariantChange={(variantId) =>
                  setValue(`items.${index}.productVariantId`, variantId, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />

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
        ))}

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
          className="w-full cursor-pointer rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
        >
          Adicionar item
        </button>

        {isProductsError && (
          <p className="text-xs text-red-600">
            Não foi possível carregar os produtos.
          </p>
        )}

        <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Os valores exibidos em produto e variação são referência. O preço final será calculado automaticamente ao salvar.
        </p>
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

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-5 shadow-sm shadow-blue-100/50">
        <h3 className="text-sm font-semibold text-slate-900">
          Resumo estimado
        </h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <dt className="text-slate-500">Subtotal estimado</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatCurrency(estimatedSubtotal)}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <dt className="text-slate-500">Desconto</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {formatCurrency(estimatedDiscount)}
            </dd>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-700 to-indigo-700 p-4 shadow-sm shadow-blue-900/20">
            <dt className="text-slate-300">Total estimado</dt>
            <dd className="mt-1 font-semibold text-white">
              {formatCurrency(estimatedTotal)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-2 border-t border-blue-100 bg-white/95 px-6 py-4 backdrop-blur">
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
      <div className="rounded-xl border border-dashed border-blue-200 bg-white/80 p-4 text-sm text-slate-500">
        Selecione cliente e produto para calcular a prévia de preço.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-blue-100 bg-white p-4 text-sm text-slate-500">
        Calculando preço...
      </div>
    )
  }

  if (isError || unitPrice === undefined || total === undefined) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Não foi possível resolver o preço deste item.
      </div>
    )
  }

  return (
    <div className="grid gap-3 rounded-xl border border-blue-100 bg-white p-4 text-sm shadow-sm shadow-blue-100/40 md:grid-cols-3">
      <div>
        <span className="text-slate-500">Preço unitário</span>
        <p className="mt-1 font-bold text-slate-950">
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
        <p className="mt-1 font-bold text-blue-800">
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
