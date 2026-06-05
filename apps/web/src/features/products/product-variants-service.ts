import { api } from '@/lib/api'
import type { ProductVariantFormData } from './product-variant-schema'
import type { ProductVariant } from './types'

export async function getProductVariants() {
  const response = await api.get<ProductVariant[]>('/product-variants')

  return response.data
}

export async function createProductVariant(data: ProductVariantFormData) {
  const response = await api.post<ProductVariant>('/product-variants', {
    ...data,
    size: data.size || undefined,
    color: data.color || undefined,
    type: data.type || undefined,
    material: data.material || undefined,
    basePrice: data.basePrice ?? undefined,
    outsourcedPrice: data.outsourcedPrice ?? undefined,
  })

  return response.data
}
