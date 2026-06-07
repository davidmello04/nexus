import { useState } from 'react'
import { Eye } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/Modal'
import { formatCurrency } from '@/lib/formatters'
import { OrderForm } from './OrderForm'
import type { OrderFormData } from './order-schema'
import { createOrder, getOrders } from './orders-service'
import type { Order, OrderItem } from './types'

export function OrdersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
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

  function handleCreateOrder(data: OrderFormData) {
    createOrderMutation.mutate(data)
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
          <p className="mt-2 text-sm text-slate-500">
            Controle de pedidos e valores calculados.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen((state) => !state)}
          className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          {isFormOpen ? 'Fechar' : 'Novo pedido'}
        </button>
      </div>

      {isFormOpen && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Novo pedido</h2>
            <p className="mt-1 text-sm text-slate-500">
              Selecione cliente e itens. Os preços serão calculados pelo
              backend.
            </p>
          </div>

          {createOrderMutation.isError && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Não foi possível salvar o pedido.
            </div>
          )}

          <OrderForm
            onSubmit={handleCreateOrder}
            isSubmitting={createOrderMutation.isPending}
          />
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
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

        {!isLoading && !isError && orders.length === 0 && (
          <div className="p-6 text-sm text-slate-500">
            Nenhum pedido cadastrado ainda.
          </div>
        )}

        {!isLoading && !isError && orders.length > 0 && (
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
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      #{order.code}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {order.customer?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(order.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(order.discount)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        title="Ver detalhes do pedido"
                        aria-label="Ver detalhes do pedido"
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selectedOrder)}
        title="Detalhes do pedido"
        description={selectedOrder ? `#${selectedOrder.code}` : undefined}
        maxWidthClassName="max-w-4xl"
        onClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && <OrderDetails order={selectedOrder} />}
      </Modal>
    </div>
  )
}

function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="space-y-6">
      <dl className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem label="Código" value={`#${order.code}`} />
        <DetailItem label="Cliente" value={order.customer?.name || '-'} />
        <DetailItem label="Status" value={order.status} />
        <DetailItem
          label="Data"
          value={new Date(order.createdAt).toLocaleDateString('pt-BR')}
        />
        <DetailItem label="Subtotal" value={formatCurrency(order.subtotal)} />
        <DetailItem label="Desconto" value={formatCurrency(order.discount)} />
        <DetailItem label="Total" value={formatCurrency(order.total)} />
      </dl>

      {order.notes && (
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Observações do pedido
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {order.notes}
          </p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Itens do pedido
        </h3>

        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200">
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
      </div>
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

