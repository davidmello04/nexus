import { api } from '@/lib/api'

export type DashboardSummary = {
  totalOrders: number
  openOrders: number
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

export async function getDashboardSummary() {
  const response = await api.get<DashboardSummary>('/dashboard/summary')

  return response.data
}
