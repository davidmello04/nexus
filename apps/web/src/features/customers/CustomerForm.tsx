import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  customerSchema,
  type CustomerFormData,
} from './customer-schema'

type CustomerFormProps = {
  onSubmit: (data: CustomerFormData) => void
  isSubmitting?: boolean
}

export function CustomerForm({ onSubmit, isSubmitting }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      document: '',
      isOutsourced: false,
      notes: '',
    },
  })

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

      <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm">
        <input
          type="checkbox"
          {...register('isOutsourced')}
          className="h-4 w-4"
        />
        Cliente terceirizado
      </label>

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

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar cliente'}
        </button>
      </div>
    </form>
  )
}