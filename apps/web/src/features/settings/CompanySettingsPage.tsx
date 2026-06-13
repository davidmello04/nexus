import { useEffect, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { PageHeader } from '@/components/PageHeader'
import {
  companySettingsSchema,
  type CompanySettingsFormData,
} from './company-settings-schema'
import {
  getCompanySettings,
  saveCompanySettings,
  uploadCompanyLogo,
  type CompanySettings,
} from './company-settings-service'

const emptyCompanySettingsFormValues: CompanySettingsFormData = {
  name: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  document: '',
  address: '',
  defaultOrderMessage: '',
}

export function CompanySettingsPage() {
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const queryClient = useQueryClient()
  const {
    data: companySettings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['company-settings'],
    queryFn: getCompanySettings,
  })
  const saveCompanySettingsMutation = useMutation({
    mutationFn: saveCompanySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
    },
  })
  const uploadLogoMutation = useMutation({
    mutationFn: uploadCompanyLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
      setSelectedLogo(null)
    },
  })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: emptyCompanySettingsFormValues,
  })

  useEffect(() => {
    reset(mapCompanySettingsToFormData(companySettings))
  }, [companySettings, reset])

  const onSubmit: SubmitHandler<CompanySettingsFormData> = (data) => {
    saveCompanySettingsMutation.mutate(data)
  }

  function handleUploadLogo() {
    if (!selectedLogo) {
      return
    }

    uploadLogoMutation.mutate(selectedLogo)
  }

  const logoPreviewUrl = companySettings?.logoUrl
    ? buildUploadUrl(companySettings.logoUrl)
    : ''

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Dados da empresa usados em documentos, pedidos e orçamentos."
        eyebrow="Empresa"
        icon={Building2}
      />

      <div className="rounded-3xl border border-white/80 bg-white p-6 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
        {isLoading && (
          <div className="text-sm text-slate-500">
            Carregando configurações...
          </div>
        )}

        {isError && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Não foi possível carregar as configurações da empresa.
          </div>
        )}

        {!isLoading && !isError && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <SettingsSection
              title="Logo"
              description="Imagem exibida nos documentos e no cabeçalho dos PDFs."
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60">
                    {logoPreviewUrl ? (
                      <img
                        src={logoPreviewUrl}
                        alt="Logo da empresa"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="px-2 text-center text-xs text-slate-500">
                        Sem logo
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Logo da empresa
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Use PNG, JPEG ou WebP com até 2MB.
                    </p>
                    <p className="mt-2 max-w-xs truncate text-xs text-slate-500">
                      {selectedLogo?.name || 'Nenhuma imagem selecionada'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    Selecionar imagem
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) =>
                        setSelectedLogo(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleUploadLogo}
                    disabled={!selectedLogo || uploadLogoMutation.isPending}
                    className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadLogoMutation.isPending
                      ? 'Enviando...'
                      : 'Enviar logo'}
                  </button>
                </div>
              </div>

              {uploadLogoMutation.isError && (
                <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  Não foi possível enviar a logo. Verifique o arquivo e tente
                  novamente.
                </div>
              )}
            </SettingsSection>

            {saveCompanySettingsMutation.isError && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                Não foi possível salvar as configurações.
              </div>
            )}

            {saveCompanySettingsMutation.isSuccess && (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                Configurações salvas com sucesso.
              </div>
            )}

            <SettingsSection
              title="Identidade da empresa"
              description="Dados principais usados nos documentos gerados pelo Nexus."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  label="Nome da empresa"
                  error={errors.name?.message}
                >
                  <input
                    {...register('name')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="Nome da empresa"
                  />
                </FormField>

                <FormField label="Documento">
                  <input
                    {...register('document')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="CNPJ, CPF ou identificação"
                  />
                </FormField>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Contato"
              description="Canais exibidos em pedidos, orçamentos e PDFs."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Telefone">
                  <input
                    {...register('phone')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="Telefone"
                  />
                </FormField>

                <FormField label="WhatsApp">
                  <input
                    {...register('whatsapp')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="WhatsApp"
                  />
                </FormField>

                <FormField label="Instagram">
                  <input
                    {...register('instagram')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="@empresa"
                  />
                </FormField>
              </div>
            </SettingsSection>

            <SettingsSection title="Endereço">
              <FormField label="Endereço">
                <textarea
                  {...register('address')}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                  placeholder="Endereço completo"
                />
              </FormField>
            </SettingsSection>

            <SettingsSection
              title="Mensagem padrão"
              description="Texto usado como apoio nos documentos de pedido."
            >
              <FormField label="Mensagem padrão do pedido">
                <textarea
                  {...register('defaultOrderMessage')}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                  placeholder="Mensagem padrão para documentos de pedido"
                />
              </FormField>
            </SettingsSection>

            <div className="flex justify-end border-t border-blue-100 pt-5">
              <button
                type="submit"
                disabled={saveCompanySettingsMutation.isPending}
                className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveCompanySettingsMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar configurações'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/35 p-5 shadow-sm shadow-blue-100/40">
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-blue-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  )
}

function mapCompanySettingsToFormData(
  companySettings?: CompanySettings | null,
): CompanySettingsFormData {
  if (!companySettings) {
    return emptyCompanySettingsFormValues
  }

  return {
    name: companySettings.name,
    phone: companySettings.phone,
    whatsapp: companySettings.whatsapp,
    instagram: companySettings.instagram,
    document: companySettings.document,
    address: companySettings.address,
    defaultOrderMessage: companySettings.defaultOrderMessage,
  }
}

function buildUploadUrl(url: string) {
  if (url.startsWith('http')) {
    return url
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
  const baseUrl = apiUrl.replace(/\/api\/?$/, '')

  return `${baseUrl}${url}`
}
