import { api } from '@/lib/api'
import type { ProductFormData } from './product-schema'
import type { Product } from './types'

export async function getProducts() {
  const response = await api.get<Product[]>('/products')

  return response.data
}

export async function createProduct(data: ProductFormData) {
  const response = await api.post<Product>('/products', {
    ...data,
    description: data.description || undefined,
    outsourcedPrice: data.outsourcedPrice ?? undefined,
    categoryId: data.categoryId || undefined,
  })

  return response.data
}
