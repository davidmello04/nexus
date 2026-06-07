import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Save, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { ProductImageUpload } from './ProductImageUpload'
import {
  deleteProductImage,
  getProductImages,
  updateProductImage,
} from './products-service'
import type { ProductImage } from './types'

type ProductImagesPanelProps = {
  productId: string
}

const apiAssetBaseUrl = (
  import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
).replace(/\/api\/?$/, '')

export function ProductImagesPanel({ productId }: ProductImagesPanelProps) {
  const [editingAltByImageId, setEditingAltByImageId] = useState<
    Record<string, string>
  >({})
  const [imageToDelete, setImageToDelete] = useState<ProductImage | null>(null)
  const queryClient = useQueryClient()
  const queryKey = ['product-images', productId]

  const {
    data: images = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: () => getProductImages(productId),
  })

  function invalidateImages() {
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey })
  }

  const updateImageMutation = useMutation({
    mutationFn: ({ id, alt, isMain }: { id: string; alt?: string; isMain?: boolean }) =>
      updateProductImage(id, { alt, isMain }),
    onSuccess: () => {
      invalidateImages()
    },
  })
  const deleteImageMutation = useMutation({
    mutationFn: deleteProductImage,
    onSuccess: () => {
      invalidateImages()
      setImageToDelete(null)
    },
  })

  function handleUploadSuccess() {
    invalidateImages()
  }

  function handleAltChange(imageId: string, alt: string) {
    setEditingAltByImageId((current) => ({
      ...current,
      [imageId]: alt,
    }))
  }

  function handleSaveAlt(image: ProductImage) {
    updateImageMutation.mutate(
      {
        id: image.id,
        alt: editingAltByImageId[image.id] ?? image.alt ?? '',
      },
      {
        onSuccess: () => {
          setEditingAltByImageId((current) => {
            const next = { ...current }
            delete next[image.id]
            return next
          })
        },
      },
    )
  }

  function handleSetMain(image: ProductImage) {
    updateImageMutation.mutate({
      id: image.id,
      isMain: true,
    })
  }

  function handleDeleteImage(image: ProductImage) {
    deleteImageMutation.reset()
    setImageToDelete(image)
  }

  function handleCancelDeleteImage() {
    deleteImageMutation.reset()
    setImageToDelete(null)
  }

  function handleConfirmDeleteImage() {
    if (!imageToDelete) {
      return
    }

    deleteImageMutation.mutate(imageToDelete.id)
  }

  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">
        Envie imagens, ajuste descrições e escolha a imagem principal.
      </p>

      <ProductImageUpload productId={productId} onSuccess={handleUploadSuccess} />

      <div className="rounded-xl border border-slate-200 bg-white">
        {isLoading && (
          <div className="p-4 text-sm text-slate-500">
            Carregando imagens...
          </div>
        )}

        {isError && (
          <div className="p-4 text-sm text-red-600">
            Não foi possível carregar as imagens.
          </div>
        )}

        {!isLoading && !isError && images.length === 0 && (
          <div className="p-4 text-sm text-slate-500">
            Nenhuma imagem cadastrada para este produto.
          </div>
        )}

        {!isLoading && !isError && images.length > 0 && (
          <div className="divide-y divide-slate-100">
            {images.map((image) => {
              const altValue = editingAltByImageId[image.id] ?? image.alt ?? ''

              return (
                <div
                  key={image.id}
                  className="grid gap-4 p-4 md:grid-cols-[80px_1fr_auto]"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img
                      src={getImageUrl(image.url)}
                      alt={image.alt || 'Imagem do produto'}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      {image.isMain && (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                          Principal
                        </span>
                      )}
                      <span className="truncate text-xs text-slate-500">
                        {image.url}
                      </span>
                    </div>

                    <label className="text-xs font-medium text-slate-600">
                      Descrição da imagem
                    </label>
                    <input
                      value={altValue}
                      onChange={(event) =>
                        handleAltChange(image.id, event.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                      placeholder="Descrição da imagem"
                    />
                  </div>

                  <div className="flex items-end justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveAlt(image)}
                      disabled={updateImageMutation.isPending}
                      title="Salvar descrição"
                      aria-label="Salvar descrição da imagem"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetMain(image)}
                      disabled={image.isMain || updateImageMutation.isPending}
                      title="Definir como principal"
                      aria-label="Definir imagem como principal"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image)}
                      disabled={deleteImageMutation.isPending}
                      title="Excluir imagem"
                      aria-label="Excluir imagem"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(imageToDelete)}
        title="Excluir imagem"
        description="Tem certeza que deseja excluir esta imagem? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteImageMutation.isPending}
        errorMessage={
          deleteImageMutation.isError
            ? getApiErrorMessage(
                deleteImageMutation.error,
                'Não foi possível excluir esta imagem.',
              )
            : undefined
        }
        onConfirm={handleConfirmDeleteImage}
        onCancel={handleCancelDeleteImage}
      />
    </div>
  )
}

function getImageUrl(url: ProductImage['url']) {
  if (url.startsWith('http')) {
    return url
  }

  return `${apiAssetBaseUrl}${url}`
}
