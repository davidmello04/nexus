import { api } from '@/lib/api'
import type { Customer } from './types'

export async function getCustomers() {
  const response = await api.get<Customer[]>('/customers')

  return response.data
}