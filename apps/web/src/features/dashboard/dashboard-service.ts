import { api } from '@/lib/api'

export type DashboardSummary = {
  totalOrders: number
  draftOrders: number
  pendingOrders: number
  openOrders: number
  inProductionOrders: number
  productionOrders: number
  doneOrders: number
  canceledOrders: number
  totalSoldDone: number
  totalPending: number
  totalInProduction: number
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
}

export type DashboardSummaryFilters = {
  startDate?: string
  endDate?: string
}

export async function getDashboardSummary(filters?: DashboardSummaryFilters) {
  const response = await api.get<DashboardSummary>('/dashboard/summary', {
    params: {
      startDate: filters?.startDate || undefined,
      endDate: filters?.endDate || undefined,
    },
  })

  return response.data
}
