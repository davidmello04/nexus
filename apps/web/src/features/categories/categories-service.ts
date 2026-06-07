import { api } from '@/lib/api'
import type { CategoryFormData } from './category-schema'
import type { Category } from './types'

export async function getCategories() {
  const response = await api.get<Category[]>('/categories')

  return response.data
}

export async function createCategory(data: CategoryFormData) {
  const response = await api.post<Category>('/categories', data)

  return response.data
}

export async function updateCategory(id: string, data: CategoryFormData) {
  const response = await api.patch<Category>(`/categories/${id}`, data)

  return response.data
}

export async function updateCategoryActive(id: string, active: boolean) {
  const response = await api.patch<Category>(`/categories/${id}`, { active })

  return response.data
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`)
}
