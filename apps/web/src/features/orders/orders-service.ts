import { api } from '@/lib/api'
import type { OrderFormData } from './order-schema'
import type { CreateOrderPayload, Order } from './types'

export async function getOrders() {
  const response = await api.get<Order[]>('/orders')

  return response.data
}

export async function getOrder(id: string) {
  const response = await api.get<Order>(`/orders/${id}`)

  return response.data
}

export async function downloadOrderPdf(id: string) {
  const response = await api.get<Blob>(`/orders/${id}/pdf`, {
    responseType: 'blob',
  })

  return response.data
}

export async function createOrder(data: OrderFormData) {
  const payload = buildOrderPayload(data)
  const response = await api.post<Order>('/orders', payload)

  return response.data
}

export async function updateOrder(id: string, data: OrderFormData) {
  const payload = buildOrderPayload(data)
  const response = await api.patch<Order>(`/orders/${id}`, payload)

  return response.data
}

export async function updateOrderStatus(id: string, status: string) {
  const response = await api.patch<Order>(`/orders/${id}`, { status })

  return response.data
}

function buildOrderPayload(data: OrderFormData): CreateOrderPayload {
  return {
    customerId: data.customerId,
    discount: data.discount ?? undefined,
    notes: data.notes || undefined,
    items: data.items.map((item) => ({
      productId: item.productId,
      productVariantId: item.productVariantId || undefined,
      quantity: item.quantity,
      notes: item.notes || undefined,
    })),
  }
}
