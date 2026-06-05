import { api } from '@/lib/api'
import type { CustomerProductPriceFormData } from './customer-product-price-schema'
import type { CustomerProductPrice } from './types'

export async function getCustomerProductPrices() {
  const response = await api.get<CustomerProductPrice[]>(
    '/customer-product-prices',
  )

  return response.data
}

export async function createCustomerProductPrice(
  data: CustomerProductPriceFormData,
) {
  const response = await api.post<CustomerProductPrice>(
    '/customer-product-prices',
    {
      ...data,
      variantId: data.variantId || undefined,
    },
  )

  return response.data
}
