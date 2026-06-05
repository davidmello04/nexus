import { api } from '@/lib/api'
import type { ProductFormData } from './product-schema'
import type { Product, ProductImage } from './types'

type UploadProductImageData = {
  file: File
  alt?: string
  isMain?: boolean
}

export async function getProducts() {
  const response = await api.get<Product[]>('/products')

  return response.data
}

export async function createProduct(data: ProductFormData) {
  const response = await api.post<Product>('/products', {
    ...data,
    description: data.description || undefined,
    outsourcedPrice: data.outsourcedPrice ?? undefined,
    categoryId: data.categoryId || undefined,
  })

  return response.data
}

export async function uploadProductImage(
  productId: string,
  data: UploadProductImageData,
) {
  const formData = new FormData()

  formData.append('file', data.file)

  if (data.alt) {
    formData.append('alt', data.alt)
  }

  if (data.isMain !== undefined) {
    formData.append('isMain', String(data.isMain))
  }

  const response = await api.post<ProductImage>(
    `/product-images/upload/${productId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}
