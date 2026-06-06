export type Customer = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  document?: string | null
  isOutsourced: boolean
  active: boolean
  source?: string | null
  sourceOther?: string | null
  notes?: string | null
  addresses?: Address[]
  createdAt: string
  updatedAt: string
}

export type Address = {
  id: string
  customerId: string
  type: 'MAIN' | 'DELIVERY' | 'BILLING'
  zipCode?: string | null
  street?: string | null
  number?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  complement?: string | null
  reference?: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}
