import { api } from '@/lib/api'
import type { CustomerFormData } from './customer-schema'
import type { Customer } from './types'

export async function getCustomers() {
  const response = await api.get<Customer[]>('/customers')

  return response.data
}

export async function createCustomer(data: CustomerFormData) {
  const response = await api.post<Customer>('/customers', normalizeCustomerData(data))

  return response.data
}

export async function updateCustomer(id: string, data: CustomerFormData) {
  const response = await api.patch<Customer>(
    `/customers/${id}`,
    normalizeCustomerData(data),
  )

  return response.data
}

export async function deleteCustomer(id: string) {
  await api.delete(`/customers/${id}`)
}

function normalizeCustomerData(data: CustomerFormData) {
  return {
    ...data,
    email: data.email || undefined,
    phone: data.phone || undefined,
    document: data.document || undefined,
    notes: data.notes || undefined,
  }
}
