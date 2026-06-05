import { useQuery } from '@tanstack/react-query'
import { getProducts } from './products-service'
import type { Product, ProductImage } from './types'

const apiAssetBaseUrl = (
  import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
).replace(/\/api\/?$/, '')

export function ProductsPage() {
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
        <p className="mt-2 text-sm text-slate-500">
          Produtos, imagens, variacoes e precos.
        </p>
      </div>

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
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const mainImage = getMainImage(product)

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-slate-100 last:border-0"
                    >
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
                    </tr>
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
