import { z } from 'zod'

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return Number(value)
}, z.number().min(0, 'Informe um valor maior ou igual a zero').optional())

export const productVariantSchema = z.object({
  productId: z.string().min(1, 'Informe o produto'),

  size: z.string().optional(),

  color: z.string().optional(),

  type: z.string().optional(),

  material: z.string().optional(),

  basePrice: optionalNumber,

  outsourcedPrice: optionalNumber,

  active: z.boolean(),
})

export type ProductVariantFormInput = z.input<typeof productVariantSchema>
export type ProductVariantFormData = z.output<typeof productVariantSchema>
