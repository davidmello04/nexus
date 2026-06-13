import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Power, Tags, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Modal } from '@/components/Modal'
import { PageHeader } from '@/components/PageHeader'
import { TablePagination } from '@/components/TablePagination'
import { usePagination } from '@/hooks/usePagination'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { CategoryForm } from './CategoryForm'
import type { CategoryFormData } from './category-schema'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  updateCategoryActive,
} from './categories-service'
import type { Category } from './types'

export function CategoriesPage() {
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  )
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  )
  const [categoryToToggle, setCategoryToToggle] = useState<Category | null>(
    null,
  )
  const queryClient = useQueryClient()

  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const categoriesPagination = usePagination({ items: categories })

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsCategoryModalOpen(false)
      setSelectedCategory(null)
    },
  })
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsCategoryModalOpen(false)
      setSelectedCategory(null)
    },
  })
  const toggleCategoryMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateCategoryActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCategoryToToggle(null)
    },
  })
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setCategoryToDelete(null)
      setSelectedCategory(null)
    },
  })

  const isEditing = Boolean(selectedCategory)
  const selectedCategoryInitialData = selectedCategory
    ? mapCategoryToFormData(selectedCategory)
    : undefined
  const isSubmitting =
    createCategoryMutation.isPending || updateCategoryMutation.isPending

  function handleSubmitCategory(data: CategoryFormData) {
    if (selectedCategory) {
      updateCategoryMutation.mutate({
        id: selectedCategory.id,
        data,
      })
      return
    }

    createCategoryMutation.mutate(data)
  }

  function handleNewCategoryClick() {
    createCategoryMutation.reset()
    updateCategoryMutation.reset()
    setSelectedCategory(null)
    setIsCategoryModalOpen(true)
  }

  function handleEditCategory(category: Category) {
    createCategoryMutation.reset()
    updateCategoryMutation.reset()
    setSelectedCategory(category)
    setIsCategoryModalOpen(true)
  }

  function handleCloseCategoryModal() {
    createCategoryMutation.reset()
    updateCategoryMutation.reset()
    setSelectedCategory(null)
    setIsCategoryModalOpen(false)
  }

  function handleToggleCategory(category: Category) {
    toggleCategoryMutation.reset()
    setCategoryToToggle(category)
  }

  function handleCancelToggleCategory() {
    toggleCategoryMutation.reset()
    setCategoryToToggle(null)
  }

  function handleConfirmToggleCategory() {
    if (!categoryToToggle) {
      return
    }

    toggleCategoryMutation.mutate({
      id: categoryToToggle.id,
      active: !categoryToToggle.active,
    })
  }

  function handleDeleteCategory(category: Category) {
    deleteCategoryMutation.reset()
    setCategoryToDelete(category)
  }

  function handleCancelDeleteCategory() {
    deleteCategoryMutation.reset()
    setCategoryToDelete(null)
  }

  function handleConfirmDeleteCategory() {
    if (!categoryToDelete) {
      return
    }

    deleteCategoryMutation.mutate(categoryToDelete.id)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Organize produtos em grupos claros para facilitar cadastro e venda."
        eyebrow="Catálogo"
        icon={Tags}
        actions={
          <button
            type="button"
            onClick={handleNewCategoryClick}
            className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-slate-800"
          >
            Nova categoria
          </button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
        {isLoading && (
          <div className="p-6 text-sm text-slate-500">
            Carregando categorias...
          </div>
        )}

        {isError && (
          <div className="p-6 text-sm text-red-600">
            Não foi possível carregar as categorias.
          </div>
        )}

        {!isLoading && !isError && categories.length === 0 && (
          <div className="p-6 text-sm text-slate-500">
            Nenhuma categoria cadastrada ainda.
          </div>
        )}

        {!isLoading && !isError && categories.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>

              <tbody>
                {categoriesPagination.paginatedItems.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {category.name}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={[
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          category.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700',
                        ].join(' ')}
                      >
                        {category.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditCategory(category)}
                          title="Editar categoria"
                          aria-label={`Editar categoria ${category.name}`}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleCategory(category)}
                          disabled={toggleCategoryMutation.isPending}
                          title={
                            category.active
                              ? 'Inativar categoria'
                              : 'Ativar categoria'
                          }
                          aria-label={
                            category.active
                              ? `Inativar categoria ${category.name}`
                              : `Ativar categoria ${category.name}`
                          }
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Power className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category)}
                          disabled={deleteCategoryMutation.isPending}
                          title="Excluir categoria"
                          aria-label={`Excluir categoria ${category.name}`}
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
            <TablePagination
              page={categoriesPagination.page}
              pageSize={categoriesPagination.pageSize}
              totalItems={categories.length}
              onPageChange={categoriesPagination.setPage}
              onPageSizeChange={categoriesPagination.setPageSize}
            />
          </div>
        )}
      </div>

      <Modal
        open={isCategoryModalOpen}
        title={isEditing ? 'Editar categoria' : 'Nova categoria'}
        description={
          isEditing
            ? 'Atualize os dados da categoria selecionada.'
            : 'Preencha os dados para cadastrar uma nova categoria.'
        }
        onClose={handleCloseCategoryModal}
      >
        {(createCategoryMutation.isError || updateCategoryMutation.isError) && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Não foi possível salvar a categoria.
          </div>
        )}

        <CategoryForm
          onSubmit={handleSubmitCategory}
          isSubmitting={isSubmitting}
          initialData={selectedCategoryInitialData}
          submitButtonText={
            isEditing ? 'Atualizar categoria' : 'Salvar categoria'
          }
          onCancel={handleCloseCategoryModal}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title="Excluir categoria"
        description={
          categoryToDelete
            ? `Tem certeza que deseja excluir a categoria "${categoryToDelete.name}"?\nEssa ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteCategoryMutation.isPending}
        errorMessage={
          deleteCategoryMutation.isError
            ? getApiErrorMessage(
                deleteCategoryMutation.error,
                'Não foi possível excluir esta categoria.',
              )
            : undefined
        }
        onConfirm={handleConfirmDeleteCategory}
        onCancel={handleCancelDeleteCategory}
      />

      <ConfirmDialog
        open={Boolean(categoryToToggle)}
        title={
          categoryToToggle?.active
            ? 'Inativar categoria'
            : 'Ativar categoria'
        }
        description={
          categoryToToggle
            ? categoryToToggle.active
              ? `Tem certeza que deseja inativar a categoria "${categoryToToggle.name}"? Ela deixará de aparecer como ativa.`
              : `Tem certeza que deseja ativar a categoria "${categoryToToggle.name}"? Ela voltará a aparecer como ativa.`
            : ''
        }
        confirmLabel={categoryToToggle?.active ? 'Inativar' : 'Ativar'}
        cancelLabel="Cancelar"
        isLoading={toggleCategoryMutation.isPending}
        errorMessage={
          toggleCategoryMutation.isError
            ? getApiErrorMessage(
                toggleCategoryMutation.error,
                categoryToToggle?.active
                  ? 'Não foi possível inativar esta categoria.'
                  : 'Não foi possível ativar esta categoria.',
              )
            : undefined
        }
        onConfirm={handleConfirmToggleCategory}
        onCancel={handleCancelToggleCategory}
      />
    </div>
  )
}

function mapCategoryToFormData(category: Category): CategoryFormData {
  return {
    name: category.name,
    active: category.active,
  }
}
