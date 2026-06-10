import type { Customer } from '@/features/customers/types'
import type { Product, ProductVariant } from '@/features/products/types'

export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED'

export type QuoteItem = {
  id: string
  quoteId: string
  productId: string
  product: Product
  productVariantId?: string | null
  productVariant?: ProductVariant | null
  quantity: number
  unitPrice: string | number
  total: string | number
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type Quote = {
  id: string
  code: number
  status: QuoteStatus
  customerId: string
  customer: Customer
  subtotal: string | number
  discount: string | number
  total: string | number
  notes?: string | null
  validUntil?: string | null
  items: QuoteItem[]
  createdAt: string
  updatedAt: string
}
