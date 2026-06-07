import { Fragment, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DollarSign, Image as ImageIcon, Layers } from 'lucide-react'
import { Modal } from '@/components/Modal'
import { ProductForm } from './ProductForm'
import { ProductImageUpload } from './ProductImageUpload'
import { ProductVariantsPanel } from './ProductVariantsPanel'
import { CustomerProductPricesPanel } from './CustomerProductPricesPanel'
import type { ProductFormData } from './product-schema'
import { createProduct, getProducts } from './products-service'
import type { Product, ProductImage } from './types'

const apiAssetBaseUrl = (
  import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
).replace(/\/api\/?$/, '')

export function ProductsPage() {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [uploadProductId, setUploadProductId] = useState<string | null>(null)
  const [variantsProductId, setVariantsProductId] = useState<string | null>(
    null,
  )
  const [pricesProductId, setPricesProductId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsProductModalOpen(false)
    },
  })

  function handleCreateProduct(data: ProductFormData) {
    createProductMutation.mutate(data)
  }

  function handleNewProductClick() {
    createProductMutation.reset()
    setIsProductModalOpen(true)
  }

  function handleCloseProductModal() {
    createProductMutation.reset()
    setIsProductModalOpen(false)
  }

  function handleUploadSuccess() {
    queryClient.invalidateQueries({ queryKey: ['products'] })
    setUploadProductId(null)
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="mt-2 text-sm text-slate-500">
            Produtos, imagens, variações e preços.
          </p>
        </div>

        <button
          type="button"
          onClick={handleNewProductClick}
          className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Novo produto
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        {isLoading && (
          <div className="p-6 text-sm text-slate-500">
            Carregando produtos...
          </div>
        )}

        {isError && (
          <div className="p-6 text-sm text-red-600">
            Não foi possível carregar os produtos.
          </div>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <div className="p-6 text-sm text-slate-500">
            Nenhum produto cadastrado ainda.
          </div>
        )}

        {!isLoading && !isError && products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Preço base</th>
                  <th className="px-4 py-3 font-medium">Terceirizado</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Variações
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const mainImage = getMainImage(product)

                  return (
                    <Fragment key={product.id}>
                      <tr className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                              {mainImage ? (
                                <img
                                  src={getImageUrl(mainImage.url)}
                                  alt={mainImage.alt || product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400">
                                  Sem foto
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {product.name}
                              </p>
                              {product.description && (
                                <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {product.category?.name || '-'}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-900">
                          {formatCurrency(product.basePrice)}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {hasPrice(product.outsourcedPrice)
                            ? formatCurrency(product.outsourcedPrice)
                            : '-'}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                              product.active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700',
                            ].join(' ')}
                          >
                            {product.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right text-slate-600">
                          {product.variants?.length ?? 0}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setUploadProductId((currentProductId) =>
                                  currentProductId === product.id
                                    ? null
                                    : product.id,
                                )
                              }
                              title="Gerenciar imagem"
                              aria-label={`Gerenciar imagem de ${product.name}`}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50"
                            >
                              <ImageIcon
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setVariantsProductId((currentProductId) =>
                                  currentProductId === product.id
                                    ? null
                                    : product.id,
                                )
                              }
                              title="Gerenciar variações"
                              aria-label={`Gerenciar variações de ${product.name}`}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50"
                            >
                              <Layers className="h-4 w-4" aria-hidden="true" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setPricesProductId((currentProductId) =>
                                  currentProductId === product.id
                                    ? null
                                    : product.id,
                                )
                              }
                              title="Gerenciar preços"
                              aria-label={`Gerenciar preços de ${product.name}`}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50"
                            >
                              <DollarSign
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {uploadProductId === product.id && (
                        <tr className="border-b border-slate-100">
                          <td colSpan={7} className="px-4 py-4">
                            <ProductImageUpload
                              productId={product.id}
                              onSuccess={handleUploadSuccess}
                            />
                          </td>
                        </tr>
                      )}

                      {variantsProductId === product.id && (
                        <tr className="border-b border-slate-100">
                          <td colSpan={7} className="px-4 py-4">
                            <ProductVariantsPanel productId={product.id} />
                          </td>
                        </tr>
                      )}

                      {pricesProductId === product.id && (
                        <tr className="border-b border-slate-100">
                          <td colSpan={7} className="px-4 py-4">
                            <CustomerProductPricesPanel
                              productId={product.id}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={isProductModalOpen}
        title="Novo produto"
        description="Preencha os dados para cadastrar um novo produto."
        onClose={handleCloseProductModal}
      >
        {createProductMutation.isError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Não foi possível salvar o produto.
          </div>
        )}

        <ProductForm
          onSubmit={handleCreateProduct}
          isSubmitting={createProductMutation.isPending}
        />
      </Modal>
    </div>
  )
}

function getMainImage(product: Product) {
  return product.images?.find((image) => image.isMain) ?? product.images?.[0]
}

function getImageUrl(url: ProductImage['url']) {
  if (url.startsWith('http')) {
    return url
  }

  return `${apiAssetBaseUrl}${url}`
}

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function hasPrice(value: string | number | null | undefined) {
  return value !== null && value !== undefined
}
