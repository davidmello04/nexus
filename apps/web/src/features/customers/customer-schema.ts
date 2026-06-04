import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Informe o nome do cliente'),
  phone: z.string().optional(),
  email: z
    .string()
    .email('Informe um e-mail válido')
    .optional()
    .or(z.literal('')),
  document: z.string().optional(),
  isOutsourced: z.boolean().default(false),
  notes: z.string().optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>