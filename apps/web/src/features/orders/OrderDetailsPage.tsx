import { useState } from 'react'
import {
  ArrowLeft,
  AlertTriangle,
  Ban,
  CheckCheck,
  CircleCheck,
  FileText,
  Factory,
  Pencil,
  type LucideIcon,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Modal } from '@/components/Modal'
import { formatCurrency } from '@/lib/formatters'
import { getApiErrorMessage } from '@/lib/get-api-error-message'
import { OrderForm } from './OrderForm'
import type { OrderFormData } from './order-schema'
import {
  downloadOrderPdf,
  getOrder,
  updateOrder,
  updateOrderStatus,
} from './orders-service'
import type { Order, OrderItem } from './types'

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

export function OrderDetailsPage() {
  const { id } = useParams()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<StatusAction | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const queryClient = useQueryClient()
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id ?? ''),
    enabled: Boolean(id),
  })
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      setStatusAction(null)
    },
  })
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: OrderFormData }) =>
      updateOrder(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      setIsEditOpen(false)
    },
  })

  function handleOpenStatusDialog(orderToUpdate: Order, status: OrderStatus) {
    updateStatusMutation.reset()
    setStatusAction({ order: orderToUpdate, status })
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
      orderId: statusAction.order.id,
      status: statusAction.status,
    })
  }

  function handleOpenEditModal() {
    updateOrderMutation.reset()
    setIsEditOpen(true)
  }

  function handleCloseEditModal() {
    updateOrderMutation.reset()
    setIsEditOpen(false)
  }

  function handleUpdateOrder(data: OrderFormData) {
    if (!order) {
      return
    }

    updateOrderMutation.mutate({
      orderId: order.id,
      data,
    })
  }

  async function handleGeneratePdf() {
    if (!order) {
      return
    }

    setIsGeneratingPdf(true)
    setPdfError('')

    try {
      const file = await downloadOrderPdf(order.id)
      const url = window.URL.createObjectURL(file)
      const link = document.createElement('a')

      link.href = url
      link.download = `pedido-${order.code}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setPdfError('Não foi possível gerar o PDF do pedido.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (isLoading) {
    return <div className="text-sm text-slate-500">Carregando pedido...</div>
  }

  if (isError || !order) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Não foi possível carregar os detalhes do pedido.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 shadow-sm shadow-blue-100/70 ring-1 ring-blue-900/5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />
        <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Voltar para pedidos
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Pedido #{order.code}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Detalhes do pedido, itens e valores calculados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
          </button>

          <span
            className={[
              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
              getStatusBadgeClassName(order.status),
            ].join(' ')}
          >
            {getStatusLabel(order.status)}
          </span>

          {getStatusActions(order.status).map((action) => {
            const Icon = action.icon

            return (
              <button
                key={action.status}
                type="button"
                onClick={() => handleOpenStatusDialog(order, action.status)}
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
              onClick={handleOpenEditModal}
              title="Editar pedido"
              aria-label="Editar pedido"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <HighlightStat label="Cliente" value={order.customer?.name || '-'} />
          <HighlightStat label="Status" value={getStatusLabel(order.status)} />
          <HighlightStat
            label="Total geral"
            value={formatCurrency(order.total)}
            accent
          />
        </div>
      </div>

      {order.status === 'CANCELED' && (
        <section className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm shadow-red-100/70">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">Este pedido foi cancelado</h2>
            <p className="mt-1 text-sm text-red-700">
              O pedido permanece disponível para consulta, PDF e histórico.
            </p>
          </div>
        </section>
      )}

      {pdfError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {pdfError}
        </div>
      )}

      {order.quote && (
      <section className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm shadow-blue-100/70">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-blue-950">
                Origem: Orçamento #{order.quote.code}
              </h2>
              <p className="mt-1 text-sm text-blue-800">
                Este pedido foi gerado a partir de um orçamento aprovado.
              </p>
            </div>

            <Link
              to={`/quotes/${order.quote.id}`}
              className="cursor-pointer rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Ver orçamento
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-white/80 bg-white p-6 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
        <h2 className="text-lg font-semibold text-slate-900">Dados gerais</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem label="Código" value={`#${order.code}`} />
          <DetailItem label="Cliente" value={order.customer?.name || '-'} />
          <DetailItem label="Status" value={getStatusLabel(order.status)} />
          <DetailItem
            label="Criado em"
            value={new Date(order.createdAt).toLocaleString('pt-BR')}
          />
          <DetailItem
            label="Atualizado em"
            value={new Date(order.updatedAt).toLocaleString('pt-BR')}
          />
          <DetailItem label="Subtotal" value={formatCurrency(order.subtotal)} />
          <DetailItem label="Desconto" value={formatCurrency(order.discount)} />
          <DetailItem label="Total geral" value={formatCurrency(order.total)} />
        </dl>
      </section>

      {order.notes && (
      <section className="rounded-2xl border border-white/80 bg-white p-6 shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
          <h2 className="text-lg font-semibold text-slate-900">
            Observações
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {order.notes}
          </p>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-white/80 bg-white shadow-sm shadow-slate-200/70 ring-1 ring-slate-900/5">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Itens do pedido
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Variação</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium">Valor unitário</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Observações</th>
              </tr>
            </thead>

            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.product?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatVariant(item)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-blue-100 bg-gradient-to-r from-white to-blue-50/50 p-6">
          <div className="w-full max-w-sm space-y-2 text-sm">
            <SummaryRow label="Subtotal" value={formatCurrency(order.subtotal)} />
            <SummaryRow label="Desconto" value={formatCurrency(order.discount)} />
            <SummaryRow
              label="Total geral"
              value={formatCurrency(order.total)}
              strong
            />
          </div>
        </div>
      </section>

      <Modal
        open={isEditOpen}
        title="Editar pedido"
        description={`Pedido #${order.code}. Recalcule itens e valores pelo backend ao salvar.`}
        maxWidthClassName="max-w-5xl"
        onClose={handleCloseEditModal}
      >
        {updateOrderMutation.isError && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Não foi possível salvar as alterações do pedido.
          </div>
        )}

        <OrderForm
          initialData={order}
          onSubmit={handleUpdateOrder}
          isSubmitting={updateOrderMutation.isPending}
          submitButtonText="Salvar alterações"
          onCancel={handleCloseEditModal}
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

function HighlightStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={[
        'rounded-2xl border p-4 shadow-sm',
        accent
          ? 'border-blue-200 bg-gradient-to-br from-blue-700 to-indigo-700 text-white shadow-blue-900/20'
          : 'border-white/80 bg-white/75 text-slate-900 shadow-blue-100/50',
      ].join(' ')}
    >
      <p
        className={[
          'text-xs font-semibold uppercase tracking-[0.14em]',
          accent ? 'text-blue-100' : 'text-slate-500',
        ].join(' ')}
      >
        {label}
      </p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-4',
        strong ? 'rounded-2xl bg-blue-700 px-4 py-3 text-white shadow-sm shadow-blue-900/20' : '',
      ].join(' ')}
    >
      <span className={strong ? 'text-blue-100' : 'text-slate-500'}>
        {label}
      </span>
      <span
        className={
          strong ? 'text-lg font-bold text-white' : 'text-slate-700'
        }
      >
        {value}
      </span>
    </div>
  )
}

function formatVariant(item: OrderItem) {
  const variant = item.productVariant

  if (!variant) {
    return '-'
  }

  const parts = [variant.size, variant.color, variant.type, variant.material]
    .filter(Boolean)
    .join(' / ')

  return parts || '-'
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

function canEditOrder(status: string) {
  return status === 'DRAFT' || status === 'PENDING'
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
