import { useEffect, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, type SubmitHandler } from 'react-hook-form'
import {
  companySettingsSchema,
  type CompanySettingsFormData,
} from './company-settings-schema'
import {
  getCompanySettings,
  saveCompanySettings,
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

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-2 text-sm text-slate-500">
          Dados da empresa usados em documentos e pedidos.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
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

            <FormField label="Endereço">
              <textarea
                {...register('address')}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                placeholder="Endereço completo"
              />
            </FormField>

            <FormField label="Mensagem padrão do pedido">
              <textarea
                {...register('defaultOrderMessage')}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                placeholder="Mensagem padrão para documentos de pedido"
              />
            </FormField>

            <div className="flex justify-end">
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
