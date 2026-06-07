import { Fragment, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DollarSign,
  Image as ImageIcon,
  Layers,
  Pencil,
  Power,
  Trash2,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Modal } from '@/components/Modal'
import { formatCurrency } from '@/lib/formatters'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { ProductForm } from './ProductForm'
import { ProductImagesPanel } from './ProductImagesPanel'
import { ProductVariantsPanel } from './ProductVariantsPanel'
import { CustomerProductPricesPanel } from './CustomerProductPricesPanel'
import type { ProductFormData } from './product-schema'
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  updateProductActive,
} from './products-service'
import type { Product, ProductImage } from './types'

const apiAssetBaseUrl = (
  import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
).replace(/\/api\/?$/, '')

export function ProductsPage() {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [productToToggle, setProductToToggle] = useState<Product | null>(null)
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
      setSelectedProduct(null)
    },
  })
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsProductModalOpen(false)
      setSelectedProduct(null)
    },
  })
  const toggleProductMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateProductActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setProductToToggle(null)
    },
  })
  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setProductToDelete(null)
      setSelectedProduct(null)
    },
  })

  const isEditing = Boolean(selectedProduct)
  const selectedProductInitialData = selectedProduct
    ? mapProductToFormData(selectedProduct)
    : undefined
  const isSubmitting =
    createProductMutation.isPending || updateProductMutation.isPending

  function handleSubmitProduct(data: ProductFormData) {
    if (selectedProduct) {
      updateProductMutation.mutate({
        id: selectedProduct.id,
        data,
      })
      return
    }

    createProductMutation.mutate(data)
  }

  function handleNewProductClick() {
    createProductMutation.reset()
    updateProductMutation.reset()
    setSelectedProduct(null)
    setIsProductModalOpen(true)
  }

  function handleEditProduct(product: Product) {
    createProductMutation.reset()
    updateProductMutation.reset()
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  function handleCloseProductModal() {
    createProductMutation.reset()
    updateProductMutation.reset()
    setSelectedProduct(null)
    setIsProductModalOpen(false)
  }

  function handleToggleProduct(product: Product) {
    toggleProductMutation.reset()
    setProductToToggle(product)
  }

  function handleCancelToggleProduct() {
    toggleProductMutation.reset()
    setProductToToggle(null)
  }

  function handleConfirmToggleProduct() {
    if (!productToToggle) {
      return
    }

    toggleProductMutation.mutate({
      id: productToToggle.id,
      active: !productToToggle.active,
    })
  }

  function handleDeleteProduct(product: Product) {
    deleteProductMutation.reset()
    setProductToDelete(product)
  }

  function handleCancelDeleteProduct() {
    deleteProductMutation.reset()
    setProductToDelete(null)
  }

  function handleConfirmDeleteProduct() {
    if (!productToDelete) {
      return
    }

    deleteProductMutation.mutate(productToDelete.id)
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
                              onClick={() => handleEditProduct(product)}
                              title="Editar produto"
                              aria-label={`Editar produto ${product.name}`}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleProduct(product)}
                              disabled={toggleProductMutation.isPending}
                              title={
                                product.active
                                  ? 'Inativar produto'
                                  : 'Ativar produto'
                              }
                              aria-label={
                                product.active
                                  ? `Inativar produto ${product.name}`
                                  : `Ativar produto ${product.name}`
                              }
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Power className="h-4 w-4" aria-hidden="true" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setUploadProductId((currentProductId) =>
                                  currentProductId === product.id
                                    ? null
                                    : product.id,
                                )
                              }
                              title="Gerenciar imagens"
                              aria-label={`Gerenciar imagens de ${product.name}`}
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

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              disabled={deleteProductMutation.isPending}
                              title="Excluir produto"
                              aria-label={`Excluir produto ${product.name}`}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {uploadProductId === product.id && (
                        <tr className="border-b border-slate-100">
                          <td colSpan={7} className="px-4 py-4">
                            <ProductImagesPanel productId={product.id} />
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
        title={isEditing ? 'Editar produto' : 'Novo produto'}
        description={
          isEditing
            ? 'Atualize os dados do produto selecionado.'
            : 'Preencha os dados para cadastrar um novo produto.'
        }
        onClose={handleCloseProductModal}
      >
        {(createProductMutation.isError || updateProductMutation.isError) && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Não foi possível salvar o produto.
          </div>
        )}

        <ProductForm
          onSubmit={handleSubmitProduct}
          isSubmitting={isSubmitting}
          initialData={selectedProductInitialData}
          submitButtonText={isEditing ? 'Atualizar produto' : 'Salvar produto'}
          onCancel={handleCloseProductModal}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(productToDelete)}
        title="Excluir produto"
        description={
          productToDelete
            ? `Tem certeza que deseja excluir o produto "${productToDelete.name}"?\nEssa ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteProductMutation.isPending}
        errorMessage={
          deleteProductMutation.isError
            ? getApiErrorMessage(
                deleteProductMutation.error,
                'Não foi possível excluir este produto.',
              )
            : undefined
        }
        onConfirm={handleConfirmDeleteProduct}
        onCancel={handleCancelDeleteProduct}
      />

      <ConfirmDialog
        open={Boolean(productToToggle)}
        title={
          productToToggle?.active ? 'Inativar produto' : 'Ativar produto'
        }
        description={
          productToToggle
            ? productToToggle.active
              ? `Tem certeza que deseja inativar o produto "${productToToggle.name}"? Ele deixará de aparecer como ativo nas operações.`
              : `Tem certeza que deseja ativar o produto "${productToToggle.name}"? Ele voltará a aparecer como ativo nas operações.`
            : ''
        }
        confirmLabel={productToToggle?.active ? 'Inativar' : 'Ativar'}
        cancelLabel="Cancelar"
        isLoading={toggleProductMutation.isPending}
        errorMessage={
          toggleProductMutation.isError
            ? getApiErrorMessage(
                toggleProductMutation.error,
                productToToggle?.active
                  ? 'Não foi possível inativar este produto.'
                  : 'Não foi possível ativar este produto.',
              )
            : undefined
        }
        onConfirm={handleConfirmToggleProduct}
        onCancel={handleCancelToggleProduct}
      />
    </div>
  )
}

function getMainImage(product: Product) {
  return product.images?.find((image) => image.isMain) ?? product.images?.[0]
}

function mapProductToFormData(product: Product): ProductFormData {
  return {
    name: product.name,
    description: product.description ?? '',
    basePrice: Number(product.basePrice),
    outsourcedPrice: hasPrice(product.outsourcedPrice)
      ? Number(product.outsourcedPrice)
      : undefined,
    active: product.active,
    categoryId: product.categoryId ?? '',
  }
}

function getImageUrl(url: ProductImage['url']) {
  if (url.startsWith('http')) {
    return url
  }

  return `${apiAssetBaseUrl}${url}`
}

function hasPrice(value: string | number | null | undefined) {
  return value !== null && value !== undefined
}
