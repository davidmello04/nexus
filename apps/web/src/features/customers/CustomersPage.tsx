import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CustomerForm } from './CustomerForm'
import type { CustomerFormData } from './customer-schema'
import { createCustomer, getCustomers } from './customers-service'

export function CustomersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const queryClient = useQueryClient()

  const {
    data: customers = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
  })

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsFormOpen(false)
    },
  })

  function handleCreateCustomer(data: CustomerFormData) {
    createCustomerMutation.mutate(data)
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="mt-2 text-sm text-slate-500">
            Cadastro e gerenciamento de clientes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen((state) => !state)}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {isFormOpen ? 'Fechar' : 'Novo cliente'}
        </button>
      </div>

      {isFormOpen && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Novo cliente</h2>
            <p className="mt-1 text-sm text-slate-500">
              Preencha os dados para cadastrar um novo cliente.
            </p>
          </div>

          {createCustomerMutation.isError && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Não foi possível salvar o cliente.
            </div>
          )}

          <CustomerForm
            onSubmit={handleCreateCustomer}
            isSubmitting={createCustomerMutation.isPending}
          />
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        {isLoading && (
          <div className="p-6 text-sm text-slate-500">
            Carregando clientes...
          </div>
        )}

        {isError && (
          <div className="p-6 text-sm text-red-600">
            Não foi possível carregar os clientes.
          </div>
        )}

        {!isLoading && !isError && customers.length === 0 && (
          <div className="p-6 text-sm text-slate-500">
            Nenhum cliente cadastrado ainda.
          </div>
        )}

        {!isLoading && !isError && customers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {customer.name}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {customer.phone || '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {customer.email || '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {customer.document || '-'}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={[
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          customer.isOutsourced
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800',
                        ].join(' ')}
                      >
                        {customer.isOutsourced ? 'Terceirizado' : 'Normal'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}