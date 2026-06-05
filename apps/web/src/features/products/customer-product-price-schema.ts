import { z } from 'zod'

export const customerProductPriceSchema = z.object({
  customerId: z.string().min(1, 'Informe o cliente'),

  productId: z.string().min(1, 'Informe o produto'),

  variantId: z.string().optional(),

  price: z.preprocess(
    (value) => Number(value),
    z.number().min(0, 'Informe um valor maior ou igual a zero'),
  ),

  active: z.boolean(),
})

export type CustomerProductPriceFormInput = z.input<
  typeof customerProductPriceSchema
>
export type CustomerProductPriceFormData = z.output<
  typeof customerProductPriceSchema
>
