import { z } from 'zod'

export const companySettingsSchema = z.object({
  name: z.string().min(1, 'Informe o nome da empresa.'),
  phone: z.string(),
  whatsapp: z.string(),
  instagram: z.string(),
  document: z.string(),
  address: z.string(),
  defaultOrderMessage: z.string(),
})

export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>
