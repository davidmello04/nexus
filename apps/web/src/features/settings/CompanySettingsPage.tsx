import { useEffect, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Check, Moon, Palette, Sun, type LucideIcon } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { PageHeader } from '@/components/PageHeader'
import { cn } from '@/lib/utils'
import { useTheme } from '@/theme/ThemeProvider'
import type { ColorPalette, ThemeMode } from '@/theme/palettes'
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
  addressZipCode: '',
  addressStreet: '',
  addressNumber: '',
  addressComplement: '',
  addressNeighborhood: '',
  addressCity: '',
  addressState: '',
  defaultOrderMessage: '',
}

export function CompanySettingsPage() {
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null)
  const { mode, palette, palettes, setMode, setPalette } = useTheme()
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

      <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5 sm:p-6">
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
              title="Aparência"
              description="Escolha uma paleta para personalizar a identidade visual do Nexus."
            >
              <div>
                <h3 className="text-sm font-semibold text-brand-strong">
                  Modo de exibição
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Alterne entre o tema claro e o tema escuro sem mudar a paleta.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ThemeModeOption
                    mode="light"
                    active={mode === 'light'}
                    title="Claro"
                    description="Interface clara, arejada e próxima do visual padrão."
                    icon={Sun}
                    onClick={() => setMode('light')}
                  />
                  <ThemeModeOption
                    mode="dark"
                    active={mode === 'dark'}
                    title="Escuro"
                    description="Superfícies escuras com acentos da paleta ativa."
                    icon={Moon}
                    onClick={() => setMode('dark')}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-brand-soft pt-5">
                <h3 className="text-sm font-semibold text-brand-strong">
                  Paleta de cores
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  A paleta controla acentos, botões, cabeçalhos e detalhes de marca.
                </p>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {palettes.map((option) => {
                  const isSelected = option.id === palette.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPalette(option.id)}
                      className={cn(
                        'group cursor-pointer rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                        isSelected
                          ? 'border-brand-soft shadow-sm shadow-slate-200/80 ring-2 ring-brand-soft'
                          : 'border-slate-200 hover:border-brand-soft',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                            <Palette className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-950">
                              {option.name}
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {option.description}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-sm shadow-slate-300/70">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </div>

                      <PaletteSwatches palette={option} />

                      {isSelected && (
                        <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-xs font-medium text-brand-strong">
                          Paleta ativa
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </SettingsSection>

            <SettingsSection
              title="Logo"
              description="Imagem exibida nos documentos e no cabeçalho dos PDFs."
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-brand-soft bg-brand-soft">
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

            <SettingsSection
              title="Endereço"
              description="Preencha os dados separados para melhorar documentos e PDFs."
            >
              {companySettings?.address && !hasStructuredAddress(companySettings) && (
                <LegacyAddressNotice
                  parsedAddress={parseLegacyAddress(companySettings.address)}
                />
              )}

              <div className="grid gap-4 md:grid-cols-6">
                <FormField label="CEP" className="md:col-span-2">
                  <input
                    {...register('addressZipCode')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="00000-000"
                  />
                </FormField>

                <FormField label="Rua/Logradouro" className="md:col-span-4">
                  <input
                    {...register('addressStreet')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="Rua, avenida, travessa..."
                  />
                </FormField>

                <FormField label="Número" className="md:col-span-2">
                  <input
                    {...register('addressNumber')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="Número"
                  />
                </FormField>

                <FormField label="Complemento" className="md:col-span-4">
                  <input
                    {...register('addressComplement')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="Sala, bloco, ponto de referência..."
                  />
                </FormField>

                <FormField label="Bairro" className="md:col-span-2">
                  <input
                    {...register('addressNeighborhood')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="Bairro"
                  />
                </FormField>

                <FormField label="Cidade" className="md:col-span-3">
                  <input
                    {...register('addressCity')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                    placeholder="Cidade"
                  />
                </FormField>

                <FormField label="UF" className="md:col-span-1">
                  <input
                    {...register('addressState')}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-slate-950"
                    placeholder="UF"
                    maxLength={2}
                  />
                </FormField>
              </div>
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

            <div className="flex justify-end border-t border-brand-soft pt-5">
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
    <section className="overflow-hidden rounded-2xl border border-brand-soft bg-brand-section shadow-sm shadow-slate-200/70">
      <div className="section-heading-solid border-b border-brand-soft px-4 py-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/85 shadow-sm shadow-slate-900/20" />
          <div>
            <h2 className="section-heading-title text-xs font-bold uppercase tracking-[0.14em]">
              {title}
            </h2>
            {description && (
              <p className="section-heading-description mt-0.5 text-xs leading-5">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function LegacyAddressNotice({
  parsedAddress,
}: {
  parsedAddress: ParsedLegacyAddress
}) {
  return (
    <div className="mb-4 rounded-2xl border border-brand-soft bg-white/80 px-4 py-3 text-sm shadow-sm shadow-slate-200/70">
      <p className="font-semibold text-brand-strong">
        {parsedAddress.confident
          ? 'Preenchemos os campos usando o endereço antigo.'
          : 'Endereço antigo encontrado.'}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {parsedAddress.confident
          ? 'Revise os dados abaixo antes de salvar no novo formato.'
          : 'Revise e complete os campos abaixo para salvar no novo formato.'}
      </p>
    </div>
  )
}

function ThemeModeOption({
  active,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  mode: ThemeMode
  active: boolean
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        active
          ? 'border-brand-soft shadow-sm shadow-slate-200/80 ring-2 ring-brand-soft'
          : 'border-slate-200 hover:border-brand-soft',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-950">{title}</h4>
            {active && (
              <span className="rounded-full bg-brand-gradient px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white">
                Ativo
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </button>
  )
}

function PaletteSwatches({ palette }: { palette: ColorPalette }) {
  return (
    <div className="mt-4 flex items-center gap-2">
      {[palette.primary, palette.secondary, palette.accent].map((color) => (
        <span
          key={color}
          className="h-7 flex-1 rounded-xl border border-white shadow-sm ring-1 ring-slate-200"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )
}

function FormField({
  label,
  className,
  error,
  children,
}: {
  label: string
  className?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className={cn('block', className)}>
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

  const parsedLegacyAddress =
    companySettings.address && !hasStructuredAddress(companySettings)
      ? parseLegacyAddress(companySettings.address)
      : null

  return {
    name: companySettings.name,
    phone: companySettings.phone,
    whatsapp: companySettings.whatsapp,
    instagram: companySettings.instagram,
    document: companySettings.document,
    address: companySettings.address,
    addressZipCode: companySettings.addressZipCode || parsedLegacyAddress?.zipCode || '',
    addressStreet: companySettings.addressStreet || parsedLegacyAddress?.street || '',
    addressNumber: companySettings.addressNumber || parsedLegacyAddress?.number || '',
    addressComplement:
      companySettings.addressComplement || parsedLegacyAddress?.complement || '',
    addressNeighborhood: companySettings.addressNeighborhood || '',
    addressCity: companySettings.addressCity || '',
    addressState: companySettings.addressState || '',
    defaultOrderMessage: companySettings.defaultOrderMessage,
  }
}

type ParsedLegacyAddress = {
  street: string
  number: string
  complement: string
  zipCode: string
  confident: boolean
}

function parseLegacyAddress(address: string): ParsedLegacyAddress {
  const normalizedAddress = address.trim().replace(/\s+/g, ' ')
  const defaultResult = {
    street: normalizedAddress,
    number: '',
    complement: '',
    zipCode: '',
    confident: false,
  }

  if (!normalizedAddress) {
    return defaultResult
  }

  const zipCodeMatch = normalizedAddress.match(/\b\d{5}-?\d{3}\b/)
  const zipCode = zipCodeMatch?.[0] ?? ''
  const addressWithoutZipCode = zipCode
    ? normalizedAddress.replace(zipCode, '').replace(/[,\s]+$/, '').trim()
    : normalizedAddress

  const commaNumberMatch = addressWithoutZipCode.match(
    /^(.+?),\s*(\d+[A-Za-z]?)\s*(.*)$/,
  )

  if (commaNumberMatch) {
    return {
      street: commaNumberMatch[1].trim(),
      number: commaNumberMatch[2].trim(),
      complement: commaNumberMatch[3].trim(),
      zipCode,
      confident: true,
    }
  }

  const looseNumberMatch = addressWithoutZipCode.match(
    /^(.+?)\s+(\d+[A-Za-z]?)\s+(.+)$/,
  )

  if (looseNumberMatch) {
    return {
      street: looseNumberMatch[1].trim(),
      number: looseNumberMatch[2].trim(),
      complement: looseNumberMatch[3].trim(),
      zipCode,
      confident: true,
    }
  }

  return {
    ...defaultResult,
    zipCode,
  }
}

function hasStructuredAddress(companySettings: CompanySettings) {
  return Boolean(
    companySettings.addressZipCode ||
      companySettings.addressStreet ||
      companySettings.addressNumber ||
      companySettings.addressComplement ||
      companySettings.addressNeighborhood ||
      companySettings.addressCity ||
      companySettings.addressState,
  )
}

function buildUploadUrl(url: string) {
  if (url.startsWith('http')) {
    return url
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
  const baseUrl = apiUrl.replace(/\/api\/?$/, '')

  return `${baseUrl}${url}`
}
