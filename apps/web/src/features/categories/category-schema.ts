import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1, 'Informe o nome da categoria'),
  active: z.boolean(),
})

export type CategoryFormData = z.infer<typeof categorySchema>
