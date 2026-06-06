import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import {
  customerSchema,
  customerSourceOptions,
  type CustomerFormData,
} from './customer-schema'

type CustomerFormProps = {
  onSubmit: SubmitHandler<CustomerFormData>
  isSubmitting?: boolean
  initialData?: CustomerFormData
  submitButtonText?: string
}

const emptyCustomerFormValues: CustomerFormData = {
  name: '',
  phone: '',
  email: '',
  document: '',
  isOutsourced: false,
  active: true,
  source: '',
  sourceOther: '',
  notes: '',
  address: {
    zipCode: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    complement: '',
    reference: '',
  },
}

export function CustomerForm({
  onSubmit,
  isSubmitting,
  initialData,
  submitButtonText = 'Salvar cliente',
}: CustomerFormProps) {
  const [isAddressOpen, setIsAddressOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData ?? emptyCustomerFormValues,
  })
  const selectedSource = watch('source')

  useEffect(() => {
    const values = initialData ?? emptyCustomerFormValues

    reset(values)
    setIsAddressOpen(hasAddressData(values.address))
  }, [initialData, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Nome</label>
        <input
          {...register('name')}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          placeholder="Nome do cliente"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Telefone
          </label>
          <input
            {...register('phone')}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="(83) 99999-9999"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">
            Documento
          </label>
          <input
            {...register('document')}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="CPF/CNPJ"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">E-mail</label>
        <input
          {...register('email')}
          className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          placeholder="cliente@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
          <input
            type="checkbox"
            {...register('active')}
            className="h-4 w-4"
          />
          Cliente ativo
        </label>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
          <input
            type="checkbox"
            {...register('isOutsourced')}
            className="h-4 w-4"
          />
          Cliente terceirizado
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">
            Origem do cliente
          </label>
          <select
            {...register('source')}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            <option value="">Não informado</option>
            {customerSourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        {selectedSource === 'Outro' && (
          <div>
            <label className="text-sm font-medium text-slate-700">
              Outra origem
            </label>
            <input
              {...register('sourceOther')}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              placeholder="Informe a origem"
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Observações
        </label>
        <textarea
          {...register('notes')}
          className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          placeholder="Observações sobre o cliente"
        />
      </div>

      <div className="rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setIsAddressOpen((state) => !state)}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800"
        >
          Endereço
          <span className="text-xs text-slate-500">
            {isAddressOpen ? 'Ocultar' : 'Mostrar'}
          </span>
        </button>

        {isAddressOpen && (
          <div className="space-y-4 border-t border-slate-200 p-4">
            <div className="grid gap-4 sm:grid-cols-[140px_1fr_120px]">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  CEP
                </label>
                <input
                  {...register('address.zipCode')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                  placeholder="00000-000"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Endereço
                </label>
                <input
                  {...register('address.street')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                  placeholder="Rua, avenida..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Número
                </label>
                <input
                  {...register('address.number')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                  placeholder="123"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Bairro
                </label>
                <input
                  {...register('address.neighborhood')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Cidade
                </label>
                <input
                  {...register('address.city')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Estado
                </label>
                <input
                  {...register('address.state')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase outline-none focus:border-slate-950"
                  placeholder="PB"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Complemento
                </label>
                <input
                  {...register('address.complement')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Referência
                </label>
                <input
                  {...register('address.reference')}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : submitButtonText}
        </button>
      </div>
    </form>
  )
}

function hasAddressData(address?: CustomerFormData['address']) {
  if (!address) {
    return false
  }

  return Object.values(address).some((value) => Boolean(value))
}
