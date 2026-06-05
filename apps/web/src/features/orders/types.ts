import type { Customer } from '@/features/customers/types'
import type { Product, ProductVariant } from '@/features/products/types'

export type OrderItem = {
  id: string
  orderId: string
  productId: string
  product: Product
  productVariantId?: string | null
  productVariant?: ProductVariant | null
  quantity: number
  unitPrice: string | number
  total: string | number
  notes?: string | null
  createdAt: string
}

export type Order = {
  id: string
  code: number
  status: string
  customerId: string
  customer: Customer
  subtotal: string | number
  discount: string | number
  total: string | number
  notes?: string | null
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export type CreateOrderPayload = {
  customerId: string
  discount?: number
  notes?: string
  items: Array<{
    productId: string
    productVariantId?: string
    quantity: number
    notes?: string
  }>
}
