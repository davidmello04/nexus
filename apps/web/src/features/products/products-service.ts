import { api } from '@/lib/api'
import type { Product } from './types'

export async function getProducts() {
  const response = await api.get<Product[]>('/products')

  return response.data
}
