import { useMemo, useState } from 'react'
import type { Product, ProductVariant } from '@/features/products/types'
import { formatCurrency } from '@/lib/formatters'

type LineItemProductSelectorProps = {
  products: Product[]
  productId?: string
  productVariantId?: string
  productError?: string
  isLoadingProducts?: boolean
  onProductChange: (productId: string) => void
  onVariantChange: (variantId: string) => void
}

export function LineItemProductSelector({
  products,
  productId = '',
  productVariantId = '',
  productError,
  isLoadingProducts,
  onProductChange,
  onVariantChange,
}: LineItemProductSelectorProps) {
  const [productSearch, setProductSearch] = useState('')
  const selectedProduct = products.find((product) => product.id === productId)
  const selectedVariant = selectedProduct?.variants?.find(
    (variant) => variant.id === productVariantId,
  )
  const visibleProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLowerCase()

    return products.filter((product) => {
      const canShowInactiveCompatibility = product.id === productId
      const canShowByStatus = product.active || canShowInactiveCompatibility
      const categoryName = product.category?.name ?? ''
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        categoryName.toLowerCase().includes(normalizedSearch)

      return canShowByStatus && matchesSearch
    })
  }, [productId, productSearch, products])
  const variants = selectedProduct?.variants ?? []
  const visibleVariants = variants.filter(
    (variant) => variant.active || variant.id === productVariantId,
  )

  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <label className="text-sm font-medium text-slate-700">Produto</label>
          <input
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="Buscar produto por nome ou categoria"
          />
          <select
            value={productId}
            disabled={isLoadingProducts}
            onChange={(event) => {
              onProductChange(event.target.value)
              onVariantChange('')
            }}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">Selecione um produto</option>
            {visibleProducts.map((product) => (
              <option
                key={product.id}
                value={product.id}
                disabled={!product.active && product.id !== productId}
              >
                {formatProductOption(product)}
              </option>
            ))}
          </select>
          {productError && (
            <p className="mt-1 text-xs text-red-600">{productError}</p>
          )}
          {productSearch && visibleProducts.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Nenhum produto ativo encontrado para a busca.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Variação
          </label>
          <select
            value={productVariantId}
            disabled={!selectedProduct || visibleVariants.length === 0}
            onChange={(event) => onVariantChange(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              {selectedProduct && variants.length === 0
                ? 'Produto sem variações'
                : 'Sem variação'}
            </option>
            {visibleVariants.map((variant) => (
              <option
                key={variant.id}
                value={variant.id}
                disabled={!variant.active && variant.id !== productVariantId}
              >
                {formatVariantOption(variant)}
              </option>
            ))}
          </select>
          {selectedProduct && variants.length > 0 && visibleVariants.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Este produto não possui variações ativas.
            </p>
          )}
        </div>
      </div>

      {selectedProduct && (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 md:grid-cols-2">
          <div>
            <strong className="block text-sm text-slate-900">
              {selectedProduct.name}
            </strong>
            <span>{selectedProduct.category?.name || 'Sem categoria'}</span>
            {!selectedProduct.active && (
              <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                Inativo
              </span>
            )}
            <p className="mt-1">
              Base: {formatCurrency(selectedProduct.basePrice)}
              {selectedProduct.outsourcedPrice !== null &&
                selectedProduct.outsourcedPrice !== undefined &&
                ` | Terceirizado: ${formatCurrency(selectedProduct.outsourcedPrice)}`}
            </p>
          </div>

          <div>
            <strong className="block text-sm text-slate-900">
              {selectedVariant
                ? formatVariantName(selectedVariant)
                : 'Sem variação selecionada'}
            </strong>
            {selectedVariant ? (
              <>
                {!selectedVariant.active && (
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-700">
                    Inativa
                  </span>
                )}
                <p className="mt-1">
                  {formatVariantPrices(selectedVariant) ||
                    'Sem preço próprio cadastrado'}
                </p>
              </>
            ) : (
              <p className="mt-1">O preço final será calculado ao salvar.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatProductOption(product: Product) {
  const parts = [
    product.name,
    product.category?.name,
    `Base ${formatCurrency(product.basePrice)}`,
    product.outsourcedPrice !== null && product.outsourcedPrice !== undefined
      ? `Terc. ${formatCurrency(product.outsourcedPrice)}`
      : undefined,
    !product.active ? 'Inativo' : undefined,
  ].filter(Boolean)

  return parts.join(' - ')
}

function formatVariantOption(variant: ProductVariant) {
  return [
    formatVariantName(variant),
    formatVariantPrices(variant),
    !variant.active ? 'Inativa' : undefined,
  ]
    .filter(Boolean)
    .join(' - ')
}

function formatVariantName(variant: ProductVariant) {
  const parts = [variant.size, variant.color, variant.type, variant.material]
    .filter(Boolean)
    .join(' / ')

  return parts || `Variação ${variant.id.slice(0, 8)}`
}

function formatVariantPrices(variant: ProductVariant) {
  return [
    variant.basePrice !== null && variant.basePrice !== undefined
      ? `Base ${formatCurrency(variant.basePrice)}`
      : undefined,
    variant.outsourcedPrice !== null && variant.outsourcedPrice !== undefined
      ? `Terc. ${formatCurrency(variant.outsourcedPrice)}`
      : undefined,
  ]
    .filter(Boolean)
    .join(' | ')
}
