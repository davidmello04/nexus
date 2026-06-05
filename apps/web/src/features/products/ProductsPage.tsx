import { Fragment, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  const [isFormOpen, setIsFormOpen] = useState(false)
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
      setIsFormOpen(false)
    },
  })

  function handleCreateProduct(data: ProductFormData) {
    createProductMutation.mutate(data)
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
            Produtos, imagens, variacoes e precos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen((state) => !state)}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {isFormOpen ? 'Fechar' : 'Novo produto'}
        </button>
      </div>

      {isFormOpen && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Novo produto</h2>
            <p className="mt-1 text-sm text-slate-500">
              Preencha os dados para cadastrar um novo produto.
            </p>
          </div>

          {createProductMutation.isError && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Nao foi possivel salvar o produto.
            </div>
          )}

          <ProductForm
            onSubmit={handleCreateProduct}
            isSubmitting={createProductMutation.isPending}
          />
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        {isLoading && (
          <div className="p-6 text-sm text-slate-500">
            Carregando produtos...
          </div>
        )}

        {isError && (
          <div className="p-6 text-sm text-red-600">
            Nao foi possivel carregar os produtos.
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
                  <th className="px-4 py-3 font-medium">Preco base</th>
                  <th className="px-4 py-3 font-medium">Terceirizado</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Variacoes
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Acoes</th>
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
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Imagem
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
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Variacoes
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
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Precos
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
