import { api } from '@/lib/api'
import type { ProductVariantFormData } from './product-variant-schema'
import type { ProductVariant } from './types'

export async function getProductVariants() {
  const response = await api.get<ProductVariant[]>('/product-variants')

  return response.data
}

export async function createProductVariant(data: ProductVariantFormData) {
  const response = await api.post<ProductVariant>(
    '/product-variants',
    normalizeProductVariantPayload(data),
  )

  return response.data
}

export async function updateProductVariant(
  id: string,
  data: ProductVariantFormData,
) {
  const response = await api.patch<ProductVariant>(
    `/product-variants/${id}`,
    normalizeProductVariantPayload(data),
  )

  return response.data
}

export async function updateProductVariantActive(id: string, active: boolean) {
  const response = await api.patch<ProductVariant>(`/product-variants/${id}`, {
    active,
  })

  return response.data
}

export async function deleteProductVariant(id: string) {
  await api.delete(`/product-variants/${id}`)
}

function normalizeProductVariantPayload(data: ProductVariantFormData) {
  return {
    ...data,
    size: data.size || undefined,
    color: data.color || undefined,
    type: data.type || undefined,
    material: data.material || undefined,
    basePrice: data.basePrice ?? undefined,
    outsourcedPrice: data.outsourcedPrice ?? undefined,
  }
}
