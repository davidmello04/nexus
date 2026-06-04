import { z } from 'zod'

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

  notes: z.string().optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>