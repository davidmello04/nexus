import { z } from 'zod'

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return Number(value)
}, z.number().min(0, 'Informe um valor maior ou igual a zero').optional())

const requiredPositiveInteger = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined
    }

    return Number(value)
  },
  z
    .number({ error: 'Informe a quantidade.' })
    .int('Informe uma quantidade inteira')
    .min(1, 'Informe ao menos 1'),
)

const quoteItemSchema = z.object({
  productId: z.string().min(1, 'Informe o produto'),
  productVariantId: z.string().optional(),
  quantity: requiredPositiveInteger,
  notes: z.string().optional(),
})

export const quoteSchema = z.object({
  customerId: z.string().min(1, 'Informe o cliente'),
  discount: optionalNumber,
  notes: z.string().optional(),
  validUntil: z.string().optional(),
  items: z
    .array(quoteItemSchema)
    .min(1, 'Inclua pelo menos um item no orçamento'),
})

export type QuoteFormInput = z.input<typeof quoteSchema>
export type QuoteFormData = z.output<typeof quoteSchema>
