import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CustomerForm } from './CustomerForm'
import type { CustomerFormData } from './customer-schema'
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from './customers-service'
import type { Customer } from './types'

export function CustomersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
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
      setSelectedCustomer(null)
    },
  })

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsFormOpen(false)
      setSelectedCustomer(null)
    },
  })

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsFormOpen(false)
      setSelectedCustomer(null)
    },
  })

  const isEditing = Boolean(selectedCustomer)
  const selectedCustomerInitialData = selectedCustomer
    ? mapCustomerToFormData(selectedCustomer)
    : undefined
  const isSubmitting =
    createCustomerMutation.isPending || updateCustomerMutation.isPending

  function handleSubmitCustomer(data: CustomerFormData) {
    if (selectedCustomer) {
      updateCustomerMutation.mutate({
        id: selectedCustomer.id,
        data,
      })
      return
    }

    createCustomerMutation.mutate(data)
  }

  function handleNewCustomerClick() {
    setSelectedCustomer(null)
    setIsFormOpen((state) => !state)
  }

  function handleEditCustomer(customer: Customer) {
    setSelectedCustomer(customer)
    setIsFormOpen(true)
  }

  function handleDeleteCustomer(customer: Customer) {
    const shouldDelete = window.confirm(
      `Deseja excluir o cliente "${customer.name}"?`,
    )

    if (!shouldDelete) {
      return
    }

    deleteCustomerMutation.mutate(customer.id)
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
          onClick={handleNewCustomerClick}
          className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {isFormOpen && !isEditing ? 'Fechar' : 'Novo cliente'}
        </button>
      </div>

      {isFormOpen && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {isEditing ? 'Editar cliente' : 'Novo cliente'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? 'Atualize os dados do cliente selecionado.'
                  : 'Preencha os dados para cadastrar um novo cliente.'}
              </p>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null)
                  setIsFormOpen(false)
                }}
                className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            )}
          </div>

          {(createCustomerMutation.isError ||
            updateCustomerMutation.isError) && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Não foi possível salvar o cliente.
            </div>
          )}

          <CustomerForm
            onSubmit={handleSubmitCustomer}
            isSubmitting={isSubmitting}
            initialData={selectedCustomerInitialData}
            submitButtonText={isEditing ? 'Atualizar cliente' : 'Salvar cliente'}
          />
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        {deleteCustomerMutation.isError && (
          <div className="border-b border-red-100 bg-red-50 p-4 text-sm text-red-700">
            Não foi possível excluir o cliente.
          </div>
        )}

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
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
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

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditCustomer(customer)}
                          className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(customer)}
                          disabled={deleteCustomerMutation.isPending}
                          className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Excluir
                        </button>
                      </div>
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

function mapCustomerToFormData(customer: Customer): CustomerFormData {
  return {
    name: customer.name,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    document: customer.document ?? '',
    isOutsourced: customer.isOutsourced,
    notes: customer.notes ?? '',
  }
}
