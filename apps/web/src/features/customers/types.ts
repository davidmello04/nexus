export type Customer = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  document?: string | null
  isOutsourced: boolean
  notes?: string | null
  createdAt: string
  updatedAt: string
}