import { api } from '@/lib/api'
import type { Customer } from '@/features/customers/types'

export type OrdersReportFilters = {
  startDate?: string
  endDate?: string
  status?: string
  customerId?: string
}

export type OrdersReportOrder = {
  id: string
  code: number
  status: string
  customerId: string
  customer?: Customer | null
  subtotal: number
  discount: number
  total: number
  createdAt: string
}

export type OrdersReportSummary = {
  ordersCount: number
  subtotalTotal: number
  discountTotal: number
  grandTotal: number
}

export type OrdersReport = {
  orders: OrdersReportOrder[]
  summary: OrdersReportSummary
}

export async function getOrdersReport(filters: OrdersReportFilters = {}) {
  const response = await api.get<OrdersReport>('/reports/orders', {
    params: {
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      status: filters.status || undefined,
      customerId: filters.customerId || undefined,
    },
  })

  return response.data
}
