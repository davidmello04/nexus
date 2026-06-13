import { useState } from 'react'
import {
  Ban,
  CheckCheck,
  CircleCheck,
  ClipboardList,
  Eye,
  Factory,
  Pencil,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Modal } from '@/components/Modal'
import { PageHeader } from '@/components/PageHeader'
import { TablePagination } from '@/components/TablePagination'
import { usePagination } from '@/hooks/usePagination'
import { formatCurrency } from '@/lib/formatters'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { OrderForm } from './OrderForm'
import type { OrderFormData } from './order-schema'
import {
  createOrder,
  getOrders,
  updateOrder,
  updateOrderStatus,
} from './orders-service'
import type { Order } from './types'

type OrderStatus = 'DRAFT' | 'PENDING' | 'IN_PRODUCTION' | 'DONE' | 'CANCELED'

type StatusAction = {
  order: Order
  status: OrderStatus
}

type StatusActionOption = {
  status: OrderStatus
  label: string
  icon: LucideIcon
  variant?: 'default' | 'danger'
}

type OrderFilters = {
  status: string
  customerId: string
  code: string
  startDate: string
  endDate: string
}

const initialFilters: OrderFilters = {
  status: '',
  customerId: '',
  code: '',
  startDate: '',
  endDate: '',
}

