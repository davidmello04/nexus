import { api } from '@/lib/api'
import type { Order } from '@/features/orders/types'
import type { QuoteFormData } from './quote-schema'
import type { Quote, QuoteStatus } from './types'

export async function getQuotes() {
  const response = await api.get<Quote[]>('/quotes')
  return response.data
}

export async function getQuote(id: string) {
  const response = await api.get<Quote>(`/quotes/${id}`)
  return response.data
}

export async function createQuote(data: QuoteFormData) {
  const response = await api.post<Quote>('/quotes', buildQuotePayload(data))
  return response.data
}

export async function updateQuote(id: string, data: QuoteFormData) {
  const response = await api.patch<Quote>(`/quotes/${id}`, buildQuotePayload(data))
  return response.data
}

export async function updateQuoteStatus(id: string, status: QuoteStatus) {
  const response = await api.patch<Quote>(`/quotes/${id}/status`, { status })
  return response.data
}

export async function deleteQuote(id: string) {
  await api.delete(`/quotes/${id}`)
}

export async function convertQuoteToOrder(id: string) {
  const response = await api.post<Order>(`/quotes/${id}/convert-to-order`)
  return response.data
}

export async function downloadQuotePdf(id: string) {
  const response = await api.get<Blob>(`/quotes/${id}/pdf`, {
    responseType: 'blob',
  })
  return response.data
}

function buildQuotePayload(data: QuoteFormData) {
  return {
    customerId: data.customerId,
    discount: data.discount ?? undefined,
    notes: data.notes || undefined,
    validUntil: data.validUntil || undefined,
    items: data.items.map((item) => ({
      productId: item.productId,
      productVariantId: item.productVariantId || undefined,
      quantity: item.quantity,
      notes: item.notes || undefined,
    })),
  }
}
