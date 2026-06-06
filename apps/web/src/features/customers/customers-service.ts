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
  const address = normalizeAddress(data.address)

  return {
    ...data,
    email: data.email || undefined,
    phone: data.phone || undefined,
    document: data.document || undefined,
    source: data.source || undefined,
    sourceOther: data.source === 'Outro' ? data.sourceOther || undefined : undefined,
    notes: data.notes || undefined,
    address,
  }
}

function normalizeAddress(address: CustomerFormData['address']) {
  if (!address) {
    return undefined
  }

  const normalizedAddress = {
    zipCode: address.zipCode || undefined,
    street: address.street || undefined,
    number: address.number || undefined,
    neighborhood: address.neighborhood || undefined,
    city: address.city || undefined,
    state: address.state || undefined,
    complement: address.complement || undefined,
    reference: address.reference || undefined,
  }
  const hasAddressField = Object.values(normalizedAddress).some(Boolean)

  return hasAddressField ? normalizedAddress : undefined
}
