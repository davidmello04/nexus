import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ProductVariantFormData } from './product-variant-schema'
import { ProductVariantForm } from './ProductVariantForm'
import {
  createProductVariant,
  getProductVariants,
} from './product-variants-service'
import type { ProductVariant } from './types'

type ProductVariantsPanelProps = {
  productId: string
}

export function ProductVariantsPanel({ productId }: ProductVariantsPanelProps) {
  const queryClient = useQueryClient()
  const {
    data: variants = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product-variants'],
    queryFn: getProductVariants,
  })
  const createVariantMutation = useMutation({
    mutationFn: createProductVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
  const productVariants = variants.filter(
    (variant) => variant.productId === productId,
  )

  function handleCreateVariant(data: ProductVariantFormData) {
    createVariantMutation.mutate(data)
  }

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Variacoes do produto
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Cadastre combinacoes de tamanho, cor, tipo, material e precos.
        </p>
      </div>

      {createVariantMutation.isError && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Nao foi possivel salvar a variacao.
        </div>
      )}

      <ProductVariantForm
        productId={productId}
        onSubmit={handleCreateVariant}
        isSubmitting={createVariantMutation.isPending}
      />

      <div className="rounded-xl border border-slate-200 bg-white">
        {isLoading && (
          <div className="p-4 text-sm text-slate-500">
            Carregando variacoes...
          </div>
        )}

        {isError && (
          <div className="p-4 text-sm text-red-600">
            Nao foi possivel carregar as variacoes.
          </div>
        )}

        {!isLoading && !isError && productVariants.length === 0 && (
          <div className="p-4 text-sm text-slate-500">
            Nenhuma variacao cadastrada para este produto.
          </div>
        )}

        {!isLoading && !isError && productVariants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-slate-500">
                  <th className="px-3 py-2 font-medium">Tamanho</th>
                  <th className="px-3 py-2 font-medium">Cor</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Material</th>
                  <th className="px-3 py-2 font-medium">Preco base</th>
                  <th className="px-3 py-2 font-medium">Terceirizado</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {productVariants.map((variant) => (
                  <tr
                    key={variant.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-2 text-slate-700">
                      {variant.size || '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {variant.color || '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {variant.type || '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {variant.material || '-'}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {hasPrice(variant.basePrice)
                        ? formatCurrency(variant.basePrice)
                        : '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {hasPrice(variant.outsourcedPrice)
                        ? formatCurrency(variant.outsourcedPrice)
                        : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={[
                          'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                          variant.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700',
                        ].join(' ')}
                      >
                        {variant.active ? 'Ativa' : 'Inativa'}
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

function formatCurrency(value: ProductVariant['basePrice']) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function hasPrice(value: string | number | null | undefined) {
  return value !== null && value !== undefined
}
