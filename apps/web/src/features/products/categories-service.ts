import { api } from '@/lib/api'
import type { Category } from './types'

export async function getCategories() {
  const response = await api.get<Category[]>('/categories')

  return response.data
}
