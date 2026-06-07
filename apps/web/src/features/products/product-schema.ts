import { z } from 'zod'

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return Number(value)
}, z.number().min(0, 'Informe um valor maior ou igual a zero').optional())

const requiredNumber = (requiredMessage: string) =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return Number(value)
  },
  z
    .number({ error: requiredMessage })
    .min(0, 'Informe um valor maior ou igual a zero'))

export const productSchema = z.object({
  name: z.string().min(1, 'Informe o nome do produto'),

  description: z.string().optional(),

  basePrice: requiredNumber('Informe o preço base do produto.'),

  outsourcedPrice: optionalNumber,

  active: z.boolean(),

  categoryId: z.string().optional(),
})

export type ProductFormInput = z.input<typeof productSchema>
export type ProductFormData = z.output<typeof productSchema>
