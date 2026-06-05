import { z } from 'zod'

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return Number(value)
}, z.number().min(0, 'Informe um valor maior ou igual a zero').optional())

export const productSchema = z.object({
  name: z.string().min(1, 'Informe o nome do produto'),

  description: z.string().optional(),

  basePrice: z.preprocess(
    (value) => Number(value),
    z.number().min(0, 'Informe um valor maior ou igual a zero'),
  ),

  outsourcedPrice: optionalNumber,

  active: z.boolean(),

  categoryId: z.string().optional(),
})

export type ProductFormInput = z.input<typeof productSchema>
export type ProductFormData = z.output<typeof productSchema>
