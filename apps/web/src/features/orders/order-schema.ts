import { z } from 'zod'

const optionalNumber = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }

  return Number(value)
}, z.number().min(0, 'Informe um valor maior ou igual a zero').optional())

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Informe o produto'),

  productVariantId: z.string().optional(),

  quantity: z.preprocess(
    (value) => Number(value),
    z.number().int('Informe uma quantidade inteira').min(1, 'Informe ao menos 1'),
  ),

  notes: z.string().optional(),
})

export const orderSchema = z.object({
  customerId: z.string().min(1, 'Informe o cliente'),

  discount: optionalNumber,

  notes: z.string().optional(),

  items: z
    .array(orderItemSchema)
    .min(1, 'Inclua pelo menos um item no pedido'),
})

export type OrderFormInput = z.input<typeof orderSchema>
export type OrderFormData = z.output<typeof orderSchema>
