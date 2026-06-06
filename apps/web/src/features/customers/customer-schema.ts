import { z } from 'zod'

export const customerSourceOptions = [
  'Instagram',
  'WhatsApp',
  'Indicação',
  'Cliente antigo',
  'Loja física',
  'Outro',
] as const

const addressSchema = z.object({
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  complement: z.string().optional(),
  reference: z.string().optional(),
})

export const customerSchema = z.object({
  name: z.string().min(1, 'Informe o nome do cliente'),

  phone: z.string().optional(),

  email: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true

      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }, 'Informe um e-mail válido'),

  document: z.string().optional(),

  isOutsourced: z.boolean(),

  active: z.boolean(),

  source: z.string().optional(),

  sourceOther: z.string().optional(),

  notes: z.string().optional(),

  address: addressSchema.optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>
