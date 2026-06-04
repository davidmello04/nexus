import { api } from '@/lib/api'
import type { CustomerFormData } from './customer-schema'
import type { Customer } from './types'

export async function getCustomers() {
  const response = await api.get<Customer[]>('/customers')

  return response.data
}

export async function createCustomer(data: CustomerFormData) {
  const response = await api.post<Customer>('/customers', {
    ...data,
    email: data.email || undefined,
    phone: data.phone || undefined,
    document: data.document || undefined,
    notes: data.notes || undefined,
  })

  return response.data
}