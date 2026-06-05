import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CustomerProductPriceFormData } from './customer-product-price-schema'
import { CustomerProductPriceForm } from './CustomerProductPriceForm'
import {
  createCustomerProductPrice,
  getCustomerProductPrices,
} from './customer-product-prices-service'
import { getProductVariants } from './product-variants-service'
import type { CustomerProductPrice, ProductVariant } from './types'

type CustomerProductPricesPanelProps = {
  productId: string
}

export function CustomerProductPricesPanel({
  productId,
}: CustomerProductPricesPanelProps) {
  const queryClient = useQueryClient()
  const {
    data: prices = [],
    isLoading: isLoadingPrices,
    isError: isPricesError,
  } = useQuery({
    queryKey: ['customer-product-prices'],
    queryFn: getCustomerProductPrices,
  })
  const {
    data: variants = [],
    isLoading: isLoadingVariants,
    isError: isVariantsError,
  } = useQuery({
    queryKey: ['product-variants'],
    queryFn: getProductVariants,
  })
  const createPriceMutation = useMutation({
    mutationFn: createCustomerProductPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-product-prices'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
  const productPrices = prices.filter((price) => price.productId === productId)
  const productVariants = variants.filter(
    (variant) => variant.productId === productId,
  )

  function handleCreatePrice(data: CustomerProductPriceFormData) {
    createPriceMutation.mutate(data)
  }

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Preços específicos
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Configure preços por cliente para o produto ou para uma variação.
        </p>
      </div>

      {createPriceMutation.isError && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Não foi possível salvar o preço específico.
        </div>
      )}

      {isVariantsError && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Não foi possível carregar as variações.
        </div>
      )}

      <CustomerProductPriceForm
        productId={productId}
        variants={productVariants}
        onSubmit={handleCreatePrice}
        isSubmitting={createPriceMutation.isPending || isLoadingVariants}
      />

      <div className="rounded-xl border border-slate-200 bg-white">
        {isLoadingPrices && (
          <div className="p-4 text-sm text-slate-500">
            Carregando preços específicos...
          </div>
        )}

        {isPricesError && (
          <div className="p-4 text-sm text-red-600">
            Não foi possível carregar os preços específicos.
          </div>
        )}

        {!isLoadingPrices && !isPricesError && productPrices.length === 0 && (
          <div className="p-4 text-sm text-slate-500">
            Nenhum preço específico cadastrado para este produto.
          </div>
        )}

        {!isLoadingPrices && !isPricesError && productPrices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-slate-500">
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Variação</th>
                  <th className="px-3 py-2 font-medium">Preço</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {productPrices.map((price) => (
                  <tr
                    key={price.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {price.customer?.name || price.customerId}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {price.variant
                        ? formatVariantLabel(price.variant)
                        : 'Sem variação'}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {formatCurrency(price.price)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={[
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          price.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700',
                        ].join(' ')}
                      >
                        {price.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function formatVariantLabel(variant: ProductVariant) {
  const parts = [variant.size, variant.color, variant.type, variant.material]
    .filter(Boolean)
    .join(' / ')

  return parts || `Variação ${variant.id.slice(0, 8)}`
}

function formatCurrency(value: CustomerProductPrice['price']) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
