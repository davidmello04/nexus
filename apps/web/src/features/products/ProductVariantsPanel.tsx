import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Power, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { formatCurrency } from '@/lib/formatters'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import type { ProductVariantFormData } from './product-variant-schema'
import { ProductVariantForm } from './ProductVariantForm'
import {
  createProductVariant,
  deleteProductVariant,
  getProductVariants,
  updateProductVariant,
  updateProductVariantActive,
} from './product-variants-service'
import type { ProductVariant } from './types'

type ProductVariantsPanelProps = {
  productId: string
}

export function ProductVariantsPanel({ productId }: ProductVariantsPanelProps) {
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null,
  )
  const [variantToDelete, setVariantToDelete] = useState<ProductVariant | null>(
    null,
  )
  const [formResetKey, setFormResetKey] = useState(0)
  const queryClient = useQueryClient()
  const {
    data: variants = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product-variants'],
    queryFn: getProductVariants,
  })

  function invalidateVariantQueries() {
    queryClient.invalidateQueries({ queryKey: ['product-variants'] })
    queryClient.invalidateQueries({ queryKey: ['products'] })
  }

  const createVariantMutation = useMutation({
    mutationFn: createProductVariant,
    onSuccess: () => {
      invalidateVariantQueries()
      setFormResetKey((key) => key + 1)
    },
  })
  const updateVariantMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductVariantFormData }) =>
      updateProductVariant(id, data),
    onSuccess: () => {
      invalidateVariantQueries()
      setEditingVariant(null)
    },
  })
  const toggleVariantMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateProductVariantActive(id, active),
    onSuccess: () => {
      invalidateVariantQueries()
    },
  })
  const deleteVariantMutation = useMutation({
    mutationFn: deleteProductVariant,
    onSuccess: () => {
      invalidateVariantQueries()
      setEditingVariant(null)
      setVariantToDelete(null)
    },
  })
  const productVariants = variants.filter(
    (variant) => variant.productId === productId,
  )
  const editingVariantInitialData = editingVariant
    ? mapVariantToFormData(editingVariant)
    : undefined
  const isSubmitting =
    createVariantMutation.isPending || updateVariantMutation.isPending

  function handleSubmitVariant(data: ProductVariantFormData) {
    if (editingVariant) {
      updateVariantMutation.mutate({ id: editingVariant.id, data })
      return
    }

    createVariantMutation.mutate(data)
  }

  function handleEditVariant(variant: ProductVariant) {
    createVariantMutation.reset()
    updateVariantMutation.reset()
    setEditingVariant(variant)
  }

  function handleCancelEditVariant() {
    updateVariantMutation.reset()
    setEditingVariant(null)
  }

  function handleToggleVariant(variant: ProductVariant) {
    toggleVariantMutation.mutate({
      id: variant.id,
      active: !variant.active,
    })
  }

  function handleDeleteVariant(variant: ProductVariant) {
    deleteVariantMutation.reset()
    setVariantToDelete(variant)
  }

  function handleCancelDeleteVariant() {
    deleteVariantMutation.reset()
    setVariantToDelete(null)
  }

  function handleConfirmDeleteVariant() {
    if (!variantToDelete) {
      return
    }

    deleteVariantMutation.mutate(variantToDelete.id)
  }

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Variações do produto
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Cadastre combinações de tamanho, cor, tipo, material e preços.
        </p>
      </div>

      {(createVariantMutation.isError || updateVariantMutation.isError) && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          Não foi possível salvar a variação.
        </div>
      )}

      <ProductVariantForm
        key={editingVariant?.id ?? formResetKey}
        productId={productId}
        onSubmit={handleSubmitVariant}
        isSubmitting={isSubmitting}
        initialData={editingVariantInitialData}
        submitButtonText={
          editingVariant ? 'Atualizar variação' : 'Salvar variação'
        }
        onCancel={editingVariant ? handleCancelEditVariant : undefined}
      />

      <div className="rounded-xl border border-slate-200 bg-white">
        {isLoading && (
          <div className="p-4 text-sm text-slate-500">
            Carregando variações...
          </div>
        )}

        {isError && (
          <div className="p-4 text-sm text-red-600">
            Não foi possível carregar as variações.
          </div>
        )}

        {!isLoading && !isError && productVariants.length === 0 && (
          <div className="p-4 text-sm text-slate-500">
            Nenhuma variação cadastrada para este produto.
          </div>
        )}

        {!isLoading && !isError && productVariants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-slate-500">
                  <th className="px-3 py-2 font-medium">Tamanho/Medida</th>
                  <th className="px-3 py-2 font-medium">Cor</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Material</th>
                  <th className="px-3 py-2 font-medium">Preço base</th>
                  <th className="px-3 py-2 font-medium">Terceirizado</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Ações</th>
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
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditVariant(variant)}
                          title="Editar variação"
                          aria-label="Editar variação"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleVariant(variant)}
                          disabled={toggleVariantMutation.isPending}
                          title={
                            variant.active
                              ? 'Inativar variação'
                              : 'Ativar variação'
                          }
                          aria-label={
                            variant.active
                              ? 'Inativar variação'
                              : 'Ativar variação'
                          }
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Power className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(variant)}
                          disabled={deleteVariantMutation.isPending}
                          title="Excluir variação"
                          aria-label="Excluir variação"
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(variantToDelete)}
        title="Excluir variação"
        description="Tem certeza que deseja excluir esta variação? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteVariantMutation.isPending}
        errorMessage={
          deleteVariantMutation.isError
            ? getApiErrorMessage(
                deleteVariantMutation.error,
                'Não foi possível excluir esta variação.',
              )
            : undefined
        }
        onConfirm={handleConfirmDeleteVariant}
        onCancel={handleCancelDeleteVariant}
      />
    </div>
  )
}

function mapVariantToFormData(variant: ProductVariant): ProductVariantFormData {
  return {
    productId: variant.productId,
    size: variant.size ?? '',
    color: variant.color ?? '',
    type: variant.type ?? '',
    material: variant.material ?? '',
    basePrice: parseOptionalPrice(variant.basePrice),
    outsourcedPrice: parseOptionalPrice(variant.outsourcedPrice),
    active: variant.active,
  }
}

function parseOptionalPrice(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return undefined
  }

  return Number(value)
}

function hasPrice(value: string | number | null | undefined) {
  return value !== null && value !== undefined
}
