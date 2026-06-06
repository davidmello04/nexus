import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Modal } from '@/components/Modal'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
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
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  )
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
      setIsCustomerModalOpen(false)
      setSelectedCustomer(null)
      setCustomerToDelete(null)
    },
  })

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsCustomerModalOpen(false)
      setSelectedCustomer(null)
    },
  })

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsCustomerModalOpen(false)
      setSelectedCustomer(null)
      setCustomerToDelete(null)
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
    createCustomerMutation.reset()
    updateCustomerMutation.reset()
    setSelectedCustomer(null)
    setIsCustomerModalOpen(true)
  }

  function handleEditCustomer(customer: Customer) {
    createCustomerMutation.reset()
    updateCustomerMutation.reset()
    setSelectedCustomer(customer)
    setIsCustomerModalOpen(true)
  }

  function handleCloseCustomerModal() {
    createCustomerMutation.reset()
    updateCustomerMutation.reset()
    setSelectedCustomer(null)
    setIsCustomerModalOpen(false)
  }

  function handleDeleteCustomer(customer: Customer) {
    deleteCustomerMutation.reset()
    setCustomerToDelete(customer)
  }

  function handleCancelDeleteCustomer() {
    deleteCustomerMutation.reset()
    setCustomerToDelete(null)
  }

  function handleConfirmDeleteCustomer() {
    if (!customerToDelete) {
      return
    }

    deleteCustomerMutation.mutate(customerToDelete.id)
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
          Novo cliente
        </button>
      </div>

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
                  <th className="px-4 py-3 font-medium">Cidade/UF</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => {
                  const isCustomerActive = customer.active ?? true

                  return (
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
                      {formatCustomerLocation(customer)}
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

                    <td className="px-4 py-3">
                      <span
                        className={[
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          isCustomerActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700',
                        ].join(' ')}
                      >
                        {isCustomerActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditCustomer(customer)}
                          title="Editar cliente"
                          aria-label={`Editar cliente ${customer.name}`}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(customer)}
                          disabled={deleteCustomerMutation.isPending}
                          title="Excluir cliente"
                          aria-label={`Excluir cliente ${customer.name}`}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={isCustomerModalOpen}
        title={isEditing ? 'Editar cliente' : 'Novo cliente'}
        description={
          isEditing
            ? 'Atualize os dados do cliente selecionado.'
            : 'Preencha os dados para cadastrar um novo cliente.'
        }
        onClose={handleCloseCustomerModal}
      >
        {(createCustomerMutation.isError || updateCustomerMutation.isError) && (
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
      </Modal>

      <ConfirmDialog
        open={Boolean(customerToDelete)}
        title="Excluir cliente"
        description={
          customerToDelete
            ? `Tem certeza que deseja excluir o cliente "${customerToDelete.name}"?\nEssa ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteCustomerMutation.isPending}
        errorMessage={
          deleteCustomerMutation.isError
            ? getApiErrorMessage(
                deleteCustomerMutation.error,
                'Não foi possível excluir este cliente.',
              )
            : undefined
        }
        onConfirm={handleConfirmDeleteCustomer}
        onCancel={handleCancelDeleteCustomer}
      />
    </div>
  )
}

function mapCustomerToFormData(customer: Customer): CustomerFormData {
  const mainAddress = getPrimaryAddress(customer)

  return {
    name: customer.name,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    document: customer.document ?? '',
    isOutsourced: customer.isOutsourced,
    active: customer.active ?? true,
    source: customer.source ?? '',
    sourceOther: customer.sourceOther ?? '',
    notes: customer.notes ?? '',
    address: {
      zipCode: mainAddress?.zipCode ?? '',
      street: mainAddress?.street ?? '',
      number: mainAddress?.number ?? '',
      neighborhood: mainAddress?.neighborhood ?? '',
      city: mainAddress?.city ?? '',
      state: mainAddress?.state ?? '',
      complement: mainAddress?.complement ?? '',
      reference: mainAddress?.reference ?? '',
    },
  }
}

function getPrimaryAddress(customer: Customer) {
  return (
    customer.addresses?.find((address) => address.isDefault) ??
    customer.addresses?.[0]
  )
}

function formatCustomerLocation(customer: Customer) {
  const address = getPrimaryAddress(customer)
  const city = address?.city?.trim()
  const state = address?.state?.trim()

  if (city && state) {
    return `${city}/${state}`
  }

  if (city) {
    return city
  }

  if (state) {
    return state
  }

  return '-'
}
