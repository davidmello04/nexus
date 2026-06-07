import { z } from 'zod'

const requiredNumber = (requiredMessage: string) =>
  z.preprocess(
    (value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined
      }

      return Number(value)
    },
    z
      .number({ error: requiredMessage })
      .min(0, 'Informe um valor maior ou igual a zero'),
  )

export const customerProductPriceSchema = z.object({
  customerId: z.string().min(1, 'Informe o cliente'),

  productId: z.string().min(1, 'Informe o produto'),

  variantId: z.string().optional(),

  price: requiredNumber('Informe o preço específico.'),

  active: z.boolean(),
})

export type CustomerProductPriceFormInput = z.input<
  typeof customerProductPriceSchema
>
export type CustomerProductPriceFormData = z.output<
  typeof customerProductPriceSchema
>