export function OrdersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null)
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null)
  const [filters, setFilters] = useState<OrderFilters>(initialFilters)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  })
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setIsFormOpen(false)
    },
  })
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setStatusAction(null)
    },
  })
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderFormData }) =>
      updateOrder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
      setOrderToEdit(null)
    },
  })
  const customerFilterOptions = getCustomerFilterOptions(orders)
  const filteredOrders = orders.filter((order) => {
    if (filters.status && order.status !== filters.status) {
      return false
    }

    if (filters.customerId && order.customerId !== filters.customerId) {
      return false
    }

    if (
      filters.code.trim() &&
      !String(order.code).includes(filters.code.trim())
    ) {
      return false
    }

    if (
      filters.startDate &&
      getDateInputValue(order.createdAt) < filters.startDate
    ) {
      return false
    }

    if (
      filters.endDate &&
      getDateInputValue(order.createdAt) > filters.endDate
    ) {
      return false
    }

    return true
  })
  const ordersPagination = usePagination({ items: filteredOrders })

  function handleCreateOrder(data: OrderFormData) {
    createOrderMutation.mutate(data)
  }

  function handleOpenCreateOrderModal() {
    createOrderMutation.reset()
    setIsFormOpen(true)
  }

  function handleCloseCreateOrderModal() {
    createOrderMutation.reset()
    setIsFormOpen(false)
  }

  function handleOpenEditOrderModal(order: Order) {
    updateOrderMutation.reset()
    setOrderToEdit(order)
  }

  function handleCloseEditOrderModal() {
    updateOrderMutation.reset()
    setOrderToEdit(null)
  }

  function handleUpdateOrder(data: OrderFormData) {
    if (!orderToEdit) {
      return
    }

    updateOrderMutation.mutate({
      id: orderToEdit.id,
      data,
    })
  }

  function handleFilterChange(field: keyof OrderFilters, value: string) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }))
    ordersPagination.setPage(1)
  }

  function handleOpenStatusDialog(order: Order, status: OrderStatus) {
    updateStatusMutation.reset()
    setStatusAction({ order, status })
  }

  function handleCloseStatusDialog() {
    updateStatusMutation.reset()
    setStatusAction(null)
  }

  function handleConfirmStatusChange() {
    if (!statusAction) {
      return
    }

    updateStatusMutation.mutate({
      id: statusAction.order.id,
      status: statusAction.status,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        description="Acompanhe pedidos, status, clientes e valores calculados."
        eyebrow="Operação"
        icon={ClipboardList}
        actions={
          <button
            type="button"
            onClick={handleOpenCreateOrderModal}
            className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-slate-800"
          >
            Novo pedido
          </button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
        {isLoading && (
          <div className="p-6 text-sm text-slate-500">
            Carregando pedidos...
          </div>
        )}

        {isError && (
          <div className="p-6 text-sm text-red-600">
            Não foi possível carregar os pedidos.
          </div>
        )}

        {!isLoading && !isError && orders.length > 0 && (
          <div className="border-b border-slate-200 p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] xl:items-end">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(event) =>
                    handleFilterChange('status', event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                >
                  <option value="">Todos</option>
                  {getStatusOptions().map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Cliente
                </label>
                <select
                  value={filters.customerId}
                  onChange={(event) =>
                    handleFilterChange('customerId', event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                >
                  <option value="">Todos</option>
                  {customerFilterOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Código do pedido
                </label>
                <input
                  value={filters.code}
                  onChange={(event) =>
                    handleFilterChange('code', event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                  placeholder="Ex.: 1024"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) =>
                    handleFilterChange('startDate', event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Data final
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) =>
                    handleFilterChange('endDate', event.target.value)
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setFilters(initialFilters)
                  ordersPagination.setPage(1)
                }}
                className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="p-6 text-sm text-slate-500">
            Nenhum pedido cadastrado ainda.
          </div>
        )}

        {!isLoading &&
          !isError &&
          orders.length > 0 &&
          filteredOrders.length === 0 && (
            <div className="p-6 text-sm text-slate-500">
              Nenhum pedido encontrado com os filtros selecionados.
            </div>
          )}

        {!isLoading && !isError && filteredOrders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Subtotal</th>
                  <th className="px-4 py-3 font-medium">Desconto</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>

              <tbody>
                {ordersPagination.paginatedItems.map((order) => (
                  <tr
                    key={order.id}
                    data-status={order.status}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/45 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-800">
                        #{order.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {order.customer?.name || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          getStatusBadgeClassName(order.status),
                        ].join(' ')}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(order.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(order.discount)}
                    </td>
                    <td
                      className={[
                        'px-4 py-3 text-base font-bold',
                        getOrderTotalClassName(order.status),
                      ].join(' ')}
                    >
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusActions(order.status).map((action) => {
                          const Icon = action.icon

                          return (
                            <button
                              key={action.status}
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleOpenStatusDialog(order, action.status)
                              }}
                              title={action.label}
                              aria-label={action.label}
                              className={[
                                'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-60',
                                action.variant === 'danger'
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                              ].join(' ')}
                            >
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          )
                        })}

                        {canEditOrder(order.status) && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleOpenEditOrderModal(order)
                            }}
                            title="Editar pedido"
                            aria-label="Editar pedido"
                            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            navigate(`/orders/${order.id}`)
                          }}
                          title="Ver detalhes do pedido"
                          aria-label="Ver detalhes do pedido"
                          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePagination
              page={ordersPagination.page}
              pageSize={ordersPagination.pageSize}
              totalItems={filteredOrders.length}
              onPageChange={ordersPagination.setPage}
              onPageSizeChange={ordersPagination.setPageSize}
            />
          </div>
        )}
      </div>

      <Modal
        open={isFormOpen}
        title="Novo pedido"
        description="Selecione cliente e itens. Os preços serão calculados pelo backend."
        maxWidthClassName="max-w-5xl"
        onClose={handleCloseCreateOrderModal}
      >
        {createOrderMutation.isError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Não foi possível salvar o pedido.
          </div>
        )}

        <OrderForm
          onSubmit={handleCreateOrder}
          isSubmitting={createOrderMutation.isPending}
        />
      </Modal>

      <Modal
        open={Boolean(orderToEdit)}
        title="Editar pedido"
        description={
          orderToEdit
            ? `Pedido #${orderToEdit.code}. Recalcule itens e valores pelo backend ao salvar.`
            : undefined
        }
        maxWidthClassName="max-w-5xl"
        onClose={handleCloseEditOrderModal}
      >
        {updateOrderMutation.isError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Não foi possível salvar as alterações do pedido.
          </div>
        )}

        <OrderForm
          initialData={orderToEdit}
          onSubmit={handleUpdateOrder}
          isSubmitting={updateOrderMutation.isPending}
          submitButtonText="Salvar alterações"
          onCancel={handleCloseEditOrderModal}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(statusAction)}
        title={
          statusAction
            ? getStatusConfirmCopy(statusAction.status).title
            : 'Alterar status'
        }
        description={
          statusAction
            ? getStatusConfirmCopy(statusAction.status).description(
                statusAction.order,
              )
            : ''
        }
        confirmLabel={
          statusAction
            ? getStatusConfirmCopy(statusAction.status).confirmLabel
            : 'Confirmar'
        }
        cancelLabel="Cancelar"
        variant={statusAction?.status === 'CANCELED' ? 'danger' : 'default'}
        isLoading={updateStatusMutation.isPending}
        errorMessage={
          updateStatusMutation.isError
            ? getApiErrorMessage(
                updateStatusMutation.error,
                'Não foi possível alterar o status do pedido.',
              )
            : undefined
        }
        onConfirm={handleConfirmStatusChange}
        onCancel={handleCloseStatusDialog}
      />
    </div>
  )
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Rascunho',
    PENDING: 'Pendente',
    IN_PRODUCTION: 'Em produção',
    DONE: 'Concluído',
    CANCELED: 'Cancelado',
  }

  return labels[status] ?? status
}

