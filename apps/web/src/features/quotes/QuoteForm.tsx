import { useEffect } from 'react'
import { getCustomers } from '@/features/customers/customers-service'
import { getProducts } from '@/features/products/products-service'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form'
import { CurrencyInput } from '@/components/CurrencyInput'
import { LineItemProductSelector } from '@/components/LineItemProductSelector'
import {
  quoteSchema,
  type QuoteFormData,
  type QuoteFormInput,
} from './quote-schema'
import type { Quote } from './types'

type QuoteFormProps = {
  onSubmit: SubmitHandler<QuoteFormData>
  isSubmitting?: boolean
  initialData?: Quote | null
  submitButtonText?: string
  onCancel?: () => void
}

export function QuoteForm({
  onSubmit,
  isSubmitting,
  initialData,
  submitButtonText = 'Salvar orçamento',
  onCancel,
}: QuoteFormProps) {
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  })
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
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
  } = useForm<QuoteFormInput, unknown, QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: getQuoteFormDefaultValues(initialData),
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })
  const customerId = watch('customerId')
  const watchedItems = watch('items')
  const selectedCustomer = customers.find((customer) => customer.id === customerId)

  useEffect(() => {
    reset(getQuoteFormDefaultValues(initialData))
  }, [initialData, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
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
          {selectedCustomer?.isOutsourced && (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Cliente terceirizado. O preço final será calculado automaticamente ao salvar.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Válido até
          </label>
          <input
            type="date"
            {...register('validUntil')}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Itens</h3>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre produtos, variações e quantidades do orçamento.
          </p>
        </div>

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
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Observações do orçamento
          </label>
          <input
            {...register('notes')}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="Informações gerais"
          />
        </div>
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

function getQuoteFormDefaultValues(quote?: Quote | null): QuoteFormInput {
  if (!quote) {
    return {
      customerId: '',
      discount: undefined,
      notes: '',
      validUntil: '',
      items: [{ productId: '', productVariantId: '', quantity: 1, notes: '' }],
    }
  }

  return {
    customerId: quote.customerId,
    discount: quote.discount === undefined ? undefined : Number(quote.discount),
    notes: quote.notes || '',
    validUntil: quote.validUntil ? quote.validUntil.slice(0, 10) : '',
    items: quote.items.map((item) => ({
      productId: item.productId,
      productVariantId: item.productVariantId || '',
      quantity: item.quantity,
      notes: item.notes || '',
    })),
  }
}
