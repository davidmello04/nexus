export type Category = {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export type ProductImage = {
  id: string
  url: string
  alt?: string | null
  isMain: boolean
  productId: string
  createdAt: string
}

export type ProductVariant = {
  id: string
  size?: string | null
  color?: string | null
  type?: string | null
  material?: string | null
  basePrice?: string | number | null
  outsourcedPrice?: string | number | null
  active: boolean
  productId: string
  createdAt: string
  updatedAt: string
}

export type Product = {
  id: string
  name: string
  description?: string | null
  basePrice: string | number
  outsourcedPrice?: string | number | null
  active: boolean
  categoryId?: string | null
  category?: Category | null
  images?: ProductImage[]
  variants?: ProductVariant[]
  createdAt: string
  updatedAt: string
}