function getStatusOptions(): OrderStatus[] {
  return ['DRAFT', 'PENDING', 'IN_PRODUCTION', 'DONE', 'CANCELED']
}

function canEditOrder(status: string) {
  return status === 'DRAFT' || status === 'PENDING'
}

function getCustomerFilterOptions(orders: Order[]) {
  const customers = new Map<string, string>()

  orders.forEach((order) => {
    if (order.customerId && order.customer?.name) {
      customers.set(order.customerId, order.customer.name)
    }
  })

  return Array.from(customers.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((firstCustomer, secondCustomer) =>
      firstCustomer.name.localeCompare(secondCustomer.name, 'pt-BR'),
    )
}

function getDateInputValue(date: string) {
  return new Date(date).toISOString().slice(0, 10)
}

function getStatusBadgeClassName(status: string) {
  const classNames: Record<string, string> = {
    DRAFT: 'border border-slate-200 bg-slate-100 text-slate-700',
    PENDING: 'border border-blue-200 bg-blue-50 text-blue-700',
    IN_PRODUCTION: 'border border-amber-200 bg-amber-50 text-amber-800',
    DONE: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
    CANCELED: 'border border-red-200 bg-red-50 text-red-700',
  }

  return classNames[status] ?? 'border border-slate-200 bg-slate-100 text-slate-700'
}

function getOrderTotalClassName(status: string) {
  const classNames: Record<string, string> = {
    DONE: 'text-emerald-700',
    CANCELED: 'text-red-700',
  }

  return classNames[status] ?? 'text-slate-950'
}

function getStatusActions(status: string): StatusActionOption[] {
  const actions: StatusActionOption[] = []

  if (status === 'DRAFT') {
    actions.push({
      status: 'PENDING',
      label: 'Confirmar pedido',
      icon: CircleCheck,
    })
  }

  if (status === 'PENDING') {
    actions.push({
      status: 'IN_PRODUCTION',
      label: 'Enviar para produção',
      icon: Factory,
    })
  }

  if (status === 'IN_PRODUCTION') {
    actions.push({
      status: 'DONE',
      label: 'Concluir pedido',
      icon: CheckCheck,
    })
  }

  if (['DRAFT', 'PENDING', 'IN_PRODUCTION'].includes(status)) {
    actions.push({
      status: 'CANCELED',
      label: 'Cancelar pedido',
      icon: Ban,
      variant: 'danger',
    })
  }

  return actions
}

function getStatusConfirmCopy(status: OrderStatus) {
  const copies: Record<
    OrderStatus,
    {
      title: string
      confirmLabel: string
      description: (order: Order) => string
    }
  > = {
    DRAFT: {
      title: 'Voltar para rascunho',
      confirmLabel: 'Voltar para rascunho',
      description: (order) =>
        `Deseja voltar o pedido #${order.code} para rascunho?`,
    },
    PENDING: {
      title: 'Confirmar pedido',
      confirmLabel: 'Confirmar pedido',
      description: (order) =>
        `Deseja confirmar o pedido #${order.code} e movê-lo para pendente?`,
    },
    IN_PRODUCTION: {
      title: 'Enviar para produção',
      confirmLabel: 'Enviar para produção',
      description: (order) =>
        `Deseja enviar o pedido #${order.code} para produção?`,
    },
    DONE: {
      title: 'Concluir pedido',
      confirmLabel: 'Concluir pedido',
      description: (order) => `Deseja concluir o pedido #${order.code}?`,
    },
    CANCELED: {
      title: 'Cancelar pedido',
      confirmLabel: 'Cancelar pedido',
      description: (order) =>
        `Deseja cancelar o pedido #${order.code}? Essa ação altera o status do pedido para cancelado.`,
    },
  }

  return copies[status]
}

