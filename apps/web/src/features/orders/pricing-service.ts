import { api } from '@/lib/api'

export type ResolvedPriceSource =
  | 'CUSTOMER_PRODUCT_VARIANT'
  | 'CUSTOMER_PRODUCT'
  | 'VARIANT_OUTSOURCED'
  | 'PRODUCT_OUTSOURCED'
  | 'VARIANT_BASE'
  | 'PRODUCT_BASE'

export type ResolvedPrice = {
  price: string | number
  source: ResolvedPriceSource
}

type ResolvePriceParams = {
  customerId: string
  productId: string
  variantId?: string
}

export async function resolvePrice({
  customerId,
  productId,
  variantId,
}: ResolvePriceParams) {
  const response = await api.get<ResolvedPrice>('/pricing/resolve', {
    params: {
      customerId,
      productId,
      variantId: variantId || undefined,
    },
  })

  return response.data
}
