import { api } from '@/lib/api'
import type { CompanySettingsFormData } from './company-settings-schema'

export type CompanySettings = CompanySettingsFormData & {
  id: string
  logoUrl?: string | null
  createdAt: string
  updatedAt: string
}

export async function getCompanySettings() {
  const response = await api.get<CompanySettings | null>('/company-settings')

  return response.data
}

export async function saveCompanySettings(data: CompanySettingsFormData) {
  const response = await api.put<CompanySettings>('/company-settings', data)

  return response.data
}

export async function uploadCompanyLogo(file: File) {
  const formData = new FormData()

  formData.append('file', file)

  const response = await api.post<CompanySettings>(
    '/company-settings/logo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}
